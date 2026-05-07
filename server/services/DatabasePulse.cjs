const useFirestore = process.env.USE_FIREBASE === 'true';
let models;

try {
    if (useFirestore) {
        models = require('./FirestoreModels.cjs');
        console.log('🔥 DATABASE_PULSE: Global database mode set to CLOUD FIRESTORE (Production Persistent).');
    } else {
        throw new Error("Firebase Disabled via ENV");
    }
} catch (err) {
    console.warn('⚠️ DATABASE_PULSE: Firebase initialization failed or disabled. Falling back to MEMORY MODE (Development Only).', err.message);
    models = require('./MemoryModels.cjs');
}

const { 
    FirestoreUser, FirestorePost, FirestoreCommunity, FirestorePlaylist, 
    FirestoreTransaction, FirestoreNotification, FirestoreThread, 
    FirestoreMessage, FirestoreComment, FirestoreEvent, FirestoreVibePass, 
    FirestoreStake, FirestoreVibeAnalytics, FirestoreAnalytics, FirestoreProposal 
} = models;


module.exports = {
    User: FirestoreUser,
    Post: FirestorePost,
    Community: FirestoreCommunity,
    Playlist: FirestorePlaylist,
    Transaction: FirestoreTransaction,
    Notification: FirestoreNotification,
    Thread: FirestoreThread,
    Message: FirestoreMessage,
    Comment: FirestoreComment,
    Event: FirestoreEvent,
    VibePass: FirestoreVibePass,
    Stake: FirestoreStake,
    VibeAnalytics: FirestoreVibeAnalytics,
    Analytics: FirestoreAnalytics,
    Proposal: FirestoreProposal
};
