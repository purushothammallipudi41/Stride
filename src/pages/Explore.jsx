import { Play } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { genres, languages, artists, albums } from '../data/musicData';
import './Explore.css';

const Explore = () => {
    const { playTrack } = useMusic();

    const handlePlayAlbum = (album) => {
        // Play first song of album
        if (album.songs && album.songs.length > 0) {
            playTrack({
                ...album.songs[0],
                cover: album.cover
            });
        }
    };

    return (
        <div className="explore-container">
            <header className="explore-header">
                <h2>Discover</h2>
                <div className="search-bar">
                    {/* Placeholder for search functionality */}
                    <input type="text" placeholder="Search artists, songs, or genres..." />
                </div>
            </header>

            {/* Genres */}
            <section className="explore-section">
                <h3>Genres</h3>
                <div className="genres-grid">
                    {genres.map(genre => (
                        <div key={genre.id} className="genre-card" style={{ backgroundColor: genre.color }}>
                            <span>{genre.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* New Albums */}
            <section className="explore-section">
                <h3>New Releases</h3>
                <div className="horizontal-scroll">
                    {albums.map(album => (
                        <div key={album.id} className="album-card" onClick={() => handlePlayAlbum(album)}>
                            <div className="album-cover">
                                <img src={album.cover} alt={album.title} />
                                <div className="play-overlay">
                                    <Play fill="white" size={24} />
                                </div>
                            </div>
                            <span className="album-title">{album.title}</span>
                            <span className="album-artist">{album.artist}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Top Artists */}
            <section className="explore-section">
                <h3>Top Artists</h3>
                <div className="horizontal-scroll">
                    {artists.map(artist => (
                        <div key={artist.id} className="artist-card">
                            <img src={artist.image} alt={artist.name} className="artist-img" />
                            <span className="artist-name">{artist.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Languages */}
            <section className="explore-section">
                <h3>Browse by Language</h3>
                <div className="tags-container">
                    {languages.map(lang => (
                        <span key={lang.id} className="lang-tag">{lang.name}</span>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Explore;
