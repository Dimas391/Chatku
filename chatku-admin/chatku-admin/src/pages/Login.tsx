import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, User, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import './login.css';

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  size: 6 + Math.random() * 10,
  x: Math.random() * 100,
  y: Math.random() * 100,
  dur: 8 + Math.random() * 12,
  delay: Math.random() * -20,
  opacity: 0.04 + Math.random() * 0.08,
}));

export const Login: React.FC = () => {
  const { login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Username atau password salah. Coba lagi.');
        triggerShake();
        setPassword('');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi nanti.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="login-gradient" />
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="login-particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.opacity,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className={`login-card ${shake ? 'shake' : ''}`}>
        <div className="login-logo-wrap">
          <div className="login-logo">
            <Shield size={28} strokeWidth={1.8} />
          </div>
          <div className="login-logo-ring" />
        </div>

        <div className="login-brand">
          <h1>ChatKu Admin</h1>
          <p>Masuk ke panel administrasi</p>
        </div>

        <div className="login-divider">
          <span>Autentikasi Admin</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="field-wrap">
            <label className="field-label" htmlFor="login-username">
              Username
            </label>
            <div className="field-input-wrap">
              <User size={16} className="field-icon" />
              <input
                id="login-username"
                ref={usernameRef}
                className="field-input"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                autoComplete="username"
                disabled={loading || authLoading}
              />
            </div>
          </div>

          <div className="field-wrap">
            <label className="field-label" htmlFor="login-password">
              Password
            </label>
            <div className="field-input-wrap">
              <Lock size={16} className="field-icon" />
              <input
                id="login-password"
                className="field-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
                disabled={loading || authLoading}
              />
              <button
                type="button"
                className="field-eye"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading || authLoading}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                Memverifikasi…
              </>
            ) : (
              <>
                <LogIn size={16} />
                Masuk ke Dashboard
              </>
            )}
          </button>
        </form>

        <div className="login-hint">
          <Lock size={11} />
          Akses terbatas · Hanya untuk admin yang berwenang
        </div>
      </div>
    </div>
  );
};