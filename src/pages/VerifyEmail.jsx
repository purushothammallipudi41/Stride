import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { BASE_URL } from '../utils/api';
import logo from '../assets/stride-logo.png';
import './VerifyEmail.css';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || 'your email';
    
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(30);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleChange = (index, value) => {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length < 6) return setError('Please enter the full 6-digit code.');

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${BASE_URL}/api/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: fullCode })
            });
            const data = await response.json();

            if (data.success) {
                // Success! Redirect to home or mark as verified
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.isVerified = true;
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('isAuthenticated', 'true');
                navigate('/');
            } else {
                setError(data.message || 'Invalid code. Please try again.');
            }
        } catch (err) {
            console.error('Verify error:', err);
            setError('Connection error. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setTimer(30);
        try {
            await fetch(`${BASE_URL}/api/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
        } catch (err) {
            console.error('Verification error:', err);
            setError('Failed to resend code.');
        }
    };

    return (
        <div className="verify-page">
            <div className="login-bg-decoration">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
            </div>

            <div className="verify-card glass-panel animate-fade-in">
                <button onClick={() => navigate('/login')} className="back-btn">
                    <ArrowLeft size={18} /> Back to Login
                </button>

                <div className="verify-header">
                    <div className="logo-section">
                        <img src={logo} alt="Stride" className="logo-image" />
                        <h1 className="logo-text">Stride</h1>
                    </div>
                    <p>We've sent a 6-digit code to <strong>{email}</strong>. Enter it below to secure your account.</p>
                    
                    {/* Development Mode Tip */}
                    <div className="dev-tip glass-panel" style={{ marginTop: '16px', padding: '8px 12px', fontSize: '0.8rem', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b' }}>
                        <p><strong>Dev Mode:</strong> If you don't receive the email, use code <code>000000</code> to bypass.</p>
                    </div>
                </div>


                <form onSubmit={handleVerify} className="verify-form">
                    <div className="code-inputs">
                        {code.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={el => inputRefs.current[idx] = el}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                className="code-input"
                                disabled={isLoading}
                            />
                        ))}
                    </div>

                    {error && <div className="verify-error animate-shake">{error}</div>}

                    <button 
                        type="submit" 
                        className="verify-submit-btn text-gradient-bg"
                        disabled={isLoading || code.join('').length < 6}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Verify Account'}
                    </button>
                </form>

                <div className="resend-section">
                    <p>Didn't receive the code?</p>
                    <button 
                        onClick={handleResend} 
                        disabled={timer > 0}
                        className="resend-btn"
                    >
                        {timer > 0 ? `Resend in ${timer}s` : (
                            <><RefreshCw size={14} /> Resend Code</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
