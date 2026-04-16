const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// Stride v2.0 - Firestore Denormalization Functions 🛡️🏗️✨🚀⚡

/**
 * Increment Post 'likeCount' when a new like document is created
 */
exports.onPostLiked = functions.firestore
    .document('posts/{postId}/likes/{userId}')
    .onCreate(async (snap, context) => {
        const postId = context.params.postId;
        const postRef = db.collection('posts').doc(postId);
        
        return postRef.update({
            likeCount: admin.firestore.FieldValue.increment(1)
        });
    });

/**
 * Decrement Post 'likeCount' when a like document is deleted
 */
exports.onPostUnliked = functions.firestore
    .document('posts/{postId}/likes/{userId}')
    .onDelete(async (snap, context) => {
        const postId = context.params.postId;
        const postRef = db.collection('posts').doc(postId);
        
        return postRef.update({
            likeCount: admin.firestore.FieldValue.increment(-1)
        });
    });

/**
 * Increment Post 'commentCount' when a new comment is added
 */
exports.onPostCommented = functions.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onCreate(async (snap, context) => {
        const postId = context.params.postId;
        const postRef = db.collection('posts').doc(postId);
        
        return postRef.update({
            commentCount: admin.firestore.FieldValue.increment(1)
        });
    });

/**
 * Sync Follower Counts
 */
exports.onUserFollowed = functions.firestore
    .document('users/{targetUserId}/followers/{sourceUserId}')
    .onCreate(async (snap, context) => {
        const { targetUserId, sourceUserId } = context.params;
        
        const targetRef = db.collection('users').doc(targetUserId);
        const sourceRef = db.collection('users').doc(sourceUserId);
        
        // Batch update for atomicity
        const batch = db.batch();
        batch.update(targetRef, { followerCount: admin.firestore.FieldValue.increment(1) });
        batch.update(sourceRef, { followingCount: admin.firestore.FieldValue.increment(1) });
        
        return batch.commit();
    });
