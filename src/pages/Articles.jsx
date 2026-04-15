import { useState } from 'react';
import { Globe, Search, Plus, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import './Articles.css';

const Articles = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="articles-container animate-fade-in">
            <PageHeader title="Stride Articles" />
            
            <div className="articles-header-subtitle-area">
                <Globe size={48} className="articles-logo-icon" />
                <p>Premium long-form content, deep dives, and creator stories.</p>
            </div>

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
