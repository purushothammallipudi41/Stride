class MemoryModel {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.data = [];
        this.idCounter = 1;
    }

    // Helper to wrap result in a chainable thenable (Mongoose-style)
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
            const result = this.data.find(d => String(d._id) === String(id) || String(d.id) === String(id)) || null;
            return result ? { ...result, toObject: () => result } : null;
        })();
        return this._chain(promise);
    }

    findOne(query) {
        const promise = (async () => {
            const result = this.data.find(d => {
                for (const [key, value] of Object.entries(query)) {
                    if (key === '$or') {
                        if (!value.some(cond => {
                            return Object.entries(cond).every(([k, v]) => d[k] === v);
                        })) return false;
                    } else if (d[key] !== value) return false;
                }
                return true;
            }) || null;
            return result ? { ...result, toObject: () => result } : null;
        })();
        return this._chain(promise);
    }

    find(query = {}, options = {}) {
        const promise = (async () => {
            let results = this.data.filter(d => {
                for (const [key, value] of Object.entries(query)) {
                    if (key === '$or') {
                        if (!value.some(cond => Object.entries(cond).every(([k, v]) => d[k] === v))) return false;
                    } else if (d[key] !== value) return false;
                }
                return true;
            });
            
            return results.map(r => ({ ...r, toObject: () => r }));
        })();
        return this._chain(promise);
    }

    async create(data) {
        const id = 'mem_' + Date.now() + '_' + (this.idCounter++);
        const doc = { _id: id, id: id, ...data, createdAt: new Date(), updatedAt: new Date() };
        this.data.push(doc);
        return { ...doc, toObject: () => doc };
    }

    async findOneAndUpdate(query, update, options = {}) {
        let docPromise = this.findOne(query).exec();
        let doc = await docPromise;
        
        if (!doc) {
            if (options.setDefaultsOnInsert || options.upsert) {
                return this.create(update.$setOnInsert || update.$set || update);
            }
            return null;
        }
        
        const updateData = update.$set || update;
        const addData = update.$addToSet || {};
        const pushData = update.$push || {};
        
        for (const [k, v] of Object.entries(updateData)) {
            if (k !== '$set' && k !== '$addToSet' && k !== '$push' && k !== '$setOnInsert') {
               doc[k] = v;
            }
        }
        
        for (const [k, v] of Object.entries(addData)) {
            if (!doc[k]) doc[k] = [];
            if (!doc[k].includes(v)) doc[k].push(v);
        }
        for (const [k, v] of Object.entries(pushData)) {
            if (!doc[k]) doc[k] = [];
            doc[k].push(v);
        }
        doc.updatedAt = new Date();
        return { ...doc, toObject: () => doc };
    }

    async updateOne(query, update) { return this.findOneAndUpdate(query, update); }
    
    async countDocuments(query = {}) { 
        const results = await this.find(query).exec();
        return results.length; 
    }
    
    async deleteMany(query = {}) {
        if (Object.keys(query).length === 0) {
            const count = this.data.length;
            this.data = [];
            return { deletedCount: count };
        }
        const initialLen = this.data.length;
        this.data = this.data.filter(d => {
            for (const [key, value] of Object.entries(query)) {
                if (d[key] !== value) return true; // keep if no match
            }
            return false; // remove if match
        });
        return { deletedCount: initialLen - this.data.length };
    }
}

// Stride social pulse collections
const FirestoreUser = new MemoryModel('users');
const FirestorePost = new MemoryModel('posts');
const FirestoreCommunity = new MemoryModel('communities');
const FirestorePlaylist = new MemoryModel('playlists');
const FirestoreTransaction = new MemoryModel('transactions');
const FirestoreNotification = new MemoryModel('notifications');
const FirestoreThread = new MemoryModel('threads');
const FirestoreMessage = new MemoryModel('messages');
const FirestoreComment = new MemoryModel('comments');
const FirestoreEvent = new MemoryModel('events');
const FirestoreVibePass = new MemoryModel('vibepasses');
const FirestoreStake = new MemoryModel('stakes');
const FirestoreVibeAnalytics = new MemoryModel('vibeanalytics');
const FirestoreAnalytics = new MemoryModel('analytics');
const FirestoreProposal = new MemoryModel('proposals');

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
