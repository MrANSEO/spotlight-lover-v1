// frontend/src/pages/user/VideoFeedPage.tsx
// VERSION CORRIGÉE — Mobile + Desktop + Auto-play/pause correct

import { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Trophy,
  X,
  Phone,
  AlertCircle,
  CheckCircle,
  Loader,
  Volume2,
  VolumeX,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Candidate {
  id: string;
  stageName: string;
  bio: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  leaderboardEntry?: {
    totalVotes: number;
    rank: number | null;
  };
  _count?: {
    votesReceived: number;
  };
}

interface VoteState {
  candidateId: string;
  candidateName: string;
  step: 'form' | 'processing' | 'polling' | 'success' | 'failed';
  phone: string;
  operator: 'MTN' | 'ORANGE';
  quantity: number;
  bonusVotes: number;
  transactionId?: string;
  pollCount: number;
}

// ─── Composant VideoSlide ────────────────────────────────────────────────────

function VideoSlide({
  candidate,
  voteCounts,
  contest,
  isLastDay,
  onVote,
}: {
  candidate: Candidate;
  voteCounts: Record<string, number>;
  contest: any;
  isLastDay: boolean;
  onVote: (candidate: Candidate) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.7 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-shrink-0 snap-start bg-black"
      style={{ height: '100svh' }} // svh = small viewport height, gère bien mobile + desktop
    >
      {/* Vidéo */}
      {candidate.videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={candidate.videoUrl}
            className="w-full h-full object-cover cursor-pointer"
            loop
            playsInline
            muted={isMuted}
            onClick={togglePlay}
          />
          {/* Indicateur pause */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              onClick={togglePlay}
            >
              <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Play size={28} className="text-white ml-1" fill="white" />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🎥</div>
            <p className="text-xl">Vidéo en cours d'upload...</p>
          </div>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Banner concours */}
      {contest && contest.status === 'OPEN' && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-green-500/80 backdrop-blur-sm text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-bold">{contest.title}</span>
          </div>
          {contest.prizeAmount && (
            <span className="text-xs font-semibold">
              🏆 {contest.prizeAmount.toLocaleString('fr-FR')} FCFA
            </span>
          )}
        </div>
      )}

      {/* Compte à rebours */}
      {isLastDay && contest?.endDate && (
        <CountdownBanner endDate={new Date(contest.endDate)} />
      )}

      {/* Infos candidat — bas gauche */}
      <div className="absolute bottom-0 left-0 right-20 p-6 pb-10 md:pb-8">
        {candidate.leaderboardEntry?.rank && (
          <div className="flex items-center gap-1 mb-2">
            <Trophy size={14} className="text-yellow-400" />
            <span className="text-yellow-400 text-sm font-bold">
              #{candidate.leaderboardEntry.rank}
            </span>
          </div>
        )}
        <h2 className="text-white text-2xl font-bold mb-1 drop-shadow-lg">
          {candidate.stageName}
        </h2>
        {candidate.bio && (
          <p className="text-gray-200 text-sm leading-relaxed line-clamp-2 drop-shadow">
            {candidate.bio}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <Heart size={16} className="text-red-400 fill-red-400" />
          <span className="text-white text-sm font-semibold">
            {(voteCounts[candidate.id] || 0).toLocaleString('fr-FR')} votes
          </span>
        </div>
      </div>

      {/* Actions — bas droite */}
      <div className="absolute right-4 bottom-10 md:bottom-8 flex flex-col items-center gap-5">
        {/* Voter */}
        <button
          onClick={() => onVote(candidate)}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Heart size={22} className="text-white fill-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">Voter</span>
          {isLastDay ? (
            <span className="text-yellow-300 text-xs font-bold drop-shadow animate-pulse">
              2 votes !
            </span>
          ) : (
            <span className="text-white text-xs drop-shadow">100 FCFA</span>
          )}
        </button>

        {/* Mute/Unmute */}
        <button
          onClick={toggleMute}
          className="w-10 h-10 bg-black/40 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/60 transition"
          title={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function VideoFeedPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [voteState, setVoteState] = useState<VoteState | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [contest, setContest] = useState<any>(null);
  const [isLastDay, setIsLastDay] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const response = await api.get('/candidates?status=ACTIVE&limit=50');
      const data = response.data.data || response.data || [];
      setCandidates(data);
      const counts: Record<string, number> = {};
      data.forEach((c: Candidate) => {
        counts[c.id] = c.leaderboardEntry?.totalVotes || c._count?.votesReceived || 0;
      });
      setVoteCounts(counts);
    } catch {
      toast.error('Impossible de charger les vidéos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/contest/current').then(r => {
      setContest(r.data);
      if (r.data?.endDate && r.data?.status === 'OPEN') {
        const diff = new Date(r.data.endDate).getTime() - Date.now();
        setIsLastDay(diff <= 24 * 60 * 60 * 1000 && diff > 0);
      }
    }).catch(() => {});

    api.get('/referral/wallet').then(r => {
      setWalletBalance(r.data.balance || 0);
    }).catch(() => {});
  }, []);

  const openVoteModal = (candidate: Candidate) => {
    setVoteState({
      candidateId: candidate.id,
      candidateName: candidate.stageName,
      step: 'form',
      phone: '',
      operator: 'MTN',
      quantity: 1,
      bonusVotes: 0,
      pollCount: 0,
    });
  };

  const closeVoteModal = () => {
    if (voteState?.step === 'processing' || voteState?.step === 'polling') return;
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setVoteState(null);
  };

  const submitVote = async () => {
    if (!voteState) return;
    const hasEnoughCredits = walletBalance >= voteState.quantity * 100;

    if (!hasEnoughCredits) {
      const phone = voteState.phone.replace(/\D/g, '');
      if (phone.length < 9) {
        toast.error('Numéro de téléphone invalide.');
        return;
      }
    }

    const bonusVotes = isLastDay ? voteState.quantity : 0;
    setVoteState((s) => s ? { ...s, step: 'processing', bonusVotes } : null);

    try {
      const response = await api.post('/payments/vote', {
        candidateId: voteState.candidateId,
        phone: hasEnoughCredits ? undefined : voteState.phone,
        operator: voteState.operator,
        quantity: voteState.quantity,
        bonusVotes,
      });

      const { transactionId, status } = response.data;

      if (status === 'COMPLETED') {
        handleVoteSuccess(voteState.candidateId, voteState.quantity, bonusVotes);
        return;
      }

      setVoteState((s) => s ? { ...s, step: 'polling', transactionId } : null);
      startPolling(transactionId, voteState.candidateId, voteState.quantity, bonusVotes);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erreur lors du vote. Réessayez.';
      toast.error(msg);
      setVoteState((s) => s ? { ...s, step: 'form' } : null);
    }
  };

  const startPolling = (
    transactionId: string,
    candidateId: string,
    quantity: number,
    bonusVotes: number,
  ) => {
    let count = 0;
    pollIntervalRef.current = setInterval(async () => {
      count++;
      try {
        const response = await api.get(`/payments/status/${transactionId}`);
        const { status } = response.data;

        if (status === 'COMPLETED') {
          clearInterval(pollIntervalRef.current!);
          handleVoteSuccess(candidateId, quantity, bonusVotes);
          return;
        }
        if (status === 'FAILED') {
          clearInterval(pollIntervalRef.current!);
          setVoteState((s) => s ? { ...s, step: 'failed' } : null);
          toast.error('Paiement échoué. Vérifiez votre solde Mobile Money.');
          return;
        }
        if (count >= 20) {
          clearInterval(pollIntervalRef.current!);
          setVoteState((s) => s ? { ...s, step: 'failed' } : null);
          toast.error("Délai d'attente dépassé. Vérifiez votre téléphone et réessayez.");
        }
        setVoteState((s) => s ? { ...s, pollCount: count } : null);
      } catch {
        console.warn('Poll error, retrying...');
      }
    }, 3000);
  };

  const handleVoteSuccess = (candidateId: string, quantity: number, bonusVotes = 0) => {
    const totalVotes = quantity + bonusVotes;
    setVoteState((s) => s ? { ...s, step: 'success' } : null);
    setVoteCounts((prev) => ({
      ...prev,
      [candidateId]: (prev[candidateId] || 0) + totalVotes,
    }));
    if (walletBalance > 0) {
      api.get('/referral/wallet').then(r => setWalletBalance(r.data.balance || 0)).catch(() => {});
    }
    toast.success(
      bonusVotes > 0
        ? `🎉 ${quantity} vote(s) + ${bonusVotes} GRATUIT(S) = ${totalVotes} votes !`
        : `🎉 ${quantity} vote(s) confirmé(s) !`
    );
    setTimeout(() => setVoteState(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-black" style={{ height: '100svh' }}>
        <div className="text-white text-center">
          <Loader className="w-10 h-10 animate-spin mx-auto mb-4" />
          <p className="text-lg">Chargement des vidéos...</p>
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-black text-white text-center px-8"
        style={{ height: '100svh' }}
      >
        <div>
          <div className="text-6xl mb-4">🎭</div>
          <h2 className="text-2xl font-bold mb-2">Aucun candidat pour le moment</h2>
          <p className="text-gray-400">Revenez bientôt pour voter !</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── Feed vidéo ───────────────────────────────────────────────────── */}
      <div
        className="overflow-y-scroll snap-y snap-mandatory bg-black"
        style={{ height: '100svh' }}
      >
        {candidates.map((candidate) => (
          <VideoSlide
            key={candidate.id}
            candidate={candidate}
            voteCounts={voteCounts}
            contest={contest}
            isLastDay={isLastDay}
            onVote={openVoteModal}
          />
        ))}
      </div>

      {/* ─── Modal de vote ────────────────────────────────────────────────── */}
      {voteState && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="w-full md:max-w-lg bg-white md:rounded-3xl rounded-t-3xl p-6 pb-10 shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Header modal */}
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                🗳️ Voter pour{' '}
                <span className="text-purple-700">{voteState.candidateName}</span>
              </h3>
              <button
                onClick={closeVoteModal}
                disabled={voteState.step === 'processing' || voteState.step === 'polling'}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={24} />
              </button>
            </div>

            {/* Bannière 24h */}
            {isLastDay && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-3 mb-4 text-center">
                <p className="text-white font-bold text-sm">🎁 Offre spéciale — Dernières 24h !</p>
                <p className="text-yellow-100 text-xs mt-1">
                  1 vote payé = 1 vote <strong>GRATUIT</strong> offert
                </p>
              </div>
            )}

            {/* ─── Formulaire ─────────────────────────────────────────────── */}
            {voteState.step === 'form' && (
              <div className="space-y-5">
                {/* Quantité */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre de votes
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 5, 10].map((q) => (
                      <button
                        key={q}
                        onClick={() => setVoteState((s) => s ? { ...s, quantity: q } : null)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
                          voteState.quantity === q
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Total :{' '}
                    <span className="font-bold text-purple-700">
                      {voteState.quantity * 100} FCFA
                    </span>
                  </p>
                </div>

                {/* Opérateur */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Opérateur Mobile Money
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['MTN', 'ORANGE'] as const).map((op) => (
                      <button
                        key={op}
                        onClick={() => setVoteState((s) => s ? { ...s, operator: op } : null)}
                        className={`py-3 rounded-xl font-bold text-sm transition border-2 ${
                          voteState.operator === op
                            ? op === 'MTN'
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-800'
                              : 'border-orange-500 bg-orange-50 text-orange-800'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {op === 'MTN' ? '🟡 MTN Money' : '🟠 Orange Money'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
                  <AlertCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Après confirmation, vous recevrez une notification sur votre téléphone.
                  </p>
                </div>

                {/* Wallet */}
                {walletBalance > 0 && (
                  <div className="bg-purple-50 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-purple-600 text-sm">💰</span>
                    <p className="text-purple-700 text-sm">
                      Vous avez <strong>{walletBalance} FCFA</strong> de crédits —
                      utilisés automatiquement !
                    </p>
                  </div>
                )}

                {/* Téléphone */}
                {walletBalance < voteState.quantity * 100 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Numéro Mobile Money
                    </label>
                    <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-purple-500 transition">
                      <Phone size={18} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500 text-sm font-mono">+237</span>
                      <input
                        type="tel"
                        placeholder="6XX XXX XXX"
                        value={voteState.phone}
                        onChange={(e) =>
                          setVoteState((s) => s ? { ...s, phone: e.target.value } : null)
                        }
                        className="flex-1 outline-none text-gray-900 font-mono text-sm"
                        maxLength={12}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Ex : 690 000 001 (sans le 237)</p>
                  </div>
                )}

                {/* Bouton voter */}
                {(() => {
                  const hasEnoughCredits = walletBalance >= voteState.quantity * 100;
                  const phoneValid = voteState.phone.replace(/\D/g, '').length >= 9;
                  const canVote = hasEnoughCredits || phoneValid;
                  return (
                    <button
                      onClick={submitVote}
                      disabled={!canVote}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {hasEnoughCredits
                        ? `Voter avec ${voteState.quantity * 100} FCFA de crédits`
                        : `Payer ${voteState.quantity * 100} FCFA et voter`}
                    </button>
                  );
                })()}
              </div>
            )}

            {/* ─── Processing ──────────────────────────────────────────────── */}
            {voteState.step === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <Loader size={48} className="animate-spin text-purple-600 mx-auto" />
                <h4 className="font-bold text-gray-900 text-lg">Initiation du paiement...</h4>
                <p className="text-gray-500 text-sm">Connexion au service de paiement.</p>
              </div>
            )}

            {/* ─── Polling ─────────────────────────────────────────────────── */}
            {voteState.step === 'polling' && (
              <div className="text-center py-8 space-y-4">
                <div className="relative mx-auto w-20 h-20">
                  <div className="w-20 h-20 border-4 border-purple-200 rounded-full" />
                  <div className="absolute inset-0 w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <Phone size={28} className="absolute inset-0 m-auto text-purple-600" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg">En attente de confirmation</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Vérifiez votre téléphone{' '}
                  <span className="font-bold">(+237 {voteState.phone})</span>
                  <br />et confirmez le paiement de{' '}
                  <span className="font-bold text-purple-700">
                    {voteState.quantity * 100} FCFA
                  </span>
                </p>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                  <span className="ml-2">Vérification ({voteState.pollCount}/20)</span>
                </div>
              </div>
            )}

            {/* ─── Succès ──────────────────────────────────────────────────── */}
            {voteState.step === 'success' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={48} className="text-green-500" />
                </div>
                <h4 className="font-bold text-gray-900 text-2xl">Votes confirmés ! 🎉</h4>
                {voteState.bonusVotes > 0 ? (
                  <div className="space-y-1">
                    <p className="text-gray-600">
                      <span className="font-bold text-purple-700">{voteState.quantity}</span> vote(s)
                      payé(s) +{' '}
                      <span className="font-bold text-green-600">
                        {voteState.bonusVotes} GRATUIT(S)
                      </span>
                    </p>
                    <p className="text-lg font-bold text-purple-700">
                      = {voteState.quantity + voteState.bonusVotes} votes pour{' '}
                      <span className="font-bold">{voteState.candidateName}</span> !
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    <span className="font-bold text-purple-700">{voteState.quantity}</span> vote(s)
                    attribués à <span className="font-bold">{voteState.candidateName}</span>
                  </p>
                )}
                <button
                  onClick={closeVoteModal}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                >
                  Continuer à voter
                </button>
                <p className="text-xs text-gray-400">
                  Cette fenêtre se ferme automatiquement dans 3s...
                </p>
              </div>
            )}

            {/* ─── Échec ───────────────────────────────────────────────────── */}
            {voteState.step === 'failed' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <X size={40} className="text-red-500" />
                </div>
                <h4 className="font-bold text-gray-900 text-xl">Paiement non confirmé</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Vérifiez que vous avez suffisamment de crédit et que vous avez bien validé la
                  notification sur votre téléphone.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={closeVoteModal}
                    className="py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() =>
                      setVoteState((s) => s ? { ...s, step: 'form', pollCount: 0 } : null)
                    }
                    className="py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Compte à rebours ─────────────────────────────────────────────────────────

function CountdownBanner({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Terminé'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endDate]);

  return (
    <div className="absolute top-10 left-0 right-0 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1.5 flex items-center justify-between">
      <span className="text-xs font-bold">⏰ Offre spéciale — 2 votes pour 100 FCFA !</span>
      <span className="text-xs font-bold tabular-nums">{timeLeft}</span>
    </div>
  );
}