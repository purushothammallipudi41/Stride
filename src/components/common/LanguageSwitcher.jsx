import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { hapticSelection } from '../../utils/haptics';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        hapticSelection();
    };

    return (
        <div className="language-switcher">
            <Globe size={18} className="globe-icon" />
            <select 
                value={i18n.language} 
                onChange={(e) => changeLanguage(e.target.value)}
                className="lang-select"
            >
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="hi">हिन्दी</option>
                <option value="te">తెలుగు</option>
            </select>
        </div>
    );
};

export default LanguageSwitcher;
