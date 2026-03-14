import { useState, useEffect } from 'react';
import api from '../../services/api';

interface Vote {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    email: string;
  };
  candidate: {
    stageName: string;
  };
  transaction?: {
    transactionId: string;
    provider: string;
  };
}

export default function AdminVotesPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [refunding, setRefunding] = useState<string | null>(null);

  useEffect(() => {
    loadVotes();
  }, [filter]);

  const loadVotes = async () => {
    try {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const response = await api.get(`/votes${params}`);
      setVotes(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (voteId: string) => {
    if (!confirm('Rembourser ce vote ? Cette action est irréversible.')) return;

    setRefunding(voteId);
    try {
      await api.post(`/votes/${voteId}/refund`);
      alert('Vote remboursé avec succès !');
      loadVotes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Échec du remboursement');
    } finally {
      setRefunding(null);
    }
  };

  const exportVotes = async () => {
    try {
      const response = await api.get('/analytics/export?type=votes', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `votes-export-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Échec de l\'export');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">❤️ Gestion des Votes</h1>
        <button
          onClick={exportVotes}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <span className="font-semibold">Filtrer par statut :</span>
          {['ALL', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'].map((status) => (
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

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Votes</h3>
          <p className="text-3xl font-bold text-purple-600">{votes.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Confirmés</h3>
          <p className="text-3xl font-bold text-green-600">
            {votes.filter(v => v.status === 'COMPLETED').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">En attente</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {votes.filter(v => v.status === 'PENDING').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Montant Total</h3>
          <p className="text-3xl font-bold text-blue-600">
            {votes.reduce((sum, v) => sum + v.amount, 0).toLocaleString()} FCFA
          </p>
        </div>
      </div>

      {/* Votes Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Utilisateur</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Candidat</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Montant</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Provider</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {votes.map((vote) => (
              <tr key={vote.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(vote.createdAt).toLocaleString('fr-FR')}
                </td>
                <td className="px-6 py-4 text-sm">{vote.user.email}</td>
                <td className="px-6 py-4 text-sm font-semibold">{vote.candidate.stageName}</td>
                <td className="px-6 py-4 text-sm font-bold text-purple-600">
                  {vote.amount} FCFA
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    vote.transaction?.provider === 'MESOMB' 
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {vote.transaction?.provider || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    vote.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    vote.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    vote.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {vote.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  {vote.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleRefund(vote.id)}
                      disabled={refunding === vote.id}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      {refunding === vote.id ? 'En cours...' : '💸 Rembourser'}
                    </button>
                  )}
                  {vote.transaction?.transactionId && (
                    <span className="text-xs text-gray-500 font-mono">
                      {vote.transaction.transactionId.slice(0, 8)}...
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {votes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun vote trouvé.
          </div>
        )}
      </div>
    </div>
  );
}
