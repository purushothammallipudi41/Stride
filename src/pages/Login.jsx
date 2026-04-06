import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Globe, Smartphone, Loader2 } from 'lucide-react';
import { BASE_URL } from '../utils/api';
import logo from '../assets/stride-logo.png';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill out all fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        // Check if user is already verified
        if (data.user.isVerified) {
          localStorage.setItem('isAuthenticated', 'true');
          navigate('/');
        } else {
          // Send verification code before navigating
          await fetch(`${BASE_URL}/api/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.user.email })
          });
          navigate('/verify', { state: { email: data.user.email } });
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setIsLoading(true);
    setError('');
    // Simulate OAuth API connection delay
    setTimeout(() => {
      const mockSocialUser = {
        username: `${provider.toLowerCase()}_user`,
        email: `demo@${provider.toLowerCase()}.com`,
        avatar: `https://ui-avatars.com/api/?name=${provider}+User&background=random`
      };
      
      localStorage.setItem('user', JSON.stringify(mockSocialUser));
      localStorage.setItem('token', `${provider.toLowerCase()}-oauth-mock-token`);
      setIsLoading(false);
      
      // Social logins come pre-verified, so we skip the /verify screen and go straight to the app!
      navigate('/');
    }, 1200);
  };

  return (
    <div className="login-page">
      <div className="login-bg-decoration">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <div className="logo-section">
            <img src={logo} alt="Stride Logo" className="logo-image" />
            <h1 className="logo-text">Stride</h1>
          </div>
          <p className="login-subtitle">Connect, vibe, and discover the rhythm of your world.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="input-group">
            <label htmlFor="email">Email or Username</label>
            <div className="input-with-icon">
              <Mail className="field-icon" size={18} />
              <input 
                type="text" 
                id="email" 
                placeholder="you@example.com or user123"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <a href="#forgot" className="forgot-link">Forgot?</a>
            </div>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkmark" />
              Remember me
            </label>
          </div>

          {error && <div className="login-error animate-shake">{error}</div>}

          <button 
            type="submit" 
            className="login-submit-btn text-gradient-bg"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <span>Or continue with</span>
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
            <Globe size={20} /> Google
          </button>
        </div>

        <p className="signup-prompt">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
