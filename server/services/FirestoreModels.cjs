const { db } = require('./FirebaseAdmin.cjs');

/**
 * Stride v2.0 Firestore Bridge
 * Provides a Mongoose-like API for Firestore collections
 */
class FirestoreModel {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.collection = db.collection(collectionName);
    }

    async findById(id) {
        if (!id) return null;
        const doc = await this.collection.doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async findOne(query) {
        let q = this.collection;
        for (const [key, value] of Object.entries(query)) {
            q = q.where(key, '==', value);
        }
        const snapshot = await q.limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }

    async find(query = {}, options = {}) {
        let q = this.collection;
        for (const [key, value] of Object.entries(query)) {
            q = q.where(key, '==', value);
        }
        
        if (options.sort) {
            const [field, order] = Object.entries(options.sort)[0];
            q = q.orderBy(field, order === -1 ? 'desc' : 'asc');
        }
        
        if (options.limit) q = q.limit(options.limit);
        
        const snapshot = await q.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async create(data) {
        const docRef = await this.collection.add({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
    }

    async findOneAndUpdate(query, update, options = {}) {
        const doc = await this.findOne(query);
        if (!doc) {
            if (options.setDefaultsOnInsert) {
                return this.create(update.$setOnInsert || update);
            }
            return null;
        }
        
        const updateData = update.$set || update;
        await this.collection.doc(doc.id).update({
            ...updateData,
            updatedAt: new Date()
        });
        
        return { ...doc, ...updateData };
    }

    async updateOne(query, update) {
        return this.findOneAndUpdate(query, update);
    }

    async countDocuments(query = {}) {
        let q = this.collection;
        for (const [key, value] of Object.entries(query)) {
            q = q.where(key, '==', value);
        }
        const snapshot = await q.get();
        return snapshot.size;
    }
}

// Stride social pulse collections
const FirestoreUser = new FirestoreModel('users');
const FirestorePost = new FirestoreModel('posts');
const FirestoreCommunity = new FirestoreModel('communities');
const FirestorePlaylist = new FirestoreModel('playlists');
const FirestoreTransaction = new FirestoreModel('transactions');

module.exports = { 
    FirestoreUser, 
    FirestorePost, 
    FirestoreCommunity, 
    FirestorePlaylist, 
    FirestoreTransaction 
};
