import { useState, useEffect } from 'react';
import { Trophy, Star, TrendingUp, Users, Zap, Crown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGamification } from '../context/GamificationContext';
import { useAuth } from '../context/AuthContext';
import XPProgressBar from '../components/common/XPProgressBar';
import StreakBadge from '../components/common/StreakBadge';
import config from '../config';
import './AchievementsPage.css';

const ACHIEVEMENT_ICONS = {
    first_post: '🏅',
    streak_7: '🔥',
    streak_30: '🌟',
    likes_100: '❤️',
    followers_1k: '🚀',
    creator: '🎨',
    night_owl: '🦉',
    trendsetter: '📈',
};

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

// ── Confetti burst using pure CSS keyframe ──────────────────────────
const ConfettiBurst = () => (
    <div className="confetti-burst" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="confetti-particle" style={{ '--i': i }} />
        ))}
    </div>
);

// ── Single achievement card ─────────────────────────────────────────
const AchievementCard = ({ achievement, justUnlocked }) => {
    const { t } = useTranslation();
    return (
        <div className={`achievement-card ${achievement.earned ? 'earned' : 'locked'} ${justUnlocked ? 'just-unlocked' : ''}`}
            id={`achievement-${achievement.id}`}>
            {justUnlocked && <ConfettiBurst />}
            <div className="achievement-icon">{achievement.emoji}</div>
            <div className="achievement-info">
                <span className="achievement-label">{achievement.label}</span>
                <span className="achievement-desc">{achievement.desc}</span>
            </div>
            <div className="achievement-xp">+{achievement.xp} XP</div>
            {!achievement.earned && <div className="achievement-lock-overlay">🔒</div>}
        </div>
    );
};

// ── Main page ────────────────────────────────────────────────────────
const AchievementsPage = () => {
    const { t } = useTranslation();
    const { achievements, xp, level, streak, weeklyXp, rank, newlyUnlocked, loading } = useGamification();
    const { token } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [myWeeklyXp, setMyWeeklyXp] = useState(0);
    const [loadingLB, setLoadingLB] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch(`${config.API_URL}/api/gamification/leaderboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboard(data.leaderboard || []);
                    setMyRank(data.myRank);
                    setMyWeeklyXp(data.myWeeklyXp);
                }
            } catch (e) {
                console.error('[LEADERBOARD]', e);
            } finally {
                setLoadingLB(false);
            }
        };
        if (token) fetchLeaderboard();
    }, [token]);

    const earnedCount = achievements.filter(a => a.earned).length;

    return (
        <div className="achievements-page">
            {/* ── Hero Stats ─────────────────────────────────── */}
            <div className="achievements-hero">
                <div className="hero-stat">
                    <Trophy size={22} className="hero-icon" />
                    <div className="hero-stat-value">{earnedCount}<span className="hero-stat-max">/{achievements.length}</span></div>
                    <div className="hero-stat-label">{t('common.posts')}</div>
                </div>
                <div className="hero-stat hero-stat--xp">
                    <Zap size={22} className="hero-icon" />
                    <div className="hero-stat-value">{xp?.toLocaleString()}</div>
                    <div className="hero-stat-label">{t('gamification.totalXP')}</div>
                    <div className="hero-xpbar"><XPProgressBar compact={false} /></div>
                </div>
                <div className="hero-stat">
                    <Star size={22} className="hero-icon" />
                    <div className="hero-stat-value">#{rank || '—'}</div>
                    <div className="hero-stat-label">{t('gamification.weeklyRank')}</div>
                </div>
                <div className="hero-stat">
                    <StreakBadge size="md" showLabel />
                </div>
            </div>

            <div className="achievements-layout">
                {/* ── Achievements Gallery ────────────────────── */}
                <section className="achievements-gallery">
                    <h2 className="section-title"><Trophy size={20} /> {t('gamification.badges')}</h2>
                    {loading ? (
                        <div className="loading-grid">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="achievement-card skeleton" />
                            ))}
                        </div>
                    ) : (
                        <div className="achievement-grid">
                            {achievements.map(a => (
                                <AchievementCard
                                    key={a.id}
                                    achievement={a}
                                    justUnlocked={newlyUnlocked?.includes(a.id)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Weekly Leaderboard ──────────────────────── */}
                <section className="leaderboard-section">
                    <h2 className="section-title"><Crown size={20} /> {t('gamification.weeklyLeaderboard')}</h2>
                    <p className="leaderboard-subtitle">{t('gamification.leaderboardSubtitle')}</p>

                    {loadingLB ? (
                        <div className="loading-list">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="lb-row skeleton" />
                            ))}
                        </div>
                    ) : (
                        <div className="leaderboard-list">
                            {leaderboard.map((entry, i) => (
                                <div key={entry.username}
                                    className={`lb-row ${entry.isCurrentUser ? 'lb-row--me' : ''}`}
                                    id={`lb-rank-${i + 1}`}>
                                    <span className="lb-rank">
                                        {i < 3 ? RANK_MEDALS[i] : `#${i + 1}`}
                                    </span>
                                    <img
                                        src={entry.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${entry.username}`}
                                        alt={entry.username}
                                        className="lb-avatar"
                                    />
                                    <div className="lb-info">
                                        <span className="lb-name">{entry.name || entry.username}</span>
                                        <span className="lb-handle">@{entry.username}</span>
                                    </div>
                                    <div className="lb-right">
                                        <span className="lb-xp">{entry.weeklyXp?.toLocaleString()} XP</span>
                                        <span className="lb-level">Lv. {entry.level}</span>
                                    </div>
                                </div>
                            ))}

                            {/* Show current user's rank if outside top 10 */}
                            {myRank > 10 && (
                                <>
                                    <div className="lb-ellipsis">···</div>
                                    <div className="lb-row lb-row--me">
                                        <span className="lb-rank">#{myRank}</span>
                                        <div className="lb-info"><span className="lb-name">{t('gamification.you')}</span></div>
                                        <div className="lb-right">
                                            <span className="lb-xp">{myWeeklyXp?.toLocaleString()} XP</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default AchievementsPage;
