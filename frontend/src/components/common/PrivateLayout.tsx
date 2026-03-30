// frontend/src/components/common/PrivateLayout.tsx — VERSION CORRIGÉE
// Remplace intégralement ton fichier existant.
//
// CORRECTIONS :
//   1. Bouton "Déconnexion" ajouté dans la bottom nav mobile (visible pour USER et CANDIDATE)
//   2. Le logout redirige vers '/' (page d'accueil) grâce à window.location.href dans AuthContext

import { Outlet as PrivateOutlet, Link as PrivateLink, useLocation as usePrivateLocation } from 'react-router-dom';
import { useAuth as usePrivateAuth } from '../../contexts/AuthContext';
import { Video, Trophy, User, LayoutDashboard, LogOut, Star } from 'lucide-react';

export function PrivateLayout() {
  const { user, logout } = usePrivateAuth();
  const location = usePrivateLocation();
  const isAdmin = user?.role === 'ADMIN';
  const isCandidate = user?.role === 'CANDIDATE';

  const navItems = [
    { to: '/feed', icon: Video, label: 'Vidéos' },
    { to: '/leaderboard', icon: Trophy, label: 'Top' },
    ...(isCandidate || isAdmin ? [{ to: '/candidate/dashboard', icon: Star, label: 'Mon espace' }] : []),
    { to: '/profile', icon: User, label: 'Profil' },
    ...(isAdmin ? [{ to: '/admin', icon: LayoutDashboard, label: 'Admin' }] : []),
  ];

  const hasBanner = user && !user.isVerified;

  return (
    <div className={`min-h-screen bg-gray-50 ${hasBanner ? 'pt-10' : ''}`}>

      {/* Desktop top nav — admin seulement */}
      {isAdmin && (
        <header className="hidden md:flex bg-white border-b border-gray-200 sticky top-0 z-40">
          <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
            <PrivateLink to="/" className="text-xl font-bold text-purple-700">🎬 SpotLightLover</PrivateLink>
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { to: '/admin', label: 'Dashboard' },
                { to: '/admin/users', label: 'Utilisateurs' },
                { to: '/admin/candidates', label: 'Candidats' },
                { to: '/admin/votes', label: 'Votes' },
                { to: '/admin/contest', label: '🏆 Concours' },
                { to: '/admin/analytics', label: 'Analytics' },
                { to: '/admin/audit-logs', label: 'Audit' },
                { to: '/admin/webhooks', label: 'Webhooks' },
                { to: '/admin/maintenance', label: '🔧 Maintenance' },
              ].map(({ to, label }) => (
                <PrivateLink
                  key={to}
                  to={to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    location.pathname === to
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </PrivateLink>
              ))}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition"
            >
              <LogOut size={16} /> Déconnexion
            </button>
          </nav>
        </header>
      )}

      {/* Main content */}
      <main className="pb-20 md:pb-0">
        <PrivateOutlet />
      </main>

      {/* Mobile bottom nav — USER, CANDIDATE et ADMIN (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden safe-bottom">
        <div className="flex justify-around py-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive =
              location.pathname === to ||
              (to !== '/feed' && location.pathname.startsWith(to));
            return (
              <PrivateLink
                key={to}
                to={to}
                className={`flex flex-col items-center py-2 px-3 min-w-0 transition ${
                  isActive ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-xs mt-0.5 font-medium">{label}</span>
              </PrivateLink>
            );
          })}

          {/* ✅ NOUVEAU : Bouton déconnexion dans la bottom nav mobile */}
          <button
            onClick={logout}
            className="flex flex-col items-center py-2 px-3 min-w-0 transition text-gray-400 hover:text-red-500"
          >
            <LogOut size={22} strokeWidth={1.5} />
            <span className="text-xs mt-0.5 font-medium">Deconnexion</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default PrivateLayout;