import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PublicLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // Pages où on cache le header/footer (flux immersifs)
  const isAuthPage = [
    '/login',
    '/register',
    '/become-candidate',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
  ].includes(pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isAuthPage && (
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-purple-700">
              🎬 SpotLightLover
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-600 hover:text-purple-600 font-medium text-sm transition">
                Accueil
              </Link>
              <Link to="/leaderboard" className="text-gray-600 hover:text-purple-600 font-medium text-sm transition">
                Classement
              </Link>
              <Link to="/results" className="text-gray-600 hover:text-purple-600 font-medium text-sm transition">
                Résultats
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-purple-600 font-medium text-sm transition">
                À propos
              </Link>
              <Link
                to="/become-candidate"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition"
              >
                Devenir Candidat
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <Link
                  to="/feed"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition"
                >
                  Mon espace
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-purple-600 font-medium text-sm transition">
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition"
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {!isAuthPage && (
        <footer className="bg-gray-900 text-white py-10 mt-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <p className="font-bold text-purple-400 text-lg mb-2">🎬 SpotLightLover</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Plateforme de concours vidéo — Afrique francophone.<br />
                  Révélons les talents ensemble.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white mb-3">Navigation</p>
                <div className="space-y-2">
                  {[
                    { to: '/', label: 'Accueil' },
                    { to: '/leaderboard', label: 'Classement' },
                    { to: '/results', label: 'Résultats' },
                    { to: '/about', label: 'À propos' },
                  ].map(({ to, label }) => (
                    <Link key={to} to={to} className="block text-gray-400 hover:text-purple-400 text-sm transition">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-white mb-3">Participer</p>
                <div className="space-y-2">
                  {[
                    { to: '/register', label: 'Créer un compte' },
                    { to: '/become-candidate', label: 'Devenir candidat' },
                    { to: '/login', label: 'Se connecter' },
                  ].map(({ to, label }) => (
                    <Link key={to} to={to} className="block text-gray-400 hover:text-purple-400 text-sm transition">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6 text-center">
              <p className="text-gray-600 text-xs">© 2025 SpotLightLover. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}