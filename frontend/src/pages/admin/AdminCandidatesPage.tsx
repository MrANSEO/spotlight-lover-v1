import { useState, useEffect } from 'react';
import api from '../../services/api';

interface Candidate {
  id: string;
  stageName: string;
  bio: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  createdAt: string;
  user: {
    email: string;
  };
  _count?: {
    votesReceived: number;
  };
  totalVoteAmount: number;
}

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    loadCandidates();
  }, [filter]);

  const loadCandidates = async () => {
    try {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const response = await api.get(`/candidates${params}`);
      setCandidates(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (candidateId: string, newStatus: string) => {
    if (!confirm(`Changer le statut vers "${newStatus}" ?`)) return;

    try {
      await api.patch(`/candidates/${candidateId}/status`, { status: newStatus });
      alert('Statut mis à jour !');
      loadCandidates();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Échec de la mise à jour');
    }
  };

  const deleteCandidate = async (candidateId: string) => {
    if (!confirm('Supprimer ce candidat ? Cette action est irréversible.')) return;

    try {
      await api.delete(`/candidates/${candidateId}`);
      alert('Candidat supprimé !');
      loadCandidates();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Échec de la suppression');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🎬 Modération des Candidats</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <span className="font-semibold">Filtrer par statut :</span>
          {['ALL', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'].map((status) => (
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

      {/* Candidates grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Thumbnail */}
            <div 
              className="aspect-video bg-gray-200 relative cursor-pointer"
              onClick={() => candidate.videoUrl && setSelectedVideo(candidate.videoUrl)}
            >
              {candidate.thumbnailUrl ? (
                <img src={candidate.thumbnailUrl} alt={candidate.stageName} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  🎥 Pas de vidéo
                </div>
              )}
              {candidate.videoUrl && (
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition">
                  <span className="text-white text-4xl opacity-0 hover:opacity-100">▶️</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="text-xl font-bold mb-1">{candidate.stageName}</h3>
              <p className="text-sm text-gray-600 mb-2">{candidate.user.email}</p>
              {candidate.bio && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{candidate.bio}</p>
              )}

              <div className="flex items-center justify-between mb-4 text-sm">
                <span>❤️ {candidate._count?.votesReceived || 0} votes</span>
                <span className="font-semibold text-purple-600">
                  {candidate.totalVoteAmount?.toLocaleString() || 0} FCFA
                </span>
              </div>

              {/* Status badge */}
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  candidate.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  candidate.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  candidate.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {candidate.status}
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {candidate.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => updateCandidateStatus(candidate.id, 'ACTIVE')}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
                    >
                      ✅ Approuver
                    </button>
                    <button
                      onClick={() => updateCandidateStatus(candidate.id, 'REJECTED')}
                      className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
                    >
                      ❌ Rejeter
                    </button>
                  </>
                )}

                {candidate.status === 'ACTIVE' && (
                  <button
                    onClick={() => updateCandidateStatus(candidate.id, 'SUSPENDED')}
                    className="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm font-semibold"
                  >
                    ⏸️ Suspendre
                  </button>
                )}

                {candidate.status === 'SUSPENDED' && (
                  <button
                    onClick={() => updateCandidateStatus(candidate.id, 'ACTIVE')}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
                  >
                    ▶️ Réactiver
                  </button>
                )}

                <button
                  onClick={() => deleteCandidate(candidate.id)}
                  className="w-full px-3 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 text-sm font-semibold"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucun candidat trouvé.
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300"
            >
              ✕
            </button>
            <video 
              src={selectedVideo} 
              controls 
              autoPlay
              className="w-full rounded-lg shadow-2xl"
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}
