import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Star, Phone, CheckCircle, Loader, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Step1Data {
  stageName: string;
  bio: string;
}

interface Step2Data {
  phone: string;
  operator: 'MTN' | 'ORANGE';
}

type Step = 'info' | 'payment' | 'polling' | 'success';

export default function BecomeCandidatePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>('info');
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const step1Form = useForm<Step1Data>();
  const step2Form = useForm<Step2Data>({ defaultValues: { operator: 'MTN' } });

  // ─── Étape 1 : Créer le profil candidat ────────────────────────────────

  const onSubmitStep1 = async (data: Step1Data) => {
    if (!user) {
      toast.error('Vous devez être connecté.');
      navigate('/login');
      return;
    }

    try {
      const res = await api.post('/candidates', {
        stageName: data.stageName,
        bio: data.bio,
        paymentProvider: 'MESOMB',
      });
      setCandidateId(res.data.candidateId);
      setStep('payment');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du profil.');
    }
  };

  // ─── Étape 2 : Initier le paiement d'inscription ───────────────────────

  const onSubmitStep2 = async (data: Step2Data) => {
    try {
      const res = await api.post('/payments/candidate-registration', {
        candidateId,
        phone: data.phone,
        operator: data.operator,
      });

      if (res.data.status === 'COMPLETED') {
        await refreshUser();
        setStep('success');
        return;
      }

      setTransactionId(res.data.transactionId);
      setStep('polling');
      startPolling(res.data.transactionId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du paiement.');
    }
  };

  // ─── Polling statut paiement ────────────────────────────────────────────

  const startPolling = (txId: string) => {
    let count = 0;
    const interval = setInterval(async () => {
      count++;
      setPollCount(count);
      try {
        const res = await api.get(`/payments/status/${txId}`);
        if (res.data.status === 'COMPLETED') {
          clearInterval(interval);
          await refreshUser();
          setStep('success');
        } else if (res.data.status === 'FAILED') {
          clearInterval(interval);
          toast.error('Paiement échoué. Réessayez.');
          setStep('payment');
        } else if (count >= 20) {
          clearInterval(interval);
          toast.error('Délai dépassé. Vérifiez votre téléphone et réessayez.');
          setStep('payment');
        }
      } catch { /* continuer */ }
    }, 3000);
  };

  // ─── Rendu selon l'étape ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Devenir candidat</h1>
          <p className="text-gray-500 mt-1 text-sm">Inscription payante — 500 FCFA via Mobile Money</p>
        </div>

        {/* Indicateur d'étapes */}
        {(step === 'info' || step === 'payment') && (
          <div className="flex items-center gap-2 mb-6">
            {['Profil', 'Paiement'].map((label, i) => {
              const active = (i === 0 && step === 'info') || (i === 1 && step === 'payment');
              const done = (i === 0 && step === 'payment');
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    done ? 'bg-green-500 text-white' :
                    active ? 'bg-purple-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm font-semibold ${active ? 'text-purple-700' : done ? 'text-green-700' : 'text-gray-400'}`}>
                    {label}
                  </span>
                  {i < 1 && <div className="flex-1 h-0.5 bg-gray-200 mx-1" />}
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl p-6">

          {/* ─── Étape 1 : Infos profil ─────────────────────────────────── */}
          {step === 'info' && (
            <form onSubmit={step1Form.handleSubmit(onSubmitStep1)} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de scène *
                </label>
                <input
                  {...step1Form.register('stageName', {
                    required: 'Le nom de scène est obligatoire',
                    minLength: { value: 2, message: 'Minimum 2 caractères' },
                    maxLength: { value: 50, message: 'Maximum 50 caractères' },
                  })}
                  placeholder="Le nom que vous utiliserez dans le concours"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition text-sm"
                />
                {step1Form.formState.errors.stageName && (
                  <p className="text-red-500 text-xs mt-1.5">{step1Form.formState.errors.stageName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Biographie
                </label>
                <textarea
                  {...step1Form.register('bio', {
                    maxLength: { value: 500, message: 'Maximum 500 caractères' },
                  })}
                  rows={3}
                  placeholder="Présentez-vous en quelques mots..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition text-sm resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <AlertCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Ce qui vous attend :</p>
                  <ul className="space-y-0.5 text-blue-600">
                    <li>• Paiement de 500 FCFA via Mobile Money</li>
                    <li>• Upload d'une vidéo (60–90 secondes max)</li>
                    <li>• Votre vidéo visible par tous les votants</li>
                    <li>• Gain possible : jusqu'à 50 000 FCFA</li>
                  </ul>
                </div>
              </div>

              <button
                type="submit"
                disabled={step1Form.formState.isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {step1Form.formState.isSubmitting
                  ? <><Loader size={18} className="animate-spin" /> Création du profil...</>
                  : 'Continuer vers le paiement →'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Vous avez déjà un compte candidat ?{' '}
                <Link to="/candidate/dashboard" className="text-purple-600 font-semibold hover:underline">
                  Mon tableau de bord
                </Link>
              </p>
            </form>
          )}

          {/* ─── Étape 2 : Paiement ─────────────────────────────────────── */}
          {step === 'payment' && (
            <form onSubmit={step2Form.handleSubmit(onSubmitStep2)} className="space-y-5">
              <div className="bg-purple-50 rounded-2xl p-4 text-center mb-2">
                <p className="text-3xl font-bold text-purple-700">500 FCFA</p>
                <p className="text-sm text-purple-500 mt-1">Frais d'inscription — paiement unique</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opérateur Mobile Money
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['MTN', 'ORANGE'] as const).map((op) => (
                    <label
                      key={op}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm cursor-pointer transition ${
                        step2Form.watch('operator') === op
                          ? op === 'MTN'
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-800'
                            : 'border-orange-500 bg-orange-50 text-orange-800'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={op}
                        {...step2Form.register('operator')}
                        className="hidden"
                      />
                      {op === 'MTN' ? '🟡 MTN Money' : '🟠 Orange Money'}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Numéro Mobile Money
                </label>
                <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-purple-500 transition">
                  <Phone size={18} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 text-sm font-mono">+237</span>
                  <input
                    type="tel"
                    {...step2Form.register('phone', {
                      required: 'Numéro requis',
                      validate: (v) =>
                        v.replace(/\D/g, '').length >= 9 || 'Numéro invalide (9 chiffres min)',
                    })}
                    placeholder="6XX XXX XXX"
                    className="flex-1 outline-none text-gray-900 font-mono text-sm"
                    maxLength={12}
                  />
                </div>
                {step2Form.formState.errors.phone && (
                  <p className="text-red-500 text-xs mt-1.5">{step2Form.formState.errors.phone.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={step2Form.formState.isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {step2Form.formState.isSubmitting
                  ? <><Loader size={18} className="animate-spin" /> Initiation du paiement...</>
                  : 'Payer 500 FCFA et devenir candidat 🎬'}
              </button>

              <button
                type="button"
                onClick={() => setStep('info')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
              >
                ← Retour
              </button>
            </form>
          )}

          {/* ─── Étape 3 : Polling ──────────────────────────────────────── */}
          {step === 'polling' && (
            <div className="text-center py-8 space-y-5">
              <div className="relative mx-auto w-20 h-20">
                <div className="w-20 h-20 border-4 border-purple-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <Phone size={28} className="absolute inset-0 m-auto text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Confirmez sur votre téléphone</h3>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                  Vous avez reçu une notification Mobile Money.<br />
                  Acceptez le paiement de <strong className="text-purple-700">500 FCFA</strong> pour activer votre compte.
                </p>
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
                <span className="ml-2">Vérification en cours ({pollCount}/20)</span>
              </div>
            </div>
          )}

          {/* ─── Étape 4 : Succès ───────────────────────────────────────── */}
          {step === 'success' && (
            <div className="text-center py-8 space-y-5">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={44} className="text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-2xl">Bienvenue dans le concours ! 🎉</h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  Votre compte candidat est actif.<br />
                  Uploadez maintenant votre vidéo depuis votre tableau de bord.
                </p>
              </div>
              <button
                onClick={() => navigate('/candidate/dashboard')}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition"
              >
                Accéder à mon tableau de bord →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}