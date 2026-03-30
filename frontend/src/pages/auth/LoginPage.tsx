import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
  twoFactorCode?: string;
}

// ─── Bouton Google ────────────────────────────────────────────────────────────

function GoogleButton() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  return (
    <a
      href={`${apiUrl}/auth/google`}
      className="flex items-center justify-center gap-3 w-full py-3 border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition text-sm"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
        <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
      </svg>
      Continuer avec Google
    </a>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      const result = await login(data.email, data.password, data.twoFactorCode);

      if (result?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        return;
      }

      if (result?.user?.role === 'ADMIN') navigate('/admin');
      else if (result?.user?.role === 'CANDIDATE') navigate('/candidate/dashboard');
      else navigate('/feed');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Email ou mot de passe incorrect.',
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
              🎬 SpotLightLover
            </h1>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Connectez-vous à votre compte</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">

          {/* ✅ NOUVEAU : Bouton Google EN PREMIER */}
          <GoogleButton />

          {/* Séparateur */}
          <div className="relative flex items-center justify-center my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-4 text-sm text-gray-400">ou</span>
          </div>

          {/* Formulaire email/mot de passe */}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email requis',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' },
                })}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition text-sm"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Mot de passe</label>
                <Link to="/forgot-password" className="text-xs text-purple-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-purple-500 transition">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Mot de passe requis' })}
                  placeholder="Votre mot de passe"
                  className="flex-1 outline-none text-gray-900 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Champ 2FA si requis */}
            {requiresTwoFactor && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Code 2FA</label>
                <input
                  type="text"
                  maxLength={6}
                  {...register('twoFactorCode', {
                    required: 'Code 2FA requis',
                    minLength: { value: 6, message: '6 chiffres requis' },
                  })}
                  placeholder="123456"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition text-sm tracking-widest text-center"
                />
                {errors.twoFactorCode && <p className="text-red-500 text-xs mt-1">{errors.twoFactorCode.message}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader size={18} className="animate-spin" /> Connexion...</>
              ) : (
                'Se connecter'
              )}
            </button>

            <p className="text-center text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-purple-700 font-semibold hover:underline">
                S'inscrire gratuitement
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}