import { useState, useEffect } from 'react';
import api from '../../services/api';

interface AnalyticsData {
  revenue: {
    registrations: number;
    votes: number;
    total: number;
    byDay: { date: string; amount: number }[];
  };
  candidates: {
    total: number;
    byStatus: { status: string; count: number }[];
  };
  votes: {
    total: number;
    byCandidate: { candidateName: string; count: number; amount: number }[];
  };
  users: {
    total: number;
    growth: { date: string; count: number }[];
  };
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportType, setExportType] = useState<string>('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [revenue, votes, candidates, users] = await Promise.all([
        api.get('/analytics/revenue'),
        api.get('/analytics/votes'),
        api.get('/analytics/candidates'),
        api.get('/analytics/users/growth'),
      ]);

      setAnalytics({
        revenue: revenue.data,
        candidates: candidates.data,
        votes: votes.data,
        users: users.data,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    setExportType(type);
    try {
      const response = await api.get(`/analytics/export?type=${type}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-export-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert(`Export ${type} réussi !`);
    } catch (error) {
      alert('Échec de l\'export');
    } finally {
      setExportType('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Chargement des analytics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">📊 Analytics & Statistiques</h1>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Revenue Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">💰 Revenus</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-semibold opacity-90 mb-2">Inscriptions Candidats</h3>
            <p className="text-4xl font-bold">
              {analytics?.revenue?.registrations?.toLocaleString() || 0}
            </p>
            <p className="text-sm opacity-90 mt-2">FCFA</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-semibold opacity-90 mb-2">Votes</h3>
            <p className="text-4xl font-bold">
              {analytics?.revenue?.votes?.toLocaleString() || 0}
            </p>
            <p className="text-sm opacity-90 mt-2">FCFA</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-semibold opacity-90 mb-2">Total</h3>
            <p className="text-4xl font-bold">
              {analytics?.revenue?.total?.toLocaleString() || 0}
            </p>
            <p className="text-sm opacity-90 mt-2">FCFA</p>
          </div>
        </div>
      </div>

      {/* Top Candidates by Votes */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">🏆 Top Candidats (Votes)</h2>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Rang</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Candidat</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Votes</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Montant Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {analytics?.votes?.byCandidate?.slice(0, 10).map((candidate, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">{candidate.candidateName}</td>
                  <td className="px-6 py-4 text-purple-600 font-bold">{candidate.count}</td>
                  <td className="px-6 py-4 text-green-600 font-bold">
                    {candidate.amount?.toLocaleString() || 0} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidates by Status */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">🎬 Candidats par Statut</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {analytics?.candidates?.byStatus?.map((stat) => (
            <div key={stat.status} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">{stat.status}</h3>
              <p className="text-4xl font-bold text-purple-600">{stat.count}</p>
              <p className="text-sm text-gray-500 mt-2">
                {((stat.count / (analytics?.candidates?.total || 1)) * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">📥 Export Données</h2>
        <p className="text-gray-600 mb-6">
          Exportez les données en format CSV pour analyse externe (Excel, Google Sheets, etc.)
        </p>
        
        <div className="grid md:grid-cols-4 gap-4">
          <button
            onClick={() => exportData('users')}
            disabled={exportType === 'users'}
            className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {exportType === 'users' ? '⏳ Export...' : '👥 Users CSV'}
          </button>

          <button
            onClick={() => exportData('candidates')}
            disabled={exportType === 'candidates'}
            className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {exportType === 'candidates' ? '⏳ Export...' : '🎬 Candidats CSV'}
          </button>

          <button
            onClick={() => exportData('votes')}
            disabled={exportType === 'votes'}
            className="px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
          >
            {exportType === 'votes' ? '⏳ Export...' : '❤️ Votes CSV'}
          </button>

          <button
            onClick={() => exportData('transactions')}
            disabled={exportType === 'transactions'}
            className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            {exportType === 'transactions' ? '⏳ Export...' : '💳 Transactions CSV'}
          </button>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">📈 Revenus par Jour (30 derniers jours)</h2>
        <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
          <p className="mb-2">📊 Graphique interactif</p>
          <p className="text-sm">
            Pour ajouter un graphique interactif, installez Chart.js ou Recharts :
          </p>
          <code className="text-xs bg-gray-200 px-2 py-1 rounded mt-2 inline-block">
            npm install react-chartjs-2 chart.js
          </code>
        </div>
      </div>
    </div>
  );
}
