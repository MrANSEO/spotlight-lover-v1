import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            🎬 Bienvenue sur Spotlight Lover
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            La première plateforme de concours vidéo mobile-first pour l'Afrique francophone.
            Révélez votre talent et montez sur scène !
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
            <Link 
              to="/become-candidate" 
              className="px-8 py-4 bg-white text-purple-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              🎤 Devenir Candidat (500 FCFA)
            </Link>
            <Link 
              to="/gallery" 
              className="px-8 py-4 bg-purple-800 text-white rounded-lg font-bold text-lg hover:bg-purple-900 transition"
            >
              🎥 Voir les Talents
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Comment ça marche ?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-purple-50 rounded-lg shadow-lg">
              <div className="text-6xl mb-4">📹</div>
              <h3 className="text-2xl font-bold mb-4 text-purple-600">1. Inscrivez-vous</h3>
              <p className="text-gray-700">
                Créez votre compte gratuitement, puis devenez candidat pour <strong>500 FCFA</strong> 
                et uploadez votre vidéo de talent (max 90 secondes).
              </p>
            </div>

            <div className="text-center p-8 bg-purple-50 rounded-lg shadow-lg">
              <div className="text-6xl mb-4">❤️</div>
              <h3 className="text-2xl font-bold mb-4 text-purple-600">2. Recevez des votes</h3>
              <p className="text-gray-700">
                Partagez votre profil avec vos amis et fans. Chaque vote coûte <strong>100 FCFA</strong> 
                via Mobile Money (MTN/Orange).
              </p>
            </div>

            <div className="text-center p-8 bg-purple-50 rounded-lg shadow-lg">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold mb-4 text-purple-600">3. Gagnez des prix</h3>
              <p className="text-gray-700">
                Montez dans le classement en temps réel et remportez des récompenses exclusives. 
                Plus vous avez de votes, plus vous êtes visible !
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Nos Chiffres</h2>
          
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-5xl font-bold text-purple-600 mb-2">1,000+</div>
              <p className="text-gray-600 text-lg">Candidats inscrits</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-5xl font-bold text-purple-600 mb-2">50,000+</div>
              <p className="text-gray-600 text-lg">Votes enregistrés</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-5xl font-bold text-purple-600 mb-2">5M+</div>
              <p className="text-gray-600 text-lg">FCFA distribués</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-5xl font-bold text-purple-600 mb-2">10+</div>
              <p className="text-gray-600 text-lg">Pays africains</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Nos Valeurs</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start space-x-4 p-6 bg-purple-50 rounded-lg">
              <span className="text-4xl">✓</span>
              <div>
                <h3 className="text-xl font-bold mb-2">Transparence</h3>
                <p className="text-gray-700">
                  Classement en temps réel, audité et sécurisé. Tous les votes sont vérifiés.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-purple-50 rounded-lg">
              <span className="text-4xl">✓</span>
              <div>
                <h3 className="text-xl font-bold mb-2">Équité</h3>
                <p className="text-gray-700">
                  Modération stricte, détection anti-fraude pour garantir un concours juste.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-purple-50 rounded-lg">
              <span className="text-4xl">✓</span>
              <div>
                <h3 className="text-xl font-bold mb-2">Accessibilité</h3>
                <p className="text-gray-700">
                  Mobile-first, paiements Mobile Money. Aucune carte bancaire nécessaire.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-purple-50 rounded-lg">
              <span className="text-4xl">✓</span>
              <div>
                <h3 className="text-xl font-bold mb-2">Communauté</h3>
                <p className="text-gray-700">
                  Une plateforme pour TOUTE l'Afrique francophone. Unis par le talent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prêt à briller sur scène ?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de talents qui ont déjà franchi le pas. 
            Votre moment est maintenant !
          </p>
          <Link 
            to="/register" 
            className="inline-block px-10 py-5 bg-white text-purple-600 rounded-lg font-bold text-xl hover:bg-gray-100 transition shadow-lg"
          >
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>
    </div>
  );
}
