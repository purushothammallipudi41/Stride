import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', type = 'primary' }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="confirm-modal-overlay" onClick={onClose}>
            <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
                <div className="confirm-modal-header">
                    <div className={`status-icon ${type}`}>
                        <AlertCircle size={24} />
                    </div>
                    <button className="confirm-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="confirm-modal-body">
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>
                <div className="confirm-modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className={`confirm-btn ${type}`} onClick={() => {
                        onConfirm();
                        onClose();
                    }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
