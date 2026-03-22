import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiService } from '../services/apiService';
import NotificationCenter from './NotificationCenter';
import './BottomNav.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
};

const BottomNav = () => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('dating_theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dating_theme', theme);
    }, [theme]);

    useEffect(() => {
        if (user) updateUnreadCount();
    }, [user]);

    useEffect(() => {
        if (socket) {
            const handle = () => setUnreadCount(prev => prev + 1);
            socket.on('new-notification', handle);
            return () => socket.off('new-notification', handle);
        }
    }, [socket]);

    useEffect(() => {
        const handleClick = (e) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => { setShowProfileMenu(false); }, [location]);

    const updateUnreadCount = async () => {
        try {
            const data = await apiService.getNotifications(user.userId);
            setUnreadCount(data.unreadCount || 0);
        } catch (e) { console.error(e); }
    };

    const hasProfileImage = user?.images && user.images.length > 0;

    const tabs = [
        {
            to: '/swipe',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" className="tab-svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.58-.5 5.07-1.37l.08-.05C20.17 18.44 22 15.42 22 12c0-5.52-4.48-10-10-10zm0 3c1.74 0 3.34.56 4.65 1.5C14.82 8.57 12 12 12 12S9.18 8.57 7.35 6.5A7.96 7.96 0 0112 5z" fill="currentColor"/>
                </svg>
            ),
            label: 'Khám phá',
            activeIcon: '🔥'
        },
        {
            to: '/discover',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" className="tab-svg">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" fill="currentColor"/>
                </svg>
            ),
            label: 'Explore',
        },
        {
            to: '/who-liked',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" className="tab-svg">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/>
                </svg>
            ),
            label: 'Likes',
            isPremium: true,
        },
        {
            to: '/matches',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" className="tab-svg">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill="currentColor"/>
                </svg>
            ),
            label: 'Chat',
            hasBadge: unreadCount > 0,
            badgeCount: unreadCount,
        },
        {
            to: '/profile',
            isProfile: true,
            label: 'Hồ sơ',
        },
    ];

    return (
        <>
            {/* Top Header Bar - Tinder style */}
            <header className="tinder-header">
                <div className="tinder-header-inner">
                    <div className="header-left">
                        <Link to="/swipe" className="tinder-logo-link">
                            <span className="tinder-logo-flame">🔥</span>
                            <span className="tinder-logo-text">tinder</span>
                        </Link>
                    </div>
                    <div className="header-center">
                        <Link to="/premium" className="header-gold-btn">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 3.9l5 2.22V11c0 3.87-2.68 7.49-5 8.36-2.32-.87-5-4.49-5-8.36V7.12l5-2.22z"/>
                            </svg>
                            <span>GET GOLD</span>
                        </Link>
                    </div>
                    <div className="header-right">
                        <button
                            className="header-icon-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="var(--text-muted)">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
                        </button>
                        <button
                            className="header-icon-btn"
                            onClick={() => theme === 'dark' ? (setTheme('light'), document.documentElement.setAttribute('data-theme', 'light'), localStorage.setItem('dating_theme', 'light')) : (setTheme('dark'), document.documentElement.setAttribute('data-theme', 'dark'), localStorage.setItem('dating_theme', 'dark'))}
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                        <Link to="/settings" className="header-icon-btn">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="var(--text-muted)">
                                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                            </svg>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Bottom Tab Bar */}
            <nav className="bottom-nav">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.to;
                    return (
                        <Link
                            key={tab.to}
                            to={tab.to}
                            className={`bottom-tab ${isActive ? 'active' : ''} ${tab.isPremium ? 'premium-tab' : ''}`}
                        >
                            {tab.isProfile ? (
                                <div className={`profile-tab-avatar ${isActive ? 'active-ring' : ''}`}>
                                    {hasProfileImage ? (
                                        <img src={getImageUrl(user.images[0])} alt="" />
                                    ) : (
                                        <span>{user?.firstName?.charAt(0)?.toUpperCase() || '?'}</span>
                                    )}
                                </div>
                            ) : (
                                <div className="tab-icon-wrap">
                                    {isActive && tab.activeIcon ? (
                                        <span className="tab-active-emoji">{tab.activeIcon}</span>
                                    ) : (
                                        tab.icon
                                    )}
                                    {tab.hasBadge && (
                                        <span className="tab-badge">{tab.badgeCount}</span>
                                    )}
                                </div>
                            )}
                            <span className="tab-label">{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <NotificationCenter
                isOpen={showNotifications}
                onClose={() => { setShowNotifications(false); updateUnreadCount(); }}
            />
        </>
    );
};

export default BottomNav;
