import { useState } from 'react';
import { Sparkles, X, Hash, Type, ChevronDown, ChevronUp, Image, Film } from 'lucide-react';
import config from '../../config';
import './AIStudio.css';

const AIStudio = ({ onInsert, onInsertMedia, mode = 'post', currentCaption = '' }) => {
    const [open, setOpen] = useState(false);
    const [context, setContext] = useState('');
    const [captions, setCaptions] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const [tone, setTone] = useState('Professional');
    const [loadingCaptions, setLoadingCaptions] = useState(false);
    const [loadingTags, setLoadingTags] = useState(false);
    const [loadingTone, setLoadingTone] = useState(false);
    const [loadingArticle, setLoadingArticle] = useState(false);
    const [loadingImage, setLoadingImage] = useState(false);
    const [articleResult, setArticleResult] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [reelResult, setReelResult] = useState(null);
    const [loadingReel, setLoadingReel] = useState(false);

    const tones = ['Professional', 'Funny', 'Excited', 'Poetic', 'Minimalist', 'Gen-Z'];

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const generateCaptions = async () => {
        if (!context.trim()) return;
        setLoadingCaptions(true);
        try {
            const res = await fetch(`${config.API_URL}/api/ai/caption`, {
                method: 'POST', headers,
                body: JSON.stringify({
                    context: context || currentCaption,
                    mediaType: mode
                })
            });
            const data = await res.json();
            setCaptions(data.captions || []);
        } catch (e) { setCaptions(['Failed to generate. Try again.']); }
        finally { setLoadingCaptions(false); }
    };

    const generateHashtags = async () => {
        if (!context.trim()) return;
        setLoadingTags(true);
        try {
            const res = await fetch(`${config.API_URL}/api/ai/hashtags`, {
                method: 'POST', headers,
                body: JSON.stringify({ text: context || currentCaption })
            });
            const data = await res.json();
            setHashtags(data.hashtags || []);
        } catch (e) { setHashtags(['#error']); }
        finally { setLoadingTags(false); }
    };

    const rewriteTone = async () => {
        if (!context.trim()) return;
        setLoadingTone(true);
        try {
            const res = await fetch(`${config.API_URL}/api/ai/tone`, {
                method: 'POST', headers,
                body: JSON.stringify({ text: context || currentCaption, tone })
            });
            const data = await res.json();
            if (data.rewrittenText) {
                setContext(data.rewrittenText);
            }
        } catch (e) { console.error('Tone adjustment failed', e); }
        finally { setLoadingTone(false); }
    };

    const elaborateIdea = async () => {
        if (!context.trim()) return;
        setLoadingTone(true); // Reuse loading state for simplicity or add loadingElaborate
        try {
            const res = await fetch(`${config.API_URL}/api/ai/post-generator`, {
                method: 'POST', headers,
                body: JSON.stringify({ idea: context })
            });
            const data = await res.json();
            if (data.post) {
                setContext(data.post);
            }
        } catch (e) { console.error('Elaboration failed', e); }
        finally { setLoadingTone(false); }
    };

    const generateArticleHelp = async () => {
        if (!context.trim()) return;
        setLoadingArticle(true);
        try {
            const res = await fetch(`${config.API_URL}/api/ai/article-assistant`, {
                method: 'POST', headers,
                body: JSON.stringify({ topic: context })
            });
            const data = await res.json();
            setArticleResult(data);
        } catch (e) { console.error('Article help failed', e); }
        finally { setLoadingArticle(false); }
    };

    const generateImage = async () => {
        if (!context.trim()) return;
        setLoadingImage(true);
        setGeneratedImage(null);
        try {
            const res = await fetch(`${config.API_URL}/api/ai/generate-image`, {
                method: 'POST', headers,
                body: JSON.stringify({ prompt: context })
            });
            const data = await res.json();
            if (data.imageUrl) {
                setGeneratedImage(data.imageUrl);
            } else {
                alert(data.error || 'Failed to generate image');
            }
        } catch (e) {
            console.error('Image generation failed', e);
            alert('Service error. Check your API configuration.');
        }
        finally { setLoadingImage(false); }
    };

    const generateReel = async () => {
        if (!context.trim()) return;
        setLoadingReel(true);
        try {
            const res = await fetch(`${config.API_URL}/api/ai/reel-generator`, {
                method: 'POST', headers,
                body: JSON.stringify({ context })
            });
            const data = await res.json();
            setReelResult(data);
        } catch (e) { console.error('Reel generation failed', e); }
        finally { setLoadingReel(false); }
    };

    return (
        <div className="ai-studio">
            <button className="ai-studio-toggle" onClick={() => setOpen(o => !o)}>
                <Sparkles size={15} />
                <span>AI Studio</span>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {open && (
                <div className="ai-studio-panel">
                    <textarea
                        className="ai-context-input"
                        placeholder={currentCaption ? "Refine your caption or describe an image..." : "Describe your post, image or reel briefly…"}
                        value={context}
                        onChange={e => setContext(e.target.value)}
                        rows={2}
                    />

                    <div className="ai-tone-section">
                        <p className="ai-results-label">Adjust Tone</p>
                        <div className="ai-tones-row">
                            {tones.map(t => (
                                <button
                                    key={t}
                                    className={`ai-tone-chip ${tone === t ? 'active' : ''}`}
                                    onClick={() => setTone(t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="ai-actions-row">
                        {mode === 'post' ? (
                            <>
                                <button className="ai-action-btn" onClick={generateCaptions} disabled={loadingCaptions}>
                                    <Type size={14} /> {loadingCaptions ? 'Generating…' : 'Captions'}
                                </button>
                                <button className="ai-action-btn" onClick={generateHashtags} disabled={loadingTags}>
                                    <Hash size={14} /> {loadingTags ? 'Generating…' : 'Hashtags'}
                                </button>
                                <button className="ai-action-btn" onClick={elaborateIdea} disabled={loadingTone}>
                                    <Sparkles size={14} /> {loadingTone ? 'Expanding…' : 'Elaborate'}
                                </button>
                                <button className="ai-action-btn magic-canvas-btn" onClick={generateImage} disabled={loadingImage}>
                                    <Image size={14} /> {loadingImage ? 'Painting…' : 'Magic Canvas'}
                                </button>
                            </>
                        ) : mode === 'reel' ? (
                            <button className="ai-action-btn reel-btn" onClick={generateReel} disabled={loadingReel}>
                                <Film size={14} /> {loadingReel ? 'Scripting…' : 'Generate Reel Script'}
                            </button>
                        ) : (
                            <button className="ai-action-btn article-btn" onClick={generateArticleHelp} disabled={loadingArticle}>
                                <Sparkles size={14} /> {loadingArticle ? 'Drafting…' : 'Generate Outline'}
                            </button>
                        )}
                        <button className="ai-action-btn rewrite" onClick={rewriteTone} disabled={loadingTone}>
                            <Sparkles size={14} /> {loadingTone ? 'Rewriting…' : 'Change Tone'}
                        </button>
                    </div>

                    {reelResult && mode === 'reel' && (
                        <div className="ai-results reel-results animate-in">
                            <p className="ai-results-label">🎬 {reelResult.scriptTitle}</p>
                            <div className="storyboard-list">
                                {reelResult.scenes.map((scene, i) => (
                                    <div key={i} className="storyboard-item">
                                        <div className="scene-time">{scene.time}</div>
                                        <div className="scene-details">
                                            <p><strong>Visual:</strong> {scene.visual}</p>
                                            <p><strong>Audio:</strong> {scene.audio}</p>
                                            <p className="overlay-text">" {scene.textOverlay} "</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="ai-use-btn" onClick={() => onInsert(reelResult.scenes.map(s => s.textOverlay).join(' '))}>
                                Copy Overlays to Caption
                            </button>
                        </div>
                    )}

                    {articleResult && mode === 'article' && (
                        <div className="ai-results article-results animate-in">
                            <p className="ai-results-label">✨ Article Suggestions</p>
                            <div className="ai-article-card" onClick={() => onInsert(`<h1>${articleResult.title}</h1><p>${articleResult.introduction}</p><ul>${articleResult.outline.map(i => `<li>${i}</li>`).join('')}</ul>`)}>
                                <strong>{articleResult.title}</strong>
                                <p className="preview-text">{articleResult.introduction.substring(0, 100)}...</p>
                                <span className="ai-use-btn">Use Outline & Intro</span>
                            </div>
                        </div>
                    )}

                    {generatedImage && mode === 'post' && (
                        <div className="ai-results image-result animate-in">
                            <p className="ai-results-label">🎨 Generated masterpiece</p>
                            <div className="ai-image-preview-card">
                                <img src={generatedImage} alt="AI Generated" />
                                <button className="ai-use-btn overlay" onClick={() => onInsertMedia && onInsertMedia(generatedImage)}>
                                    Use as Post Image
                                </button>
                            </div>
                        </div>
                    )}

                    {captions.length > 0 && mode === 'post' && (
                        <div className="ai-results">
                            <p className="ai-results-label">✨ Caption suggestions</p>
                            {captions.map((c, i) => (
                                <div key={i} className="ai-result-item" onClick={() => onInsert(c)}>
                                    <span>{c}</span>
                                    <span className="ai-use-btn">Use</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {hashtags.length > 0 && mode === 'post' && (
                        <div className="ai-results">
                            <p className="ai-results-label">🏷️ Hashtag suggestions</p>
                            <div className="ai-tags-row">
                                {hashtags.map((tag, i) => (
                                    <span key={i} className="ai-tag-chip" onClick={() => onInsert(' ' + tag)}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIStudio;
