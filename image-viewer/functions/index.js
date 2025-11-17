const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

setGlobalOptions({ maxInstances: 10 });

const stripeSecret = defineSecret("STRIPE_SECRET");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Stripe inicializálása - a secret csak futáskor lesz elérhető
let stripe;

exports.createPaymentIntent = onCall(
  { secrets: [stripeSecret] },
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