import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    byRole: { role: string; count: number }[];
  };
  candidates: {
    total: number;
    active: number;
    pending: number;
    rejected: number;
  };
  votes: {
    total: number;
    today: number;
    totalAmount: number;
  };
  payments: {
    revenue: {
      registrations: number;
      votes: number;
      total: number;
    };
    successRate: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">🛡️ Tableau de Bord Admin</h1>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600">Utilisateurs</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-4xl font-bold text-purple-600">{stats?.users?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.users?.active || 0} actifs
          </p>
          <Link 
            to="/admin/users"
            className="text-xs text-purple-600 hover:underline mt-2 inline-block"
          >
            Gérer →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600">Candidats</h3>
            <span className="text-2xl">🎬</span>
          </div>
          <p className="text-4xl font-bold text-green-600">{stats?.candidates?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.candidates?.pending || 0} en attente
          </p>
          <Link 
            to="/admin/candidates"
            className="text-xs text-green-600 hover:underline mt-2 inline-block"
          >
            Modérer →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600">Votes</h3>
            <span className="text-2xl">❤️</span>
          </div>
          <p className="text-4xl font-bold text-red-600">{stats?.votes?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.votes?.today || 0} aujourd'hui
          </p>
          <Link 
            to="/admin/votes"
            className="text-xs text-red-600 hover:underline mt-2 inline-block"
          >
            Gérer →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600">Revenus</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-4xl font-bold text-yellow-600">
            {(stats?.payments?.revenue?.total || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">FCFA</p>
          <Link 
            to="/admin/analytics"
            className="text-xs text-yellow-600 hover:underline mt-2 inline-block"
          >
            Détails →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to="/admin/users"
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">👥 Utilisateurs</h3>
            <span className="text-3xl opacity-50">→</span>
          </div>
          <p className="text-sm opacity-90">
            Gérer les comptes, activer/désactiver, supprimer
          </p>
        </Link>

        <Link
          to="/admin/candidates"
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">🎬 Candidats</h3>
            <span className="text-3xl opacity-50">→</span>
          </div>
          <p className="text-sm opacity-90">
            Approuver, rejeter, suspendre les candidatures
          </p>
        </Link>

        <Link
          to="/admin/votes"
          className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">❤️ Votes</h3>
            <span className="text-3xl opacity-50">→</span>
          </div>
          <p className="text-sm opacity-90">
            Voir les votes, rembourser, détecter fraude
          </p>
        </Link>

        <Link
          to="/admin/webhooks"
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">🔔 Webhooks</h3>
            <span className="text-3xl opacity-50">→</span>
          </div>
          <p className="text-sm opacity-90">
            Logs paiements, relancer webhooks failed
          </p>
        </Link>

        <Link
          to="/admin/analytics"
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">📊 Analytics</h3>
            <span className="text-3xl opacity-50">→</span>
          </div>
          <p className="text-sm opacity-90">
            Statistiques détaillées, export CSV
          </p>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="bg-gradient-to-br from-gray-500 to-gray-600 text-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">📋 Audit Logs</h3>
            <span className="text-3xl opacity-50">→</span>
          </div>
          <p className="text-sm opacity-90">
            Historique des actions administrateur
          </p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">📈 Activité Récente</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border-l-4 border-purple-600 pl-4">
            <p className="text-sm text-gray-600">Nouveaux utilisateurs (7j)</p>
            <p className="text-2xl font-bold text-purple-600">
              {stats?.users?.active || 0}
            </p>
          </div>
          <div className="border-l-4 border-green-600 pl-4">
            <p className="text-sm text-gray-600">Candidats en attente</p>
            <p className="text-2xl font-bold text-green-600">
              {stats?.candidates?.pending || 0}
            </p>
          </div>
          <div className="border-l-4 border-red-600 pl-4">
            <p className="text-sm text-gray-600">Votes aujourd'hui</p>
            <p className="text-2xl font-bold text-red-600">
              {stats?.votes?.today || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
