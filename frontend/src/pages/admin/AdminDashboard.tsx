import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersStats, candidatesStats, paymentsStats] = await Promise.all([
        api.get('/users/stats'),
        api.get('/candidates/stats'),
        api.get('/payments/stats'),
      ]);

      setStats({
        users: usersStats.data,
        candidates: candidatesStats.data,
        payments: paymentsStats.data,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🛡️ Tableau de Bord Admin</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Utilisateurs</h3>
          <p className="text-4xl font-bold text-purple-600">{stats?.users?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.users?.active || 0} actifs
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Candidats</h3>
          <p className="text-4xl font-bold text-green-600">{stats?.candidates?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.candidates?.active || 0} actifs
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Revenus</h3>
          <p className="text-4xl font-bold text-yellow-600">
            {stats?.payments?.revenue?.registrations?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">FCFA</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Actions Administrateur</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            👥 Gérer les utilisateurs
          </button>
          <button className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            🎬 Modérer les candidats
          </button>
          <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            ❤️ Gérer les votes
          </button>
          <button className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
            📊 Statistiques détaillées
          </button>
        </div>
      </div>
    </div>
  );
}
