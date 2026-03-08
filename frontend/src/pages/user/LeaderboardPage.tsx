import { useState, useEffect } from 'react';
import api from '../../services/api';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
    
    // Setup Socket.IO for real-time updates
    const newSocket = io(`${WS_URL}/leaderboard`);

    newSocket.on('leaderboardUpdate', (data) => {
      setLeaderboard(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await api.get('/leaderboard?limit=20');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        🏆 Classement en temps réel
      </h1>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-purple-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Rang</th>
              <th className="px-4 py-3 text-left">Candidat</th>
              <th className="px-4 py-3 text-right">Votes</th>
              <th className="px-4 py-3 text-right">Montant (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry: any) => (
              <tr key={entry.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-bold">
                  {entry.rank === 1 && '🥇'}
                  {entry.rank === 2 && '🥈'}
                  {entry.rank === 3 && '🥉'}
                  {entry.rank > 3 && entry.rank}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    {entry.candidate.thumbnailUrl && (
                      <img
                        src={entry.candidate.thumbnailUrl}
                        alt={entry.candidate.stageName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <span className="font-medium">{entry.candidate.stageName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{entry.totalVotes}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  {entry.totalAmount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
