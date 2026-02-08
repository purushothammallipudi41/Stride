import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [identifier, setIdentifier] = useState(''); // Email or Username
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            if (isRegistering) {
                await register({ name, username, email, password });
            } else {
                await login({ identifier, password });
            }
            navigate('/');
        } catch (err) {
            console.error('Login Error:', err);
            setError(err.message || 'Authentication failed. Please check your network or credentials.');
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
                    <p>{isRegistering ? 'Join the rhythm' : 'Enter your rhythm'}</p>
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

                <div className="login-footer">
                    <span>{isRegistering ? 'Already have an account? ' : "Don't have an account? "}</span>
                    <button className="text-link-btn" onClick={() => setIsRegistering(!isRegistering)}>
                        {isRegistering ? 'Sign In' : 'Register'}
                    </button>
                </div>
                <div className="version-tag">v1.0.3-latest</div>
            </div>
        </div>
    );
};

export default Login;
