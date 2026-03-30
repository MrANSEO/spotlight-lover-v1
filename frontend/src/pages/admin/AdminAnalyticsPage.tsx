import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { Download, TrendingUp, Heart, Users, Loader, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface RevenueDay {
  date: string;
  totalRevenue: number;
  totalVotes: number;
  newUsers: number;
  newCandidates: number;
}

interface CandidateVoteStat {
  id: string;
  stageName: string;
  totalVotes: number;
}

interface PaymentStats {
  transactions: {
    total: number;
    completed: number;
    failed: number;
  };
  revenue: {
    total: number;
  };
  successRate: number;
}

export default function AdminAnalyticsPage() {
  const [revenueData, setRevenueData] = useState<RevenueDay[]>([]);
  const [voteData, setVoteData] = useState<CandidateVoteStat[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [dashStats, setDashStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    loadAll();
  }, [period]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rev, votes, payments, dash] = await Promise.all([
        api.get(`/analytics/revenue?days=${period}`),
        api.get('/analytics/votes?limit=10'),
        api.get('/analytics/payments'),
        api.get('/analytics/dashboard'),
      ]);
      setRevenueData(rev.data || []);
      setVoteData(votes.data || []);
      setPaymentStats(payments.data);
      setDashStats(dash.data);
    } catch {
      toast.error('Impossible de charger les analytics.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Export CSV ──────────────────────────────────────────────────────────

  const exportCSV = async (type: string) => {
    setExporting(type);
    try {
      const res = await api.get(`/analytics/export?type=${type}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Export "${type}" téléchargé !`);
    } catch {
      toast.error('Échec de l\'export.');
    } finally {
      setExporting(null);
    }
  };

  // ─── Formatter date pour les graphes ────────────────────────────────────

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

  const formatFCFA = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const successRate = paymentStats
    ? Math.round((paymentStats.transactions.completed / Math.max(paymentStats.transactions.total, 1)) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">📊 Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  period === d ? 'bg-white shadow text-purple-700' : 'text-gray-600'
                }`}
              >
                {d}j
              </button>
            ))}
          </div>
          <button
            onClick={loadAll}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      {/* ─── KPI résumé ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Revenu total',
            value: `${(dashStats?.revenue?.total || 0).toLocaleString('fr-FR')} FCFA`,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Votes confirmés',
            value: (dashStats?.votes?.completed || 0).toLocaleString(),
            icon: Heart,
            color: 'text-pink-600',
            bg: 'bg-pink-50',
          },
          {
            label: 'Taux de succès paiements',
            value: `${successRate}%`,
            icon: TrendingUp,
            color: successRate >= 70 ? 'text-green-600' : 'text-orange-600',
            bg: successRate >= 70 ? 'bg-green-50' : 'bg-orange-50',
          },
          {
            label: 'Utilisateurs total',
            value: (dashStats?.users?.total || 0).toLocaleString(),
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs font-semibold">{label}</p>
              <Icon size={16} className={color} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ─── Graphe revenus par jour ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-5">💰 Revenus des {period} derniers jours (FCFA)</h2>
        {revenueData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Aucune donnée disponible.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData.map((d) => ({ ...d, date: formatDate(d.date) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatFCFA} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [`${v.toLocaleString('fr-FR')} FCFA`, 'Revenus']}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                name="Revenus (FCFA)"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ─── Graphe votes par jour ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-5">❤️ Votes confirmés par jour</h2>
        {revenueData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Aucune donnée disponible.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData.map((d) => ({ ...d, date: formatDate(d.date) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [v, 'Votes']} />
              <Bar dataKey="totalVotes" name="Votes" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ─── Top candidats ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-5">🏆 Top candidats par votes</h2>
        {voteData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Aucun vote enregistré.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={voteData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="stageName"
                type="category"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(v: number) => [v, 'Votes']} />
              <Bar dataKey="totalVotes" name="Votes" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ─── Stats paiements ─────────────────────────────────────────────── */}
      {paymentStats && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">💳 Statistiques paiements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total transactions', value: paymentStats.transactions.total, color: 'text-gray-900' },
              { label: 'Confirmées', value: paymentStats.transactions.completed, color: 'text-green-600' },
              { label: 'Échouées', value: paymentStats.transactions.failed, color: 'text-red-600' },
              { label: 'Taux succès', value: `${successRate}%`, color: successRate >= 70 ? 'text-green-600' : 'text-orange-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 font-semibold mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Barre de progression taux succès */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Taux de confirmation des paiements</span>
              <span>{successRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  successRate >= 70 ? 'bg-green-500' : successRate >= 50 ? 'bg-orange-400' : 'bg-red-500'
                }`}
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Export CSV ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Download size={16} /> Exports CSV
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { type: 'users',        label: 'Utilisateurs',  icon: '👥' },
            { type: 'candidates',   label: 'Candidats',     icon: '🎬' },
            { type: 'votes',        label: 'Votes',         icon: '❤️' },
            { type: 'transactions', label: 'Transactions',  icon: '💳' },
          ].map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => exportCSV(type)}
              disabled={!!exporting}
              className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
            >
              {exporting === type
                ? <Loader size={14} className="animate-spin" />
                : <Download size={14} />}
              {icon} {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Les fichiers CSV sont générés en temps réel depuis la base de données.
        </p>
      </div>

    </div>
  );
}
