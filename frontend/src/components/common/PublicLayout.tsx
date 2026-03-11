import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-purple-600">
              🎬 Spotlight Lover
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-700 hover:text-purple-600 font-medium">
                Accueil
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-purple-600 font-medium">
                À propos
              </Link>
              <Link to="/gallery" className="text-gray-700 hover:text-purple-600 font-medium">
                Galerie
              </Link>
              <Link 
                to="/become-candidate" 
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Devenir Candidat
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-purple-600 font-medium"
              >
                Connexion
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                S'inscrire
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2026 Spotlight Lover - Plateforme de concours vidéo pour l'Afrique francophone
          </p>
          <div className="mt-4 flex justify-center space-x-6 text-sm">
            <Link to="/about" className="hover:text-purple-400">À propos</Link>
            <a href="#" className="hover:text-purple-400">Conditions d'utilisation</a>
            <a href="#" className="hover:text-purple-400">Confidentialité</a>
            <a href="#" className="hover:text-purple-400">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
