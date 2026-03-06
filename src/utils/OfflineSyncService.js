import config from '../config';

const DB_NAME = 'StrideOfflineDB';
const DB_VERSION = 2; // Incremented for schema changes

class OfflineSyncService {
    constructor() {
        this.db = null;
        this.initIdb();
        this.pendingQueue = JSON.parse(localStorage.getItem('stride_pending_actions') || '[]');

        window.addEventListener('online', () => this.syncPendingActions());
        // Sync on boot if online
        if (navigator.onLine) this.syncPendingActions();
    }

    async initIdb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('posts')) {
                    db.createObjectStore('posts', { keyPath: '_id' });
                }
                if (!db.objectStoreNames.contains('stories')) {
                    db.createObjectStore('stories', { keyPath: '_id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (e) => reject(e);
        });
    }

    async cachePosts(posts) {
        if (!this.db) await this.initIdb();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('posts', 'readwrite');
            const store = tx.objectStore('posts');

            // Clear current cache for freshness
            store.clear();

            // Only keep top 50
            posts.slice(0, 50).forEach(post => store.put(post));

            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e);
        });
    }

    async getCachedPosts() {
        if (!this.db) await this.initIdb();
        return new Promise((resolve) => {
            const tx = this.db.transaction('posts', 'readonly');
            const store = tx.objectStore('posts');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            request.onerror = () => resolve([]);
        });
    }

    async queueAction(type, endpoint, method, body) {
        const action = {
            id: Date.now(),
            type,
            endpoint,
            method,
            body,
            timestamp: new Date().toISOString()
        };
        this.pendingQueue.push(action);
        this.saveQueue();

        if (navigator.onLine) {
            this.syncPendingActions();
        } else {
            console.log('[OfflineSync] Offline: Action queued', action);
        }
        return action;
    }

    saveQueue() {
        localStorage.setItem('stride_pending_actions', JSON.stringify(this.pendingQueue));
    }

    async syncPendingActions() {
        if (!navigator.onLine || this.pendingQueue.length === 0) return;

        console.log(`[OfflineSync] Syncing ${this.pendingQueue.length} actions...`);

        const actionsToProcess = [...this.pendingQueue];
        this.pendingQueue = [];
        this.saveQueue();

        for (const action of actionsToProcess) {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const res = await fetch(`${config.API_URL}${action.endpoint}`, {
                    method: action.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(action.body)
                });

                if (!res.ok) throw new Error(`Sync failed with status ${res.status}`);

                console.log(`[OfflineSync] Successfully synced: ${action.type}`);
            } catch (err) {
                console.error(`[OfflineSync] Failed to sync action ${action.id}:`, err);
                // Re-queue with slight delay or just push back
                this.pendingQueue.push(action);
                this.saveQueue();
            }
        }
    }
}

const offlineSync = new OfflineSyncService();
export default offlineSync;
