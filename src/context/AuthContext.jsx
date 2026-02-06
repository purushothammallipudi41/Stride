import { createContext, useState, useContext, useEffect } from 'react';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const savedAccounts = localStorage.getItem('accounts');
            const activeId = localStorage.getItem('activeAccountId');

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
                            localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                        }
                    } catch (e) { }
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (credentials) => {
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
                localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
                localStorage.setItem('activeAccountId', fullData.id || fullData.email);
                return true;
            } else {
                throw new Error('Invalid credentials');
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
                await login({ identifier: data.user.email, password: userData.password });
                return true;
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
            localStorage.setItem('activeAccountId', accountId);
        }
    };

    const logout = () => {
        const remaining = accounts.filter(a => a.id !== user?.id && a.email !== user?.email);
        setAccounts(remaining);
        if (remaining.length > 0) {
            setUser(remaining[0]);
            localStorage.setItem('activeAccountId', remaining[0].id || remaining[0].email);
            localStorage.setItem('accounts', JSON.stringify(remaining));
        } else {
            setUser(null);
            localStorage.removeItem('accounts');
            localStorage.removeItem('activeAccountId');
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
                localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
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
                localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
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
