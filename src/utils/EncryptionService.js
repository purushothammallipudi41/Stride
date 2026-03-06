/**
 * EncryptionService.js
 * 
 * Handles client-side End-to-End Encryption (E2EE) using the Web Crypto API.
 * Uses ECDH (Curve P-256) for key exchange and AES-GCM (256-bit) for message encryption.
 */

class EncryptionService {
    constructor() {
        this.keyPair = null;
        this.dbName = 'StrideE2EE';
        this.storeName = 'IdentityKeys';
    }

    /**
     * Initializes the service by loading or generating identity keys.
     */
    async init() {
        if (this.keyPair) return this.keyPair;

        try {
            const storedPair = await this._loadFromStorage();
            if (storedPair) {
                this.keyPair = storedPair;
                return this.keyPair;
            }

            // Generate new ECDH key pair
            this.keyPair = await window.crypto.subtle.generateKey(
                { name: 'ECDH', namedCurve: 'P-256' },
                true, // extractable
                ['deriveKey', 'deriveBits']
            );

            await this._saveToStorage(this.keyPair);
            return this.keyPair;
        } catch (err) {
            console.error('[E2EE] Init failed:', err);
            throw err;
        }
    }

    /**
     * Exports the public key to Base64 for sharing with the server.
     */
    async getExportedPublicKey() {
        if (!this.keyPair) await this.init();
        const exported = await window.crypto.subtle.exportKey('spki', this.keyPair.publicKey);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    }

    /**
     * Encrypts a plain text message for a specific peer.
     * @param {string} text Plain text content
     * @param {string} peerPublicKeyB64 Peer's Base64 public key
     */
    async encrypt(text, peerPublicKeyB64) {
        if (!peerPublicKeyB64) return text; // Fallback to plain text if no key available

        try {
            if (!this.keyPair) await this.init();

            // 1. Import Peer Public Key
            const peerPublicKey = await this._importPublicKey(peerPublicKeyB64);

            // 2. Derive Shared Secret (AES-256-GCM Key)
            const sharedKey = await window.crypto.subtle.deriveKey(
                { name: 'ECDH', public: peerPublicKey },
                this.keyPair.privateKey,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );

            // 3. Encrypt
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(text);
            const ciphertext = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                sharedKey,
                encoded
            );

            // 4. Return formatted blob
            return JSON.stringify({
                v: '1',
                iv: btoa(String.fromCharCode(...iv)),
                data: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
                encrypted: true
            });
        } catch (err) {
            console.error('[E2EE] Encryption failed:', err);
            return text; // Graceful fallback
        }
    }

    /**
     * Decrypts an encrypted message blob from a specific peer.
     * @param {string} encryptedBlob JSON string containing E2EE data
     * @param {string} peerPublicKeyB64 Peer's Base64 public key
     */
    async decrypt(encryptedBlob, peerPublicKeyB64) {
        if (!peerPublicKeyB64) return encryptedBlob;

        try {
            const blob = JSON.parse(encryptedBlob);
            if (!blob.encrypted || blob.v !== '1') return encryptedBlob;

            if (!this.keyPair) await this.init();

            // 1. Import Peer Public Key
            const peerPublicKey = await this._importPublicKey(peerPublicKeyB64);

            // 2. Derive Shared Secret
            const sharedKey = await window.crypto.subtle.deriveKey(
                { name: 'ECDH', public: peerPublicKey },
                this.keyPair.privateKey,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );

            // 3. Decrypt
            const iv = new Uint8Array(atob(blob.iv).split('').map(c => c.charCodeAt(0)));
            const ciphertext = new Uint8Array(atob(blob.data).split('').map(c => c.charCodeAt(0)));

            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                sharedKey,
                ciphertext
            );

            return new TextDecoder().decode(decrypted);
        } catch (err) {
            // If it's not valid JSON or decryption fails, return as-is
            return encryptedBlob;
        }
    }

    /**
     * Encrypts text using a symmetric key (AES-256-GCM).
     * @param {string} text 
     * @param {string} keyB64 Base64 encoded raw key
     */
    async encryptSymmetric(text, keyB64) {
        if (!keyB64) return text;
        try {
            const keyData = new Uint8Array(atob(keyB64).split('').map(c => c.charCodeAt(0)));
            const key = await window.crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );

            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(text);
            const ciphertext = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                encoded
            );

            return JSON.stringify({
                v: '1',
                iv: btoa(String.fromCharCode(...iv)),
                data: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
                symmetric: true
            });
        } catch (err) {
            console.error('[E2EE] Symmetric encryption failed:', err);
            return text;
        }
    }

    /**
     * Decrypts text using a symmetric key.
     */
    async decryptSymmetric(encryptedBlob, keyB64) {
        if (!keyB64) return encryptedBlob;
        try {
            const blob = JSON.parse(encryptedBlob);
            if (!blob.symmetric) return encryptedBlob;

            const keyData = new Uint8Array(atob(keyB64).split('').map(c => c.charCodeAt(0)));
            const key = await window.crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );

            const iv = new Uint8Array(atob(blob.iv).split('').map(c => c.charCodeAt(0)));
            const ciphertext = new Uint8Array(atob(blob.data).split('').map(c => c.charCodeAt(0)));

            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                ciphertext
            );

            return new TextDecoder().decode(decrypted);
        } catch (err) {
            return encryptedBlob;
        }
    }

    /**
     * Encrypts a File or Blob.
     * @returns {Promise<{blob: Blob, key: string, iv: string}>}
     */
    async encryptFile(file) {
        try {
            const rawKey = window.crypto.getRandomValues(new Uint8Array(32));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            const key = await window.crypto.subtle.importKey(
                'raw',
                rawKey,
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            const fileData = await file.arrayBuffer();
            const encryptedData = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                fileData
            );

            return {
                blob: new Blob([encryptedData], { type: 'application/octet-stream' }),
                key: btoa(String.fromCharCode(...rawKey)),
                iv: btoa(String.fromCharCode(...iv))
            };
        } catch (err) {
            console.error('[E2EE] File encryption failed:', err);
            throw err;
        }
    }

    /**
     * Decrypts an encrypted Blob.
     */
    async decryptFile(encryptedBlob, keyB64, ivB64, originalType = 'image/jpeg') {
        try {
            const rawKey = new Uint8Array(atob(keyB64).split('').map(c => c.charCodeAt(0)));
            const iv = new Uint8Array(atob(ivB64).split('').map(c => c.charCodeAt(0)));

            const key = await window.crypto.subtle.importKey(
                'raw',
                rawKey,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            const encryptedBuffer = await encryptedBlob.arrayBuffer();
            const decryptedData = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                encryptedBuffer
            );

            return new Blob([decryptedData], { type: originalType });
        } catch (err) {
            console.error('[E2EE] File decryption failed:', err);
            throw err;
        }
    }



    // --- Private Helpers ---

    async _importPublicKey(b64) {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        return await window.crypto.subtle.importKey(
            'spki',
            bytes,
            { name: 'ECDH', namedCurve: 'P-256' },
            false,
            []
        );
    }

    /**
     * Saves keys to IndexedDB (Secure browser storage).
     */
    _saveToStorage(keyPair) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                e.target.result.createObjectStore(this.storeName);
            };
            request.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.put(keyPair.publicKey, 'publicKey');
                store.put(keyPair.privateKey, 'privateKey');
                tx.oncomplete = () => resolve();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * Loads keys from IndexedDB.
     */
    _loadFromStorage() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                e.target.result.createObjectStore(this.storeName);
            };
            request.onsuccess = async (e) => {
                const db = e.target.result;
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);

                const pubReq = store.get('publicKey');
                const privReq = store.get('privateKey');

                tx.oncomplete = () => {
                    if (pubReq.result && privReq.result) {
                        resolve({ publicKey: pubReq.result, privateKey: privReq.result });
                    } else {
                        resolve(null);
                    }
                };
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }
}

export const encryptionService = new EncryptionService();
