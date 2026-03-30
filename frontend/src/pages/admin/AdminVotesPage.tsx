// frontend/src/pages/admin/AdminVotesPage.tsx — VERSION CORRIGÉE
// Remplace intégralement ton fichier existant.
//
// CORRECTIONS :
//   1. Interface Vote : user → voter (l'API retourne voter.email pas user.email)
//   2. vote.user.email → vote.voter.email dans le tableau
//   3. Ajout du panel "Vote admin gratuit" en haut de la page (problème 4)

import { useState, useEffect } from 'react';
import { Download, Loader, RefreshCw, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Vote {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  isSuspicious: boolean;
  // ✅ CORRECTION : voter (pas user) — correspond à ce que retourne l'API
  voter: { email: string };
  candidate: { stageName: string };
  transaction?: {
    provider: string;
    providerReference?: string | null;
  };
}

interface Candidate {
  id: string;
  stageName: string;
  status: string;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function AdminVotesPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [refunding, setRefunding] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // ─── Vote admin ────────────────────────────────────────────────────────
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [adminVoteQty, setAdminVoteQty] = useState(1);
  const [adminVoting, setAdminVoting] = useState(false);

  useEffect(() => {
    loadVotes();
    loadCandidates();
  }, [filter]);

  const loadVotes = async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const response = await api.get(`/votes${params}`);
      setVotes(response.data.data || response.data);
    } catch {
      toast.error('Impossible de charger les votes.');
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async () => {
    try {
      const res = await api.get('/candidates?status=ACTIVE&limit=100');
      setCandidates(res.data.data || res.data || []);
    } catch {
      // silently fail
    }
  };

  // ─── Vote admin gratuit ───────────────────────────────────────────────

  const handleAdminVote = async () => {
    if (!selectedCandidateId) {
      toast.error('Sélectionnez un candidat.');
      return;
    }
    if (adminVoteQty < 1 || adminVoteQty > 10) {
      toast.error('Quantité entre 1 et 10.');
      return;
    }
    if (!window.confirm(`Ajouter ${adminVoteQty} vote(s) gratuit(s) pour ce candidat ?`)) return;

    setAdminVoting(true);
    try {
      await api.post('/payments/admin/vote', {
        candidateId: selectedCandidateId,
        quantity: adminVoteQty,
        reason: 'Vote admin gratuit',
      });
      toast.success(`✅ ${adminVoteQty} vote(s) ajouté(s) avec succès !`);
      setSelectedCandidateId('');
      setAdminVoteQty(1);
      await loadVotes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du vote admin.');
    } finally {
      setAdminVoting(false);
    }
  };

  // ─── Remboursement ────────────────────────────────────────────────────

  const handleRefund = async (voteId: string) => {
    if (!window.confirm('Rembourser ce vote ? Cette action est irréversible.')) return;
    setRefunding(voteId);
    try {
      await api.post(`/votes/${voteId}/refund`);
      toast.success('✅ Vote remboursé avec succès !');
      loadVotes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Échec du remboursement.');
    } finally {
      setRefunding(null);
    }
  };

  // ─── Export CSV ───────────────────────────────────────────────────────

  const exportVotes = async () => {
    setExporting(true);
    try {
      const response = await api.get('/analytics/export?type=votes', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `votes-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export CSV téléchargé !');
    } catch {
      toast.error('Échec de l\'export CSV.');
    } finally {
      setExporting(false);
    }
  };

  // ─── UI helpers ───────────────────────────────────────────────────────

  const filterButtons = ['ALL', 'COMPLETED', 'PENDING', 'FAILED'];

  const statusColor = (s: string) => {
    if (s === 'COMPLETED') return 'bg-green-100 text-green-700';
    if (s === 'PENDING')   return 'bg-yellow-100 text-yellow-700';
    if (s === 'FAILED')    return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  // ─── Rendu ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">❤️ Gestion des votes</h1>
        <div className="flex gap-2">
          <button
            onClick={loadVotes}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <RefreshCw size={14} /> Actualiser
          </button>
          <button
            onClick={exportVotes}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60"
          >
            {exporting
              ? <><Loader size={14} className="animate-spin" /> Export...</>
              : <><Download size={14} /> Export CSV</>}
          </button>
        </div>
      </div>

      {/* ─── ✅ NOUVEAU : Vote admin gratuit ────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-purple-500">
        <div className="flex items-center gap-2 mb-4">
          <Heart size={18} className="text-purple-600 fill-purple-200" />
          <h2 className="font-bold text-gray-900">Vote admin gratuit</h2>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
            Sans paiement
          </span>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Candidat
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="">— Sélectionner un candidat —</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.stageName}
                </option>
              ))}
            </select>
          </div>

          <div className="w-32">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Quantité (max 10)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={adminVoteQty}
              onChange={(e) => setAdminVoteQty(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={handleAdminVote}
            disabled={adminVoting || !selectedCandidateId}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition disabled:opacity-60"
          >
            {adminVoting
              ? <><Loader size={14} className="animate-spin" /> En cours...</>
              : <><Heart size={14} /> Voter gratuitement</>}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Ces votes comptent dans le classement mais ne génèrent pas de revenus. Ils sont tracés dans les logs d'audit.
        </p>
      </div>

      {/* ─── Stats rapides ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: votes.length, color: 'text-gray-900' },
          { label: 'Confirmés', value: votes.filter(v => v.status === 'COMPLETED').length, color: 'text-green-600' },
          { label: 'En attente', value: votes.filter(v => v.status === 'PENDING').length, color: 'text-yellow-600' },
          {
            label: 'Montant total',
            value: `${votes.filter(v => v.status === 'COMPLETED').reduce((s, v) => s + v.amount, 0).toLocaleString('fr-FR')} FCFA`,
            color: 'text-purple-700',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-500 font-semibold mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ─── Filtres ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex gap-2 flex-wrap">
        {filterButtons.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
              filter === s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'ALL' ? 'Tous' : s}
          </button>
        ))}
      </div>

      {/* ─── Table des votes ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader className="w-7 h-7 animate-spin text-purple-600" />
          </div>
        ) : votes.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-sm">Aucun vote trouvé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Votant</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Candidat</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {votes.map((vote) => (
                  <tr
                    key={vote.id}
                    className={`hover:bg-gray-50 transition ${vote.isSuspicious ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {new Date(vote.createdAt).toLocaleString('fr-FR')}
                    </td>
                    {/* ✅ CORRECTION : voter.email au lieu de user.email */}
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {vote.voter?.email || '—'}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                      {vote.candidate?.stageName || '—'}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-purple-700">
                      {vote.amount} FCFA
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${statusColor(vote.status)}`}>
                          {vote.status}
                        </span>
                        {vote.isSuspicious && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 w-fit">
                            ⚠️ Suspect
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {vote.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleRefund(vote.id)}
                          disabled={refunding === vote.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-semibold transition disabled:opacity-60"
                        >
                          {refunding === vote.id
                            ? <><Loader size={12} className="animate-spin" /> En cours...</>
                            : '💸 Rembourser'}
                        </button>
                      )}
                      {vote.transaction?.providerReference && (
                        <p className="text-xs text-gray-400 font-mono mt-1">
                          {vote.transaction.providerReference.slice(0, 8)}...
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}