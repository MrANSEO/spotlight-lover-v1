// frontend/src/components/common/PrivateLayout.tsx
// VERSION CORRIGÉE — Mobile + Desktop

import {
  Outlet,
  Link,
  useLocation,
} from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Video,
  Trophy,
  User,
  LayoutDashboard,
  LogOut,
  Star,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export function PrivateLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isCandidate = user?.role === 'CANDIDATE';

  // Pages immersives — pas de nav desktop (feed vidéo plein écran)
  const isImmersive = location.pathname === '/feed';

  const navItems = [
    { to: '/feed', icon: Video, label: 'Vidéos' },
    { to: '/leaderboard', icon: Trophy, label: 'Classement' },
    ...(isCandidate || isAdmin
      ? [{ to: '/candidate/dashboard', icon: Star, label: 'Mon espace' }]
      : []),
    { to: '/profile', icon: User, label: 'Profil' },
    ...(isAdmin
      ? [{ to: '/admin', icon: LayoutDashboard, label: 'Admin' }]
      : []),
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'Utilisateurs' },
    { to: '/admin/candidates', label: 'Candidats' },
    { to: '/admin/votes', label: 'Votes' },
    { to: '/admin/contest', label: '🏆 Concours' },
    { to: '/admin/analytics', label: 'Analytics' },
    { to: '/admin/audit-logs', label: 'Audit' },
    { to: '/admin/webhooks', label: 'Webhooks' },
    { to: '/admin/maintenance', label: '🔧 Maintenance' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ═══════════════════════════════════════════════════════
          HEADER DESKTOP — visible md+ sur toutes les pages
          sauf le feed immersif
      ═══════════════════════════════════════════════════════ */}
      {!isImmersive && (
        <header className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <nav className="container mx-auto px-6 py-3 flex items-center justify-between">

            {/* Logo */}
            <Link to="/feed" className="text-xl font-bold text-purple-700 flex items-center gap-2 flex-shrink-0">
              🎬 SpotLightLover
            </Link>

            {/* Navigation centrale */}
            <div className="flex items-center gap-1">
              {isAdmin
                ? adminLinks.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        location.pathname === to
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </Link>
                  ))
                : navItems.map(({ to, icon: Icon, label }) => {
                    const isActive =
                      location.pathname === to ||
                      (to !== '/feed' && location.pathname.startsWith(to));
                    return (
                      <Link
                        key={to}
                        to={to}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                          isActive
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
                        {label}
                      </Link>
                    );
                  })}
            </div>

            {/* Droite — infos user + déconnexion */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.firstName || ''}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user?.firstName || user?.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={15} />
                Déconnexion
              </button>
            </div>
          </nav>
        </header>
      )}

      {/* Sur le feed desktop — nav flottante discrète en haut */}
      {isImmersive && (
        <div className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl px-4 py-2 flex items-center gap-2 border border-white/10">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button
              onClick={logout}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs text-white/60 hover:text-red-400 transition"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          CONTENU PRINCIPAL
      ═══════════════════════════════════════════════════════ */}
      <main className={`${!isImmersive ? 'pb-20 md:pb-0' : ''}`}>
        <Outlet />
      </main>

      {/* ═══════════════════════════════════════════════════════
          BOTTOM NAV MOBILE — visible uniquement sur mobile
      ═══════════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden safe-bottom">
        <div className="flex justify-around py-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive =
              location.pathname === to ||
              (to !== '/feed' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center py-2 px-3 min-w-0 transition ${
                  isActive ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-xs mt-0.5 font-medium">{label}</span>
              </Link>
            );
          })}

          {/* Déconnexion */}
          <button
            onClick={logout}
            className="flex flex-col items-center py-2 px-3 min-w-0 transition text-gray-400 hover:text-red-500"
          >
            <LogOut size={22} strokeWidth={1.5} />
            <span className="text-xs mt-0.5 font-medium">Quitter</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default PrivateLayout;