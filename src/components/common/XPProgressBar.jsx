import { useGamification } from '../../context/GamificationContext';
import './XPProgressBar.css';

/**
 * XP progress bar showing level + progress toward next level.
 * @param {boolean} compact - if true, shows just the bar without labels
 */
const XPProgressBar = ({ compact = false }) => {
    const { xp, level, xpInCurrentLevel, xpForNextLevel, loading } = useGamification();
    if (loading) return null;

    const percent = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100);

    return (
        <div className={`xp-bar-wrap ${compact ? 'xp-bar-wrap--compact' : ''}`}>
            {!compact && (
                <div className="xp-bar-labels">
                    <span className="xp-level-badge">Lv. {level}</span>
                    <span className="xp-numbers">{xpInCurrentLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</span>
                </div>
            )}
            <div className="xp-bar-track">
                <div
                    className="xp-bar-fill"
                    style={{ width: `${percent}%` }}
                    aria-label={`Level ${level}: ${Math.round(percent)}% to next level`}
                />
            </div>
            {compact && (
                <span className="xp-level-badge xp-level-badge--compact">Lv. {level}</span>
            )}
        </div>
    );
};

export default XPProgressBar;
