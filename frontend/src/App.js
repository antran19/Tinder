import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import SwipeView from './components/SwipeView';
import MatchList from './components/MatchList';
import Navigation from './components/Navigation';
import MatchNotification from './components/MatchNotification';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage'; // Mới
import EditProfile from './components/EditProfile'; // Mới
import PremiumPage from './components/PremiumPage'; // Mới
import WhoLikedYou from './components/WhoLikedYou'; // Mới
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Component bảo vệ Route: Nếu chưa đăng nhập thì đuổi về trang Login
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Đang tải...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Trang Login không cần Navigation bar */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Các trang cần đăng nhập mới xem được */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <main className="main-content">
                      <Routes>
                        <Route path="/" element={<Navigate to="/swipe" replace />} />
                        <Route path="/swipe" element={<SwipeView />} />
                        <Route path="/matches" element={<MatchList />} />
                        <Route path="/profile" element={<EditProfile />} />
                        <Route path="/premium" element={<PremiumPage />} />
                        <Route path="/who-liked" element={<WhoLikedYou />} />
                      </Routes>
                    </main>
                    <MatchNotification />
                  </>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;