// ═══════════════════════════════════════════════════════════
// LeaderboardAndResultsPages.tsx — VERSION AMÉLIORÉE
// ═══════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { Trophy, Heart, Loader2, RefreshCw, Star } from 'lucide-react';
import api from '../../services/api';

interface LeaderEntry {
  rank: number;
  candidateId: string;
  stageName: string;
  thumbnailUrl?: string;
  totalVotes: number;
}

interface ContestInfo {
  id: string;
  title: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'RESULTS_PUBLISHED';
  prizeAmount: number | null;
  prizeDescription: string | null;
  endDate: string | null;
  resultsPublishedAt: string | null;
}

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [contest, setContest] = useState<ContestInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      const [leaderRes, contestRes] = await Promise.all([
        api.get('/leaderboard'),
        api.get('/contest/current').catch(() => ({ data: null })),
      ]);
      setEntries(leaderRes.data.entries || []);
      setContest(contestRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  const medals = ['🥇', '🥈', '🥉'];

  const statusBanner = () => {
    if (!contest || contest.status === 'DRAFT') return null;

    if (contest.status === 'OPEN') {
      return (
        <div className="bg-green-500 text-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="font-bold text-sm uppercase tracking-wide">Concours en cours</span>
              </div>
              <p className="font-bold text-lg">{contest.title}</p>
              {contest.prizeAmount && (
                <p className="text-green-100 text-sm mt-0.5">
                  🏆 Prix : {contest.prizeAmount.toLocaleString('fr-FR')} FCFA
                  {contest.prizeDescription && ` — ${contest.prizeDescription}`}
                </p>
              )}
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Star size={24} className="text-white" />
            </div>
          </div>
        </div>
      );
    }

    if (contest.status === 'CLOSED') {
      return (
        <div className="bg-red-500 text-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-white rounded-full" />
                <span className="font-bold text-sm uppercase tracking-wide">Concours terminé</span>
              </div>
              <p className="font-bold text-lg">{contest.title}</p>
              {contest.prizeAmount && (
                <p className="text-red-100 text-sm mt-0.5">
                  🏆 Prix : {contest.prizeAmount.toLocaleString('fr-FR')} FCFA
                </p>
              )}
              <p className="text-red-200 text-xs mt-1">⏳ Résultats officiels à venir...</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Trophy size={24} className="text-white" />
            </div>
          </div>
        </div>
      );
    }

    if (contest.status === 'RESULTS_PUBLISHED') {
      const winner = entries[0];
      return (
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-2xl p-5 mb-4 shadow-lg">
          <p className="text-center text-sm font-bold uppercase tracking-wide mb-3">🏆 Résultats officiels</p>
          <p className="text-center font-bold text-lg mb-3">{contest.title}</p>
          {winner && (
            <div className="bg-white/20 rounded-xl p-3 text-center mb-3">
              <p className="text-xs text-yellow-100 mb-1">🥇 Gagnant</p>
              {winner.thumbnailUrl ? (
                <img src={winner.thumbnailUrl} alt={winner.stageName}
                  className="w-16 h-16 rounded-full mx-auto border-4 border-white mb-2 object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full mx-auto border-4 border-white mb-2 bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {winner.stageName[0]}
                </div>
              )}
              <p className="font-bold text-xl">{winner.stageName}</p>
              <p className="text-yellow-100 text-sm">{winner.totalVotes.toLocaleString()} votes</p>
            </div>
          )}
          {contest.prizeAmount && (
            <p className="text-center font-bold text-xl">
              💰 {contest.prizeAmount.toLocaleString('fr-FR')} FCFA
            </p>
          )}
          {contest.resultsPublishedAt && (
            <p className="text-center text-yellow-200 text-xs mt-1">
              Publié le {new Date(contest.resultsPublishedAt).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white px-4 pt-10 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy size={24} /> Classement
            </h1>
            <p className="text-yellow-100 text-sm mt-1">
              {contest?.status === 'OPEN' 
                ? 'Mis à jour en temps réel' 
                : contest?.status === 'CLOSED' || contest?.status === 'RESULTS_PUBLISHED'
                  ? 'Classement final'
                  : 'Aucun concours en cours'}
            </p>
          </div>
          <button onClick={load} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-8">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Banner statut concours */}
            {statusBanner()}

            {/* Classement */}
            {entries.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <Trophy size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium">Aucun vote pour l'instant</p>
                <p className="text-gray-400 text-sm mt-1">Soyez le premier à voter !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Label classement final si terminé */}
                {(contest?.status === 'CLOSED' || contest?.status === 'RESULTS_PUBLISHED') && (
                  <div className="text-center py-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Classement final
                    </span>
                  </div>
                )}

                {entries.map((e, i) => (
                  <div
                    key={e.candidateId}
                    className={`bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 transition 
                      ${i === 0 && contest?.status === 'RESULTS_PUBLISHED' ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}
                      ${i === 0 && contest?.status === 'OPEN' ? 'ring-2 ring-yellow-400' : ''}
                    `}
                  >
                    <div className="text-2xl w-8 text-center">
                      {i < 3 ? medals[i] : <span className="text-lg font-bold text-gray-400">#{e.rank}</span>}
                    </div>
                    {e.thumbnailUrl ? (
                      <img src={e.thumbnailUrl} alt={e.stageName}
                        className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                        {e.stageName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{e.stageName}</p>
                      {i === 0 && contest?.status === 'RESULTS_PUBLISHED' && (
                        <span className="text-xs text-yellow-600 font-semibold">🏆 Gagnant</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-pink-600">{e.totalVotes.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <Heart size={10} />votes
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ResultsPage redirige maintenant vers LeaderboardPage
export function ResultsPage() {
  useEffect(() => {
    window.location.href = '/leaderboard';
  }, []);
  return null;
}
