import { useState, useEffect } from 'react';
import api from '../../services/api';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string | null;
  metadata: any;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    email: string;
    role: string;
  };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    action: 'ALL',
    entity: 'ALL',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.action !== 'ALL') params.append('action', filter.action);
      if (filter.entity !== 'ALL') params.append('entity', filter.entity);

      const response = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
    if (action.includes('APPROVE')) return 'bg-purple-100 text-purple-700';
    if (action.includes('REJECT')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return '➕';
    if (action.includes('UPDATE')) return '✏️';
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('APPROVE')) return '✅';
    if (action.includes('REJECT')) return '❌';
    if (action.includes('LOGIN')) return '🔑';
    return '📝';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Chargement des logs...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">📋 Audit Logs</h1>
        <button
          onClick={loadLogs}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Action</label>
            <select
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">Toutes les actions</option>
              <option value="USER_CREATE">Création utilisateur</option>
              <option value="USER_UPDATE">Modification utilisateur</option>
              <option value="USER_DELETE">Suppression utilisateur</option>
              <option value="CANDIDATE_APPROVE">Approbation candidat</option>
              <option value="CANDIDATE_REJECT">Rejet candidat</option>
              <option value="VOTE_REFUND">Remboursement vote</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Entité</label>
            <select
              value={filter.entity}
              onChange={(e) => setFilter({ ...filter, entity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">Toutes les entités</option>
              <option value="USER">Users</option>
              <option value="CANDIDATE">Candidats</option>
              <option value="VOTE">Votes</option>
              <option value="TRANSACTION">Transactions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Actions</h3>
          <p className="text-3xl font-bold text-purple-600">{logs.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Créations</h3>
          <p className="text-3xl font-bold text-green-600">
            {logs.filter(l => l.action.includes('CREATE')).length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Modifications</h3>
          <p className="text-3xl font-bold text-blue-600">
            {logs.filter(l => l.action.includes('UPDATE')).length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Suppressions</h3>
          <p className="text-3xl font-bold text-red-600">
            {logs.filter(l => l.action.includes('DELETE')).length}
          </p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date/Heure</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Entité</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Utilisateur</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">IP</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(log.createdAt).toLocaleString('fr-FR')}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)} {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-700">
                  {log.entity}
                </td>
                <td className="px-6 py-4 text-sm">
                  {log.user ? (
                    <div>
                      <p className="font-semibold">{log.user.email}</p>
                      <p className="text-xs text-gray-500">{log.user.role}</p>
                    </div>
                  ) : (
                    <span className="text-gray-400">System</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-600">
                  {log.ipAddress || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    👁️ Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun log trouvé avec les filtres actuels.
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Détails du Log</h2>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">ID</label>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedLog.id}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Date/Heure</label>
                <p className="text-sm">{new Date(selectedLog.createdAt).toLocaleString('fr-FR')}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Action</label>
                <p className="text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Entité</label>
                <p className="text-sm">{selectedLog.entity} (ID: {selectedLog.entityId})</p>
              </div>

              {selectedLog.user && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Utilisateur</label>
                  <p className="text-sm">{selectedLog.user.email} ({selectedLog.user.role})</p>
                </div>
              )}

              {selectedLog.ipAddress && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Adresse IP</label>
                  <p className="text-sm font-mono">{selectedLog.ipAddress}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-600">Métadonnées</label>
                <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
