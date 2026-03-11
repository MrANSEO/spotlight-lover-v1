import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PrivateLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/feed" className="text-2xl font-bold text-purple-600">
              🎬 Spotlight Lover
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/feed" className="text-gray-700 hover:text-purple-600 font-medium">
                📱 Feed
              </Link>
              <Link to="/video-feed" className="text-gray-700 hover:text-purple-600 font-medium">
                🎥 Vidéos
              </Link>
              <Link to="/leaderboard" className="text-gray-700 hover:text-purple-600 font-medium">
                🏆 Classement
              </Link>
              <Link to="/profile" className="text-gray-700 hover:text-purple-600 font-medium">
                👤 Profil
              </Link>
              
              {user?.role === 'ADMIN' && (
                <div className="relative group">
                  <button className="text-gray-700 hover:text-purple-600 font-medium">
                    🛡️ Admin
                  </button>
                  <div className="absolute hidden group-hover:block bg-white shadow-lg rounded-lg mt-2 py-2 w-48 z-10">
                    <Link 
                      to="/admin" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📊 Dashboard
                    </Link>
                    <Link 
                      to="/admin/users" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      👥 Utilisateurs
                    </Link>
                    <Link 
                      to="/admin/candidates" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🎬 Candidats
                    </Link>
                    <Link 
                      to="/admin/webhooks" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🔔 Webhooks
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="pb-16">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
        <div className="flex justify-around py-2">
          <Link to="/feed" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-purple-600">
            <span className="text-2xl">📱</span>
            <span className="text-xs mt-1">Feed</span>
          </Link>
          <Link to="/video-feed" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-purple-600">
            <span className="text-2xl">🎥</span>
            <span className="text-xs mt-1">Vidéos</span>
          </Link>
          <Link to="/leaderboard" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-purple-600">
            <span className="text-2xl">🏆</span>
            <span className="text-xs mt-1">Classement</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-purple-600">
            <span className="text-2xl">👤</span>
            <span className="text-xs mt-1">Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
