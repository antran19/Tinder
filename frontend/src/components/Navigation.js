import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiService } from '../services/apiService';
import NotificationCenter from './NotificationCenter';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dating_theme') || 'dark';
  });

  // Áp dụng theme khi component mount và khi theme thay đổi
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dating_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (user) {
      updateUnreadCount();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleNewNotify = () => {
        setUnreadCount(prev => prev + 1);
      };
      socket.on('new-notification', handleNewNotify);
      return () => socket.off('new-notification', handleNewNotify);
    }
  }, [socket]);

  const updateUnreadCount = async () => {
    try {
      const data = await apiService.getNotifications(user.userId);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-title">Dating App</h1>
        <div className="nav-links">
          <Link
            to="/swipe"
            className={`nav-link ${location.pathname === '/swipe' ? 'active' : ''}`}
          >
            Swipe
          </Link>
          <Link
            to="/matches"
            className={`nav-link ${location.pathname === '/matches' ? 'active' : ''}`}
          >
            Matches
          </Link>
          <Link
            to="/who-liked"
            className={`nav-link ${location.pathname === '/who-liked' ? 'active' : ''}`}
          >
            👀 Ai thích bạn
          </Link>
          <Link
            to="/premium"
            className={`nav-link premium-link ${location.pathname === '/premium' ? 'active' : ''}`}
          >
            ⭐ Premium
          </Link>
        </div>

        {user && (
          <div className="nav-user">
            {/* Theme Toggle */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Notification Bell */}
            <div className="nav-notify-container" onClick={() => setShowNotifications(!showNotifications)}>
              <span className="nav-bell">🔔</span>
              {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </div>

            <Link
              to="/profile"
              className={`user-name-link ${location.pathname === '/profile' ? 'active' : ''}`}
            >
              Hi, {user.firstName} ⚙️
            </Link>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        )}
      </div>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          updateUnreadCount();
        }}
      />
    </nav>
  );
};

export default Navigation;