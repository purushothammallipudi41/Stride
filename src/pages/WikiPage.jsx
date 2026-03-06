import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Search, Clock, ChevronRight } from 'lucide-react';
import config from '../config';
import './ArticlePage.css'; // Reuse article CSS

const WikiPage = () => {
    const { serverId } = useParams();
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchWiki = async () => {
            try {
                const res = await fetch(`${config.API_URL}/api/articles/server/${serverId}`);
                if (res.ok) {
                    const data = await res.json();
                    setArticles(data);
                }
            } catch (e) {
                console.error('Failed to fetch wiki', e);
            } finally {
                setLoading(false);
            }
        };
        fetchWiki();
    }, [serverId]);

    const filtered = articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.content.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="article-page animate-in">
            <header className="article-header glass-header">
                <button className="icon-btn back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <div className="article-title-bar">
                    <h1>Server Wiki</h1>
                    <p>Knowledge base</p>
                </div>
            </header>

            <main className="wiki-content">
                <div className="wiki-search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search wiki articles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex-center" style={{ padding: '2rem' }}>
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
                    <div className="wiki-list">
                        {filtered.length === 0 ? (
                            <div className="empty-state">No wiki articles found.</div>
                        ) : (
                            filtered.map(article => (
                                <div
                                    key={article._id}
                                    className="wiki-card glass-card"
                                    onClick={() => navigate(`/articles/${article._id}`)}
                                >
                                    <div className="wiki-card-icon">
                                        <FileText size={24} />
                                    </div>
                                    <div className="wiki-card-info">
                                        <h3>{article.title}</h3>
                                        <p>{article.content.substring(0, 100)}...</p>
                                        <div className="wiki-meta">
                                            <span><Clock size={12} /> {new Date(article.createdAt).toLocaleDateString()}</span>
                                            <span>By @{article.authorUsername}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="wiki-arrow" />
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default WikiPage;
