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
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isRegistering) {
                await register({ name, username, email, password });
            } else {
                await login({ identifier, password });
            }
            navigate('/');
        } catch (error) {
            alert(error.message || 'Authentication failed. Please check your credentials.');
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
                        />
                    </div>
                    <button type="submit" className="login-btn">
                        {isRegistering ? 'Sign Up' : 'Sign In'}
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
