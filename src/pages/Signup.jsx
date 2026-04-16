import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Smartphone, Loader2 } from 'lucide-react';
import logo from '../assets/stride-logo.png';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { BASE_URL } from '../utils/api';
import './Login.css';

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
            // 1. Create Identity Profile
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const firebaseUser = userCredential.user;

            // 2. Burn Username into Identity
            await updateProfile(firebaseUser, {
                displayName: formData.username,
                photoURL: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`
            });

            const token = await firebaseUser.getIdToken();

            // 3. Link user data for local session pulse
            localStorage.setItem('user', JSON.stringify({
                _id: firebaseUser.uid,
                username: formData.username,
                email: formData.email,
                avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
                isVerified: false
            }));
            localStorage.setItem('token', token);

            // 4. Navigate to Verification Rhythm
            navigate('/verify', { state: { email: formData.email } });
        } catch (err) {
            console.error('Firebase Signup error:', err);
            if (err.code === 'auth/email-already-in-use') {
                 setError('Email is already registered.');
            } else if (err.code === 'auth/weak-password') {
                 setError('Password must be at least 6 characters.');
            } else {
                 setError(err.message || 'Connection error. Please try again later.');
            }
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
                            <div className="input-divider" />
                            <input 
                                type="text" 
                                id="username" 
                                value={formData.username}
                                onChange={handleChange}
                                onFocus={() => setUsernameFocused(true)}
                                onBlur={() => setUsernameFocused(false)}
                                required
                            />
                            <label htmlFor="username" className="floating-label">Username</label>
                        </div>
                    </div>

                    <div className={`input-group floating-input ${emailFocused || formData.email ? 'active' : ''}`}>
                        <div className="input-with-icon">
                            <Mail className={`field-icon ${emailFocused ? 'focused' : ''}`} size={18} />
                            <div className="input-divider" />
                            <input 
                                type="email" 
                                id="email" 
                                value={formData.email}
                                onChange={handleChange}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                required
                            />
                            <label htmlFor="email" className="floating-label">Email Address</label>
                        </div>
                    </div>

                    <div className={`input-group floating-input ${passwordFocused || formData.password ? 'active' : ''}`}>
                        <div className="input-with-icon">
                            <Lock className={`field-icon ${passwordFocused ? 'focused' : ''}`} size={18} />
                            <div className="input-divider" />
                            <input 
                                type="password" 
                                id="password" 
                                value={formData.password}
                                onChange={handleChange}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                required
                            />
                            <label htmlFor="password" className="floating-label">Password</label>
                        </div>
                    </div>

                    <div className={`input-group floating-input ${confirmFocused || formData.confirmPassword ? 'active' : ''}`}>
                        <div className="input-with-icon">
                            <Lock className={`field-icon ${confirmFocused ? 'focused' : ''}`} size={18} />
                            <div className="input-divider" />
                            <input 
                                type="password" 
                                id="confirmPassword" 
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onFocus={() => setConfirmFocused(true)}
                                onBlur={() => setConfirmFocused(false)}
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

                <p className="signup-prompt">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
