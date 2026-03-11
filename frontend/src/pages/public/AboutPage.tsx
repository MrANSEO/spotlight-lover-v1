export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">À propos de Spotlight Lover</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">Notre Mission</h2>
          <p className="text-gray-700 leading-relaxed">
            Spotlight Lover est la première plateforme de concours vidéo mobile-first dédiée à l'Afrique francophone. 
            Notre mission est de révéler les talents cachés et de donner à chacun la chance de briller sur scène.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="text-4xl mb-4">📹</div>
              <h3 className="font-bold mb-2">1. Inscrivez-vous</h3>
              <p className="text-sm text-gray-600">
                Devenez candidat pour 500 FCFA et uploadez votre vidéo de talent (max 90s).
              </p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="text-4xl mb-4">❤️</div>
              <h3 className="font-bold mb-2">2. Recevez des votes</h3>
              <p className="text-sm text-gray-600">
                Partagez votre profil. Chaque vote coûte 100 FCFA via Mobile Money (MTN/Orange).
              </p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="font-bold mb-2">3. Gagnez des prix</h3>
              <p className="text-sm text-gray-600">
                Montez dans le classement en temps réel et remportez des récompenses exclusives.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">Nos Valeurs</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">✓</span>
              <span><strong>Transparence :</strong> Classement en temps réel, audité et sécurisé</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">✓</span>
              <span><strong>Équité :</strong> Modération stricte, détection anti-fraude</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">✓</span>
              <span><strong>Accessibilité :</strong> Mobile-first, paiements Mobile Money</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">✓</span>
              <span><strong>Communauté :</strong> Une plateforme pour TOUTE l'Afrique francophone</span>
            </li>
          </ul>
        </section>

        <section className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-semibold mb-4">Rejoignez l'aventure !</h2>
          <p className="text-gray-700 mb-6">
            Que vous soyez danseur, chanteur, comédien ou artiste en herbe, Spotlight Lover est votre scène.
          </p>
          <a 
            href="/register" 
            className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Créer mon compte gratuitement
          </a>
        </section>
      </div>
    </div>
  );
}
