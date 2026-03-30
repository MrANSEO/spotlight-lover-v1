import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, PauseCircle, Trash2, Play, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Candidate {
  id: string;
  stageName: string;
  bio: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  createdAt: string;
  rejectionReason: string | null;
  user: { email: string };
  _count?: { votesReceived: number };
  totalVoteAmount?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT:   { label: 'Paiement en attente', color: 'bg-gray-100 text-gray-700' },
  PENDING_VALIDATION: { label: 'En validation',      color: 'bg-yellow-100 text-yellow-700' },
  ACTIVE:            { label: 'Actif',               color: 'bg-green-100 text-green-700' },
  SUSPENDED:         { label: 'Suspendu',            color: 'bg-red-100 text-red-700' },
  REJECTED:          { label: 'Rejeté',              color: 'bg-orange-100 text-orange-700' },
};

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadCandidates();
  }, [filter]);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? `?status=${filter}&limit=50` : '?limit=50';
      const response = await api.get(`/candidates${params}`);
      setCandidates(response.data.data || response.data || []);
    } catch {
      toast.error('Impossible de charger les candidats.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECTION : utilise PATCH /candidates/:id/moderate avec les bons statuts
  const moderateCandidate = async (
    candidateId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED',
    reason?: string,
  ) => {
    setActionLoading(candidateId);
    try {
      await api.patch(`/candidates/${candidateId}/moderate`, {
        status,
        ...(reason ? { rejectionReason: reason } : {}),
      });

      const labels: Record<string, string> = {
        ACTIVE:    '✅ Candidat approuvé',
        SUSPENDED: '⚠️ Candidat suspendu',
        REJECTED:  '❌ Candidat rejeté',
      };
      toast.success(labels[status] || 'Statut mis à jour');
      await loadCandidates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la modération.');
    } finally {
      setActionLoading(null);
      setRejectModal(null);
      setRejectReason('');
    }
  };

  const deleteCandidate = async (candidateId: string, stageName: string) => {
    if (!window.confirm(`Supprimer définitivement "${stageName}" ? Cette action est irréversible.`)) return;

    setActionLoading(candidateId);
    try {
      await api.delete(`/candidates/${candidateId}`);
      toast.success('Candidat supprimé.');
      await loadCandidates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression.');
    } finally {
      setActionLoading(null);
    }
  };

  const filterButtons = ['ALL', 'PENDING_PAYMENT', 'PENDING_VALIDATION', 'ACTIVE', 'SUSPENDED', 'REJECTED'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🎬 Modération des candidats</h1>

        {/* Filtres */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {filterButtons.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-xl font-semibold text-xs transition whitespace-nowrap ${
                  filter === s
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'ALL' ? 'Tous' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
            Aucun candidat pour ce filtre.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((candidate) => {
              const statusCfg = STATUS_CONFIG[candidate.status] || { label: candidate.status, color: 'bg-gray-100 text-gray-700' };
              const isLoading = actionLoading === candidate.id;

              return (
                <div key={candidate.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Thumbnail / Vidéo */}
                  <div
                    className="aspect-video bg-gray-900 relative cursor-pointer group"
                    onClick={() => candidate.videoUrl && setSelectedVideo(candidate.videoUrl)}
                  >
                    {candidate.thumbnailUrl ? (
                      <img
                        src={candidate.thumbnailUrl}
                        alt={candidate.stageName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                        🎥 Pas de vidéo
                      </div>
                    )}
                    {candidate.videoUrl && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Play size={36} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{candidate.stageName}</h3>
                        <p className="text-xs text-gray-500 truncate">{candidate.user.email}</p>
                      </div>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {candidate.bio && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{candidate.bio}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>❤️ {candidate._count?.votesReceived || 0} votes</span>
                      <span className="font-semibold text-purple-700">
                        {(candidate.totalVoteAmount || 0).toLocaleString()} FCFA
                      </span>
                      <span>{new Date(candidate.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>

                    {/* Actions selon statut */}
                    {isLoading ? (
                      <div className="flex justify-center py-2">
                        <Loader size={20} className="animate-spin text-purple-600" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Approuver (si en attente validation ou rejeté) */}
                        {(candidate.status === 'PENDING_VALIDATION' || candidate.status === 'REJECTED') && (
                          <button
                            onClick={() => moderateCandidate(candidate.id, 'ACTIVE')}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition"
                          >
                            <CheckCircle size={16} /> Approuver
                          </button>
                        )}

                        {/* Suspendre (si actif) */}
                        {candidate.status === 'ACTIVE' && (
                          <button
                            onClick={() => setRejectModal({ id: candidate.id, name: candidate.stageName })}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition"
                          >
                            <PauseCircle size={16} /> Suspendre
                          </button>
                        )}

                        {/* Réactiver (si suspendu) */}
                        {candidate.status === 'SUSPENDED' && (
                          <button
                            onClick={() => moderateCandidate(candidate.id, 'ACTIVE')}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition"
                          >
                            <CheckCircle size={16} /> Réactiver
                          </button>
                        )}

                        {/* Rejeter (si en attente) */}
                        {candidate.status === 'PENDING_VALIDATION' && (
                          <button
                            onClick={() => {
                              setRejectModal({ id: candidate.id, name: candidate.stageName });
                              setRejectReason('Contenu non conforme aux règles du concours.');
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-100 text-red-700 rounded-xl font-semibold text-sm hover:bg-red-200 transition"
                          >
                            <XCircle size={16} /> Rejeter
                          </button>
                        )}

                        {/* Supprimer (toujours disponible pour admin) */}
                        <button
                          onClick={() => deleteCandidate(candidate.id, candidate.stageName)}
                          className="w-full flex items-center justify-center gap-2 py-2 border border-red-200 text-red-600 rounded-xl font-semibold text-xs hover:bg-red-50 transition"
                        >
                          <Trash2 size={14} /> Supprimer définitivement
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal vidéo */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
            >
              <X size={28} />
            </button>
            <video src={selectedVideo} controls autoPlay className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* Modal raison suspension/rejet */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Raison de l'action</h3>
            <p className="text-sm text-gray-500 mb-4">
              Pour <span className="font-semibold text-purple-700">{rejectModal.name}</span>
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Expliquez la raison (sera envoyée au candidat par email)..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => moderateCandidate(
                  rejectModal.id,
                  'SUSPENDED',
                  rejectReason || undefined,
                )}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}