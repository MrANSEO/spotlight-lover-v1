import { useState, useEffect } from 'react';
import api from '../../services/api';

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    try {
      const params = filter !== 'ALL' ? `?role=${filter}` : '';
      const response = await api.get(`/users${params}`);
      setUsers(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`${currentStatus ? 'Désactiver' : 'Activer'} cet utilisateur ?`)) return;

    try {
      await api.patch(`/users/${userId}/toggle-status`);
      alert('Statut mis à jour !');
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Échec de la mise à jour');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Supprimer définitivement cet utilisateur ? Cette action est irréversible.')) return;

    try {
      await api.delete(`/users/${userId}`);
      alert('Utilisateur supprimé !');
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Échec de la suppression');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">👥 Gestion des Utilisateurs</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <span className="font-semibold">Filtrer par rôle :</span>
          {['ALL', 'USER', 'CANDIDATE', 'ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => setFilter(role)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === role
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Rôle</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date d'inscription</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{user.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                    user.role === 'CANDIDATE' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                    className={`px-3 py-1 rounded ${
                      user.isActive
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun utilisateur trouvé.
          </div>
        )}
      </div>
    </div>
  );
}
