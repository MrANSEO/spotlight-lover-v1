// ═══════════════════════════════════════════════════════════════════════════════
// api.ts — SpotLightLover
//
// CORRECTION APPLIQUÉE :
//   ✅ Ajout du header 'ngrok-skip-browser-warning': 'true'
//      Sans ce header, ngrok renvoie une page HTML d'avertissement au lieu
//      du JSON → toute l'app plante avec des erreurs de parsing JSON.
// ═══════════════════════════════════════════════════════════════════════════════

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // ✅ CORRECTION NGROK : empêche la page d'avertissement ngrok d'intercepter les requêtes API
    // Ce header est ignoré par un vrai serveur de production, il est 100% safe de le laisser
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: 30000,
});

// ─── Attacher le JWT à chaque requête ────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auto-refresh token sur 401 ──────────────────────────────────────────────

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Éviter les boucles infinies sur /auth/login et /auth/refresh
    if (
      original.url?.includes('/auth/login') ||
      original.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(
        `${API_URL}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        },
      );

      const { accessToken, refreshToken: newRefreshToken } = res.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      original.headers.Authorization = `Bearer ${accessToken}`;

      onTokenRefreshed(accessToken);
      isRefreshing = false;

      return api(original);
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers = [];

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';

      return Promise.reject(refreshError);
    }
  },
);

export default api;