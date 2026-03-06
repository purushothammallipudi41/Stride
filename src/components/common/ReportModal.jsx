import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, Shield, Flag } from 'lucide-react';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, targetType, targetId, targetOwnerId, onSubmit }) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const reasons = [
        { id: 'spam', label: t('report.reasons.spam'), icon: '🗑️' },
        { id: 'harassment', label: t('report.reasons.harassment'), icon: '🗣️' },
        { id: 'hate_speech', label: t('report.reasons.hate_speech'), icon: '🚫' },
        { id: 'nsfw', label: t('report.reasons.nsfw'), icon: '🔞' },
        { id: 'violence', label: t('report.reasons.violence'), icon: '👊' },
        { id: 'scam', label: t('report.reasons.scam'), icon: '⚠️' },
        { id: 'other', label: t('report.reasons.other'), icon: '❓' }
    ];

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        // ... previous implementation ...
        e.preventDefault();
        if (!reason) return;

        setSubmitting(true);
        try {
            await onSubmit({
                targetType,
                targetId,
                targetOwnerId,
                reason,
                description
            });
            onClose();
        } catch (error) {
            console.error('[REPORT] Failed to submit:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="report-modal-overlay" onClick={onClose}>
            <div className="report-modal-content" onClick={e => e.stopPropagation()}>
                <div className="report-modal-header">
                    <div className="header-title">
                        <Flag size={20} className="report-icon" />
                        <h3>{t('report.title')}</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="report-modal-body">
                    <p className="report-hint">{t('report.hint', { type: targetType })}</p>

                    <form onSubmit={handleSubmit}>
                        <div className="reasons-grid">
                            {reasons.map(r => (
                                <label key={r.id} className={`reason-item ${reason === r.id ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={r.id}
                                        onChange={(e) => setReason(e.target.value)}
                                        checked={reason === r.id}
                                    />
                                    <span className="reason-emoji">{r.icon}</span>
                                    <span className="reason-label">{r.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="description-section">
                            <label htmlFor="report-desc">{t('report.optionalDetails')}</label>
                            <textarea
                                id="report-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('report.placeholder')}
                                maxLength={300}
                            />
                        </div>

                        <div className="report-footer">
                            <div className="protection-notice">
                                <Shield size={14} />
                                <span>{t('report.protectionNotice')}</span>
                            </div>
                            <div className="action-btns">
                                <button type="button" className="cancel-btn" onClick={onClose}>{t('common.cancel')}</button>
                                <button
                                    type="submit"
                                    className="submit-report-btn"
                                    disabled={!reason || submitting}
                                >
                                    {submitting ? t('report.submitting') : t('report.submit')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
