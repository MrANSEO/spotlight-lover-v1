import { useAuth } from '../../contexts/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold mb-8">Mon Profil</h1>

      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-lg">{user?.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Nom</label>
            <p className="text-lg">{user?.firstName} {user?.lastName}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Rôle</label>
            <p className="text-lg">
              <span className={`px-3 py-1 rounded-full text-sm ${
                user?.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                user?.role === 'CANDIDATE' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user?.role}
              </span>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Authentification 2FA</label>
            <p className="text-lg">
              {user?.twoFactorEnabled ? (
                <span className="text-green-600">✔ Activé</span>
              ) : (
                <span className="text-gray-400">❌ Désactivé</span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {user?.role !== 'CANDIDATE' && (
            <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              🎬 Devenir Candidat (500 FCFA)
            </button>
          )}
          
          {!user?.twoFactorEnabled && (
            <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              🔒 Activer l'authentification 2FA
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
