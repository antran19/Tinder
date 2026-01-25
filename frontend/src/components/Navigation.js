import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Mới
import './Navigation.css';

/**
 * Navigation Component
 * Provides navigation between Swipe and Matches views
 * Requirements: 6.1, 6.2 - Basic routing structure
 */
const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth(); // Lấy hàm logout và thông tin user

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
        </div>

        {/* Mới: Hiển thị tên user (bấm vào để sửa) và nút Đăng xuất */}
        {user && (
          <div className="nav-user">
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
    </nav>
  );
};

export default Navigation;