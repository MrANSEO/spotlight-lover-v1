import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Power, PowerOff, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AdminMaintenancePage() {
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/settings/maintenance');
      setMaintenance(res.data.maintenance);
      setMessage(res.data.message || '');
    } catch {
      toast.error('Impossible de charger le statut de maintenance.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    const newState = !maintenance;
    setSaving(true);
    try {
      const res = await api.post('/settings/maintenance', {
        enabled: newState,
        message: message || undefined,
      });
      setMaintenance(res.data.maintenance);
      toast.success(
        newState
          ? '🔴 Mode maintenance activé — les utilisateurs voient le message.'
          : '🟢 Mode maintenance désactivé — la plateforme est de nouveau accessible.',
      );
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={32} className="animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🔧 Mode Maintenance</h1>
      <p className="text-gray-500 text-sm mb-8">
        En mode maintenance, toutes les requêtes non-admin retournent une erreur 503.
        Vous restez connecté et pouvez continuer à travailler normalement.
      </p>

      {/* Statut actuel */}
      <div
        className={`rounded-2xl p-6 mb-6 border-2 ${
          maintenance
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          {maintenance ? (
            <AlertTriangle size={24} className="text-red-600" />
          ) : (
            <CheckCircle size={24} className="text-green-600" />
          )}
          <span
            className={`text-lg font-bold ${
              maintenance ? 'text-red-700' : 'text-green-700'
            }`}
          >
            {maintenance
              ? '🔴 Maintenance EN COURS'
              : '🟢 Plateforme ACTIVE'}
          </span>
        </div>
        <p
          className={`text-sm ${
            maintenance ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {maintenance
            ? 'Les visiteurs et utilisateurs voient le message de maintenance.'
            : 'La plateforme est accessible à tous les utilisateurs.'}
        </p>
      </div>

      {/* Message personnalisé */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Message affiché aux utilisateurs
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Ex : Maintenance en cours pour améliorer la plateforme. Retour prévu dans 30 minutes."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition text-sm resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {message.length}/500 caractères
        </p>
      </div>

      {/* Bouton d'action */}
      <button
        onClick={handleToggle}
        disabled={saving}
        className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition shadow-lg disabled:opacity-70 ${
          maintenance
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        {saving ? (
          <Loader size={20} className="animate-spin" />
        ) : maintenance ? (
          <>
            <Power size={20} />
            Désactiver la maintenance
          </>
        ) : (
          <>
            <PowerOff size={20} />
            Activer le mode maintenance
          </>
        )}
      </button>

      {/* Avertissement */}
      {!maintenance && (
        <p className="text-center text-xs text-gray-400 mt-4">
          ⚠️ En activant la maintenance, tous les utilisateurs non-admin seront bloqués immédiatement.
        </p>
      )}
    </div>
  );
}
