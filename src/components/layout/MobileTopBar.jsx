import { NavLink, useLocation } from 'react-router-dom';
import { Film, Mic2 } from 'lucide-react';
import './MobileTopBar.css';

const MobileTopBar = () => {
    const location = useLocation();

    // Only show top bar on mobile, and optionally hide it on specific screens
    const isHiddenOnMobile = ['/messages', '/notifications'].some(path =>
        location.pathname.startsWith(path)
    );

    if (isHiddenOnMobile) return null;

    return (
        <div className="mobile-top-bar">
            {/* Logo on the left */}
            <div className="mobile-top-logo">
                <img src="/logo.png" alt="Stride" className="top-logo-icon" />
                <span className="top-logo-text">Stride</span>
            </div>

            {/* Overflow Nav Items on the right */}
            <nav className="mobile-top-nav">
                <NavLink 
                    to="/reels" 
                    className={({ isActive }) => `top-nav-item ${isActive ? 'active' : ''}`}
                    title="Reels"
                >
                    <Film size={22} />
                </NavLink>
                <NavLink 
                    to="/spaces" 
                    className={({ isActive }) => `top-nav-item ${isActive ? 'active' : ''}`}
                    title="Spaces"
                >
                    <Mic2 size={22} />
                </NavLink>
            </nav>
        </div>
    );
};

export default MobileTopBar;
