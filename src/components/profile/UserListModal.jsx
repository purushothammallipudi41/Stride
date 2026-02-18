import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import config from '../../config';
import { X, Search } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import './UserListModal.css';

const UserListModal = ({ title, userIds, onClose }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            if (!userIds || userIds.length === 0) {
                setUsers([]);
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${config.API_URL}/api/users/batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: userIds })
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error('Failed to fetch batch users:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [userIds]);

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserClick = (username) => {
        navigate(`/profile/${username}`);
        onClose();
    };

    return createPortal(
        <div className="user-modal-overlay" onClick={onClose}>
            <div className="user-modal-content glass-card" onClick={e => e.stopPropagation()}>
                <header className="user-modal-header">
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </header>

                <div className="user-modal-search">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="user-modal-list">
                    {loading ? (
                        <div className="modal-loading"><div className="spinner small"></div></div>
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                            <div
                                key={u.id || u._id || u.email}
                                className="user-modal-item"
                                onClick={() => handleUserClick(u.username)}
                                style={{ cursor: 'pointer' }}
                            >
                                <img
                                    src={getImageUrl(u.avatar)}
                                    alt={u.name}
                                    className="user-item-avatar"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = getImageUrl(null, 'user');
                                    }}
                                />
                                <div className="user-item-info">
                                    <span className="user-item-username">{u.username}</span>
                                    <span className="user-item-name">{u.name}</span>
                                </div>
                                <button className="user-item-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    handleUserClick(u.username);
                                }}>View</button>
                            </div>
                        ))
                    ) : (
                        <p className="no-users">No users found.</p>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UserListModal;
