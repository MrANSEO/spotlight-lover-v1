import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, CheckCircle, Loader } from 'lucide-react';
import api from '../../services/api';

interface ForgotFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>();

  const onSubmit = async (data: ForgotFormData) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      // Toujours afficher succès (anti-énumération)
      setSent(true);
    } catch {
      // Même en cas d'erreur, on affiche le succès pour la sécurité
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Email envoyé !</h1>
            <p className="text-gray-600 leading-relaxed mb-6">
              Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans les prochaines minutes.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Vérifiez aussi vos spams si vous ne trouvez pas l'email.
            </p>
            <Link
              to="/login"
              className="block w-full py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition text-center"
            >
              Retour à la connexion
            </Link>
          </div>
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
              <Mail size={32} className="text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié ?</h1>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-purple-500 transition">
                <Mail size={18} className="text-gray-400 flex-shrink-0" />
                <input
                  type="email"
                  {...register('email', {
                    required: 'L\'email est obligatoire',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' },
                  })}
                  placeholder="votre@email.com"
                  className="flex-1 outline-none text-gray-900 text-sm"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader size={18} className="animate-spin" /> Envoi en cours...</>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-purple-700 transition"
            >
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
