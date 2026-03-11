import { useState, useEffect } from 'react';
import api from '../../services/api';

interface Candidate {
  id: string;
  stageName: string;
  bio: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  _count?: {
    votesReceived: number;
  };
  totalVoteAmount: number;
}

export default function GalleryPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const response = await api.get('/candidates?status=ACTIVE&limit=50');
      setCandidates(response.data.data || []);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const openVideoModal = (videoUrl: string) => {
    setSelectedVideo(videoUrl);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Chargement de la galerie...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">🎬 Galerie des Talents</h1>
        <p className="text-gray-600 text-lg">
          Découvrez tous les candidats en compétition et soutenez vos favoris !
        </p>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎭</div>
          <p className="text-xl text-gray-600">Aucun candidat pour le moment</p>
          <p className="text-gray-500 mt-2">Revenez bientôt pour découvrir les talents !</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {candidates.map((candidate) => (
            <div 
              key={candidate.id} 
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition cursor-pointer"
              onClick={() => candidate.videoUrl && openVideoModal(candidate.videoUrl)}
            >
              <div className="aspect-[9/16] bg-gray-200 relative">
                {candidate.thumbnailUrl ? (
                  <img 
                    src={candidate.thumbnailUrl} 
                    alt={candidate.stageName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎥</div>
                      <p className="text-sm">Pas de vidéo</p>
                    </div>
                  </div>
                )}
                
                {/* Play overlay */}
                {candidate.videoUrl && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                    <div className="text-white text-5xl">▶️</div>
                  </div>
                )}
              </div>
              
              <div className="p-3">
                <h3 className="font-bold text-lg truncate">{candidate.stageName}</h3>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                  <span>❤️ {candidate._count?.votesReceived || 0}</span>
                  <span className="font-semibold text-purple-600">
                    {candidate.totalVoteAmount?.toLocaleString() || 0} FCFA
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeVideoModal}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={closeVideoModal}
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
