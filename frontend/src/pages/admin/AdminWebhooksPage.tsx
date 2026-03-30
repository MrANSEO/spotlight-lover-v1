import { useState, useEffect } from 'react';
import { RefreshCw, Loader, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface WebhookLog {
  id: string;
  provider: string;
  event: string;
  payload: any;
  isValid: boolean;
  isProcessed: boolean;
  processingError: string | null;
  createdAt: string;
}

export default function AdminWebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookLog | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    loadWebhooks();
  }, [filter]);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? `?processed=${filter === 'PROCESSED'}` : '';
      const response = await api.get(`/webhooks/logs${params}`);
      setWebhooks(response.data.data || response.data);
    } catch {
      toast.error('Impossible de charger les webhooks.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECTION : alert() → toast
  const retryWebhook = async (webhookId: string) => {
    if (!window.confirm('Relancer le traitement de ce webhook ?')) return;

    setRetrying(webhookId);
    try {
      await api.post(`/webhooks/${webhookId}/retry`);
      toast.success('✅ Webhook retraité avec succès !');
      loadWebhooks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Échec du retraitement.');
    } finally {
      setRetrying(null);
    }
  };

  const filterButtons = [
    { key: 'ALL',        label: 'Tous' },
    { key: 'PROCESSED',  label: 'Traités' },
    { key: 'PENDING',    label: 'Non traités' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">🔔 Logs Webhooks MeSomb</h1>
        <button
          onClick={loadWebhooks}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: webhooks.length, color: 'text-gray-900' },
          { label: 'Traités', value: webhooks.filter(w => w.isProcessed).length, color: 'text-green-600' },
          { label: 'En attente', value: webhooks.filter(w => !w.isProcessed).length, color: 'text-orange-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-500 font-semibold mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex gap-2">
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
              filter === key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader className="w-7 h-7 animate-spin text-purple-600" />
          </div>
        ) : webhooks.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-sm">Aucun webhook trouvé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date/Heure</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Événement</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {webhooks.map((webhook) => (
                  <tr key={webhook.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {new Date(webhook.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                        {webhook.provider}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-gray-700">{webhook.event}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        webhook.isProcessed
                          ? 'bg-green-100 text-green-700'
                          : webhook.processingError
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {webhook.isProcessed ? '✅ Traité' : webhook.processingError ? '❌ Erreur' : '⏳ En attente'}
                      </span>
                    </td>
                    <td className="px-5 py-4 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedWebhook(webhook)}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition"
                      >
                        Détails
                      </button>
                      {!webhook.isProcessed && (
                        <button
                          onClick={() => retryWebhook(webhook.id)}
                          disabled={retrying === webhook.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-200 transition disabled:opacity-60"
                        >
                          {retrying === webhook.id
                            ? <><Loader size={12} className="animate-spin" /> Relance...</>
                            : '🔄 Relancer'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal détails webhook */}
      {selectedWebhook && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedWebhook(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg">Détails du webhook</h2>
              <button onClick={() => setSelectedWebhook(null)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: 'ID', value: selectedWebhook.id, mono: true },
                { label: 'Provider', value: selectedWebhook.provider },
                { label: 'Événement', value: selectedWebhook.event, mono: true },
                { label: 'Date', value: new Date(selectedWebhook.createdAt).toLocaleString('fr-FR') },
                { label: 'Valide', value: selectedWebhook.isValid ? '✅ Oui' : '❌ Non' },
                { label: 'Traité', value: selectedWebhook.isProcessed ? '✅ Oui' : '❌ Non' },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between items-start py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm font-medium">{label}</span>
                  <span className={`text-gray-900 text-sm font-semibold ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
                </div>
              ))}

              {selectedWebhook.processingError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-700 text-xs font-semibold mb-1">Erreur de traitement</p>
                  <p className="text-red-600 text-xs font-mono">{selectedWebhook.processingError}</p>
                </div>
              )}

              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">Payload</p>
                <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto">
                  {JSON.stringify(selectedWebhook.payload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
