const { 
    FirestoreUser, FirestorePost, FirestoreCommunity, FirestorePlaylist, 
    FirestoreTransaction, FirestoreNotification, FirestoreThread, 
    FirestoreMessage, FirestoreComment, FirestoreEvent, FirestoreVibePass, 
    FirestoreStake, FirestoreVibeAnalytics, FirestoreAnalytics, FirestoreProposal 
} = require('./FirestoreModels.cjs');

console.log('🔥 DATABASE_PULSE: Global database mode set to CLOUD FIRESTORE (Production Persistent).');

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
