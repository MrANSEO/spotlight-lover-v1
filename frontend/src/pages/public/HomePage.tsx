import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-purple-600 mb-6">
            Spotlight Lover
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            La plateforme de concours vidéo monétisé #1 en Afrique francophone
          </p>
          <div className="space-x-4">
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-lg"
            >
              Commencer maintenant
            </Link>
            <Link
              to="/login"
              className="inline-block px-8 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-50 text-lg"
            >
              Se connecter
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-xl font-bold mb-2">Devenez Candidat</h3>
            <p className="text-gray-600">Inscrivez-vous et partagez votre talent avec le monde entier</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">❤️</div>
            <h3 className="text-xl font-bold mb-2">Votez pour vos favoris</h3>
            <p className="text-gray-600">Soutenez vos candidats préférés en votant (100 FCFA par vote)</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">Gagnez des prix</h3>
            <p className="text-gray-600">Les meilleurs candidats remportent des récompenses incroyables</p>
          </div>
        </div>
      </div>
    </div>
  );
}
