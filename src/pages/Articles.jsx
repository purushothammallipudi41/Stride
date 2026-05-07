import { useState } from 'react';
import { Globe, Search, Plus, BookOpen, ChevronLeft, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../hooks/useUI';
import PageHeader from '../components/layout/PageHeader';
import './Articles.css';

const Articles = () => {
    const navigate = useNavigate();
    const { openArticleModal } = useUI();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="articles-container animate-fade-in">
            <PageHeader title="Vyx Articles" hideBack={true} />
            
            <div className="articles-back-action-area" style={{ padding: '0 20px', marginTop: '12px', marginBottom: '32px', display: 'flex', gap: '12px' }}>
                <button 
                    className="back-btn-content"
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '14px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '56px'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    className="create-article-btn-premium"
                    onClick={() => openArticleModal()}
                    style={{
                        flex: 1,
                        padding: '16px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        fontWeight: '900',
                        fontSize: '0.95rem',
                        boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)',
                        cursor: 'pointer',
                        textTransform: 'uppercase'
                    }}
                >
                    <PenTool size={20} strokeWidth={3} />
                    <span>Write New Article</span>
                </button>
            </div>
            
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
