import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, Key, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import './Login.css';

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [identifier, setIdentifier] = useState(''); // Email or Username
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    // Verification State
    const [showVerification, setShowVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationEmail, setVerificationEmail] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Forgot Password State
    const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0: None, 1: Email, 2: Reset
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            if (isRegistering) {
                const res = await register({ name, username, email, password });
                if (res && res.success) {
                    setVerificationEmail(res.email);
                    setShowVerification(true);
                    setSuccessMessage('Verification code sent to your email!');
                }
            } else {
                await login({ identifier, password }, rememberMe);
                navigate('/');
            }
        } catch (err) {
            console.error('Login Error:', err);
            // Check if error indicates unverified account
            if (err.message === 'Email not verified' || (err.email && err.error === 'Email not verified')) {
                setVerificationEmail(err.email || identifier); // Fallback to identifier if email not in error
                setShowVerification(true);
                setError('Please verify your email to continue.');
            } else {
                setError(err.message || 'Authentication failed. Please check your network or credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${config.API_URL}/api/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: verificationEmail, code: verificationCode })
            });
            const data = await res.json();

            if (res.ok) {
                // Determine password to use for auto-login
                // If registering, we have `password`. If logging in, we have `password`.
                // If we fell back here from a session where password might be lost? 
                // We assume `password` state is still preserved as we haven't unmounted.
                await login({ identifier: verificationEmail, password }, rememberMe);
                navigate(isRegistering ? '/servers/0' : '/');
            } else {
                throw new Error(data.error || 'Verification failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);
        setSuccessMessage('');
        setError('');
        try {
            const res = await fetch(`${config.API_URL}/api/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: verificationEmail })
            });
            if (res.ok) {
                setSuccessMessage('Verification code resent!');
            } else {
                throw new Error('Failed to resend code');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${config.API_URL}/api/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifier }) // Reusing identifier for email
            });
            const data = await res.json();
            if (res.ok) {
                setForgotPasswordStep(2);
                setSuccessMessage(data.message);
            } else {
                throw new Error(data.error || 'Failed to send reset code');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${config.API_URL}/api/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifier, code: resetCode, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccessMessage('Password reset successful! You can now login.');
                setForgotPasswordStep(0);
                setPassword('');
            } else {
                throw new Error(data.error || 'Failed to reset password');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-glass-card">
                <div className="login-header">
                    <img src="/logo.png" alt="Stride Logo" className="logo-icon-large" style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '1rem' }} />
                    <h1>Stride</h1>
                    <p>
                        {showVerification ? 'Verify Account' :
                            isRegistering ? 'Join the rhythm' : 'Enter your rhythm'}
                    </p>
                </div>

                {error && (
                    <div className="error-message" style={{
                        color: '#ff4d4d',
                        background: 'rgba(255, 77, 77, 0.1)',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="success-message" style={{
                        color: '#4caf50',
                        background: 'rgba(76, 175, 80, 0.1)',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                    }}>
                        {successMessage}
                    </div>
                )}

                {!showVerification && forgotPasswordStep === 0 ? (
                    <form className="login-form" onSubmit={handleSubmit}>
                        {isRegistering && (
                            <>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoComplete="name"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoComplete="username"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="input-group">
                                    <Mail size={20} className="input-icon" />
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        disabled={isLoading}
                                    />
                                </div>
                            </>
                        )}

                        {!isRegistering && (
                            <div className="input-group">
                                <Mail size={20} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Email or Username"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                    autoComplete="username"
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <Lock size={20} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete={isRegistering ? "new-password" : "current-password"}
                                disabled={isLoading}
                            />
                        </div>

                        {!isRegistering && (
                            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                                <button type="button" className="text-link-btn" onClick={() => {
                                    setForgotPasswordStep(1);
                                    setIdentifier(''); // Clear to let them type email
                                    setError('');
                                }}>Forgot Password?</button>
                            </div>
                        )}

                        {!isRegistering && (
                            <div className="remember-me-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={{ accentColor: '#6C5DD3', width: '16px', height: '16px' }}
                                />
                                <label htmlFor="rememberMe" style={{ cursor: 'pointer' }}>Remember me</label>
                            </div>
                        )}

                        <button type="submit" className="login-btn" disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex-center gap-2">
                                    <Activity className="animate-spin" size={20} />
                                    {isRegistering ? 'Creating Account...' : 'Signing In...'}
                                </span>
                            ) : (
                                isRegistering ? 'Sign Up' : 'Sign In'
                            )}
                        </button>
                    </form>
                ) : forgotPasswordStep === 1 ? (
                    <form className="login-form" onSubmit={handleForgotPassword}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#ccc', fontSize: '0.9rem' }}>
                            Enter your email to reset your password.
                        </div>
                        <div className="input-group">
                            <Mail size={20} className="input-icon" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={isLoading}>
                            {isLoading ? <Activity className="animate-spin" size={20} /> : 'Send Reset Code'}
                        </button>
                        <button type="button" className="text-link-btn" onClick={() => setForgotPasswordStep(0)} style={{ marginTop: '1rem', width: '100%', textAlign: 'center' }}>
                            Back to Login
                        </button>
                    </form>
                ) : forgotPasswordStep === 2 ? (
                    <form className="login-form" onSubmit={handleResetPassword}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#ccc', fontSize: '0.9rem' }}>
                            Enter the code sent to <strong>{identifier}</strong> and your new password.
                        </div>
                        <div className="input-group">
                            <Key size={20} className="input-icon" />
                            <input
                                type="text"
                                placeholder="Reset Code"
                                value={resetCode}
                                onChange={(e) => setResetCode(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="input-group">
                            <Lock size={20} className="input-icon" />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={isLoading}>
                            {isLoading ? <Activity className="animate-spin" size={20} /> : 'Reset Password'}
                        </button>
                        <button type="button" className="text-link-btn" onClick={() => setForgotPasswordStep(1)} style={{ marginTop: '1rem', width: '100%', textAlign: 'center' }}>
                            Back
                        </button>
                    </form>
                ) : (
                    <form className="login-form" onSubmit={handleVerify}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#ccc', fontSize: '0.9rem' }}>
                            Enter the 6-digit code sent to<br /><strong>{verificationEmail}</strong>
                        </div>
                        <div className="input-group">
                            <Key size={20} className="input-icon" />
                            <input
                                type="text"
                                placeholder="Verification Code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                maxLength={6}
                                style={{ letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center' }}
                                disabled={isLoading}
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex-center gap-2">
                                    <Activity className="animate-spin" size={20} />
                                    Verifying...
                                </span>
                            ) : 'Verify Account'}
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                            <button type="button" className="text-link-btn" onClick={() => setShowVerification(false)} style={{ fontSize: '0.85rem' }}>
                                <ArrowLeft size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                Back
                            </button>
                            <button type="button" className="text-link-btn" onClick={handleResendCode} disabled={isLoading} style={{ fontSize: '0.85rem' }}>
                                Resend Code
                            </button>
                        </div>
                    </form>
                )}

                {!showVerification && (
                    <div className="login-footer">
                        <span>{isRegistering ? 'Already have an account? ' : "Don't have an account? "}</span>
                        <button className="text-link-btn" onClick={() => setIsRegistering(!isRegistering)}>
                            {isRegistering ? 'Sign In' : 'Register'}
                        </button>
                    </div>
                )}
                <div className="legal-links" style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                    <a href="/legal/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <a href="/legal/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
                </div>
                <div className="version-tag">v1.4.3</div>
            </div>
        </div>
    );
};

export default Login;
