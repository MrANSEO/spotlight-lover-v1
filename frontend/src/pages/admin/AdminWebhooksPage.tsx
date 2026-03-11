import { useState, useEffect } from 'react';
import api from '../../services/api';

interface WebhookLog {
  id: string;
  provider: string;
  event: string;
  payload: any;
  status: string;
  error: string | null;
  receivedAt: string;
}

export default function AdminWebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookLog | null>(null);

  useEffect(() => {
    loadWebhooks();
  }, [filter]);

  const loadWebhooks = async () => {
    try {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const response = await api.get(`/webhooks/logs${params}`);
      setWebhooks(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load webhook logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryWebhook = async (webhookId: string) => {
    if (!confirm('Relancer le traitement de ce webhook ?')) return;

    try {
      await api.post(`/webhooks/${webhookId}/retry`);
      alert('Webhook retraité avec succès !');
      loadWebhooks();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Échec du retraitement');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🔔 Logs des Webhooks</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <span className="font-semibold">Filtrer par statut :</span>
          {['ALL', 'SUCCESS', 'FAILED', 'DUPLICATE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Webhooks table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date/Heure</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Provider</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Event</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {webhooks.map((webhook) => (
              <tr key={webhook.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(webhook.receivedAt).toLocaleString('fr-FR')}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    webhook.provider === 'MESOMB' ? 'bg-yellow-100 text-yellow-700' :
                    webhook.provider === 'STRIPE' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {webhook.provider}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono">{webhook.event}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    webhook.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                    webhook.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {webhook.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => setSelectedWebhook(webhook)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Détails
                  </button>
                  {webhook.status === 'FAILED' && (
                    <button
                      onClick={() => retryWebhook(webhook.id)}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      Relancer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {webhooks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun webhook enregistré.
          </div>
        )}
      </div>

      {/* Webhook Details Modal */}
      {selectedWebhook && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedWebhook(null)}
        >
          <div 
            className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Détails du Webhook</h2>
              <button 
                onClick={() => setSelectedWebhook(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">ID</label>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedWebhook.id}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Date/Heure</label>
                <p className="text-sm">{new Date(selectedWebhook.receivedAt).toLocaleString('fr-FR')}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Provider</label>
                <p className="text-sm">{selectedWebhook.provider}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Event</label>
                <p className="text-sm font-mono">{selectedWebhook.event}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Statut</label>
                <p className="text-sm">{selectedWebhook.status}</p>
              </div>

              {selectedWebhook.error && (
                <div>
                  <label className="text-sm font-semibold text-red-600">Erreur</label>
                  <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
                    {selectedWebhook.error}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-600">Payload</label>
                <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
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
