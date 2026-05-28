import React, { createContext, useContext, useState, useEffect } from 'react';
import adminApiService from '@/services/adminApi';

interface Admin {
  id: string;
  username: string;
  name: string;
  role: string;
  token: string;  
}

interface AuthCtx {
  admin: Admin | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const Ctx = createContext<AuthCtx>({
  admin: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
  isLoading: true,
});

const STORAGE_KEY = 'admin_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        console.log('[Auth] Loading session from localStorage:', raw);
        
        if (raw) {
          const session = JSON.parse(raw) as Admin;
          console.log('[Auth] Session loaded:', session);
          
          if (session.token) {
            setAdmin(session);
          } else {
            console.warn('[Auth] Session found but no token, clearing');
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          console.log('[Auth] No session found');
        }
      } catch (error) {
        console.error('[Auth] Failed to load session:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('[Auth] Attempting login for:', username);
      const response = await adminApiService.login(username, password);
      
      console.log('[Auth] Login response:', response);
      
      const session: Admin = {
        id: response.admin.id,
        username: response.admin.username,
        name: response.admin.name,
        role: response.admin.role,
        token: response.access_token,
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      console.log('[Auth] Session saved to localStorage');
      
      setAdmin(session);
      return true;
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('[Auth] Logging out');
    localStorage.removeItem(STORAGE_KEY);
    setAdmin(null);
  };

  return (
    <Ctx.Provider value={{ 
      admin, 
      login, 
      logout, 
      isAuthenticated: !!admin, 
      isLoading 
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);