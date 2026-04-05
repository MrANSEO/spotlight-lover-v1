import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Heart, Video, Star, ChevronRight } from 'lucide-react';
import api from '../../services/api';

interface TopCandidate {
  rank: number;
  stageName: string;
  thumbnailUrl?: string;
  totalVotes: number;
}

export default function HomePage() {
  const [topCandidates, setTopCandidates] = useState<TopCandidate[]>([]);
  
  const [contest, setContest] = useState<any>(null);

	useEffect(() => {
	  api.get('/contest/current').then(r => setContest(r.data)).catch(() => {});
	}, []);

  useEffect(() => {
    api.get('/leaderboard?limit=3').then((r) => {
      setTopCandidates(r.data.entries?.slice(0, 3) || []);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 text-white px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Le concours vidéo<br />qui récompense les talents
        </h1>
        <p className="text-purple-200 text-lg mb-8 max-w-md mx-auto">
          Votez pour vos candidats favoris. Gagnez des prix. Faites briller votre talent.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/feed" className="px-8 py-4 bg-white text-purple-700 rounded-2xl font-bold text-lg hover:bg-purple-50 transition">
            Voir les vidéos 🎥
          </Link>
          <Link to="/become-candidate" className="px-8 py-4 bg-purple-800 text-white rounded-2xl font-bold text-lg hover:bg-purple-900 transition border border-purple-500">
            Participer — 500 FCFA
          </Link>
        </div>
      </section>
      
      {/* Banner concours */}
	{contest && (
	  <div className={`px-4 py-3 text-center text-white text-sm font-semibold ${
	    contest.status === 'OPEN' ? 'bg-green-600' :
	    contest.status === 'CLOSED' ? 'bg-red-600' :
	    contest.status === 'RESULTS_PUBLISHED' ? 'bg-yellow-500' : 'bg-gray-600'
	  }`}>
	    {contest.status === 'OPEN' && `🟢 ${contest.title} en cours — Prix : ${contest.prizeAmount?.toLocaleString('fr-FR')} FCFA`}
	    {contest.status === 'CLOSED' && `🔴 ${contest.title} terminé — Résultats à venir`}
	    {contest.status === 'RESULTS_PUBLISHED' && `🏆 Résultats de ${contest.title} disponibles !`}
	  </div>
	)}
      

      {/* How it works */}
      <section className="px-4 py-16 bg-white">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Comment ça marche ?</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Star, title: 'Inscrivez-vous', desc: 'Payez 500 FCFA via Mobile Money et créez votre profil candidat.', color: 'bg-purple-100 text-purple-600' },
            { icon: Video, title: 'Uploadez votre vidéo', desc: 'Partagez votre talent en 60 à 90 secondes maximum.', color: 'bg-pink-100 text-pink-600' },
            { icon: Heart, title: 'Récoltez des votes', desc: 'Chaque vote coûte 100 FCFA. Plus vous avez de votes, plus vous avancez.', color: 'bg-orange-100 text-orange-600' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="text-center p-6 rounded-2xl bg-gray-50">
              <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4`}>
                <Icon size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top 3 */}
      {topCandidates.length > 0 && (
        <section className="px-4 py-16 bg-gray-50">
          <div className="flex items-center justify-between mb-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={24} /> Top candidats
            </h2>
            <Link to="/leaderboard" className="text-purple-600 text-sm font-semibold flex items-center gap-1">
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {topCandidates.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm text-center">
                <div className="text-3xl mb-2">{['🥇', '🥈', '🥉'][i]}</div>
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt={c.stageName} className="w-16 h-16 rounded-full mx-auto object-cover mb-3" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 font-bold text-xl flex items-center justify-center mx-auto mb-3">
                    {c.stageName[0]}
                  </div>
                )}
                <p className="font-bold text-gray-900">{c.stageName}</p>
                <p className="text-pink-600 font-semibold mt-1 flex items-center justify-center gap-1">
                  <Heart size={14} /> {c.totalVotes.toLocaleString()} votes
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-4 py-16 bg-gradient-to-br from-purple-700 to-pink-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Prêt à voter ?</h2>
        <p className="text-purple-200 mb-8">Soutenez vos talents préférés. 100 FCFA par vote via Mobile Money.</p>
        <Link to="/register" className="inline-block px-8 py-4 bg-white text-purple-700 rounded-2xl font-bold text-lg hover:bg-purple-50 transition">
          Créer un compte gratuit
        </Link>
      </section>
    </div>
  );
}
