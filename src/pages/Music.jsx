import { useState } from 'react';
import SEO from '../components/common/SEO';
import { Play, Pause, Music, SkipBack, SkipForward, Share2, Plus, DollarSign, Award } from 'lucide-react';




import { useMusic } from '../hooks/useMusic';

import { useUI } from '../hooks/useUI';
// albums and allSongs will be loaded from the context or locally via fetch
import Visualizer from '../components/music/Visualizer';
import PageHeader from '../components/layout/PageHeader';
import './Music.css';

import { useNavigate } from 'react-router-dom';


const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const ImageWithFallback = ({ src, alt, className, fallback = '/default-track.png' }) => {
    const [hasError, setHasError] = useState(false);

    return (
        <img 
            key={src}
            src={hasError || !src ? fallback : src} 
            alt={alt} 
            className={className} 
            onError={() => setHasError(true)}
        />
    );
};

const MusicPage = () => {
    const navigate = useNavigate();
    const { addNotification } = useUI();

    const { 
        allSongs,
        currentTrack, 
        isPlaying, 
        togglePlay, 
        playTrack, 
        analyzer,
        nextTrack,
        prevTrack,
        progress,
        setProgress,
        playlists,
        createPlaylist,
        addToPlaylist
    } = useMusic();



    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);


    const [isExpanded, setIsExpanded] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [addingToPlaylist, setAddingToPlaylist] = useState(null);


    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            setIsSearching(true);
            const { searchTracks } = await import('../services/audiusService');
            const tracks = await searchTracks(query);
            setSearchResults(tracks);
            setIsSearching(false);
        } else {
            setSearchResults([]);
        }
    };



    const handlePlaySong = (song) => {
        if (currentTrack?.id === song.id) {
            togglePlay();
        } else {
            playTrack(song);
        }
    };

    const handleShareSong = async (e, song) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: song.title,
                    text: `Check out ${song.title} by ${song.artist} on Stride!`,
                    url: window.location.href,
                });
            } catch (err) {
                console.error("Share failed:", err);
            }
        } else {
            const shareUrl = `${window.location.origin}/track/${song.id}`;
            navigator.clipboard.writeText(shareUrl);
            addNotification({ title: 'Link Copied', message: 'Vibe link copied to clipboard!', type: 'info' });
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName) return;
        await createPlaylist({ name: newPlaylistName, tracks: [] });
        setNewPlaylistName('');
        setShowCreateModal(false);
        addNotification({ title: 'Playlist Created', message: `"${newPlaylistName}" is ready for vibes.`, type: 'success' });
    };

    const Scrubber = ({ isLarge }) => (
        <div 
            className={`scrubber-container ${isLarge ? 'large' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                if (!currentTrack?.duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                setProgress(percentage * currentTrack.duration);
            }}
        >
            <div 
                className="scrubber-fill" 
                style={{ width: `${(progress / (currentTrack?.duration || 1)) * 100}%` }}
            />
        </div>
    );

    return (
        <div className="music-page" style={{ paddingBottom: '140px' }}>
            <SEO 
                title="Music & Playlists" 
                description="Stream high-quality music from Audius, create collaborative playlists, and vibe with the Stride community." 
            />
            <PageHeader title="Music" />
            
            <div className="music-search-container">
                <input 
                    type="text" 
                    placeholder="Search Audius tracks..." 
                    value={searchQuery}
                    onChange={handleSearch}
                    className="music-search-input"
                />
                {isSearching && <div className="search-spinner">Searching...</div>}
            </div>

            {searchResults.length > 0 && (
                <section className="music-section search-results">
                    <h3>Search Results</h3>
                    <div className="songs-list">
                        {searchResults.map((song, idx) => (
                            <div
                                key={song.id}
                                className={`song-row${currentTrack?.id === song.id ? ' active' : ''}`}
                                onClick={() => playTrack(song)}
                            >
                                <span className="song-num">{idx + 1}</span>
                                <div className="song-info">
                                    <span className="song-title">{song.title}</span>
                                    <span className="song-artist">{song.user?.name || 'Audius Artist'}</span>
                                </div>
                                <button className="song-share-btn" onClick={(e) => handleShareSong(e, song)}>
                                    <Share2 size={16} />
                                </button>
                                <button className="song-add-btn" onClick={(e) => { e.stopPropagation(); setAddingToPlaylist(song); }}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Spotify-style MiniPlayer */}
            {currentTrack && (
                <div className={`spotify-mini-player ${isExpanded ? 'hidden' : ''}`} onClick={() => setIsExpanded(true)}>
                    <Scrubber />
                    <div className="mini-player-content">
                        <ImageWithFallback src={currentTrack.cover} alt="" className="mini-cover" />
                        <div className="mini-info">
                            <span className="mini-title">{currentTrack.title}</span>
                            <span className="mini-artist">{currentTrack.artist}</span>
                        </div>
                        <div className="mini-visualizer-wrapper">
                            <Visualizer analyzer={analyzer} isPlaying={isPlaying} />
                        </div>
                        <div className="mini-controls" onClick={e => e.stopPropagation()}>
                            <button className="mini-play-btn" onClick={togglePlay}>
                                {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Spotify-style Expanded Model */}
            <div className={`spotify-expanded-modal ${isExpanded ? 'active' : ''}`}>
                <div className="modal-bg-gradient" style={{ backgroundImage: `url(${currentTrack?.cover})` }} />
                <div className="modal-header">
                    <button className="close-btn" onClick={() => setIsExpanded(false)}>
                        <Music size={20} />
                    </button>
                    <div className="modal-header-info">
                        <span className="header-label">PLAYING FROM ALBUM</span>
                        <span className="header-name">{currentTrack?.title || 'Unknown'}</span>
                    </div>
                </div>

                <div className="modal-body">
                    <div className="expanded-cover-container">
                        <ImageWithFallback src={currentTrack?.cover} alt="" className="expanded-cover shadow-2xl" />
                    </div>

                    <div className="expanded-info">
                        <div className="title-row">
                            <div>
                                <h1 className="expanded-title">{currentTrack?.title}</h1>
                                <p className="expanded-artist">{currentTrack?.artist}</p>
                            </div>
                            <button className="heart-btn"><Plus size={24} /></button>
                        </div>

                        <div className="expanded-progress-section">
                            <Scrubber isLarge />
                            <div className="time-row">
                                <span>{formatTime(progress)}</span>
                                <span>{formatTime(currentTrack?.duration)}</span>
                            </div>
                        </div>

                        <div className="expanded-controls">
                            <button className="secondary-ctrl"><Music size={20} /></button>
                            <button className="main-ctrl" onClick={prevTrack}><SkipBack size={32} fill="currentColor" /></button>
                            <button className="play-ctrl" onClick={togglePlay}>
                                {isPlaying ? <Pause size={48} fill="black" /> : <Play size={48} fill="black" style={{ marginLeft: 4 }} />}
                            </button>
                            <button className="main-ctrl" onClick={nextTrack}><SkipForward size={32} fill="currentColor" /></button>
                            <button className="secondary-ctrl"><Share2 size={20} /></button>
                        </div>

                        <div className="modal-visualizer">
                            <Visualizer analyzer={analyzer} isPlaying={isPlaying} />
                        </div>
                    </div>
                </div>
            </div>


            {/* ── Trending on Audius ── */}
            <section className="music-section">
                <h3>Trending on Audius</h3>
                <div className="songs-list">
                    {allSongs.slice(0, 10).map((song, idx) => {
                        const isActive = currentTrack?.id === song.id;
                        return (
                            <div
                                key={song.id}
                                className={`song-row${isActive ? ' active' : ''}`}
                                onClick={() => handlePlaySong(song)}
                            >
                                <span className="song-num">
                                    {isActive && isPlaying
                                        ? <Music size={14} />
                                        : idx + 1}
                                </span>
                                <ImageWithFallback src={song.cover} className="song-cover" alt={song.title} />
                                <div className="song-info">
                                    <span className="song-title">{song.title}</span>
                                    <span className="song-artist">{song.artist}</span>
                                </div>
                                <button className="song-share-btn" onClick={(e) => handleShareSong(e, song)}>
                                    <Share2 size={16} />
                                </button>
                                <button className="song-add-btn" onClick={(e) => { e.stopPropagation(); setAddingToPlaylist(song); }}>
                                    <Plus size={16} />
                                </button>
                                <span className="song-duration">{formatTime(song.duration)}</span>
                            </div>
                        );
                    })}
                    {allSongs.length === 0 && (
                        <div className="loading-inline">Discovering vibes on Audius...</div>
                    )}
                </div>
            </section>

            {/* ── Playlists ── */}
            <section className="music-section">
                <div className="section-header">
                    <h3>My Playlists</h3>
                    <button className="create-playlist-btn" onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} /> Create
                    </button>
                </div>
                <div className="albums-grid">
                    {Array.isArray(playlists) && playlists.map(playlist => (
                        <div
                            key={playlist._id}
                            className="album-card playlist-card"
                            onClick={() => navigate(`/playlist/${playlist._id}`)}
                        >
                            <div className="album-thumb">
                                {playlist.thumbnail ? (
                                    <img src={playlist.thumbnail} alt={playlist.name} />
                                ) : (
                                    <div className="playlist-thumb-placeholder">
                                        <Music size={40} />
                                    </div>
                                )}
                                {playlist.isCollaborative && <div className="collab-badge">Collab</div>}
                            </div>
                            <div className="album-meta">
                                <span className="album-name">{playlist.name}</span>
                                <span className="album-artist">{playlist.tracks?.length || 0} tracks</span>
                            </div>
                        </div>
                    ))}
                    {playlists.length === 0 && (
                        <div className="empty-playlists" onClick={() => setShowCreateModal(true)}>
                            <Plus size={32} />
                            <p>Build your first vibe</p>
                        </div>
                    )}
                </div>
            </section>


            {/* ── Create Playlist Modal ── */}
            {showCreateModal && (
                <div className="playlist-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="playlist-modal animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h3>Create New Playlist</h3>
                        <p>Give your collection a name and start collaborating.</p>
                        <input 
                            type="text" 
                            placeholder="Vibe Name (e.g. Late Night Runs)" 
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
                        />
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="confirm-btn" onClick={handleCreatePlaylist} disabled={!newPlaylistName}>Create Playlist</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add to Playlist Modal ── */}
            {addingToPlaylist && (
                <div className="playlist-modal-overlay" onClick={() => setAddingToPlaylist(null)}>
                    <div className="playlist-modal animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h3>Add to Playlist</h3>
                        <p>Select a collection for "{addingToPlaylist.title}"</p>
                        <div className="playlists-select-list">
                            {Array.isArray(playlists) && playlists.map(p => (
                                <button 
                                    key={p._id} 
                                    className="select-playlist-item"
                                    onClick={() => {
                                        addToPlaylist(p._id, addingToPlaylist);
                                        setAddingToPlaylist(null);
                                        addNotification({ title: 'Added to Playlist', message: `Added to ${p.name}`, type: 'success' });
                                    }}
                                >
                                    <Music size={16} /> {p.name}
                                </button>
                            ))}
                            <button className="select-playlist-item create-new" onClick={() => { setAddingToPlaylist(null); setShowCreateModal(true); }}>
                                <Plus size={16} /> Create New Playlist...
                            </button>
                        </div>
                        <button className="cancel-btn full-width" onClick={() => setAddingToPlaylist(null)}>Cancel</button>
                    </div>
                </div>
            )}


        </div>
    );
};

export default MusicPage;
