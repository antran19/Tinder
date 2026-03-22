import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './StoriesBar.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const api = (endpoint, options = {}) =>
    fetch(`${API_BASE_URL}/api/stories${endpoint}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    }).then(r => r.json());

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
};

const StoriesBar = () => {
    const { user } = useAuth();
    const [storyGroups, setStoryGroups] = useState([]);
    const [myStories, setMyStories] = useState(null);
    const [viewingGroup, setViewingGroup] = useState(null);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const progressTimer = useRef(null);

    const loadStories = useCallback(async () => {
        try {
            const data = await api(`?userId=${user?.userId}`);
            if (data.success) {
                setStoryGroups(data.data.stories || []);
                setMyStories(data.data.myStories || null);
            }
        } catch (e) {
            console.error('Load stories error:', e);
        }
    }, [user?.userId]);

    useEffect(() => {
        loadStories();
        const interval = setInterval(loadStories, 60000); // Refresh mỗi phút
        return () => clearInterval(interval);
    }, [loadStories]);

    // Upload story
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
        if (!allowedTypes.includes(file.type)) {
            alert('Chỉ hỗ trợ ảnh (JPEG, PNG, WebP, GIF) hoặc video (MP4)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File quá lớn. Tối đa 10MB');
            return;
        }

        setUploading(true);

        try {
            // Upload file
            const formData = new FormData();
            formData.append('image', file);

            const uploadRes = await fetch(`${API_BASE_URL}/api/upload/chat`, {
                method: 'POST',
                body: formData,
            });
            const uploadData = await uploadRes.json();

            if (uploadData.success && uploadData.url) {
                // Create story
                const mediaType = file.type.startsWith('video') ? 'video' : 'image';
                const storyData = await api('', {
                    method: 'POST',
                    body: JSON.stringify({
                        userId: user?.userId,
                        mediaUrl: uploadData.url,
                        mediaType,
                    }),
                });

                if (storyData.success) {
                    loadStories();
                }
            }
        } catch (err) {
            console.error('Upload story error:', err);
            alert('Lỗi upload story');
        } finally {
            setUploading(false);
            setShowUpload(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Story viewer
    const openStoryViewer = (group, startIndex = 0) => {
        setViewingGroup(group);
        setCurrentStoryIndex(startIndex);
        setProgress(0);
    };

    const closeViewer = () => {
        setViewingGroup(null);
        setCurrentStoryIndex(0);
        setProgress(0);
        if (progressTimer.current) clearInterval(progressTimer.current);
    };

    // Progress bar auto-advance
    useEffect(() => {
        if (!viewingGroup) return;

        const story = viewingGroup.stories[currentStoryIndex];
        if (!story) return;

        // Mark as viewed
        if (!story.isViewed) {
            api(`/${story._id}/view`, {
                method: 'PUT',
                body: JSON.stringify({ userId: user?.userId }),
            }).catch(() => {});
        }

        // Auto progress (5s per story)
        setProgress(0);
        const duration = 5000;
        const interval = 50;
        let elapsed = 0;

        progressTimer.current = setInterval(() => {
            elapsed += interval;
            setProgress((elapsed / duration) * 100);

            if (elapsed >= duration) {
                // Next story
                if (currentStoryIndex < viewingGroup.stories.length - 1) {
                    setCurrentStoryIndex(prev => prev + 1);
                } else {
                    closeViewer();
                }
            }
        }, interval);

        return () => {
            if (progressTimer.current) clearInterval(progressTimer.current);
        };
    }, [viewingGroup, currentStoryIndex, user?.userId]);

    // Handle click left/right in viewer
    const handleViewerClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (x < rect.width / 3) {
            // Previous
            if (currentStoryIndex > 0) {
                setCurrentStoryIndex(prev => prev - 1);
            }
        } else {
            // Next
            if (currentStoryIndex < viewingGroup.stories.length - 1) {
                setCurrentStoryIndex(prev => prev + 1);
            } else {
                closeViewer();
            }
        }
    };

    const handleLike = async (storyId) => {
        try {
            await api(`/${storyId}/like`, {
                method: 'PUT',
                body: JSON.stringify({ userId: user?.userId }),
            });
            loadStories();
        } catch (e) {
            console.error('Like error:', e);
        }
    };

    const handleDelete = async (storyId) => {
        if (!window.confirm('Xóa story này?')) return;
        try {
            await api(`/${storyId}?userId=${user?.userId}`, { method: 'DELETE' });
            loadStories();
            closeViewer();
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
        if (seconds < 60) return 'Vừa xong';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}p trước`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h trước`;
    };

    const allGroups = [];
    // My stories first
    if (myStories) {
        allGroups.push({ ...myStories, isMe: true });
    }
    allGroups.push(...storyGroups.map(g => ({ ...g, isMe: false })));

    if (allGroups.length === 0 && !user) return null;

    const currentStory = viewingGroup?.stories?.[currentStoryIndex];

    return (
        <>
            {/* Stories Bar */}
            <div className="stories-bar">
                {/* Add story button */}
                <div className="story-item add-story" onClick={() => fileInputRef.current?.click()}>
                    <div className="story-avatar-wrapper add">
                        <div className="story-avatar">
                            {user?.images?.[0]
                                ? <img src={getImageUrl(user.images[0])} alt="" />
                                : <span>{(user?.firstName || '?').charAt(0).toUpperCase()}</span>
                            }
                        </div>
                        <div className="story-add-icon">+</div>
                    </div>
                    <span className="story-name">Thêm story</span>
                </div>

                {/* Story groups */}
                {allGroups.map((group, idx) => {
                    const avatarUrl = group.user?.images?.[0];
                    return (
                        <div
                            key={group.user?.userId || idx}
                            className={`story-item ${group.hasUnviewed ? 'unviewed' : 'viewed'} ${group.isMe ? 'my-story' : ''}`}
                            onClick={() => openStoryViewer(group)}
                        >
                            <div className={`story-avatar-wrapper ${group.hasUnviewed ? 'unviewed' : 'viewed'}`}>
                                <div className="story-avatar">
                                    {avatarUrl
                                        ? <img src={getImageUrl(avatarUrl)} alt="" />
                                        : <span>{(group.user?.firstName || '?').charAt(0).toUpperCase()}</span>
                                    }
                                </div>
                            </div>
                            <span className="story-name">
                                {group.isMe ? 'Bạn' : (group.user?.firstName || 'User')}
                            </span>
                            {group.stories?.length > 1 && (
                                <span className="story-count">{group.stories.length}</span>
                            )}
                        </div>
                    );
                })}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/mp4"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                />
            </div>

            {/* Upload Loading */}
            {uploading && (
                <div className="story-uploading">
                    <div className="story-upload-spinner"></div>
                    <span>Đang đăng story...</span>
                </div>
            )}

            {/* Story Viewer Modal */}
            {viewingGroup && currentStory && (
                <div className="story-viewer-overlay" onClick={closeViewer}>
                    <div className="story-viewer" onClick={(e) => { e.stopPropagation(); handleViewerClick(e); }}>
                        {/* Progress bars */}
                        <div className="story-progress-bars">
                            {viewingGroup.stories.map((s, idx) => (
                                <div key={idx} className="story-progress-bar">
                                    <div
                                        className="story-progress-fill"
                                        style={{
                                            width: idx < currentStoryIndex ? '100%'
                                                : idx === currentStoryIndex ? `${progress}%`
                                                    : '0%'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Header */}
                        <div className="story-viewer-header">
                            <div className="story-viewer-user">
                                <div className="story-viewer-avatar">
                                    {viewingGroup.user?.images?.[0]
                                        ? <img src={getImageUrl(viewingGroup.user.images[0])} alt="" />
                                        : <span>{(viewingGroup.user?.firstName || '?').charAt(0)}</span>
                                    }
                                </div>
                                <div className="story-viewer-info">
                                    <strong>{viewingGroup.user?.firstName || 'User'}</strong>
                                    <span>{timeAgo(currentStory.createdAt)}</span>
                                </div>
                            </div>
                            <div className="story-viewer-actions">
                                {viewingGroup.isMe && (
                                    <button className="story-delete-btn" onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(currentStory._id);
                                    }}>🗑️</button>
                                )}
                                <button className="story-close-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    closeViewer();
                                }}>✕</button>
                            </div>
                        </div>

                        {/* Media */}
                        <div className="story-viewer-media">
                            {currentStory.mediaType === 'video' ? (
                                <video
                                    src={getImageUrl(currentStory.mediaUrl)}
                                    autoPlay
                                    muted
                                    playsInline
                                />
                            ) : (
                                <img src={getImageUrl(currentStory.mediaUrl)} alt="Story" />
                            )}
                        </div>

                        {/* Caption */}
                        {currentStory.caption && (
                            <div className="story-caption">
                                {currentStory.caption}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="story-viewer-footer">
                            <button
                                className={`story-like-btn ${currentStory.isLiked ? 'liked' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLike(currentStory._id);
                                }}
                            >
                                {currentStory.isLiked ? '❤️' : '🤍'} {currentStory.likeCount || 0}
                            </button>
                            <span className="story-view-count">
                                👁️ {currentStory.viewCount || 0}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StoriesBar;
