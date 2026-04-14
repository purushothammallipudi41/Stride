import { Plus } from 'lucide-react';
import { useUI } from '../../hooks/useUI';
import { useLocation } from 'react-router-dom';

const FloatingCreateButton = () => {
    const { openCreateModal } = useUI();
    const location = useLocation();
    
    // Don't show on auth pages
    const isPublicPath = ['/login', '/signup', '/verify'].includes(location.pathname);
    if (isPublicPath) return null;

    return (
        <div className="floating-create-container animate-fade-in">
            <button 
                className="floating-create-btn"
                onClick={openCreateModal}
                aria-label="Create Post"
            >
                <Plus size={32} />
            </button>
        </div>
    );
};

export default FloatingCreateButton;
