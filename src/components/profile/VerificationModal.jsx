import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, CheckCircle, Upload, FileText, AlertCircle } from 'lucide-react';
import config from '../../config';

const VerificationModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [documentUrl, setDocumentUrl] = useState('');
    const [status, setStatus] = useState('idle'); // idle, uploading, submitting, success, error
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!documentUrl.trim()) return;

        setStatus('submitting');
        setError('');

        try {
            const res = await fetch(`${config.API_URL}/api/users/request-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id, documentUrl })
            });
            const data = await res.json();

            if (data.success) {
                setStatus('success');
                setTimeout(() => {
                    onClose();
                    setStatus('idle');
                    setDocumentUrl('');
                }, 2000);
            } else {
                throw new Error(data.error || 'Submission failed');
            }
        } catch (err) {
            setError(err.message);
            setStatus('error');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card animate-in" style={{ padding: '2rem', maxWidth: '400px', width: '90%' }}>
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'var(--color-primary-glow)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <CheckCircle size={32} />
                    </div>
                    <h2>Get Verified</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Join the elite community. Submit your government ID proof to get the blue tick.
                    </p>
                </div>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center', color: '#4caf50', padding: '1rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '12px' }}>
                        <CheckCircle size={24} style={{ marginBottom: '0.5rem' }} />
                        <p>Request Submitted Successfully!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Document URL (Passport, License, etc.)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <FileText size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="url"
                                    value={documentUrl}
                                    onChange={(e) => setDocumentUrl(e.target.value)}
                                    placeholder="https://example.com/my-id-proof.jpg"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem 0.8rem 2.5rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Please upload your ID to a secure host (e.g., Google Drive, Imgur) and paste the link here.
                            </p>
                        </div>

                        {error && (
                            <div style={{
                                color: '#ff4d4d',
                                background: 'rgba(255, 77, 77, 0.1)',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            {status === 'submitting' ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VerificationModal;
