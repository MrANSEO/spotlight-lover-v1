// frontend/src/pages/auth/GoogleCallbackPage.tsx — NOUVEAU FICHIER
// À créer dans : frontend/src/pages/auth/GoogleCallbackPage.tsx
//
// Cette page est appelée après que Google redirige vers le frontend.
// Elle extrait les tokens des query params, les stocke, et redirige vers /feed.

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error || !accessToken || !refreshToken) {
      // Erreur ou tokens manquants → retour login
      navigate('/login?error=google_failed', { replace: true });
      return;
    }

    // Stocker les tokens et charger le profil
    handleGoogleCallback(accessToken, refreshToken).then(() => {
      navigate('/feed', { replace: true });
    });
  }, []);

  const hasError = searchParams.get('error');

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Connexion échouée</h1>
          <p className="text-gray-500 mb-4">La connexion avec Google a échoué. Réessayez.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader size={40} className="animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Connexion avec Google en cours...</p>
        <p className="text-gray-400 text-sm mt-2">Vous allez être redirigé automatiquement</p>
      </div>
    </div>
  );
}