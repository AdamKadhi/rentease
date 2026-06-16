import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HousesPage from './pages/HousesPage';
import BookingsPage from './pages/BookingsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import ClientLayout from './pages/client/ClientLayout';
import ClientHomePage from './pages/client/ClientHomePage';
import ClientPropertyPage from './pages/client/ClientPropertyPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-parchment">
      <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/admin/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/admin" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      {/* Public client panel — default route, no auth */}
      <Route path="/" element={<ClientLayout />}>
        <Route index element={<ClientHomePage />} />
        <Route path="property/:houseId" element={<ClientPropertyPage />} />
      </Route>

      {/* Admin panel */}
      <Route path="/admin/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="houses" element={<HousesPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
