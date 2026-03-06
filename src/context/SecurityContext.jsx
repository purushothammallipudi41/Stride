import React, { createContext, useContext, useState, useEffect } from 'react';
import { encryptionService } from '../utils/EncryptionService';
import { useAuth } from './AuthContext';
import config from '../config';

const SecurityContext = createContext({
    isE2EEEnabled: false,
    publicKey: null,
    sessions: {},
    keyCache: {},
    groupKeys: {},
    encryptMessage: async (text, peerEmail, serverId) => { },
    decryptMessage: async (encryptedData, peerEmail, serverId) => { },
    getGroupKey: async (serverId) => { }

});

export const useSecurity = () => useContext(SecurityContext);

export const SecurityProvider = ({ children }) => {
    const { user } = useAuth();
    const [publicKey, setPublicKey] = useState(null);
    const [sessions, setSessions] = useState({});
    const [keyCache, setKeyCache] = useState({});
    const [groupKeys, setGroupKeys] = useState({});
    const [isInitialized, setIsInitialized] = useState(false);



    useEffect(() => {
        const initSecurity = async () => {
            if (!user) return;

            try {
                await encryptionService.init();
                const pubKey = await encryptionService.getExportedPublicKey();
                setPublicKey(pubKey);

                // Publish public key to server if not already done
                await fetch(`${config.API_URL}/api/users/me/public-key`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ publicKey: pubKey })
                });


                setIsInitialized(true);
            } catch (err) {
                console.error('[SECURITY] Initialization failed:', err);
            }
        };

        initSecurity();
    }, [user]);

    const getPeerKey = async (email) => {
        if (keyCache[email]) return keyCache[email];

        try {
            const res = await fetch(`${config.API_URL}/api/users/${email}/public-key`);
            if (!res.ok) throw new Error('Peer key not found');
            const { publicKey: peerPubKey } = await res.json();

            setKeyCache(prev => ({ ...prev, [email]: peerPubKey }));
            return peerPubKey;
        } catch (err) {
            console.error(`[SECURITY] Failed to fetch key for ${email}:`, err);
            return null;
        }
    };

    const encryptMessage = async (text, peerEmail, serverId) => {
        if (!isInitialized) return text;

        try {
            // Use Server E2EE (Symmetric) if serverId is provided
            if (serverId) {
                const groupKey = await getGroupKey(serverId);
                if (groupKey) {
                    return await encryptionService.encryptSymmetric(text, groupKey);
                }
            }

            // Fallback to Peer E2EE (Asymmetric)
            if (peerEmail) {
                const peerPubKey = await getPeerKey(peerEmail);
                if (!peerPubKey) throw new Error('No public key for peer');
                return await encryptionService.encrypt(text, peerPubKey);
            }

            return text;
        } catch (err) {
            console.warn('[SECURITY] Encryption fallback to plain text:', err);
            return text;
        }
    };


    const decryptMessage = async (encryptedData, peerEmail, serverId) => {
        if (!isInitialized) return encryptedData;

        try {
            // Decrypt Server Message (Symmetric)
            if (serverId) {
                const groupKey = await getGroupKey(serverId);
                if (groupKey) {
                    return await encryptionService.decryptSymmetric(encryptedData, groupKey);
                }
            }

            // Decrypt Direct Message (Asymmetric)
            if (peerEmail) {
                const peerPubKey = await getPeerKey(peerEmail);
                if (!peerPubKey) throw new Error('No public key for peer');
                return await encryptionService.decrypt(encryptedData, peerPubKey);
            }

            return encryptedData;
        } catch (err) {
            console.warn('[SECURITY] Decryption failed:', err);
            return encryptedData;
        }
    };


    const getGroupKey = async (serverId) => {
        if (!serverId) return null;
        if (groupKeys[serverId]) return groupKeys[serverId];

        try {
            const res = await fetch(`${config.API_URL}/api/servers/${serverId}/group-key`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) return null; // Server might not be encrypted

            const data = await res.json();
            if (!data.isEncrypted || !data.groupKey) return null;

            setGroupKeys(prev => ({ ...prev, [serverId]: data.groupKey }));
            return data.groupKey;
        } catch (err) {
            console.error(`[SECURITY] Failed to fetch group key for ${serverId}:`, err);
            return null;
        }
    };



    return (
        <SecurityContext.Provider value={{
            isE2EEEnabled: isInitialized,
            publicKey,
            sessions,
            keyCache,
            groupKeys,
            encryptMessage,
            decryptMessage,
            getGroupKey

        }}>

            {children}
        </SecurityContext.Provider>
    );
};
