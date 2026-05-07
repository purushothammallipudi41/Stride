const { admin, db } = require('./FirebaseAdmin.cjs');

/**
 * Vyx v2.0 Firestore Bridge
 * Provides a Mongoose-like API for Firestore collections
 */
class FirestoreModel {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.collection = db.collection(collectionName);
    }

    _wrap(data, id) {
        if (!data) return null;
        const self = this;
        const result = { 
            id: id || data.id, 
            _id: id || data._id || data.id, 
            ...data,
            toObject: () => result,
            save: async function() {
                const { id, _id, toObject, save, ...cleanData } = this;
                await self.collection.doc(String(id)).update({
                    ...cleanData,
                    updatedAt: new Date()
                });
                return this;
            }
        };
        return result;
    }

    _chain(dataPromise) {
        const query = {
            populate: () => query,
            lean: () => query,
            sort: () => query,
            limit: () => query,
            exec: () => dataPromise,
            then: (onFulfilled, onRejected) => dataPromise.then(onFulfilled, onRejected),
            catch: (onRejected) => dataPromise.catch(onRejected)
        };
        return query;
    }

    findById(id) {
        const promise = (async () => {
            if (!id) return null;
            const doc = await this.collection.doc(String(id)).get();
            if (!doc.exists) return null;
            return this._wrap(doc.data(), doc.id);
        })();
        return this._chain(promise);
    }

    findOne(query) {
        const promise = (async () => {
            let q = this.collection;
            for (const [key, value] of Object.entries(query)) {
                if (key === '$or') {
                    // Firestore $or is limited, we simulate basic equality ORs if possible
                    // For now, we take the first condition as a simplification or use a custom filter
                    const cond = value[0];
                    for (const [k, v] of Object.entries(cond)) {
                        q = q.where(k, '==', v);
                    }
                } else {
                    q = q.where(key, '==', value);
                }
            }
            const snapshot = await q.limit(1).get();
            if (snapshot.empty) return null;
            const doc = snapshot.docs[0];
            return this._wrap(doc.data(), doc.id);
        })();
        return this._chain(promise);
    }

    find(query = {}, options = {}) {
        const promise = (async () => {
            let q = this.collection;
            for (const [key, value] of Object.entries(query)) {
                if (key === '$or') continue;
                
                // Handle complex operators like $in
                if (value && typeof value === 'object' && value.$in) {
                    // Firestore limit: $in supports up to 10-30 items depending on version
                    // For now we use the native .where(key, 'in', value.$in)
                    q = q.where(key, 'in', value.$in);
                } else {
                    q = q.where(key, '==', value);
                }
            }
            
            if (options.sort) {
                const [field, order] = Object.entries(options.sort)[0];
                q = q.orderBy(field, order === -1 ? 'desc' : 'asc');
            }
            
            if (options.limit) q = q.limit(options.limit);
            
            const snapshot = await q.get();
            return snapshot.docs.map(doc => this._wrap(doc.data(), doc.id));
        })();
        return this._chain(promise);
    }

    async create(data) {
        const docRef = await this.collection.add({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        const doc = await docRef.get();
        return this._wrap(doc.data(), doc.id);
    }

    async findOneAndUpdate(query, update, options = {}) {
        let doc = await this.findOne(query).exec();
        if (!doc) {
            if (options.upsert || options.setDefaultsOnInsert) {
                const initialData = update.$setOnInsert || update.$set || update;
                return this.create(initialData);
            }
            return null;
        }
        
        const updateData = update.$set || {};
        const addToSet = update.$addToSet || {};
        const push = update.$push || {};
        
        // Handle direct updates if no operators present
        if (Object.keys(updateData).length === 0 && Object.keys(addToSet).length === 0 && Object.keys(push).length === 0) {
            Object.assign(updateData, update);
        }

        const finalUpdate = { ...updateData, updatedAt: new Date() };
        
        // Handle arrays (Firestore native operators)
        for (const [key, val] of Object.entries(addToSet)) {
            finalUpdate[key] = admin.firestore.FieldValue.arrayUnion(val);
        }
        for (const [key, val] of Object.entries(push)) {
            finalUpdate[key] = admin.firestore.FieldValue.arrayUnion(val); // Simplified: Firestore doesn't have a direct non-unique push, using arrayUnion
        }

        await this.collection.doc(doc.id).update(finalUpdate);
        
        // Return updated doc (simulate returnDocument: 'after')
        const refreshed = await this.collection.doc(doc.id).get();
        return this._wrap(refreshed.data(), refreshed.id);
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

    async deleteMany(query = {}) {
        const docs = await this.find(query).exec();
        if (docs.length === 0) return { deletedCount: 0 };
        
        const batchSize = 500;
        let deletedCount = 0;
        
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = db.batch();
            const chunk = docs.slice(i, i + batchSize);
            chunk.forEach(doc => {
                batch.delete(this.collection.doc(doc.id));
                deletedCount++;
            });
            await batch.commit();
        }
        
        return { deletedCount };
    }
}

// Vyx social pulse collections
const FirestoreUser = new FirestoreModel('users');
const FirestorePost = new FirestoreModel('posts');
const FirestoreCommunity = new FirestoreModel('communities');
const FirestorePlaylist = new FirestoreModel('playlists');
const FirestoreTransaction = new FirestoreModel('transactions');
const FirestoreNotification = new FirestoreModel('notifications');
const FirestoreThread = new FirestoreModel('threads');
const FirestoreMessage = new FirestoreModel('messages');
const FirestoreComment = new FirestoreModel('comments');
const FirestoreEvent = new FirestoreModel('events');
const FirestoreVibePass = new FirestoreModel('vibepasses');
const FirestoreStake = new FirestoreModel('stakes');
const FirestoreVibeAnalytics = new FirestoreModel('vibeanalytics');
const FirestoreAnalytics = new FirestoreModel('analytics');
const FirestoreProposal = new FirestoreModel('proposals');

module.exports = { 
    FirestoreUser, 
    FirestorePost, 
    FirestoreCommunity, 
    FirestorePlaylist, 
    FirestoreTransaction,
    FirestoreNotification,
    FirestoreThread,
    FirestoreMessage,
    FirestoreComment,
    FirestoreEvent,
    FirestoreVibePass,
    FirestoreStake,
    FirestoreVibeAnalytics,
    FirestoreAnalytics,
    FirestoreProposal
};

