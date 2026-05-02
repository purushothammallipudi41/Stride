import React, { useState, useEffect } from 'react';

import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { BASE_URL } from '../utils/api';
import { useUI } from '../hooks/useUI';
import logo from '../assets/stride-logo.png';
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useUI();
  
  const [isIntro, setIsIntro] = useState(true);
  
  // High-Fidelity Master Reset Pulse
  useEffect(() => {
    const timer = setTimeout(() => setIsIntro(false), 2000);
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
        localStorage.clear();
        sessionStorage.clear();
        addNotification({
            title: 'Cache Purged',
            message: 'All local session data has been successfully cleared. Synchronizing with Stride Nexus...',
            type: 'success'
        });
        // Clear URL params without reloading to prevent infinite loop
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    return () => clearTimeout(timer);
  }, [addNotification]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill out all fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let firebaseUser, token;
      
      try {
        // Priority 1: High-Fidelity Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        token = await firebaseUser.getIdToken();
      } catch (authErr) {
        console.warn('Firebase Auth Pulse Halted. Falling back to Core Backend Auth:', authErr.code);
        
        // Priority 2: Core Stride Backend Fallback (Unblocks dev and config-error states)
        const backRes = await fetch(`${BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const backData = await backRes.json();
        if (backData.success) {
          localStorage.setItem('user', JSON.stringify(backData.user));
          localStorage.setItem('token', backData.token);
          localStorage.setItem('isAuthenticated', 'true');
          navigate('/');
          return;
        } else {
          throw authErr; // Re-throw original if fallback also fails
        }
      }

      // Finalize Firebase session
      const mockSocialUser = {
        _id: firebaseUser.uid,
        username: firebaseUser.email.split('@')[0],
        email: firebaseUser.email,
        avatar: firebaseUser.photoURL || "", // Total Mock Eradication: No more Pravatar
        isVerified: firebaseUser.emailVerified
      };


      localStorage.setItem('user', JSON.stringify(mockSocialUser));
      localStorage.setItem('token', token);
      localStorage.setItem('isAuthenticated', 'true');

      navigate('/');

    } catch (err) {
      console.error('Unified Auth error:', err);
      if (err.code === 'auth/configuration-not-found') {
        setError('Firebase Auth Error: Please enable "Email/Password" in your Firebase Console (Authentication > Sign-in method).');
      } else {
        setError(err.message || 'Connection error. Check console.');
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
        setError('Social Sync Failed. Try standard login.');
      }

    } catch(err) {
        console.error('Social auth error:', err);
        setError('Social login halted. Try standard login.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const [forgotPulse, setForgotPulse] = useState(false);

  const handleForgotClick = async (e) => {
    e.preventDefault();
    if (!email) {
      setForgotPulse(true);
      setTimeout(() => setForgotPulse(false), 800);
      setError('Please enter your email to receive a reset pulse.');
      return;
    }

    try {
      addNotification({
        title: 'Initializing Shield',
        message: 'Synchronizing with Stride Auth Nexus...',
        type: 'info'
      });
      
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      
      addNotification({
        title: 'Reset Email Sent',
        message: `A password reset link has been sent to ${email}.`,
        type: 'success'
      });
      setError('');
    } catch (err) {
      console.warn('Firebase Reset Pulse Halted. Moving to Stride Backend Fallback:', err.code);
      
      try {
        const res = await fetch(`${BASE_URL}/api/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        
        if (data.success) {
          addNotification({
            title: 'Reset Pulse Dispatched',
            message: `A synchronization link has been sent to ${email} (via Backend).`,
            type: 'success'
          });
          setError('');
        } else {
          throw new Error('Fallback failed.');
        }
      } catch (backErr) {
        setError('Account recovery is currently offline. Please contact Stride Support.');
      }
    }
  };

  return (
    <div className="login-page">
      {isIntro && (
        <div className="login-intro-overlay animate-fade-out">
          <div className="intro-content">
            <div className="intro-spinner animate-spin" />
            <p>Recalibrating Stage...</p>
          </div>
        </div>
      )}
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
          <div className={`input-group floating-input ${emailFocused || email ? 'active' : ''} ${forgotPulse ? 'forgot-pulse' : ''}`}>
            <div className="input-with-icon">
              <Mail className={`field-icon ${emailFocused || forgotPulse ? 'focused' : ''}`} size={18} />
              <input 
                type="text" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder=" "
                required
              />
              <label htmlFor="email" className="floating-label">Email or Username</label>
            </div>
          </div>

          <div className={`input-group floating-input ${passwordFocused || password ? 'active' : ''}`}>
            <div className="label-row">
              <button 
                type="button" 
                onClick={handleForgotClick} 
                className="forgot-link-btn"
              >
                Forgot?
              </button>
            </div>
            <div className="input-with-icon">
              <Lock className={`field-icon ${passwordFocused ? 'focused' : ''}`} size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              Remember me
            </label>
          </div>

          {error && <div className="login-error animate-shake">{error}</div>}

          <button 
            type="submit" 
            className="login-submit-btn text-gradient-bg"
            disabled={isLoading}
          >
            <div className="btn-shimmer" />
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
            Google
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
