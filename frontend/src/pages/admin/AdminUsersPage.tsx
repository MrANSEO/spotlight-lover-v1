import { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, UserX, ChevronLeft, ChevronRight, Loader, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: 'USER' | 'CANDIDATE' | 'ADMIN';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin: string | null;
  _count?: {
    votesGiven: number;
    transactions: number;
  };
  totalSpent?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLE_CONFIG = {
  USER:      { label: 'Utilisateur', color: 'bg-blue-100 text-blue-700' },
  CANDIDATE: { label: 'Candidat',    color: 'bg-purple-100 text-purple-700' },
  ADMIN:     { label: 'Admin',       color: 'bg-red-100 text-red-700' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        ...(search && { search }),
        ...(roleFilter !== 'ALL' && { role: roleFilter }),
      });
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.data || res.data);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      toast.error('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(1), 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  // ─── Activer / Désactiver un compte ──────────────────────────────────

  const toggleUserStatus = async (userId: string, currentStatus: boolean, email: string) => {
    const action = currentStatus ? 'désactiver' : 'activer';
    if (!window.confirm(`Voulez-vous ${action} le compte de ${email} ?`)) return;

    setActionLoading(userId);
    try {
      await api.patch(`/users/${userId}`, { isActive: !currentStatus });
      toast.success(`Compte ${currentStatus ? 'désactivé' : 'activé'} !`);
      loadUsers(pagination.page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">👥 Gestion des utilisateurs</h1>
        <button
          onClick={() => loadUsers(pagination.page)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* ─── Filtres ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 border border-gray-300 rounded-xl px-3 py-2.5 focus-within:border-purple-500 transition">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher par email ou nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-900"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'USER', 'CANDIDATE', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                roleFilter === r
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r === 'ALL' ? 'Tous' : ROLE_CONFIG[r as keyof typeof ROLE_CONFIG]?.label || r}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Compteur ─────────────────────────────────────────────────── */}
      <p className="text-sm text-gray-500">
        {pagination.total} utilisateur{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}
      </p>

      {/* ─── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader className="w-7 h-7 animate-spin text-purple-600" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-sm">Aucun utilisateur trouvé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisateur</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rôle</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Votes donnés</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Inscription</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => {
                  const roleCfg = ROLE_CONFIG[user.role];
                  const isLoading = actionLoading === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                            {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {user.firstName || ''} {user.lastName || ''}
                              {!user.firstName && !user.lastName && <span className="text-gray-400 font-normal">Sans nom</span>}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleCfg.color}`}>
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${
                            user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.isActive ? '✅ Actif' : '❌ Désactivé'}
                          </span>
                          {!user.isVerified && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 w-fit">
                              ⚠️ Non vérifié
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span className="font-semibold text-pink-600">
                          {user._count?.votesGiven || 0}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">votes</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        {user.lastLogin && (
                          <p className="text-gray-400">
                            Dernière co. : {new Date(user.lastLogin).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {/* Détails */}
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
                          >
                            Détails
                          </button>

                          {/* Activer / Désactiver (pas sur les admins) */}
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={() => toggleUserStatus(user.id, user.isActive, user.email)}
                              disabled={isLoading}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-60 flex items-center gap-1 ${
                                user.isActive
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {isLoading
                                ? <Loader size={12} className="animate-spin" />
                                : user.isActive
                                  ? <><UserX size={12} /> Désactiver</>
                                  : <><UserCheck size={12} /> Activer</>}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Pagination ───────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} / {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => loadUsers(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            <button
              onClick={() => loadUsers(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal détails utilisateur ────────────────────────────────── */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg">
                  {(selectedUser.firstName?.[0] || selectedUser.email[0]).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { label: 'ID', value: selectedUser.id.slice(0, 12) + '...', mono: true },
                { label: 'Rôle', value: ROLE_CONFIG[selectedUser.role].label },
                { label: 'Téléphone', value: selectedUser.phone || '—' },
                { label: 'Email vérifié', value: selectedUser.isVerified ? '✅ Oui' : '❌ Non' },
                { label: 'Statut', value: selectedUser.isActive ? '✅ Actif' : '❌ Désactivé' },
                { label: 'Votes donnés', value: `${selectedUser._count?.votesGiven || 0} votes` },
                { label: 'Inscription', value: new Date(selectedUser.createdAt).toLocaleString('fr-FR') },
                { label: 'Dernière connexion', value: selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString('fr-FR') : '—' },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">{label}</span>
                  <span className={`text-gray-900 font-semibold ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
                </div>
              ))}
            </div>

            {selectedUser.role !== 'ADMIN' && (
              <button
                onClick={() => {
                  toggleUserStatus(selectedUser.id, selectedUser.isActive, selectedUser.email);
                  setSelectedUser(null);
                }}
                className={`mt-5 w-full py-3 rounded-xl font-semibold text-sm transition ${
                  selectedUser.isActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {selectedUser.isActive ? '❌ Désactiver ce compte' : '✅ Activer ce compte'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
