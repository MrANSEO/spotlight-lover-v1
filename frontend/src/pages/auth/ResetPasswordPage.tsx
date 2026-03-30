import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import api from '../../services/api';

interface ResetFormData {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>();

  const password = watch('newPassword');

  // Évaluation de la force du mot de passe
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[@$!%*?&#]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Faible', color: 'bg-red-400' };
    if (score === 3) return { score, label: 'Moyen', color: 'bg-orange-400' };
    if (score === 4) return { score, label: 'Bon', color: 'bg-yellow-400' };
    return { score, label: 'Excellent', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(password || '');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertTriangle size={48} className="text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-600 text-sm mb-6">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <Link
            to="/forgot-password"
            className="block w-full py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition text-center"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetFormData) => {
    setError(null);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Lien expiré ou invalide. Demandez un nouveau lien.',
      );
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Mot de passe modifié !</h1>
          <p className="text-gray-600 text-sm mb-6">
            Vous allez être redirigé vers la page de connexion dans quelques secondes...
          </p>
          <Link
            to="/login"
            className="block w-full py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition text-center"
          >
            Se connecter maintenant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Choisissez un mot de passe sécurisé pour votre compte.
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-purple-500 transition">
                <Lock size={18} className="text-gray-400 flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('newPassword', {
                    required: 'Mot de passe requis',
                    minLength: { value: 8, message: 'Minimum 8 caractères' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
                      message: 'Doit contenir majuscule, minuscule, chiffre et symbole (@$!%*?&#)',
                    },
                  })}
                  placeholder="Min. 8 caractères"
                  className="flex-1 outline-none text-gray-900 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1.5">{errors.newPassword.message}</p>
              )}

              {/* Jauge de force */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          i <= strength.score ? strength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Force : <span className="font-semibold">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-purple-500 transition">
                <Lock size={18} className="text-gray-400 flex-shrink-0" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Confirmation requise',
                    validate: (v) => v === password || 'Les mots de passe ne correspondent pas',
                  })}
                  placeholder="Répétez le mot de passe"
                  className="flex-1 outline-none text-gray-900 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader size={18} className="animate-spin" /> Enregistrement...</>
              ) : (
                '🔑 Enregistrer le nouveau mot de passe'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
