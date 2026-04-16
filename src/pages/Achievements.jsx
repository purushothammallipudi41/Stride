import React, { useState, useEffect } from 'react';
import { Trophy, Music, Users, Zap, Star, ShieldCheck, Lock } from 'lucide-react';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import PageHeader from '../components/layout/PageHeader';
import './Achievements.css';

const AchievementCard = ({ title, description, icon: Icon, color, isUnlocked, requirement, progress = 0, total = 5 }) => (
  <div className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`} style={{ '--accent-color': color }}>
    <div className="card-glass" />
    <div className="card-shimmer" />
    <div className="card-content">
      <div className="icon-area">
        <div className="icon-wrapper glass-panel">
          <Icon size={28} className="icon" />
          {isUnlocked ? (
            <div className="status-badge unlocked">
              <ShieldCheck size={14} /> Legandary
            </div>
          ) : (
            <div className="status-badge locked">
              <Lock size={14} /> Locked
            </div>
          )}
        </div>
      </div>
      <div className="text-content">
        <h3>{title}</h3>
        <p>{description}</p>
        
        {!isUnlocked && (
           <div className="progress-container">
             <div className="progress-label">
                <span>Progress</span>
                <span>{progress}/{total}</span>
             </div>
             <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${(progress/total)*100}%` }} />
             </div>
           </div>
        )}
      </div>
      {isUnlocked && <Star size={24} className="star-corner animate-pulse-glow" />}
    </div>
  </div>
);

const Achievements = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const currentUser = getStoredUser();

    useEffect(() => {
        if (!currentUser?.username) {
            setIsLoading(false);
            return;
        }
        fetch(`${BASE_URL}/api/profile/${currentUser.username}`)
            .then(res => res.json())
            .then(data => {
                setUser(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch achievements:", err);
                setIsLoading(false);
            });
    }, [currentUser?.username]);

    const achievementsList = [
        {
            id: 'Music Maven',
            title: 'Music Maven',
            description: 'Favorite 5 or more tracks to earn this badge.',
            icon: Music,
            color: '#8b5cf6',
            requirement: '5 Favorites'
        },
        {
            id: 'Influencer',
            title: 'Influencer',
            description: 'Build a community of 10+ followers.',
            icon: Users,
            color: '#3b82f6',
            requirement: '10 Followers'
        },
        {
            id: 'Top Tipper',
            title: 'Top Tipper',
            description: 'Send over 1,000 Vibe Points in tips.',
            icon: Zap,
            color: '#ec4899',
            requirement: '1,000 VP Sent'
        },
        {
            id: 'Content Creator',
            title: 'Content Creator',
            description: 'Publish your first high-fidelity clip using Stride Studio.',
            icon: Star,
            color: '#10b981',
            requirement: '1 Studio Post'
        },
        {
            id: 'Market Maverick',
            title: 'Market Maverick',
            description: 'Acquire a premium digital asset from the Stride Marketplace.',
            icon: Trophy,
            color: '#f59e0b',
            requirement: '1 Purchase'
        }
    ];

    if (isLoading) return <div className="loading-screen">Decrypting Honors...</div>;

    const earnedAchievements = user?.achievements || [];

    return (
        <div className="achievements-page animate-fade-in">
            <div className="stride-mesh-bg" />
            <PageHeader title="Hall of Fame" />
            
            <main className="achievements-content">
                <div className="summary-header">
                    <div className="trophy-vibe">
                        <Trophy size={48} className="trophy-icon" />
                        <div className="glow-ring" />
                    </div>
                    <h1>Hall of Fame</h1>
                    <p>Unlock prestigious badges through community contribution and musical exploration.</p>
                </div>

                {!currentUser?.username && (
                    <div className="login-prompt-banner glass-panel animate-slide-up">
                        <Lock size={20} />
                        <span>Log in to track your personal achievements and claim your spot in the Hall of Fame.</span>
                        <button className="auth-redirect-btn" onClick={() => navigate('/login')}>Sign In</button>
                    </div>
                )}

                <div className="achievement-grid">
                    {achievementsList.map((ach) => (
                        <AchievementCard
                            key={ach.id}
                            title={ach.title}
                            description={ach.description}
                            icon={ach.icon}
                            color={ach.color}
                            isUnlocked={earnedAchievements.includes(ach.id)}
                            requirement={ach.requirement}
                            progress={
                                ach.id === 'Music Maven' ? (user?.favoritesCount || 2) : 
                                ach.id === 'Influencer' ? (user?.followerCount || 0) :
                                ach.id === 'Top Tipper' ? (user?.totalTips || 0) : 0
                            }
                            total={
                                ach.id === 'Music Maven' ? 5 : 
                                ach.id === 'Influencer' ? 10 :
                                ach.id === 'Top Tipper' ? 1000 : 1
                            }
                        />
                    ))}
                </div>

                <section className="coming-soon-section">
                    <div className="section-blur" />
                    <h3>More Badges Coming Soon</h3>
                    <p>Earn unique identifiers for participating in exclusive events and DAO votes.</p>
                </section>
            </main>
        </div>
    );
};

export default Achievements;
