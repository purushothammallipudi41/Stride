import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage } from '../../utils/i18n';
import './LanguageSwitcher.css';

function LanguageSwitcher() {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

    const handleSelect = (lang) => {
        changeLanguage(lang.code);
        setIsOpen(false);
    };

    return (
        <div className="language-switcher">
            <button
                className="language-switcher__trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                id="language-switcher-trigger"
                title={t('settings.language')}
            >
                <span className="language-switcher__flag">{currentLang.flag}</span>
                <span className="language-switcher__name">{currentLang.name}</span>
                <svg
                    className={`language-switcher__chevron ${isOpen ? 'open' : ''}`}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="language-switcher__backdrop" onClick={() => setIsOpen(false)} />
                    <ul className="language-switcher__dropdown" role="listbox" id="language-switcher-list">
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <li
                                key={lang.code}
                                role="option"
                                aria-selected={lang.code === i18n.language}
                                className={`language-switcher__option ${lang.code === i18n.language ? 'active' : ''}`}
                                onClick={() => handleSelect(lang)}
                                id={`lang-option-${lang.code}`}
                            >
                                <span className="language-switcher__option-flag">{lang.flag}</span>
                                <span className="language-switcher__option-name">{lang.name}</span>
                                {lang.dir === 'rtl' && (
                                    <span className="language-switcher__option-badge">RTL</span>
                                )}
                                {lang.code === i18n.language && (
                                    <svg className="language-switcher__checkmark" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

export default LanguageSwitcher;
