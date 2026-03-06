import { useTranslation } from 'react-i18next';
import { useGamification } from '../../context/GamificationContext';
import './StreakBadge.css';

/**
 * Shows the user's current login streak with a fire emoji.
 * @param {string} size - 'sm' | 'md' (default: 'md')
 * @param {boolean} showLabel - whether to show "Day Streak" label
 */
const StreakBadge = ({ size = 'md', showLabel = false }) => {
    const { t } = useTranslation();
    const { streak, loading } = useGamification();

    if (loading || streak === 0) return null;

    const isMilestone = streak === 7 || streak === 30 || streak === 100;

    return (
        <div className={`streak-badge streak-badge--${size} ${isMilestone ? 'streak-badge--milestone' : ''}`}
            title={t('gamification.streakTitle', { streak })}>
            <span className="streak-fire">🔥</span>
            <span className="streak-count">{streak}</span>
            {showLabel && <span className="streak-label">{t('gamification.dayStreak')}</span>}
        </div>
    );
};

export default StreakBadge;
