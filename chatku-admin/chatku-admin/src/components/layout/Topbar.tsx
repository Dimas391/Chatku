import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const TITLES: Record<string, string> = {
  '/dashboard':      'Dashboard',
  '/users':          'Pengguna',
  '/chats':          'Percakapan',
  '/testing':        'Pengujian Sistem',
  '/classification': 'Klasifikasi Pesan',
  '/settings':       'Pengaturan',
};

export const Topbar = () => {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const title = TITLES[pathname] ?? 'ChatKu Admin';

  const initials = admin?.name
    ? admin.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-search">
        <Search size={16} color="var(--text-muted)" />
        <input placeholder="Cari sesuatu..." />
      </div>
      <button className="icon-btn" onClick={toggle} title="Toggle tema">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Admin info */}
      {admin && (
        <div className="topbar-admin">
          <div className="topbar-admin-info">
            <span className="topbar-admin-name">{admin.name}</span>
            <span className="topbar-admin-role">{admin.role}</span>
          </div>
          <div className="avatar">{initials}</div>
          <button
            className="icon-btn topbar-logout"
            onClick={handleLogout}
            title="Keluar"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
};

