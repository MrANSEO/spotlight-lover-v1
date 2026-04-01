import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Trophy, Heart, TrendingUp, Download,
  RefreshCw, Play, Square, Star, AlertTriangle, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DashboardStats {
  users: { total: number; active: number };
  candidates: { total: number; active: number; pending: number };
  votes: { total: number; completed: number };
  revenue: { votes: number; registrations: number; total: number; currency: string };
}

interface ContestInfo {
  id: string;
  title: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  prizeAmount: number | null;
}

interface LeaderEntry {
  rank: number;
  stageName: string;
  thumbnailUrl?: string;
  totalVotes: number;
  //totalAmount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [contest, setContest] = useState<ContestInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, contestRes, leaderRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/contest').catch(() => ({ data: null })),
        api.get('/leaderboard?limit=5').catch(() => ({ data: { entries: [] } })),
      ]);
      setStats(statsRes.data);
      setContest(contestRes.data);
      setLeaderboard(leaderRes.data.entries || []);
    } catch {
      toast.error('Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Export CSV ──────────────────────────────────────────────────────────

  const exportCSV = async (type: 'users' | 'candidates' | 'votes' | 'transactions') => {
    setExporting(type);
    try {
      const response = await api.get(`/analytics/export?type=${type}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `spotlightlover-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Export ${type} téléchargé !`);
    } catch {
      toast.error('Échec de l\'export CSV.');
    } finally {
      setExporting(null);
    }
  };

  // ─── Changer statut concours ─────────────────────────────────────────────

  const changeContestStatus = async (status: string) => {
    if (!contest) return;
    if (!window.confirm(`Passer le concours en statut "${status}" ?`)) return;
    try {
      await api.patch(`/contest/${contest.id}/status`, { status });
      toast.success('Statut mis à jour !');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Chiffre d\'affaires',
      value: `${(stats?.revenue.total || 0).toLocaleString('fr-FR')} FCFA`,
      sub: `Votes: ${(stats?.revenue.votes || 0).toLocaleString()} • Inscriptions: ${(stats?.revenue.registrations || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      link: '/admin/analytics',
    },
    {
      label: 'Votes confirmés',
      value: (stats?.votes.completed || 0).toLocaleString('fr-FR'),
      sub: `${stats?.votes.total || 0} total (dont en attente)`,
      icon: Heart,
      color: 'from-pink-500 to-rose-600',
      link: '/admin/votes',
    },
    {
      label: 'Candidats actifs',
      value: stats?.candidates.active || 0,
      sub: `${stats?.candidates.pending || 0} en attente de validation`,
      icon: Star,
      color: 'from-purple-500 to-violet-600',
      link: '/admin/candidates',
    },
    {
      label: 'Utilisateurs',
      value: (stats?.users.total || 0).toLocaleString('fr-FR'),
      sub: `${stats?.users.active || 0} comptes actifs`,
      icon: Users,
      color: 'from-blue-500 to-sky-600',
      link: '/admin/users',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard Admin</h1>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      {/* ─── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color, link }) => (
          <Link
            key={label}
            to={link}
            className={`bg-gradient-to-br ${color} text-white rounded-2xl p-5 shadow-md hover:shadow-lg transition hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">{label}</p>
              <Icon size={20} className="text-white/70" />
            </div>
            <p className="text-2xl font-bold leading-tight">{value}</p>
            <p className="text-white/70 text-xs mt-1.5 leading-relaxed">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ─── Statut du concours ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" /> Concours actuel
            </h2>
            <Link to="/admin/contest" className="text-xs text-purple-600 hover:underline">
              Gérer →
            </Link>
          </div>

          {contest ? (
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-900 text-lg">{contest.title}</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  contest.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                  contest.status === 'CLOSED' ? 'bg-red-100 text-red-700' :
                  contest.status === 'RESULTS_PUBLISHED' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {contest.status === 'DRAFT' ? '📝 Brouillon' :
                   contest.status === 'OPEN' ? '🟢 Ouvert' :
                   contest.status === 'CLOSED' ? '🔴 Clôturé' :
                   '🏆 Résultats publiés'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-0.5">Début</p>
                  <p className="font-semibold">{contest.startDate ? new Date(contest.startDate).toLocaleDateString('fr-FR') : '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-0.5">Fin</p>
                  <p className="font-semibold">{contest.endDate ? new Date(contest.endDate).toLocaleDateString('fr-FR') : '—'}</p>
                </div>
              </div>

              {contest.prizeAmount && (
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-purple-600 text-xs mb-0.5">Prix</p>
                  <p className="text-purple-700 font-bold text-lg">
                    {contest.prizeAmount.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              )}

              {/* Actions rapides */}
              <div className="flex gap-2">
                {contest.status === 'DRAFT' && (
                  <button
                    onClick={() => changeContestStatus('OPEN')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition"
                  >
                    <Play size={14} /> Ouvrir
                  </button>
                )}
                {contest.status === 'OPEN' && (
                  <button
                    onClick={() => changeContestStatus('CLOSED')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
                  >
                    <Square size={14} /> Clôturer
                  </button>
                )}
                {contest.status === 'CLOSED' && (
                  <button
                    onClick={() => changeContestStatus('RESULTS_PUBLISHED')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-yellow-500 text-white rounded-xl text-sm font-semibold hover:bg-yellow-600 transition"
                  >
                    <Star size={14} /> Publier résultats
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-orange-600">
              <AlertTriangle size={20} />
              <p className="text-sm">Aucun concours configuré.</p>
            </div>
          )}
        </div>

        {/* ─── Top 5 Classement ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              🏅 Top 5 candidats
            </h2>
            <Link to="/admin/candidates" className="text-xs text-purple-600 hover:underline">
              Voir tout →
            </Link>
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Aucun vote enregistré.</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${e.rank}`}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-sm flex-shrink-0">
                    {e.stageName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{e.stageName}</p>
                    
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-bold text-pink-600 text-sm">{e.totalVotes}</p>
                    <p className="text-xs text-gray-400">votes</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Export CSV ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Download size={18} className="text-gray-600" /> Exports CSV
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { type: 'users', label: 'Utilisateurs', icon: '👥' },
            { type: 'candidates', label: 'Candidats', icon: '🎬' },
            { type: 'votes', label: 'Votes', icon: '❤️' },
            { type: 'transactions', label: 'Transactions', icon: '💳' },
          ].map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => exportCSV(type as any)}
              disabled={exporting === type}
              className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
            >
              {exporting === type
                ? <Loader size={14} className="animate-spin" />
                : <Download size={14} />}
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Liens rapides admin ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/admin/users', label: 'Utilisateurs', icon: '👥', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { to: '/admin/votes', label: 'Votes & Remboursements', icon: '❤️', color: 'bg-pink-50 text-pink-700 border-pink-200' },
          { to: '/admin/webhooks', label: 'Webhooks MeSomb', icon: '🔔', color: 'bg-orange-50 text-orange-700 border-orange-200' },
          { to: '/admin/audit-logs', label: 'Audit Logs', icon: '📋', color: 'bg-gray-50 text-gray-700 border-gray-200' },
        ].map(({ to, label, icon, color }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 p-4 rounded-2xl border ${color} hover:shadow-sm transition font-semibold text-sm`}
          >
            <span className="text-xl">{icon}</span>
            {label}
          </Link>
        ))}
      </div>

    </div>
  );
}
