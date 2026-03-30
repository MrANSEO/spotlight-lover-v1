import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import api from '../../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant.');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (tok: string) => {
    try {
      const response = await api.get(`/auth/verify-email?token=${tok}`);
      if (response.data.alreadyVerified) {
        setStatus('already');
      } else {
        setStatus('success');
      }
      setMessage(response.data.message);
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 'Lien invalide ou expiré. Demandez un nouveau lien.',
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader size={48} className="text-purple-600 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900">Vérification en cours...</h1>
            <p className="text-gray-500 mt-2 text-sm">Veuillez patienter.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Email vérifié ! 🎉</h1>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
            <Link
              to="/feed"
              className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:shadow-lg transition text-center"
            >
              Accéder aux vidéos →
            </Link>
          </>
        )}

        {status === 'already' && (
          <>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Déjà vérifié</h1>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
            <Link
              to="/feed"
              className="block w-full py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition text-center"
            >
              Aller au feed →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Lien invalide</h1>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition text-center"
              >
                Se connecter (pour renvoyer le lien)
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
