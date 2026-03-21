import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, ChevronRight, Share2, MessageSquare, Loader2 } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import './Articles.css';

const Articles = () => {
    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/articles`);
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                setArticles(data);
            } catch (err) {
                console.error('Articles error:', err);
                setError('Failed to load articles. Please explore other sections!');
            } finally {
                setIsLoading(false);
            }
        };
        fetchArticles();
    }, []);

    if (isLoading) return (
        <div className="discovery-loading">
            <Loader2 className="animate-spin" size={40} />
            <p>Curating stories for you...</p>
        </div>
    );

    if (error) return (
        <div className="discovery-error glass-panel">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
        </div>
    );

    const featuredArticle = articles[0] || {
        title: "No Featured Story",
        excerpt: "Stay tuned for updates.",
        author: "Stride Admin",
        date: "n/a",
        readTime: "0 min",
        image: ""
    };

    return (
        <div className="articles-page animate-fade-in">
            <PageHeader title="Articles" />
            <div className="article-filters" style={{ marginTop: '16px' }}>
                    <button className="filter-tab active">All</button>
                    <button className="filter-tab">Music</button>
                    <button className="filter-tab">Tech</button>
                    <button className="filter-tab">Design</button>
                </div>
            <section className="featured-article glass-panel hover-card">
                <div className="featured-image">
                    <img src={featuredArticle.image} alt={featuredArticle.title} />
                    <span className="featured-badge">Featured Story</span>
                </div>
                <div className="featured-content">
                    <span className="category-text">{featuredArticle.category}</span>
                    <h2>{featuredArticle.title}</h2>
                    <p>{featuredArticle.excerpt}</p>
                    <div className="article-meta">
                        <div className="author-info">
                            <div className="author-avatar" />
                            <span>{featuredArticle.author}</span>
                        </div>
                        <div className="meta-details">
                            <Clock size={14} />
                            <span>{featuredArticle.readTime || '5 min read'}</span>
                            <span className="dot" />
                            <span>{featuredArticle.date}</span>
                        </div>
                    </div>
                    <button className="read-more-btn text-gradient-bg">
                        Read Full Story <ChevronRight size={18} />
                    </button>
                </div>
            </section>

            <section className="articles-grid">
                {articles.slice(1).map(article => (
                    <div key={article.id} className="article-card glass-panel hover-card">
                        <div className="article-card-image">
                            <img src={article.image} alt={article.title} />
                            <span className="card-category">{article.category}</span>
                        </div>
                        <div className="article-card-content">
                            <h3>{article.title}</h3>
                            <div className="card-meta">
                                <span>{article.author}</span>
                                <span className="dot" />
                                <span>{article.readTime || '4 min read'}</span>
                            </div>
                            <div className="card-footer">
                                <button className="icon-btn"><MessageSquare size={16} /></button>
                                <button className="icon-btn"><Share2 size={16} /></button>
                                <button className="text-link">Read More</button>
                            </div>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default Articles;
