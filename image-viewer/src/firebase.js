// Firebase inicializáló sablon (modular SDK)
// Töltsd ki a környezeti változókat a projekt gyökerében lévő `.env` fájlban (Vite: `VITE_` prefix)
// Példa `.env` (ne töltsd fel verziókövetésre):
// VITE_FIREBASE_API_KEY=your_api_key
// VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=your_project_id
// VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
// VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
// VITE_FIREBASE_APP_ID=your_app_id

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "<YOUR_API_KEY>",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "<YOUR_AUTH_DOMAIN>",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "<YOUR_PROJECT_ID>",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "<YOUR_STORAGE_BUCKET>",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "<YOUR_MESSAGING_SENDER_ID>",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "<YOUR_APP_ID>"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };