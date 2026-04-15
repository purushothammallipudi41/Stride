import React, { useState, useEffect } from 'react';
import { Trophy, Music, Users, Zap, Star, ShieldCheck, Lock } from 'lucide-react';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import PageHeader from '../components/layout/PageHeader';
import './Achievements.css';

const AchievementCard = ({ title, description, icon: Icon, color, isUnlocked }) => (
  <div className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`} style={{ '--accent-color': color }}>
    <div className="card-glass" />
    <div className="card-content">
      <div className="icon-wrapper">
        <Icon size={24} className="icon" />
        {isUnlocked ? (
          <div className="status-badge">
            <ShieldCheck size={12} /> Unlocked
          </div>
        ) : (
          <div className="status-badge locked">
            <Lock size={12} /> Locked
          </div>
        )}
      </div>
      <div className="text-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {isUnlocked && <Star size={20} className="star-corner" />}
    </div>
  </div>
);

const Achievements = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const currentUser = getStoredUser();

    useEffect(() => {
        if (!currentUser?.username) return;
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
        }
    ];

    if (isLoading) return <div className="loading-screen">Decrypting Honors...</div>;

    const earnedAchievements = user?.achievements || [];

    return (
        <div className="achievements-page">
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

                <div className="achievement-grid">
                    {achievementsList.map((ach) => (
                        <AchievementCard
                            key={ach.id}
                            title={ach.title}
                            description={ach.description}
                            icon={ach.icon}
                            color={ach.color}
                            isUnlocked={earnedAchievements.includes(ach.id)}
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
