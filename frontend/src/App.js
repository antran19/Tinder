import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import SwipeView from './components/SwipeView';
import MatchList from './components/MatchList';
import BottomNav from './components/BottomNav';
import MatchNotification from './components/MatchNotification';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import EditProfile from './components/EditProfile';
import PremiumPage from './components/PremiumPage';
import WhoLikedYou from './components/WhoLikedYou';
import DiscoverPage from './components/DiscoverPage';
import InsightsPage from './components/InsightsPage';
import SettingsPage from './components/SettingsPage';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import ToastNotifications from './components/ToastNotifications';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="app-loading-flame">🔥</div></div>;
  if (isAuthenticated) return <Navigate to="/swipe" replace />;
  return children;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="app-loading-flame">🔥</div></div>;
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
              <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

              <Route path="/*" element={
                <ProtectedRoute>
                  <div className="tinder-layout">
                    <main className="tinder-main">
                      <Routes>
                        <Route path="/app" element={<Navigate to="/swipe" replace />} />
                        <Route path="/swipe" element={<SwipeView />} />
                        <Route path="/discover" element={<DiscoverPage />} />
                        <Route path="/matches" element={<MatchList />} />
                        <Route path="/profile" element={<EditProfile />} />
                        <Route path="/premium" element={<PremiumPage />} />
                        <Route path="/who-liked" element={<WhoLikedYou />} />
                        <Route path="/insights" element={<InsightsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                      </Routes>
                    </main>
                    <BottomNav />
                    <MatchNotification />
                    <ToastNotifications />
                  </div>
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