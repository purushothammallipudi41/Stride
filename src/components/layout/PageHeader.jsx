import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './PageHeader.css';

const PageHeader = ({ title, rightElement }) => {
    const navigate = useNavigate();

    return (
        <header className="mobile-page-header">
            <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
                <ChevronLeft className="icon-gradient" size={32} />
            </button>
            <h1 className="mobile-page-title">{title}</h1>
            <div className="header-right-action">
                {rightElement || <div style={{ width: 28 }} />}
            </div>
        </header>
    );
};

export default PageHeader;
