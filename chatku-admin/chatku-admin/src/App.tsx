import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Chats } from './pages/Chats';
import { Testing } from './pages/Testing';
import { Settings } from './pages/Settings';
import { Classification } from './pages/Classification';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/layout.css';

/* ── Guard: redirect to /login if not authenticated ── */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/* ── Main shell (sidebar + topbar + content) ── */
const AppShell = () => (
  <div className="app-shell">
    <Sidebar />
    <div className="app-main">
      <Topbar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"      element={<Dashboard />} />
          <Route path="/users"          element={<Users />} />
          <Route path="/chats"          element={<Chats />} />
          <Route path="/testing"        element={<Testing />} />
          <Route path="/classification" element={<Classification />} />
          <Route path="/settings"       element={<Settings />} />
          {/* Catch-all → dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginGuard />} />

        {/* Protected shell */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

/* Redirect to dashboard if already logged in */
const LoginGuard = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />;
};

