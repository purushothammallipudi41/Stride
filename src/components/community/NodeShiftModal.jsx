import React, { useState } from 'react';
import { X, Palette, Lock, Gavel, Info } from 'lucide-react';
import { BASE_URL } from '../../utils/api';
import './NodeShiftModal.css';

const NodeShiftModal = ({ isOpen, onClose, communityId, currentAccent, availableChannels = [], onProposalCreated }) => {
    const isGlobal = !communityId || communityId === 'global';
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [shiftType, setShiftType] = useState(isGlobal ? 'policy' : 'aesthetic');
    const [options, setOptions] = useState(['Yes, apply shift', 'No, status quo']);
    const [impactValue, setImpactValue] = useState(currentAccent || '#0066ff');
    const [selectedChannelId, setSelectedChannelId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isGlobal && shiftType === 'policy' && !selectedChannelId) {
            setError('Please select a target channel for gating.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await fetch(`${BASE_URL}/api/governance/proposals`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-username': user.username
                },
                body: JSON.stringify({
                    title,
                    description,
                    type: isGlobal ? 'platform' : 'node',
                    options,
                    impactValue: shiftType === 'aesthetic' ? impactValue : selectedChannelId,
                    communityId: isGlobal ? 'global' : communityId
                })
            });

            const data = await res.json();
            if (res.ok) {
                onProposalCreated(data);
                onClose();
            } else {
                setError(data.error || 'Failed to initiate shift.');
            }
        } catch (err) {
            setError('Nexus connection failed. Recalibrating...');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay sovereignty-modal">
            <div className="modal-content glass-panel animate-scale-in">
                <header className="modal-header">
                    <div className="title-with-icon">
                        <Gavel className="text-vyx-primary" size={24} />
                        <h2>Initiate {isGlobal ? 'Platform' : 'Node'} Shift</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </header>

                <form onSubmit={handleSubmit} className="sovereignty-form">
                    <div className="form-info-tip">
                        <Info size={16} />
                        <p>Node shifts require reaching Vibe Quorum (1000 weight) to take effect.</p>
                    </div>

                    <div className="input-field">
                        <label>Proposal Title</label>
                        <input 
                            type="text" 
                            placeholder="e.g., Transition to Neon Cyberpunk Theme" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-field">
                        <label>Rational / Description</label>
                        <textarea 
                            placeholder="Explain why this shift is beneficial for the community node..." 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-field">
                        <label>Shift Type</label>
                        <div className="shift-type-selector">
                            <button 
                                type="button" 
                                className={`type-btn ${shiftType === 'aesthetic' ? 'active' : ''}`}
                                onClick={() => setShiftType('aesthetic')}
                            >
                                <Palette size={18} />
                                Aesthetic
                            </button>
                            <button 
                                type="button" 
                                className={`type-btn ${shiftType === 'policy' ? 'active' : ''}`}
                                onClick={() => setShiftType('policy')}
                            >
                                <Lock size={18} />
                                Channel Gating
                            </button>
                        </div>
                    </div>

                    {shiftType === 'aesthetic' && (
                        <div className="input-field animate-fade-in">
                            <label>Target Accent Color</label>
                            <div className="color-picker-wrap">
                                <input 
                                    type="color" 
                                    value={impactValue}
                                    onChange={(e) => setImpactValue(e.target.value)}
                                />
                                <span className="color-hex">{impactValue}</span>
                            </div>
                        </div>
                    )}

                    {shiftType === 'policy' && (
                        <div className="input-field animate-fade-in">
                            <label>Select Target Channel (to Gate)</label>
                            <div className="channel-pills-selector">
                                {availableChannels.map(ch => (
                                    <button
                                        key={ch.id}
                                        type="button"
                                        className={`channel-pill ${selectedChannelId === ch.id ? 'active' : ''}`}
                                        onClick={() => setSelectedChannelId(ch.id)}
                                    >
                                        <Lock size={12} opacity={0.6} />
                                        {ch.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <p className="form-error">{error}</p>}

                    <button 
                        type="submit" 
                        className="submit-shift-btn text-gradient-bg"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Synchronizing with Nexus...' : 'Initiate Shift'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NodeShiftModal;
