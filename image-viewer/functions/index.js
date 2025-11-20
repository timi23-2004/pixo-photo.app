const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const sharp = require("sharp");
const path = require("path");
const os = require("os");
const fs = require("fs");

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

const stripeSecret = defineSecret("STRIPE_SECRET");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Stripe inicializálása - a secret csak futáskor lesz elérhető
let stripe;

exports.createPaymentIntent = onCall(
  { 
    secrets: [stripeSecret],
    cors: true
  },
  async (request) => {
    // Inicializáljuk a Stripe-ot ha még nem történt meg
    if (!stripe) {
      stripe = require("stripe")(stripeSecret.value());
    }

    // Authentikáció ellenőrzése
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Be kell jelentkezni.");
    }

  const amount = Number(request.data?.amount);
  
  // Validáció: összeg ellenőrzése
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new HttpsError("invalid-argument", "Érvénytelen összeg.");
  }

  const MAX_AMOUNT = 10000 * 100; // 10000 USD centben
  if (amount > MAX_AMOUNT) {
    throw new HttpsError("permission-denied", "Az összeg túl nagy.");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    logger.error("Stripe paymentIntent error:", error);
    throw new HttpsError("internal", error.message || "Fizetési létrehozás sikertelen.");
  }
});

// Stripe Webhook handler - kezeli a Stripe eseményeket
exports.stripeWebhook = onRequest(
  { secrets: [stripeSecret, stripeWebhookSecret] },
  async (request, response) => {
    // Inicializáljuk a Stripe-ot ha még nem történt meg
    if (!stripe) {
      stripe = require("stripe")(stripeSecret.value());
    }

    const sig = request.headers["stripe-signature"];
    const webhookSecret = stripeWebhookSecret.value();

    let event;

    try {
      // Ellenőrizzük a webhook aláírását
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        sig,
        webhookSecret
      );
    } catch (err) {
      logger.error("Webhook signature verification failed:", err.message);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Kezeljük az eseményeket
    logger.info("Webhook event received:", event.type);

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        logger.info("PaymentIntent succeeded:", paymentIntent.id);
        // Itt kezelheted az sikeres fizetést (pl. adatbázis frissítés, email küldés stb.)
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        logger.warn("PaymentIntent failed:", failedPayment.id);
        // Sikertelen fizetés kezelése
        break;

      case "charge.succeeded":
        const charge = event.data.object;
        logger.info("Charge succeeded:", charge.id);
        break;

      default:
        logger.info("Unhandled event type:", event.type);
    }

    // Válaszoljunk 200-as státusszal, hogy a Stripe tudja, megkaptuk
    response.json({ received: true });
  }
);

// CORS-enabled HTTP endpoint for creating a Payment Intent (used by web app)
exports.createPaymentIntentHttp = onRequest(
  {
    secrets: [stripeSecret],
    cors: true,
  },
  async (req, res) => {
    try {
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return res.status(204).send("");
      }

      res.set("Access-Control-Allow-Origin", "*");

      // Init Stripe on first call, validate secret presence
      const secretValue = stripeSecret.value();
      if (!secretValue) {
        logger.error("Stripe secret missing or not configured");
        return res.status(500).json({ error: "stripe-secret-missing" });
      }
      if (!stripe) {
        stripe = require("stripe")(secretValue);
      }

      // Verify Firebase ID token from Authorization: Bearer <token>
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;
      if (!token) {
        return res.status(401).json({ error: "unauthenticated" });
      }

      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(token);
      } catch (e) {
        return res.status(401).json({ error: "invalid-token" });
      }

      const amount = Number(req.body?.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        return res.status(400).json({ error: "invalid-amount" });
      }

      const CURRENCY = "usd";
      const MIN_BY_CURRENCY = { usd: 50 }; // $0.50 minimum in cents
      const minAmount = MIN_BY_CURRENCY[CURRENCY] || 1;
      if (amount < minAmount) {
        return res.status(400).json({ error: "amount-too-small", min: minAmount, currency: CURRENCY });
      }

      const MAX_AMOUNT = 10000 * 100; // 10000 USD in cents
      if (amount > MAX_AMOUNT) {
        return res.status(403).json({ error: "amount-too-large" });
      }

      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: CURRENCY,
          metadata: {
            uid: decoded.uid,
            imageId: req.body?.imageId || "",
            fileName: req.body?.fileName || "",
            purpose: "hd_view",
          },
        });
      } catch (stripeErr) {
        logger.error("Stripe paymentIntents.create failed", {
          message: stripeErr.message,
          type: stripeErr.type,
          code: stripeErr.code,
        });
        const safeMsg = stripeErr.code || stripeErr.type || "stripe-error";
        return res.status(500).json({ error: safeMsg });
      }

      return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      logger.error("createPaymentIntentHttp unexpected error", {
        message: error.message,
        stack: error.stack,
      });
      return res.status(500).json({ error: "internal" });
    }
  }
);

// Automatikus képátméretezés amikor új kép töltődik fel
exports.generateThumbnail = onObjectFinalized(async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  // Csak képek esetén dolgozzunk
  if (!contentType || !contentType.startsWith("image/")) {
    logger.info("Not an image, skipping:", filePath);
    return null;
  }

  // Ne dolgozzuk fel újra a thumbnailokat
  if (filePath.includes("/thumbnails/")) {
    logger.info("Already a thumbnail, skipping:", filePath);
    return null;
  }

  // Csak az eredeti képek mappájából dolgozzunk
  if (!filePath.includes("/original/")) {
    logger.info("Not in original folder, skipping:", filePath);
    return null;
  }

  const fileName = path.basename(filePath);
  const bucket = admin.storage().bucket(event.data.bucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const tempThumbPath = path.join(os.tmpdir(), `thumb_${fileName}`);

  try {
    // Eredeti kép letöltése
    await bucket.file(filePath).download({ destination: tempFilePath });
    logger.info("Image downloaded to:", tempFilePath);

    // Thumbnail létrehozása Sharp-pal (400x300 max, arány megtartva)
    await sharp(tempFilePath)
      .resize(400, 300, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(tempThumbPath);

    logger.info("Thumbnail created:", tempThumbPath);

    // Thumbnail feltöltése Storage-ba
    const thumbPath = filePath.replace("/original/", "/thumbnails/").replace(fileName, `thumb_${fileName}`);
    await bucket.upload(tempThumbPath, {
      destination: thumbPath,
      metadata: {
        contentType: "image/jpeg",
      },
    });

    logger.info("Thumbnail uploaded to:", thumbPath);

    // Thumbnail URL lekérése
    const thumbnailFile = bucket.file(thumbPath);
    await thumbnailFile.makePublic();
    const thumbnailURL = `https://storage.googleapis.com/${bucket.name}/${thumbPath}`;

    // Firestore frissítése - keressük meg a képet storagePath alapján
    const db = admin.firestore();
    const imagesRef = db.collection("images");
    const querySnapshot = await imagesRef.where("storagePath", "==", filePath).get();

    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await docRef.update({
        thumbnailURL: thumbnailURL,
        thumbnailPath: thumbPath,
        processed: true,
      });
      logger.info("Firestore updated with thumbnail URL");
    }

    // Temp fájlok törlése
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(tempThumbPath);

    return null;
  } catch (error) {
    logger.error("Error generating thumbnail:", error);
    // Cleanup
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    if (fs.existsSync(tempThumbPath)) fs.unlinkSync(tempThumbPath);
    throw error;
  }
});