import { createContext, useState, useContext, useEffect } from 'react';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [storageType, setStorageType] = useState('session'); // 'local' or 'session'

    useEffect(() => {
        const checkAuth = async () => {
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
                const parsedAccounts = JSON.parse(savedAccounts);
                setAccounts(parsedAccounts);

                const active = parsedAccounts.find(a => a.id === activeId || a.email === activeId);
                if (active) {
                    setUser(active);
                    // Refresh active user data
                    try {
                        const res = await fetch(`${config.API_URL}/api/users/${active.id || active.email}`);
                        if (res.ok) {
                            const full = await res.json();
                            const updatedAccounts = parsedAccounts.map(a => (a.id === full.id || a.email === full.email) ? full : a);
                            setAccounts(updatedAccounts);
                            setUser(full);

                            if (type === 'local') {
                                localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                            } else {
                                sessionStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                            }
                        }
                    } catch (e) { }
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (credentials, rememberMe = false) => {
        try {
            const res = await fetch(`${config.API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            if (res.ok) {
                const data = await res.json();
                const fullData = data.user;

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

                if (rememberMe) {
                    localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                    localStorage.setItem('activeAccountId', fullData.id || fullData.email);
                    setStorageType('local');
                    // Clear session to avoid confusion
                    sessionStorage.removeItem('accounts');
                    sessionStorage.removeItem('activeAccountId');
                } else {
                    sessionStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                    sessionStorage.setItem('activeAccountId', fullData.id || fullData.email);
                    setStorageType('session');
                    // Clear local
                    localStorage.removeItem('accounts');
                    localStorage.removeItem('activeAccountId');
                }

                return true;
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Invalid credentials');
            }
        } catch (e) {
            console.error("Login failed", e);
            throw e;
        }
    };

    const register = async (userData) => {
        try {
            const res = await fetch(`${config.API_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (res.ok) {
                const data = await res.json();
                // Do NOT auto-login. Return success so UI can show verification.
                return { success: true, email: data.email };
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Registration failed');
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
                const refreshed = data.user;
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

    return (
        <AuthContext.Provider value={{ user, accounts, loading, login, logout, refreshUser, switchAccount, updateProfile, deleteAccount, register }}>
            {children}
        </AuthContext.Provider>
    );
};
