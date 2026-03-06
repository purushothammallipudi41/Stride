import { createContext, useState, useContext, useEffect } from 'react';
import config from '../config';
import { encryptionService } from '../utils/EncryptionService';


const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [storageType, setStorageType] = useState('session'); // 'local' or 'session'

    useEffect(() => {
        const checkAuth = async () => {
            // Delay slightly on native to ensure Capacitor bridge & network are ready
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            let savedAccounts = localStorage.getItem('accounts');
            let activeId = localStorage.getItem('activeAccountId');
            let type = 'local';

            if (!savedAccounts) {
                savedAccounts = sessionStorage.getItem('accounts');
                activeId = sessionStorage.getItem('activeAccountId');
                type = 'session';
            }

            setStorageType(type);

            if (savedAccounts) {
                try {
                    const parsedAccounts = JSON.parse(savedAccounts);
                    setAccounts(parsedAccounts);

                    const active = parsedAccounts.find(a => a.id === activeId || a.email === activeId);
                    if (active) {
                        setUser(active);
                        syncEncryptionKeys(active);
                        // Refresh active user data with safety guard
                        try {
                            console.log('[Auth] Boot-time refresh for:', active.email);
                            const res = await fetch(`${config.API_URL}/api/users/${active.id || active.email}`);
                            if (res.ok) {
                                const full = await res.json();
                                const updatedAccounts = parsedAccounts.map(a => (a.id === full.id || a.email === full.email) ? full : a);
                                setAccounts(updatedAccounts);
                                setUser(full);
                                syncEncryptionKeys(full);

                                if (type === 'local') {
                                    localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                                } else {
                                    sessionStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                                }
                            }
                        } catch (fetchErr) {
                            console.warn('[Auth] Boot refresh failed (network/native):', fetchErr);
                        }
                    }
                } catch (parseErr) {
                    console.error('[Auth] Failed to parse accounts:', parseErr);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);


    // Socket listener moved to SocketContext to break circular dependency


    const syncEncryptionKeys = async (currentUser) => {
        if (!currentUser || !currentUser.email) return;

        try {
            await encryptionService.init();
            const publicKey = await encryptionService.getExportedPublicKey();

            // If user doesn't have a public key on the server, or it's different, upload it
            if (!currentUser.messagingPublicKey || currentUser.messagingPublicKey !== publicKey) {
                console.log('[E2EE] Syncing public key with server...');
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const res = await fetch(`${config.API_URL}/api/users/me/public-key`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ publicKey })
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log('[E2EE] Public key synced successfully.');
                    // Note: We don't strictly need to update local state here as next refresh will get it,
                    // but it helps for immediate context.
                }
            }
        } catch (err) {
            console.error('[E2EE] Key sync failed:', err);
        }
    };

    const login = async (credentials, rememberMe = false) => {
        try {
            const res = await fetch(`${config.API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const contentType = res.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                console.error('[AUTH_JSON_ERROR]', text.substring(0, 100));
                throw new Error('Server returned an invalid response format.');
            }

            if (res.ok) {
                if (data.requires2FA) {
                    return { requires2FA: true, email: data.email };
                }

                const fullData = data.user;
                handlePostLogin(fullData, rememberMe, data.token);
                return true;
            } else {
                throw new Error(data.error || 'Invalid credentials');
            }
        } catch (e) {
            console.error("Login failed", e);
            throw e;
        }
    };

    const handlePostLogin = (fullData, rememberMe, token) => {
        const existingIdx = accounts.findIndex(a => a.email === fullData.email);
        let updatedAccounts;
        if (existingIdx > -1) {
            updatedAccounts = [...accounts];
            updatedAccounts[existingIdx] = fullData;
        } else {
            updatedAccounts = [...accounts, fullData];
        }

        setAccounts(updatedAccounts);
        setUser(fullData);
        syncEncryptionKeys(fullData);

        if (rememberMe) {
            localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
            localStorage.setItem('activeAccountId', fullData.id || fullData.email);
            if (token) localStorage.setItem('token', token);
            setStorageType('local');
            sessionStorage.removeItem('accounts');
            sessionStorage.removeItem('activeAccountId');
            sessionStorage.removeItem('token');
        } else {
            sessionStorage.setItem('accounts', JSON.stringify(updatedAccounts));
            sessionStorage.setItem('activeAccountId', fullData.id || fullData.email);
            if (token) sessionStorage.setItem('token', token);
            setStorageType('session');
            localStorage.removeItem('accounts');
            localStorage.removeItem('activeAccountId');
            localStorage.removeItem('token');
        }
    };

    const validate2FA = async (email, token, rememberMe = false) => {
        try {
            const res = await fetch(`${config.API_URL}/api/auth/2fa/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token })
            });

            const contentType = res.headers.get('content-type');
            if (res.ok) {
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    handlePostLogin(data.user, rememberMe, data.token);
                    return true;
                }
                throw new Error('Server returned invalid data format');
            } else {
                if (contentType && contentType.includes('application/json')) {
                    const err = await res.json();
                    throw new Error(err.error || 'Invalid 2FA token');
                }
                throw new Error('2FA validation failed');
            }
        } catch (e) {
            console.error("2FA validation failed", e);
            throw e;
        }
    };

    const setup2FA = async (email) => {
        const res = await fetch(`${config.API_URL}/api/auth/2fa/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return await res.json();
    };

    const verify2FA = async (email, token) => {
        const res = await fetch(`${config.API_URL}/api/auth/2fa/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token })
        });
        return await res.json();
    };

    const disable2FA = async (email, token) => {
        const res = await fetch(`${config.API_URL}/api/auth/2fa/disable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token })
        });
        return await res.json();
    };

    const register = async (userData) => {
        try {
            const res = await fetch(`${config.API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const contentType = res.headers.get('content-type');
            if (res.ok) {
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    return { success: true, email: data.email };
                }
                return { success: true };
            } else {
                if (contentType && contentType.includes('application/json')) {
                    const err = await res.json();
                    throw new Error(err.error || 'Registration failed');
                }
                throw new Error('Registration failed');
            }
        } catch (e) {
            console.error("Registration failed", e);
            throw e;
        }
    };

    const switchAccount = (accountId) => {
        const target = accounts.find(a => a.id === accountId || a.email === accountId);
        if (target) {
            setUser(target);
            setUser(target);
            if (storageType === 'local') {
                localStorage.setItem('activeAccountId', accountId);
            } else {
                sessionStorage.setItem('activeAccountId', accountId);
            }
        }
    };

    const logout = () => {
        const remaining = accounts.filter(a => a.id !== user?.id && a.email !== user?.email);
        setAccounts(remaining);

        // Remove from both to be safe, or check storageType
        localStorage.removeItem('accounts');
        localStorage.removeItem('activeAccountId');
        sessionStorage.removeItem('accounts');
        sessionStorage.removeItem('activeAccountId');

        if (remaining.length > 0) {
            setUser(remaining[0]);
            // If there are other accounts, we need to decide where to keep them. 
            // For simplicity, if we were in local, keep local. If session, keep session.
            if (storageType === 'local') {
                localStorage.setItem('activeAccountId', remaining[0].id || remaining[0].email);
                localStorage.setItem('accounts', JSON.stringify(remaining));
            } else {
                sessionStorage.setItem('activeAccountId', remaining[0].id || remaining[0].email);
                sessionStorage.setItem('accounts', JSON.stringify(remaining));
            }
        } else {
            setUser(null);
        }
    };

    const refreshUser = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${config.API_URL}/api/users/${user.id || user.email}`);
            if (res.ok) {
                const refreshed = await res.json();
                const updatedAccounts = accounts.map(a => (a.id === refreshed.id || a.email === refreshed.email) ? refreshed : a);
                setAccounts(updatedAccounts);
                setUser(refreshed);


                if (storageType === 'local') {
                    localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                } else {
                    sessionStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                }
            }
        } catch (e) {
            console.error("Refresh failed", e);
        }
    };

    const updateProfile = async (updates) => {
        if (!user) return;

        // Debugging Validation
        if (!config || !config.API_URL) {
            throw new Error(`Configuration Error: API_URL is missing. Config: ${JSON.stringify(config)}`);
        }
        if (!user.email) {
            throw new Error('User Error: Email is missing from user object');
        }

        const url = `${config.API_URL}/api/users/${user.email}/update`;
        console.log('[AuthContext] Update URL:', url);

        try {
            // Verify URL validity
            new URL(url);
        } catch (e) {
            throw new Error(`Invalid URL constructed: "${url}"`);
        }

        try {
            console.log('[AuthContext] Sending update request...');
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const data = await res.json();
                const refreshed = data;
                const updatedAccounts = accounts.map(a => (a.id === refreshed.id || a.email === refreshed.email) ? refreshed : a);
                setAccounts(updatedAccounts);
                setUser(refreshed);

                if (storageType === 'local') {
                    localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                } else {
                    sessionStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                }
                return refreshed;
            }
        } catch (e) {
            console.error("Update profile failed", e);
            throw e;
        }
    };

    const deleteAccount = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${config.API_URL}/api/users/${user.email}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                logout();
                return true;
            }
        } catch (e) {
            console.error("Delete account failed", e);
            throw e;
        }
    };

    const blockUser = async (targetId) => {
        if (!user) return;
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${config.API_URL}/api/users/${targetId}/block`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                await refreshUser();
                return true;
            }
        } catch (e) {
            console.error("Block user failed", e);
        }
        return false;
    };

    const unblockUser = async (targetId) => {
        if (!user) return;
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${config.API_URL}/api/users/${targetId}/unblock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                await refreshUser();
                return true;
            }
        } catch (e) {
            console.error("Unblock user failed", e);
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{
            user, accounts, loading, login, logout, refreshUser,
            switchAccount, updateProfile, deleteAccount, register,
            validate2FA, setup2FA, verify2FA, disable2FA,
            blockUser, unblockUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};
