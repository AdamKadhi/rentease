import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import i18n from '../i18n';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rentease-token');
    if (token) {
      api.post('/auth/refresh')
        .then(({ data }) => {
          localStorage.setItem('rentease-token', data.accessToken);
          setUser(data.user);
          applyLanguage(data.user.language);
          connectSocket(data.user.id);
        })
        .catch(() => localStorage.removeItem('rentease-token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function applyLanguage(lang) {
    i18n.changeLanguage(lang);
    localStorage.setItem('rentease-lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('rentease-token', data.accessToken);
    setUser(data.user);
    applyLanguage(data.user.language);
    connectSocket(data.user.id);
    return data.user;
  }

  async function register(name, email, password, language) {
    const { data } = await api.post('/auth/register', { name, email, password, language });
    localStorage.setItem('rentease-token', data.accessToken);
    setUser(data.user);
    applyLanguage(data.user.language);
    connectSocket(data.user.id);
    return data.user;
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('rentease-token');
    disconnectSocket();
    setUser(null);
  }

  async function toggleLanguage() {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    applyLanguage(newLang);
    if (user) {
      await api.put('/auth/language', { language: newLang }).catch(() => {});
      setUser(prev => ({ ...prev, language: newLang }));
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, toggleLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
