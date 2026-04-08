// frontend/src/contexts/AuthContext.tsx — VERSION MISE À JOUR
// Remplace intégralement ton fichier existant.
//
// AJOUTS :
//   1. handleGoogleCallback() — stocke les tokens après auth Google
//   2. logout() — redirige maintenant vers la page d'accueil '/' après déconnexion

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: 'USER' | 'CANDIDATE' | 'ADMIN';
  isVerified: boolean;
  avatar?: string | null;
  googleId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<any>;
  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  // ✅ NOUVEAU
  handleGoogleCallback: (accessToken: string, refreshToken: string) => Promise<void>;
}

// ─── Contexte ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);

  // useNavigate doit être dans un composant enfant du Router.
  // On crée un ref pour navigate qu'on remplacera dans un composant wrapper.
  // Alternative simple : window.location.href pour le logout.

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      if (res.data && !res.data.isVerified) {
        setShowVerifyBanner(true);
      } else {
        setShowVerifyBanner(false);
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setShowVerifyBanner(false);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (
    email: string,
    password: string,
    twoFactorCode?: string,
  ) => {
    const res = await api.post('/auth/login', { email, password, twoFactorCode });
    const data = res.data;

    if (data.requiresTwoFactor) return data;

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);

    if (data.user && !data.user.isVerified) {
      setShowVerifyBanner(true);
    }

    return data;
  }, []);

  const register = useCallback(async (registerData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    referralCode?: string;
  }) => {
    const res = await api.post('/auth/register', registerData);
    const data = res.data;

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);

    if (data.user && !data.user.isVerified) {
      setShowVerifyBanner(true);
    }

    return data;
  }, []);

  // ✅ NOUVEAU : Callback après connexion Google
  const handleGoogleCallback = useCallback(async (
    accessToken: string,
    refreshToken: string,
  ) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // Charger le profil depuis l'API avec le nouveau token
    await fetchProfile();
  }, []);

  // ✅ MODIFIÉ : logout redirige vers la page d'accueil
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignorer les erreurs réseau
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setShowVerifyBanner(false);
      // Redirection vers la page d'accueil après déconnexion
      window.location.href = '/';
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchProfile();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      handleGoogleCallback,
    }}>
      {children}
      {user && !user.isVerified && showVerifyBanner && (
        <EmailVerificationBanner
          onResent={() => {}}
          onDismiss={() => setShowVerifyBanner(false)}
        />
      )}
    </AuthContext.Provider>
  );
}

// ─── Bannière email non vérifié (inchangée) ───────────────────────────────────

function EmailVerificationBanner({
  onResent,
  onDismiss,
}: {
  onResent: () => void;
  onDismiss: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(12);

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(), 12000);
    const interval = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
    }, 1000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [onDismiss]);

  const resend = async () => {
    setSending(true);
    try {
      await api.post('/auth/resend-verification');
      setSent(true);
      setTimeout(() => onDismiss(), 3000);
    } catch { } finally { setSending(false); }
    onResent();
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm shadow-md"
      style={{ fontSize: '13px' }}
    >
      <div className="flex items-center gap-3">
        <span>⚠️ Email non vérifié.</span>
        {sent ? (
          <span className="font-semibold text-amber-100">✅ Email renvoyé !</span>
        ) : (
          <button onClick={resend} disabled={sending}
            className="underline font-semibold hover:text-amber-200 transition disabled:opacity-60"
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
            {sending ? 'Envoi...' : 'Renvoyer le lien'}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-amber-200 text-xs">Ferme dans {countdown}s</span>
        <button onClick={onDismiss} className="text-white hover:text-amber-200 font-bold text-lg leading-none"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Fermer">
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
