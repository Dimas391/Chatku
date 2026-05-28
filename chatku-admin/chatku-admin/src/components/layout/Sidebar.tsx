import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, FlaskConical, Settings, BrainCircuit } from 'lucide-react';

export const Sidebar = () => (
  <aside className="sidebar">
    <div className="sidebar-brand">
      <div className="sidebar-logo">C</div>
      <div className="sidebar-brand-text">
        <strong>ChatKu</strong>
        <span>Admin Panel</span>
      </div>
    </div>

    <div className="nav-section-label">Menu</div>
    <NavLink to="/dashboard" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
      <LayoutDashboard size={18} /> Dashboard
    </NavLink>
    <NavLink to="/users" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
      <Users size={18} /> Pengguna
    </NavLink>
    <NavLink to="/chats" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
      <MessageSquare size={18} /> Percakapan
    </NavLink>

    <div className="nav-section-label">Tools</div>
    <NavLink to="/classification" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
      <BrainCircuit size={18} /> Klasifikasi
    </NavLink>
    <NavLink to="/testing" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
      <FlaskConical size={18} /> Pengujian
    </NavLink>
    <NavLink to="/settings" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
      <Settings size={18} /> Pengaturan
    </NavLink>
  </aside>
);
