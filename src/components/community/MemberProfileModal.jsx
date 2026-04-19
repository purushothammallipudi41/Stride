import React from 'react';
import { X, ChevronRight, Gavel, Trash2, Shield, Calendar, Mail, Phone, Video, Trophy, UserMinus } from 'lucide-react';
import Avatar from '../common/Avatar';
import GlobalModal from '../common/GlobalModal';

const MemberProfileModal = ({ isOpen, onClose, member, isMod, onModAction, communityAccent }) => {
    if (!member) return null;

    const mUsername = member.username || member.name || 'Spectral Member';
    const accentColor = communityAccent || '#8b5cf6';
    const joinDate = member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'year' }) : 'Nov 26, 2025';

    return (
        <GlobalModal 
            isOpen={isOpen} 
            onClose={onClose}
            showClose={false}
            className="biocard-modal animate-scale-in"
            maxWidth="320px"
        >
            <div className="biocard-banner" style={{ '--token-accent': accentColor }}>
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', zIndex: 10 }}
                >
                    <X size={16} />
                </button>
            </div>
            
            <div className="biocard-header">
                <div className="biocard-avatar-ring">
                    <Avatar 
                        src={member.avatar} 
                        size={68} 
                        frame={member.avatarFrame || 'none'} 
                    />
                </div>
                <div className="biocard-info">
                    <h2>{mUsername}</h2>
                    <span className="u-tag">{member.username ? `@${member.username}` : 'The Silent Rhythmist'}</span>
                </div>
            </div>

            <div className="biocard-body">
                <div className="biocard-section">
                    <label>Bio</label>
                    <p className="biocard-text">
                        {member.bio || "Just another vibe in the Stride nexus. Catch me in the lounge synced to the latest drops."}
                    </p>
                </div>

                <div className="biocard-section">
                    <label>Member Since</label>
                    <div className="member-since-box">
                        <Calendar size={14} opacity={0.6} />
                        <span>{joinDate}</span>
                    </div>
                </div>

                {isMod && (
                    <div className="biocard-section">
                        <label>Moderator Toolbox</label>
                        <div className="mod-action-toolbox">
                            <button className="mod-toolbox-item" onClick={() => onModAction('manage', member)}>
                                <Shield size={16} opacity={0.7} />
                                <span>Manage User</span>
                                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                            </button>
                            <button className="mod-toolbox-item danger" onClick={() => onModAction('kick', member)}>
                                <UserMinus size={16} />
                                <span>Kick Member</span>
                            </button>
                            <button className="mod-toolbox-item danger" onClick={() => onModAction('ban', member)}>
                                <Gavel size={16} />
                                <span>Ban Member</span>
                            </button>
                        </div>
                    </div>
                )}

                {!isMod && (
                    <div className="biocard-section">
                        <div className="mod-action-toolbox">
                            <button className="mod-toolbox-item" onClick={() => onModAction('gift', member)}>
                                <Trophy size={16} className="text-stride-primary" />
                                <span>Send Virtual Gift</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </GlobalModal>
    );
};

export default MemberProfileModal;
