import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Music, UserPlus, Share2, ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import { useMusic } from '../hooks/useMusic';
import { BASE_URL } from '../utils/api';
import socket from '../services/socket';
import Topbar from '../components/layout/Topbar';
import './Music.css'; // Reuse music styles

const PlaylistView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentTrack, playTrack, playlists } = useMusic();
    
    const [inviteUsername, setInviteUsername] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);

    const playlist = playlists.find(p => p._id === id);

    useEffect(() => {
        // Join playlist room for real-time updates
        socket.emit('join_playlist', { playlistId: id });
        
        return () => socket.emit('leave_playlist', { playlistId: id });
    }, [id]);

    const handleInvite = async () => {
        if (!inviteUsername) return;
        try {
            await fetch(`${BASE_URL}/api/playlists/${id}/collaborate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: inviteUsername })
            });
            setInviteUsername('');
            setShowInviteModal(false);
            // Context will update via socket or parent re-fetch
        } catch (err) {
            console.error("Invite failed:", err);
        }
    };

    if (!playlist) return <div className="loading" style={{ padding: '100px', textAlign: 'center' }}>Finding the vibe...</div>;




    return (
        <div className="playlist-view animate-fade-in" style={{ paddingBottom: '100px' }}>
            
            <button className="back-btn" onClick={() => navigate('/music')}>
                <ArrowLeft size={20} /> Back to Music
            </button>

            <header className="playlist-header">
                <div className="playlist-art">
                    {playlist.thumbnail ? <img src={playlist.thumbnail} alt="" /> : <Music size={60} />}
                </div>
                <div className="playlist-content">
                    <span className="playlist-type">{playlist.isCollaborative ? 'Collaborative Playlist' : 'Playlist'}</span>
                    <h1 className="playlist-title">{playlist.name}</h1>
                    <div className="playlist-metadata">
                        <span className="playlist-owner">By <b>{playlist.owner?.username}</b></span>
                        {playlist.collaborators?.length > 0 && (
                            <span className="collab-count">• {playlist.collaborators.length} collaborators</span>
                        )}
                        <span className="track-count">• {playlist.tracks?.length || 0} tracks</span>
                    </div>
                    <div className="playlist-actions">
                        <button className="play-all-btn" onClick={() => playlist.tracks?.[0] && playTrack(playlist.tracks[0])}>
                            <Play size={20} fill="black" /> Play
                        </button>
                        <button className="icon-btn" onClick={() => setShowInviteModal(true)}>
                            <UserPlus size={20} />
                        </button>
                        <button className="icon-btn">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <section className="tracks-section">
                <div className="songs-list">
                    <div className="song-row header">
                        <span className="song-num">#</span>
                        <span className="song-info">Title</span>
                        <span className="song-artist">Artist</span>
                        <span className="song-duration">Time</span>
                    </div>
                    {playlist.tracks?.map((track, idx) => (
                        <div 
                            key={idx} 
                            className={`song-row ${currentTrack?.id === track.id ? 'active' : ''}`}
                            onClick={() => playTrack(track)}
                        >
                            <span className="song-num">{idx + 1}</span>
                            <div className="song-info">
                                <span className="song-title">{track.title}</span>
                                <span className="song-artist-sub">{track.artist}</span>
                            </div>
                            <span className="song-artist-col">{track.artist}</span>
                            <span className="song-duration">{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                    ))}
                    {playlist.tracks?.length === 0 && (
                        <p className="empty-msg">No tracks yet. Search for some songs and add them!</p>
                    )}
                </div>
            </section>

            {showInviteModal && (
                <div className="playlist-modal-overlay" onClick={() => setShowInviteModal(false)}>
                    <div className="playlist-modal animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h3>Add Collaborator</h3>
                        <p>Invite a friend to help build this vibe.</p>
                        <input 
                            type="text" 
                            placeholder="Username" 
                            value={inviteUsername}
                            onChange={(e) => setInviteUsername(e.target.value)}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowInviteModal(false)}>Cancel</button>
                            <button className="confirm-btn" onClick={handleInvite}>Invite</button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .playlist-view { padding: 0 40px 80px; }
                .back-btn { display: flex; align-items: center; gap: 8px; background: none; border: none; color: var(--color-text-muted); cursor: pointer; margin-bottom: 32px; font-weight: 600; }
                .back-btn:hover { color: white; }
                
                .playlist-header { display: flex; gap: 32px; align-items: flex-end; margin-bottom: 48px; }
                .playlist-art { width: 232px; height: 232px; background: linear-gradient(135deg, #333, #111); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
                .playlist-art img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
                
                .playlist-type { text-transform: uppercase; font-size: 0.75rem; font-weight: 800; color: var(--color-primary); letter-spacing: 0.1em; }
                .playlist-title { font-size: 4rem; font-weight: 900; margin: 4px 0 16px; font-family: var(--font-header); letter-spacing: -0.04em; }
                .playlist-metadata { display: flex; gap: 8px; color: var(--color-text-muted); font-size: 0.9rem; align-items: center; margin-bottom: 24px; }
                
                .playlist-actions { display: flex; gap: 16px; align-items: center; }
                .play-all-btn { background: var(--color-primary); border: none; padding: 12px 32px; border-radius: 32px; font-weight: 800; font-size: 1rem; color: black; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.2s; }
                .play-all-btn:hover { transform: scale(1.05); }
                .icon-btn { width: 48px; height: 48px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); background: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                .icon-btn:hover { border-color: white; background: rgba(255,255,255,0.05); }

                .song-row.header { border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--color-text-muted); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
                .song-artist-col { flex: 1; }
                .song-artist-sub { display: none; }
                
                @media (max-width: 768px) {
                    .playlist-header { flex-direction: column; align-items: center; text-align: center; }
                    .playlist-title { font-size: 2.5rem; }
                    .song-artist-col { display: none; }
                    .song-artist-sub { display: block; font-size: 0.8rem; color: var(--color-text-muted); }
                }
                
                .empty-msg { text-align: center; padding: 48px; color: var(--color-text-muted); font-style: italic; }
            `}} />
        </div>
    );
};

export default PlaylistView;
