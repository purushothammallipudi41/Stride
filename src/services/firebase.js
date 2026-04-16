import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Stride v2.0 - Firebase Infrastructure
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD5YDG_tKuY8F8BRqr6G3-LwfTl0Wg2aS4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "stride-v2-4123b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "stride-v2-4123b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "stride-v2-4123b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "519726312796",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:519726312796:web:8f31d9f6dc1098f10d2599",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GZ343V3W23"
};

// Initialize Firebase High-Fidelity Pulse
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase App initialization failed:", error);
  app = {};
}

// Initialize Services
export const auth = app.options ? getAuth(app) : {};
export const db = app.options ? getFirestore(app) : {};
export const storage = app.options ? getStorage(app) : {};
export const analytics = (typeof window !== 'undefined' && app.options) ? getAnalytics(app) : null;

export default app;
