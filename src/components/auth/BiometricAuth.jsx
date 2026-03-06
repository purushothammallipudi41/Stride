import { useState, useEffect } from 'react';
import { Fingerprint, ShieldCheck, X } from 'lucide-react';
import { NativeBiometric } from 'capacitor-native-biometric';
import './BiometricAuth.css';

const BiometricAuth = ({ onAuthenticated, onClose }) => {
    const [status, setStatus] = useState('pending'); // pending, checking, success, error
    const [error, setError] = useState(null);

    const checkBiometrics = async () => {
        setStatus('checking');
        try {
            const result = await NativeBiometric.isAvailable();
            if (!result.isAvailable) {
                throw new Error('Biometrics not available on this device');
            }

            const verified = await NativeBiometric.verifyIdentity({
                reason: 'Log in to Stride',
                title: 'Stride Secure Access',
                subtitle: 'Use your biometrics to identify yourself',
                description: 'We use your biometrics to keep your messages and vaults safe.',
                negativeButtonText: 'Cancel'
            });

            if (verified) {
                setStatus('success');
                setTimeout(() => onAuthenticated(), 800);
            }
        } catch (err) {
            console.error('[Biometrics] Error:', err);
            setStatus('error');
            setError(err.message || 'Authentication failed');
        }
    };

    return (
        <div className="biometric-overlay">
            <div className="biometric-modal">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>

                <div className="biometric-icon-container">
                    <div className={`biometric-pulse ${status}`}></div>
                    {status === 'success' ? (
                        <ShieldCheck className="biometric-icon success" size={48} />
                    ) : (
                        <Fingerprint className={`biometric-icon ${status}`} size={48} />
                    )}
                </div>

                <h2>{status === 'success' ? 'Authenticated' : 'Secure Access'}</h2>
                <p>
                    {status === 'error' ? error : 'Confirm your identity to continue with Stride.'}
                </p>

                {status !== 'success' && (
                    <button className="biometric-trigger-btn" onClick={checkBiometrics}>
                        {status === 'error' ? 'Try Again' : 'Verify with Biometrics'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default BiometricAuth;
