const admin = require('firebase-admin');

// Vyx v2.0 - Firebase Admin Infrastructure
// Requires serviceAccountKey.json or environment variables
try {
    let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;

    if (!serviceAccount) {
        const keyPath = require('path').join(__dirname, '../serviceAccountKey.json');
        if (require('fs').existsSync(keyPath)) {
            serviceAccount = require(keyPath);
        }
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "vyx-v2.appspot.com"
        });
        console.log("Firebase Admin Pulse: Initialized with service account.");
    } else {
        // Fallback for local development or if using Default Credentials on GCP
        admin.initializeApp({ projectId: 'stride-v2-4123b' });
        console.log("Firebase Admin Pulse: Initialized with default credentials and explicit projectId.");
    }
} catch (error) {
    console.warn("Firebase Admin Pulse: Initialization failed.", error.message);
    if (admin.apps.length === 0) {
        admin.initializeApp({ projectId: 'stride-v2-4123b' });
    }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { admin, db, auth, storage };
