const fs = require('fs');
const path = require('path');

const PERSIST_DIR = path.join(__dirname, '../.data');
if (!fs.existsSync(PERSIST_DIR)) fs.mkdirSync(PERSIST_DIR, { recursive: true });

class MemoryModel {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.persistFile = path.join(PERSIST_DIR, `${collectionName}.json`);
        this.data = this._load();
        this.idCounter = this.data.length + 1;
    }

    _load() {
        try {
            if (fs.existsSync(this.persistFile)) {
                return JSON.parse(fs.readFileSync(this.persistFile, 'utf8'));
            }
        } catch (e) {
            console.warn(`[MemoryModel] Could not load ${this.collectionName}:`, e.message);
        }
        return [];
    }

    _save() {
        try {
            fs.writeFileSync(this.persistFile, JSON.stringify(this.data, null, 2));
        } catch (e) {
            console.warn(`[MemoryModel] Could not persist ${this.collectionName}:`, e.message);
        }
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
                    } else if (value && typeof value === 'object' && value.$in) {
                        // Handle $in operator
                        if (!value.$in.includes(d[key]) && !value.$in.includes(d._id)) return false;
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
        this._save();
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
        
        // Find and mutate the actual stored reference
        const stored = this.data.find(d => d._id === doc._id);
        if (!stored) return null;

        const updateData = update.$set || update;
        const addData = update.$addToSet || {};
        const pushData = update.$push || {};
        const pullData = update.$pull || {};
        
        for (const [k, v] of Object.entries(updateData)) {
            if (k !== '$set' && k !== '$addToSet' && k !== '$push' && k !== '$pull' && k !== '$setOnInsert') {
               stored[k] = v;
            }
        }
        
        for (const [k, v] of Object.entries(addData)) {
            if (!stored[k]) stored[k] = [];
            if (!stored[k].includes(v)) stored[k].push(v);
        }
        for (const [k, v] of Object.entries(pushData)) {
            if (!stored[k]) stored[k] = [];
            stored[k].push(v);
        }
        for (const [k, v] of Object.entries(pullData)) {
            if (stored[k]) stored[k] = stored[k].filter(item => item !== v);
        }
        stored.updatedAt = new Date();
        this._save();
        return { ...stored, toObject: () => stored };
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
            this._save();
            return { deletedCount: count };
        }
        const initialLen = this.data.length;
        this.data = this.data.filter(d => {
            for (const [key, value] of Object.entries(query)) {
                if (d[key] !== value) return true; // keep if no match
            }
            return false; // remove if match
        });
        this._save();
        return { deletedCount: initialLen - this.data.length };
    }
}

// Vyx social pulse collections
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
