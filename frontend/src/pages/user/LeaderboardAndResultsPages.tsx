// ═══════════════════════════════════════════════════════════
// LeaderboardPage.tsx
// ═══════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { Trophy, Heart, Loader2, RefreshCw } from 'lucide-react';
import api from '../../services/api';

interface LeaderEntry {
  rank: number;
  candidateId: string;
  stageName: string;
  thumbnailUrl?: string;
  totalVotes: number;
  totalAmount: number;
}

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setInterval(load, 30000); // Refresh every 30s
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      const res = await api.get('/leaderboard');
      setEntries(res.data.entries || res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white px-4 pt-10 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy size={24} /> Classement</h1>
            <p className="text-yellow-100 text-sm mt-1">Mis à jour en temps réel</p>
          </div>
          <button onClick={load} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-8">
        {loading ? (
          <div className="flex justify-center pt-16"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Trophy size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">Aucun vote pour l'instant</p>
            <p className="text-gray-400 text-sm mt-1">Soyez le premier à voter !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((e, i) => (
              <div
                key={e.candidateId}
                className={`bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 transition ${i === 0 ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <div className="text-2xl w-8 text-center">
                  {i < 3 ? medals[i] : <span className="text-lg font-bold text-gray-400">#{e.rank}</span>}
                </div>
                {e.thumbnailUrl ? (
                  <img src={e.thumbnailUrl} alt={e.stageName} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                    {e.stageName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{e.stageName}</p>
                  <p className="text-sm text-gray-500">{e.totalAmount.toLocaleString('fr-FR')} FCFA collectés</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-pink-600">{e.totalVotes.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end"><Heart size={10} />votes</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ResultsPage.tsx — Résultats officiels publiés par l'admin
// ═══════════════════════════════════════════════════════════
interface PublicResults {
  published: boolean;
  message?: string;
  contest?: { title: string; endDate: string; prizeAmount: number; prizeDescription?: string; resultsPublishedAt: string };
  winner?: { rank: number; stageName: string; thumbnailUrl?: string; totalVotes: number };
  leaderboard?: { rank: number; stageName: string; thumbnailUrl?: string; totalVotes: number }[];
}

export function ResultsPage() {
  const [data, setData] = useState<PublicResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/contest/results')
      .then((r) => setData(r.data))
      .catch(() => setData({ published: false, message: 'Résultats non disponibles.' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-32"><Loader2 className="w-8 h-8 text-purple-600 animate-spin" /></div>;

  if (!data?.published) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <Trophy size={64} className="text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700">Résultats non encore disponibles</h2>
      <p className="text-gray-500 mt-2">{data?.message || 'Le concours est en cours. Revenez plus tard !'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-purple-700 to-pink-600 text-white text-center px-4 pt-12 pb-20">
        <Trophy size={48} className="mx-auto mb-3 text-yellow-300" />
        <h1 className="text-3xl font-bold">Résultats Officiels</h1>
        {data.contest && (
          <>
            <p className="text-purple-200 mt-1">{data.contest.title}</p>
            <p className="text-xs text-purple-300 mt-1">Publié le {new Date(data.contest.resultsPublishedAt).toLocaleDateString('fr-FR')}</p>
          </>
        )}
      </div>

      <div className="px-4 -mt-12 space-y-4">
        {/* Winner */}
        {data.winner && (
          <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-3xl p-6 text-center text-white shadow-lg">
            <p className="text-4xl mb-2">🏆</p>
            <p className="text-lg font-bold mb-1">Gagnant du concours</p>
            {data.winner.thumbnailUrl ? (
              <img src={data.winner.thumbnailUrl} alt={data.winner.stageName} className="w-20 h-20 rounded-full mx-auto border-4 border-white mb-3 object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto border-4 border-white mb-3 bg-white/20 flex items-center justify-center text-3xl font-bold">
                {data.winner.stageName[0]}
              </div>
            )}
            <p className="text-2xl font-bold">{data.winner.stageName}</p>
            <p className="text-yellow-100 mt-1">{data.winner.totalVotes.toLocaleString()} votes</p>
            {data.contest?.prizeAmount && (
              <p className="mt-3 text-xl font-bold">{data.contest.prizeAmount.toLocaleString('fr-FR')} FCFA 💰</p>
            )}
          </div>
        )}

        {/* Full leaderboard */}
        {data.leaderboard && data.leaderboard.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Classement final</h2>
            </div>
            {data.leaderboard.map((e, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
                <span className="font-bold text-gray-500 w-6 text-center">#{e.rank}</span>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                  {e.stageName[0]}
                </div>
                <p className="flex-1 font-semibold text-gray-900">{e.stageName}</p>
                <p className="text-pink-600 font-bold">{e.totalVotes.toLocaleString()} <span className="text-xs font-normal text-gray-400">votes</span></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
