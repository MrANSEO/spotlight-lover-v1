import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PrivateLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/feed" className="text-2xl font-bold text-purple-600">
              Spotlight Lover
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/feed" className="text-gray-700 hover:text-purple-600">
                Feed
              </Link>
              <Link to="/leaderboard" className="text-gray-700 hover:text-purple-600">
                Leaderboard
              </Link>
              <Link to="/profile" className="text-gray-700 hover:text-purple-600">
                Profile
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="text-gray-700 hover:text-purple-600">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
      
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg md:hidden">
        <div className="flex justify-around py-3">
          <Link to="/feed" className="text-center">
            <div className="text-2xl">🏠</div>
            <div className="text-xs">Feed</div>
          </Link>
          <Link to="/leaderboard" className="text-center">
            <div className="text-2xl">🏆</div>
            <div className="text-xs">Leaderboard</div>
          </Link>
          <Link to="/profile" className="text-center">
            <div className="text-2xl">👤</div>
            <div className="text-xs">Profile</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
