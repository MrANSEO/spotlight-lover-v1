import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-purple-600">
            Spotlight Lover
          </Link>
          <div className="space-x-4">
            {user ? (
              <Link
                to="/feed"
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Feed
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-purple-600 hover:text-purple-800"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
