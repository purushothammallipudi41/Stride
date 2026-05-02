import React, { useState, useEffect } from 'react';
import { Gavel, Vote, Users, Zap, Clock, TrendingUp, Info, CheckCircle, Plus } from 'lucide-react';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import { useUI } from '../hooks/useUI';
import NodeShiftModal from '../components/community/NodeShiftModal';
import './Governance.css';
import '../components/community/NodeShiftModal.css';

const Governance = () => {
    const user = getStoredUser();
    const { addNotification } = useUI();
    const [proposals, setProposals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userWeight, setUserWeight] = useState(0);
    const [activeTab, setActiveTab] = useState('active');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchProposals = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${BASE_URL}/api/governance/proposals`);
                const data = await res.json();
                setProposals(data);
                
                // Calculate current user's weight (simulated or from state)
                const balance = Number(user.balance) || 100; // Default fallback for new nodes
                const totalWeight = balance * 1.5; // Base hypothetical
                setUserWeight(totalWeight);
            } catch (err) {
                console.error("Governance Nexus failed to synchronize:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProposals();
    }, [user.balance]);

    const handleVote = async (proposalId, optionLabel) => {
        try {
            const res = await fetch(`${BASE_URL}/api/governance/vote`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-username': user.username
                },
                body: JSON.stringify({
                    proposalId,
                    optionLabel,
                    voterWeight: userWeight
                })
            });

            const data = await res.json();
            if (res.ok) {
                // Update local state for immediate feedback
                setProposals(prev => prev.map(p => 
                    p._id === proposalId ? data.proposal : p
                ));
                addNotification({ title: 'Vote Recorded', message: 'Your weight has been added to the consensus.', type: 'success' });
            }
        } catch (err) {
            console.error("Vote failed:", err);
            addNotification({ title: 'Nexus Error', message: 'Consensus rejected. Try again later.', type: 'error' });
        }
    };

    if (isLoading) {
        return (
            <div className="governance-page flex-center">
                <div className="nexus-loading-spinner animate-pulse-purple">
                    <Gavel size={48} color="#8b5cf6" />
                </div>
                <h3>Synchronizing Sovereignty...</h3>
            </div>
        );
    }

    return (
        <div className="governance-page animate-fade-in">
            <header className="gov-header">
                <div className="gov-title-area">
                    <h1 className="gov-title">Governance Nexus</h1>
                    <p className="gov-subtitle">The pulse of Stride is in your hands.</p>
                </div>
                <div className="user-weight-card glass-card">
                    <div className="weight-meta">
                        <span className="weight-label">Your Vibe Weight</span>
                        <Zap size={14} className="text-primary" />
                    </div>
                    <div className="weight-value">{userWeight.toLocaleString()}</div>
                    <div className="weight-intel">Based on balance & affinity Score.</div>
                </div>
            </header>

            <section className="gov-stats">
                <div className="gov-stat-item">
                    <Users size={18} />
                    <div className="stat-content">
                        <b>{(Number(user.balance) || 0) * 23}</b>
                        <span>Active Voters</span>
                    </div>
                </div>
                <div className="gov-stat-item">
                    <TrendingUp size={18} />
                    <div className="stat-content">
                        <b>{proposals.filter(p => p.status === 'active').length} active</b>
                        <span>Platform Shifts</span>
                    </div>
                </div>
            </section>

            <nav className="gov-tabs">
                <button className={`gov-tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Shifts</button>
                <button className={`gov-tab ${activeTab === 'passed' ? 'active' : ''}`} onClick={() => setActiveTab('passed')}>Legacy Shifts</button>
                <button 
                    className={`create-proposal-btn ${(user.isPremium || user.isVerified) ? '' : 'locked'}`} 
                    onClick={() => {
                        if (user.isPremium || user.isVerified) {
                            setIsModalOpen(true);
                        } else {
                            addNotification({ 
                                title: 'Stride Pro Required', 
                                message: 'Only Premium or Verified members can initiate new platform proposals.', 
                                type: 'info' 
                            });
                            // Optional: Trigger checkout modal here if accessible via global state/context
                        }
                    }}
                >
                    {(user.isPremium || user.isVerified) ? <Plus size={16} /> : <Info size={16} />}
                    {(user.isPremium || user.isVerified) ? 'New Proposal' : 'Upgrade to Pro to Shift'}
                </button>
            </nav>

            <div className="proposals-grid">
                {proposals.filter(p => p.status === activeTab).map((proposal) => (
                    <div key={proposal._id} className="proposal-card glass-card hover-glow">
                        <div className="proposal-header">
                            <span className={`p-badge ${proposal.type}`}>{proposal.type.toUpperCase()}</span>
                            <div className="p-time">
                                <Clock size={12} /> {new Date(proposal.expiresAt).toLocaleDateString()}
                            </div>
                        </div>
                        <h2 className="p-title">{proposal.title}</h2>
                        <p className="p-desc">{proposal.description}</p>
                        
                        <div className="options-area">
                            {proposal.options.map((opt, i) => {
                                const percentage = proposal.totalWeight > 0 ? (opt.votes / proposal.totalWeight) * 100 : 0;
                                const isVoted = proposal.voters?.some(v => v.username === user.username);
                                
                                return (
                                    <button 
                                        key={i} 
                                        className={`opt-btn ${isVoted && proposal.voters.find(v => v.username === user.username).option === opt.label ? 'voted' : ''}`}
                                        onClick={() => !isVoted && handleVote(proposal._id, opt.label)}
                                    >
                                        <div className="opt-label-row">
                                            <span>{opt.label}</span>
                                            {isVoted && proposal.voters.find(v => v.username === user.username).option === opt.label && <CheckCircle size={14} className="text-success" />}
                                            <span className="opt-percent">{percentage.toFixed(0)}%</span>
                                        </div>
                                        <div className="opt-progress-bg">
                                            <div className="opt-progress-fill" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-footer">
                            <div className="weight-cast">
                                <Zap size={12} /> {proposal.totalWeight?.toLocaleString()} weight
                            </div>
                            {proposal.status === 'active' && (
                                <div className="quorum-meter">
                                    <span>Quorum: {((proposal.totalWeight / (proposal.quorum || 1000)) * 100).toFixed(0)}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <NodeShiftModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                communityId="global"
                onProposalCreated={(newProposal) => {
                    setProposals(prev => [newProposal, ...prev]);
                    setIsModalOpen(false);
                    addNotification({ title: 'Platform Shift Initiated', message: 'Your proposal is live for consensus.', type: 'success' });
                }}
            />
        </div>
    );
};

export default Governance;
