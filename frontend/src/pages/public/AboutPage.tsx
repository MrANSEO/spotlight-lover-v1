import { Link } from 'react-router-dom';
import { Star, Heart, Trophy, Shield, Smartphone, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-700 to-pink-600 text-white px-4 py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">À propos de SpotLightLover</h1>
        <p className="text-purple-200 text-lg max-w-xl mx-auto leading-relaxed">
          La première plateforme de concours vidéo mobile-first dédiée à l'Afrique francophone.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* Mission */}
        <section>
          <h2 className="text-2xl font-bold text-purple-700 mb-4">Notre Mission</h2>
          <p className="text-gray-700 leading-relaxed text-lg">
            SpotLightLover révèle les talents cachés et donne à chacun la chance de briller.
            Notre plateforme connecte des artistes, danseurs, chanteurs et créatifs avec une
            audience passionnée prête à soutenir leurs rêves via Mobile Money.
          </p>
        </section>

        {/* Comment ça marche */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Star,
                step: '1',
                title: 'Inscrivez-vous',
                desc: 'Devenez candidat pour 500 FCFA et uploadez votre vidéo de talent (max 90s).',
                color: 'bg-purple-100 text-purple-600',
              },
              {
                icon: Heart,
                step: '2',
                title: 'Recevez des votes',
                desc: 'Partagez votre profil. Chaque vote coûte 100 FCFA via Mobile Money (MTN/Orange).',
                color: 'bg-pink-100 text-pink-600',
              },
              {
                icon: Trophy,
                step: '3',
                title: 'Gagnez des prix',
                desc: 'Montez dans le classement en temps réel et remportez des récompenses exclusives.',
                color: 'bg-yellow-100 text-yellow-600',
              },
            ].map(({ icon: Icon, step, title, desc, color }) => (
              <div key={step} className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon size={26} />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Étape {step}</span>
                <h3 className="font-bold text-gray-900 text-lg mt-1 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Valeurs */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Nos Valeurs</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Shield, title: 'Transparence', desc: 'Classement en temps réel, audité et sécurisé. Chaque vote est tracé.' },
              { icon: Users, title: 'Équité', desc: 'Modération stricte, détection anti-fraude, zéro tolérance pour la triche.' },
              { icon: Smartphone, title: 'Accessibilité', desc: 'Mobile-first, paiements Mobile Money. Conçu pour l\'Afrique, par l\'Afrique.' },
              { icon: Trophy, title: 'Excellence', desc: 'Récompenses réelles, concours sérieux, une communauté qui valorise le talent.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-purple-700 to-pink-600 rounded-3xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Rejoignez l'aventure !</h2>
          <p className="text-purple-200 mb-6 leading-relaxed">
            Que vous soyez danseur, chanteur, comédien ou artiste en herbe,<br />
            SpotLightLover est votre scène.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* ✅ CORRECTION : Link au lieu de <a href> pour la navigation interne */}
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-purple-700 rounded-2xl font-bold hover:bg-purple-50 transition"
            >
              Créer mon compte gratuitement
            </Link>
            <Link
              to="/become-candidate"
              className="px-8 py-3 bg-purple-800 text-white rounded-2xl font-bold hover:bg-purple-900 transition border border-purple-500"
            >
              Devenir candidat — 500 FCFA
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
