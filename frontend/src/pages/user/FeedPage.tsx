import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function FeedPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const response = await api.get('/candidates?status=ACTIVE');
      setCandidates(response.data.data);
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (candidateId: string) => {
    try {
      await api.post('/votes', {
        candidateId,
        paymentProvider: 'MESOMB',
        amount: 100,
      });
      alert('Vote initié ! Veuillez compléter le paiement.');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Échec du vote');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold mb-8">Candidats en compétition</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate: any) => (
          <div key={candidate.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="aspect-video bg-gray-200 relative">
              {candidate.thumbnailUrl ? (
                <img src={candidate.thumbnailUrl} alt={candidate.stageName} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Pas de vidéo
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">{candidate.stageName}</h3>
              <p className="text-gray-600 text-sm mb-4">{candidate.bio || 'Aucune biographie'}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {candidate._count?.votesReceived || 0} votes
                </span>
                <button
                  onClick={() => handleVote(candidate.id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Voter (100 FCFA)
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
