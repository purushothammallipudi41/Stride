const admin = require('firebase-admin');

// Stride v2.0 - Firebase Admin Infrastructure
// Requires serviceAccountKey.json or environment variables
try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "stride-v2.appspot.com"
        });
        console.log("Firebase Admin Pulse: Initialized with service account.");
    } else {
        // Fallback for local development or if using Default Credentials on GCP
        admin.initializeApp();
        console.log("Firebase Admin Pulse: Initialized with default credentials.");
    }
} catch (error) {
    console.warn("Firebase Admin Pulse: Initialized without credentials (standard mode).", error.message);
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { admin, db, auth, storage };
