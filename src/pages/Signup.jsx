import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Smartphone, Loader2, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import logo from '../assets/vyx-logo.png';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { BASE_URL } from '../utils/api';
import './Login.css';

const firebaseConfig = {
  apiKey: "AIzaSyD5YDG_tKuY8F8BRqr6G3-LwfTl0Wg2aS4",
  authDomain: "vyx-v2-4123b.firebaseapp.com",
  projectId: "vyx-v2-4123b",
  storageBucket: "vyx-v2-4123b.firebasestorage.app",
  messagingSenderId: "519726312796",
  appId: "1:519726312796:web:8f31d9f6dc1098f10d2599",
  measurementId: "G-GZ343V3W23"
};

const app = !getApps().length 
  ? initializeApp(firebaseConfig, 'vyx-primary') 
  : (getApps().find(a => a.name === 'vyx-primary') || getApps()[0]);
const auth = getAuth(app);

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // UI States
    const [usernameStatus, setUsernameStatus] = useState('idle'); // idle, checking, available, taken, invalid
    const [usernameMessage, setUsernameMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0); // 0-4
    
    // Focus States
    const [usernameFocused, setUsernameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmFocused, setConfirmFocused] = useState(false);

    // Enforce Username Rules: No capital start, 3-20 chars
    const validateUsername = (name) => {
        if (!name) return { valid: false, msg: '' };
        if (/^[A-Z]/.test(name)) {
            return { valid: false, msg: 'Username must start with a lowercase letter.' };
        }
        if (name.length > 0 && name.length < 3) {
            return { valid: false, msg: 'Too short (min 3 characters).' };
        }
        if (name.length > 20) {
            return { valid: false, msg: 'Too long (max 20 characters).' };
        }
        if (!/^[a-z0-9_.]+$/.test(name)) {
            return { valid: false, msg: 'Use only letters, numbers, _ or .' };
        }
        return { valid: true, msg: '' };
    };

    // Debounced Username Availability Check
    useEffect(() => {
        const username = formData.username.trim();
        if (!username) {
            setUsernameStatus('idle');
            setUsernameMessage('');
            return;
        }

        const { valid, msg } = validateUsername(username);
        if (!valid) {
            setUsernameStatus('invalid');
            setUsernameMessage(msg);
            return;
        }

        // Only check availability if valid
        setUsernameStatus('checking');
        setUsernameMessage(''); // Clear "Too short" immediately when it becomes valid
        
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/check-username/${username}`);
                const data = await res.json();
                if (data.available) {
                    setUsernameStatus('available');
                    setUsernameMessage('Username is available!');
                } else {
                    setUsernameStatus('taken');
                    setUsernameMessage('Taken. Try adding _ or . at the end.');
                }
            } catch (err) {
                setUsernameStatus('idle');
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [formData.username]);

    // Password Strength Intelligence
    const [passwordMetrics, setPasswordMetrics] = useState({
        length: false,
        number: false,
        symbol: false,
        capital: false
    });

    useEffect(() => {
        const pass = formData.password;
        const metrics = {
            length: pass.length >= 8,
            number: /[0-9]/.test(pass),
            symbol: /[^a-zA-Z0-9]/.test(pass),
            capital: /[A-Z]/.test(pass)
        };
        setPasswordMetrics(metrics);
        
        const score = Object.values(metrics).filter(Boolean).length;
        setPasswordStrength(score);
    }, [formData.password]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            return setError('Please fill out all fields.');
        }

        if (usernameStatus !== 'available' && usernameStatus !== 'checking') {
            return setError('Please choose a valid, unique username.');
        }

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setIsLoading(true);

        try {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                const firebaseUser = userCredential.user;

                await updateProfile(firebaseUser, {
                    displayName: formData.username,
                    photoURL: ""
                });

                const token = await firebaseUser.getIdToken();
                const userObj = {
                    _id: firebaseUser.uid,
                    username: formData.username,
                    email: formData.email,
                    avatar: firebaseUser.photoURL || "",
                    bio: "New on Vyx!",
                    isVerified: false
                };

                localStorage.setItem('user', JSON.stringify(userObj));
                localStorage.setItem('token', token);
                localStorage.setItem('isAuthenticated', 'true');
                window.dispatchEvent(new Event('vyx_auth_update'));
                navigate('/verify', { state: { email: formData.email } });
                return;

            } catch (authErr) {
                const backRes = await fetch(`${BASE_URL}/api/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        username: formData.username, 
                        email: formData.email, 
                        password: formData.password 
                    })
                });
                
                const backData = await backRes.json();
                if (backData.success) {
                    localStorage.setItem('user', JSON.stringify(backData.user));
                    localStorage.setItem('token', backData.token);
                    localStorage.setItem('isAuthenticated', 'true');
                    window.dispatchEvent(new Event('vyx_auth_update'));
                    navigate('/verify', { state: { email: formData.email } });
                    return;
                } else {
                    throw new Error(backData.error || backData.message || 'Backend fallback signup failed.');
                }
            }
        } catch (err) {
            if (err.code === 'auth/email-already-in-use' || err.message?.includes('already exists')) {
                 setError('Email or Username is already registered.');
            } else if (err.code === 'auth/weak-password') {
                 setError('Password must be at least 6 characters.');
            } else {
                 setError(err.message || 'Connection error.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (providerName) => {
        setIsLoading(true);
        setError('');
        try {
            let provider;
            if (providerName === 'Google') provider = new GoogleAuthProvider();
            if (providerName === 'Apple') provider = new OAuthProvider('apple.com');
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`${BASE_URL}/api/social-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: firebaseUser.email,
                    username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    avatar: firebaseUser.photoURL || "",
                    provider: providerName,
                    uid: firebaseUser.uid
                })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', token);
                localStorage.setItem('isAuthenticated', 'true');
                
                // Dispatch global auth update pulse
                window.dispatchEvent(new Event('vyx_auth_update'));
                
                navigate('/');
            } else {
                setError('Social Sync Failed. Try standard signup.');
            }
        } catch(err) {
            setError('Social login halted. Try standard signup.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-decoration">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
            </div>

            <div className="login-card glass-panel animate-fade-in">
                <div className="login-header">
                    <div className="logo-section">
                        <img src={logo} alt="Vyx Logo" className="logo-image" />
                        <h1 className="logo-text">Vyx</h1>
                    </div>
                    <p className="login-subtitle">Join the frequency. Create your Vyx account.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form" noValidate>
                    {/* Username Field */}
                    <div className={`input-group floating-input ${usernameFocused || formData.username ? 'active' : ''}`}>
                        <div className={`input-with-icon ${usernameStatus === 'available' ? 'success' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'error' : ''}`}>
                            <User className={`field-icon ${usernameFocused ? 'focused' : ''}`} size={18} />
                            <input 
                                type="text" 
                                id="username" 
                                value={formData.username}
                                onChange={handleChange}
                                onFocus={() => setUsernameFocused(true)}
                                onBlur={() => setUsernameFocused(false)}
                                placeholder=" "
                                required
                                maxLength={20}
                            />
                            <label htmlFor="username" className="floating-label">Username</label>
                            <div className="status-icon">
                                {usernameStatus === 'checking' && <Loader2 size={16} className="animate-spin text-muted" />}
                                {usernameStatus === 'available' && <CheckCircle2 size={16} className="text-success" />}
                                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                                    <button 
                                        type="button" 
                                        className="clear-username-btn"
                                        onClick={() => setFormData({ ...formData, username: '' })}
                                    >
                                        <XCircle size={16} className="text-danger" />
                                    </button>
                                )}
                            </div>
                        </div>
                        {usernameMessage && (
                            <p className={`field-hint ${usernameStatus === 'available' ? 'success' : 'error'}`}>
                                {usernameMessage}
                            </p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className={`input-group floating-input ${emailFocused || formData.email ? 'active' : ''}`}>
                        <div className="input-with-icon">
                            <Mail className={`field-icon ${emailFocused ? 'focused' : ''}`} size={18} />
                            <input 
                                type="email" 
                                id="email" 
                                value={formData.email}
                                onChange={handleChange}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="email" className="floating-label">Email Address</label>
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className={`input-group floating-input ${passwordFocused || formData.password ? 'active' : ''}`}>
                        <div className="input-with-icon">
                            <Lock className={`field-icon ${passwordFocused ? 'focused' : ''}`} size={18} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                id="password" 
                                value={formData.password}
                                onChange={handleChange}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="password" className="floating-label">Password</label>
                            <button 
                                type="button" 
                                className="toggle-password" 
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {formData.password && (
                            <div className="strength-meter">
                                <div className={`strength-bar ${passwordStrength >= 1 ? 'active' : ''}`} data-level="1" />
                                <div className={`strength-bar ${passwordStrength >= 2 ? 'active' : ''}`} data-level="2" />
                                <div className={`strength-bar ${passwordStrength >= 3 ? 'active' : ''}`} data-level="3" />
                                <div className={`strength-bar ${passwordStrength >= 4 ? 'active' : ''}`} data-level="4" />
                                <span className="strength-label">
                                    {passwordStrength <= 1 && 'Weak'}
                                    {passwordStrength === 2 && 'Fair'}
                                    {passwordStrength === 3 && 'Good'}
                                    {passwordStrength >= 4 && 'Strong'}
                                </span>
                            </div>
                        )}
                        {formData.password && (
                            <div className="password-checklist">
                                <div className={`check-item ${passwordMetrics.length ? 'met' : ''}`}>
                                    {passwordMetrics.length ? <CheckCircle2 size={12} /> : <div className="dot" />}
                                    <span>8+ chars</span>
                                </div>
                                <div className={`check-item ${passwordMetrics.capital ? 'met' : ''}`}>
                                    {passwordMetrics.capital ? <CheckCircle2 size={12} /> : <div className="dot" />}
                                    <span>ABC</span>
                                </div>
                                <div className={`check-item ${passwordMetrics.number ? 'met' : ''}`}>
                                    {passwordMetrics.number ? <CheckCircle2 size={12} /> : <div className="dot" />}
                                    <span>123</span>
                                </div>
                                <div className={`check-item ${passwordMetrics.symbol ? 'met' : ''}`}>
                                    {passwordMetrics.symbol ? <CheckCircle2 size={12} /> : <div className="dot" />}
                                    <span>#$&</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className={`input-group floating-input ${confirmFocused || formData.confirmPassword ? 'active' : ''}`}>
                        <div className="input-with-icon">
                            <Lock className={`field-icon ${confirmFocused ? 'focused' : ''}`} size={18} />
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                id="confirmPassword" 
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onFocus={() => setConfirmFocused(true)}
                                onBlur={() => setConfirmFocused(false)}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="confirmPassword" className="floating-label">Confirm Password</label>
                            <button 
                                type="button" 
                                className="toggle-password" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="login-error animate-shake">{error}</div>}

                    <button 
                        type="submit" 
                        className="login-submit-btn text-gradient-bg"
                        disabled={isLoading || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid'}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                <div className="divider">
                    <span>Or join with</span>
                </div>

                <div className="social-login">
                    <button type="button" className="social-btn glass-panel" onClick={() => handleSocialLogin('Apple')} disabled={isLoading}>Apple</button>
                    <button type="button" className="social-btn glass-panel" onClick={() => handleSocialLogin('Google')} disabled={isLoading}>Google</button>
                </div>

                <p className="signup-prompt">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;

