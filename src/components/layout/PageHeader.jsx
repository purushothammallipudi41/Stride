import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import VerificationBadge from '../common/VerificationBadge';
import './PageHeader.css';

const PageHeader = ({ title, rightElement, hideBack }) => {
    const navigate = useNavigate();

    return (
        <header className="mobile-page-header">
            {!hideBack ? (
                <div className="back-btn-container">
                    <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
                        <ChevronLeft className="icon-gradient" size={28} />
                    </button>
                </div>
            ) : <div className="back-btn-container" />}
            <div className="header-title-container">
                <h1 className="mobile-page-title">{title}</h1>
            </div>
            <div className="header-right-action">
                {rightElement || <div style={{ width: 28 }} />}
            </div>
        </header>
    );
};

export default PageHeader;
