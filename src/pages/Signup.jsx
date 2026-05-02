import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Smartphone, Loader2 } from 'lucide-react';
import logo from '../assets/stride-logo.png';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { BASE_URL } from '../utils/api';
import './Login.css';

const firebaseConfig = {
  apiKey: "AIzaSyD5YDG_tKuY8F8BRqr6G3-LwfTl0Wg2aS4",
  authDomain: "stride-v2-4123b.firebaseapp.com",
  projectId: "stride-v2-4123b",
  storageBucket: "stride-v2-4123b.firebasestorage.app",
  messagingSenderId: "519726312796",
  appId: "1:519726312796:web:8f31d9f6dc1098f10d2599",
  measurementId: "G-GZ343V3W23"
};

// Single Named Instance Lock - Prevents collisions and ensures config persistence
const app = !getApps().length 
  ? initializeApp(firebaseConfig, 'stride-primary') 
  : (getApps().find(a => a.name === 'stride-primary') || getApps()[0]);
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
    const [usernameFocused, setUsernameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmFocused, setConfirmFocused] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            return setError('Please fill out all fields.');
        }

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setIsLoading(true);

        try {
            let userObj, token;
            
            try {
                // Priority 1: High-Fidelity Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                const firebaseUser = userCredential.user;

                // 2. Burn Username into Identity
                await updateProfile(firebaseUser, {
                    displayName: formData.username,
                    photoURL: ""
                });

                token = await firebaseUser.getIdToken();
                userObj = {
                    _id: firebaseUser.uid,
                    username: formData.username,
                    email: formData.email,
                    avatar: firebaseUser.photoURL || "",
                    isVerified: false
                };
            } catch (authErr) {
                console.warn('Firebase Auth Pulse Halted. Falling back to Core Backend Auth:', authErr.code);
                
                // Priority 2: Core Stride Backend Fallback
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
                    userObj = backData.user;
                    token = backData.token;
                } else {
                    throw new Error(backData.error || backData.message || 'Backend fallback signup failed.');
                }
            }

            // 3. Link user data for local session pulse
            localStorage.setItem('user', JSON.stringify(userObj));
            localStorage.setItem('token', token);

            // 4. Navigate to Verification Rhythm
            navigate('/verify', { state: { email: formData.email } });
        } catch (err) {
            console.error('Unified Signup error:', err);
            if (err.code === 'auth/email-already-in-use' || err.message?.includes('already exists')) {
                 setError('Email or Username is already registered.');
            } else if (err.code === 'auth/weak-password') {
                 setError('Password must be at least 6 characters.');
            } else if (err.code === 'auth/configuration-not-found') {
                 setError('Firebase Auth Error: Please enable "Email/Password" in your Firebase Console (Authentication > Sign-in method).');
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
            let firebaseUser, token;
            
            try {
                // Priority 1: High-Fidelity Firebase Auth
                let provider;
                if (providerName === 'Google') provider = new GoogleAuthProvider();
                if (providerName === 'Apple') provider = new OAuthProvider('apple.com');

                const result = await signInWithPopup(auth, provider);
                firebaseUser = result.user;
                token = await firebaseUser.getIdToken();
            } catch (authErr) {
                console.warn('Firebase Social Pulse Halted. Moving to Stride Social Fallback:', authErr.code);
                
                // Priority 2: Core Stride Social Fallback (Mock data for dev/config-error states)
                const mockEmail = `mock_${providerName.toLowerCase()}_${Date.now()}@stride.social`;
                const res = await fetch(`${BASE_URL}/api/social-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: mockEmail,
                        username: `stride_user_${Date.now().toString().slice(-4)}`,
                        provider: providerName,
                        uid: `mock-uid-${Date.now()}`
                    })
                });

                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('isAuthenticated', 'true');
                    navigate('/');
                    return;
                } else {
                    throw authErr;
                }
            }

            // If Firebase succeeded, sync the real data with our backend
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
                navigate('/');
            } else {
                setError('Social Sync Failed. Try standard signup.');
            }

        } catch(err) {
            console.error('Social auth error:', err);
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
                        <img src={logo} alt="Stride Logo" className="logo-image" />
                        <h1 className="logo-text">Stride</h1>
                    </div>
                    <p className="login-subtitle">Join the rhythm. Create your Stride account.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form" noValidate>
                    <div className={`input-group floating-input ${usernameFocused || formData.username ? 'active' : ''}`}>
                        <div className="input-with-icon">
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
                            />
                            <label htmlFor="username" className="floating-label">Username</label>
                        </div>
                    </div>

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

                    <div className={`input-group floating-input ${passwordFocused || formData.password ? 'active' : ''}`}>
                        <div className="input-with-icon">
                            <Lock className={`field-icon ${passwordFocused ? 'focused' : ''}`} size={18} />
                            <input 
                                type="password" 
                                id="password" 
                                value={formData.password}
                                onChange={handleChange}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="password" className="floating-label">Password</label>
                        </div>
                    </div>

                    <div className={`input-group floating-input ${confirmFocused || formData.confirmPassword ? 'active' : ''}`}>
                        <div className="input-with-icon">
                            <Lock className={`field-icon ${confirmFocused ? 'focused' : ''}`} size={18} />
                            <input 
                                type="password" 
                                id="confirmPassword" 
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onFocus={() => setConfirmFocused(true)}
                                onBlur={() => setConfirmFocused(false)}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="confirmPassword" className="floating-label">Confirm Password</label>
                        </div>
                    </div>

                    {error && <div className="login-error animate-shake">{error}</div>}

                    <button 
                        type="submit" 
                        className="login-submit-btn text-gradient-bg"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                <div className="divider">
                    <span>Or join with</span>
                </div>

                <div className="social-login">
                    <button 
                        type="button" 
                        className="social-btn glass-panel" 
                        onClick={() => handleSocialLogin('Apple')}
                        disabled={isLoading}
                    >
                        Apple
                    </button>
                    <button 
                        type="button" 
                        className="social-btn glass-panel" 
                        onClick={() => handleSocialLogin('Google')}
                        disabled={isLoading}
                    >
                        Google
                    </button>
                </div>

                <p className="signup-prompt">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
