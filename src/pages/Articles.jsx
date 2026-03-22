import React, { useState } from 'react';
import { Globe, Search, Plus, BookOpen, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Articles.css';

const Articles = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="articles-container animate-fade-in">
            <header className="articles-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={18} /> Back to Dashboard
                </button>

                <div className="header-main">
                    <div className="logo-wrapper">
                        <Globe size={48} className="articles-logo-icon" />
                    </div>
                    <h1 className="articles-title">Stride Articles</h1>
                    <p className="articles-subtitle">
                        Premium long-form content, deep dives, and creator stories.
                    </p>
                </div>

                <div className="header-actions">
                    <div className="search-wrapper">
                        <Search size={20} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search articles..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="create-article-btn">
                        <Plus size={20} /> Create Article
                    </button>
                </div>
            </header>

            <main className="articles-content">
                <div className="empty-state">
                    <div className="empty-icon-wrapper">
                        <BookOpen size={80} />
                    </div>
                    <h2>No articles found</h2>
                    <p>We couldn't find any articles matching your search.</p>
                </div>
            </main>
        </div>
    );
};

export default Articles;
