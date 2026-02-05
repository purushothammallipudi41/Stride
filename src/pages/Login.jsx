import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Mock login
        login({ name: 'Alex', email, avatar: 'https://i.pravatar.cc/150?u=alex' });
        navigate('/');
    };

    return (
        <div className="login-container">
            <div className="login-glass-card">
                <div className="login-header">
                    <Activity className="logo-icon-large" size={48} />
                    <h1>Stride</h1>
                    <p>Enter your rhythm</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <Mail size={20} className="input-icon" />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <Lock size={20} className="input-icon" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-btn">Sign In</button>
                </form>

                <div className="login-footer">
                    <span>Don't have an account? </span>
                    <a href="#">Register</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
