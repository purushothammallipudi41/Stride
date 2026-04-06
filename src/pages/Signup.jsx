import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Smartphone, Loader2 } from 'lucide-react';
import logo from '../assets/stride-logo.png';
import { BASE_URL } from '../utils/api';
import './Login.css'; // Reuse Login styles for consistency

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
            // 1. Create Account
            const response = await fetch(`${BASE_URL}/api/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (data.success) {
                // 2. Trigger Verification Code
                await fetch(`${BASE_URL}/api/send-code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email })
                });

                // 3. Link user data for session
                localStorage.setItem('user', JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    avatar: `https://i.pravatar.cc/150?u=${formData.username}`
                }));

                // 4. Navigate to Verification
                navigate('/verify', { state: { email: formData.email } });
            } else {
                setError(data.message || 'Signup failed. Please try again.');
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError('Connection error. Please try again later.');
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
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <div className="input-with-icon">
                            <User className="field-icon" size={18} />
                            <input 
                                type="text" 
                                id="username" 
                                placeholder="stride_creator"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-with-icon">
                            <Mail className="field-icon" size={18} />
                            <input 
                                type="email" 
                                id="email" 
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-with-icon">
                            <Lock className="field-icon" size={18} />
                            <input 
                                type="password" 
                                id="password" 
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="input-with-icon">
                            <Lock className="field-icon" size={18} />
                            <input 
                                type="password" 
                                id="confirmPassword" 
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
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
