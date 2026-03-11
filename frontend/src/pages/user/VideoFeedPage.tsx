import { useState, useEffect, useRef } from 'react';
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
  user?: {
    email: string;
  };
}

export default function VideoFeedPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    // Autoplay current video, pause others
    videoRefs.current.forEach((video, idx) => {
      if (video) {
        if (idx === currentIndex) {
          video.play().catch(err => console.log('Autoplay prevented:', err));
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  const loadCandidates = async () => {
    try {
      const response = await api.get('/candidates?status=ACTIVE&limit=50');
      setCandidates(response.data.data || []);
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < candidates.length) {
      setCurrentIndex(newIndex);
    }
  };

  const openVoteModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowVoteModal(true);
  };

  const handleVote = async (paymentProvider: 'MESOMB' | 'STRIPE') => {
    if (!selectedCandidate) return;
    
    setVoting(true);
    try {
      const response = await api.post('/votes', {
        candidateId: selectedCandidate.id,
        paymentProvider,
        amount: 100,
      });

      const { transactionId } = response.data;
      
      alert(`Vote initié ! Transaction: ${transactionId}\nVeuillez compléter le paiement sur votre téléphone.`);
      setShowVoteModal(false);
      
      // Optional: Poll for payment confirmation
      pollPaymentStatus(transactionId);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Échec du vote');
    } finally {
      setVoting(false);
    }
  };

  const pollPaymentStatus = async (transactionId: string) => {
    const maxAttempts = 30; // 30 attempts = 5 minutes
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await api.get(`/payments/status/${transactionId}`);
        const { status } = response.data;

        if (status === 'COMPLETED') {
          alert('✅ Votre vote a été confirmé !');
          loadCandidates(); // Refresh to show updated counts
        } else if (status === 'FAILED') {
          alert('❌ Le paiement a échoué. Veuillez réessayer.');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        }
      } catch (err) {
        console.error('Failed to check payment status:', err);
      }
    };

    setTimeout(checkStatus, 5000); // First check after 5 seconds
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-xl">Chargement des vidéos...</div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white text-center p-8">
        <div className="text-6xl mb-4">🎭</div>
        <h2 className="text-2xl font-bold mb-2">Aucune vidéo disponible</h2>
        <p className="text-gray-400">Revenez bientôt pour découvrir les talents !</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* TikTok-style vertical scroll container */}
      <div 
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
      >
        {candidates.map((candidate, index) => (
          <div 
            key={candidate.id} 
            className="h-screen w-full snap-start snap-always relative bg-black"
          >
            {/* Video */}
            {candidate.videoUrl ? (
              <video
                ref={(el) => { videoRefs.current[index] = el; }}
                src={candidate.videoUrl}
                className="h-full w-full object-contain"
                loop
                playsInline
                muted={false}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎥</div>
                  <p className="text-xl">Vidéo non disponible</p>
                </div>
              </div>
            )}

            {/* Overlay UI */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/60 to-transparent">
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2">{candidate.stageName}</h2>
                {candidate.bio && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{candidate.bio}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="mr-4">❤️ {candidate._count?.votesReceived || 0} votes</span>
                    <span className="text-yellow-400 font-semibold">
                      {candidate.totalVoteAmount?.toLocaleString() || 0} FCFA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side action buttons */}
            <div className="absolute right-4 bottom-32 flex flex-col items-center space-y-6">
              <button 
                onClick={() => openVoteModal(candidate)}
                className="flex flex-col items-center"
              >
                <div className="bg-purple-600 rounded-full p-4 shadow-lg hover:bg-purple-700 transition">
                  <span className="text-3xl">❤️</span>
                </div>
                <span className="text-white text-xs mt-1 font-semibold">Voter</span>
              </button>

              <button className="flex flex-col items-center">
                <div className="bg-gray-800 bg-opacity-70 rounded-full p-4 shadow-lg hover:bg-opacity-90 transition">
                  <span className="text-3xl">💬</span>
                </div>
                <span className="text-white text-xs mt-1">{candidate._count?.votesReceived || 0}</span>
              </button>

              <button className="flex flex-col items-center">
                <div className="bg-gray-800 bg-opacity-70 rounded-full p-4 shadow-lg hover:bg-opacity-90 transition">
                  <span className="text-3xl">🔗</span>
                </div>
                <span className="text-white text-xs mt-1">Partager</span>
              </button>
            </div>

            {/* Video progress indicator */}
            <div className="absolute top-4 left-0 right-0 flex justify-center space-x-1 px-4">
              {candidates.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition ${
                    idx === index ? 'bg-white' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Vote Modal */}
      {showVoteModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              Voter pour {selectedCandidate.stageName}
            </h3>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <p className="text-center text-3xl font-bold text-purple-600">100 FCFA</p>
              <p className="text-center text-sm text-gray-600 mt-1">par vote</p>
            </div>

            <p className="text-gray-700 mb-6">
              Choisissez votre méthode de paiement :
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleVote('MESOMB')}
                disabled={voting}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 transition"
              >
                📱 Mobile Money (MTN/Orange)
              </button>

              <button
                onClick={() => handleVote('STRIPE')}
                disabled={voting}
                className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                💳 Carte bancaire (Stripe)
              </button>
            </div>

            <button
              onClick={() => setShowVoteModal(false)}
              className="w-full mt-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
