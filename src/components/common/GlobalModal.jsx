import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import './GlobalModal.css';

const GlobalModal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    showClose = true, 
    maxWidth = '500px',
    className = ''
}) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsMounted(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isMounted && !isOpen) return null;

    return (
        <div className={`global-modal-overlay ${isOpen ? 'is-open' : 'is-closing'}`} onClick={onClose}>
            <div 
                className={`global-modal-container glass-panel ${className}`} 
                style={{ maxWidth }}
                onClick={e => e.stopPropagation()}
            >
                {(title || showClose) && (
                    <div className="global-modal-header">
                        {title && <h3 className="global-modal-title">{title}</h3>}
                        {showClose && (
                            <button className="global-modal-close" onClick={onClose} aria-label="Close modal">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}
                <div className="global-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default GlobalModal;
