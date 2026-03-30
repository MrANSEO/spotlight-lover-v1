import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useState, useEffect } from 'react';
import AdminMaintenancePage from './pages/admin/AdminMaintenancePage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';
// ─── Layouts ─────────────────────────────────────────────────────────────────
import PublicLayout from './components/common/PublicLayout';
import PrivateLayout from './components/common/PrivateLayout';

// ─── Pages publiques ─────────────────────────────────────────────────────────
import HomePage from './pages/public/HomePage';
import BecomeCandidatePage from './pages/public/BecomeCandidatePage';
import AboutPage from './pages/public/AboutPage';

// ─── Pages auth ──────────────────────────────────────────────────────────────
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// ─── Pages user ──────────────────────────────────────────────────────────────
import VideoFeedPage from './pages/user/VideoFeedPage';
import ProfilePage from './pages/user/ProfilePage';
import { LeaderboardPage, ResultsPage } from './pages/user/LeaderboardAndResultsPages';

// ─── Pages candidat ──────────────────────────────────────────────────────────
import CandidateDashboardPage from './pages/candidate/CandidateDashboardPage';

// ─── Pages admin ─────────────────────────────────────────────────────────────
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCandidatesPage from './pages/admin/AdminCandidatesPage';
import AdminVotesPage from './pages/admin/AdminVotesPage';
import AdminWebhooksPage from './pages/admin/AdminWebhooksPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminContestPage from './pages/admin/AdminContestPage';

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({
  children,
  adminOnly = false,
  candidateOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  candidateOnly?: boolean;
}) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/feed" replace />;
  if (candidateOnly && user.role !== 'CANDIDATE' && user.role !== 'ADMIN')
    return <Navigate to="/feed" replace />;

  return <>{children}</>;
};

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  // ✅ AJOUT : état maintenance
  const [maintenanceInfo, setMaintenanceInfo] = useState<{ message: string } | null>(null);

  // ✅ AJOUT : écoute événement backend
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setMaintenanceInfo(detail);
    };

    window.addEventListener('app:maintenance', handler);
    return () => window.removeEventListener('app:maintenance', handler);
  }, []);

  // ✅ AJOUT : écran maintenance
  if (maintenanceInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔧</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Maintenance en cours
          </h1>
          <p className="text-gray-500 leading-relaxed mb-6">
            {maintenanceInfo.message ||
              'La plateforme est temporairement indisponible. Revenez dans quelques instants.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', fontSize: '14px' },
          }}
        />

        <Routes>
          {/* ─── Routes publiques ──────────────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/become-candidate" element={<BecomeCandidatePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* ─── Routes protégées user ─────────────────────────────────── */}
          <Route element={<PrivateLayout />}>
            <Route
              path="/feed"
              element={<ProtectedRoute><VideoFeedPage /></ProtectedRoute>}
            />
            <Route
              path="/leaderboard"
              element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>}
            />
            <Route
              path="/profile"
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />

            {/* ─── Candidat ────────────────────────────────────────────── */}
            <Route
              path="/candidate/dashboard"
              element={<ProtectedRoute candidateOnly><CandidateDashboardPage /></ProtectedRoute>}
            />

            {/* ─── Admin ───────────────────────────────────────────────── */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/admin/candidates" element={<ProtectedRoute adminOnly><AdminCandidatesPage /></ProtectedRoute>} />
            <Route path="/admin/votes" element={<ProtectedRoute adminOnly><AdminVotesPage /></ProtectedRoute>} />
            <Route path="/admin/webhooks" element={<ProtectedRoute adminOnly><AdminWebhooksPage /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AdminAnalyticsPage /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute adminOnly><AdminAuditLogsPage /></ProtectedRoute>} />
            <Route path="/admin/contest" element={<ProtectedRoute adminOnly><AdminContestPage /></ProtectedRoute>} />

            {/* ✅ NOUVELLE ROUTE MAINTENANCE */}
            <Route
              path="/admin/maintenance"
              element={
                <ProtectedRoute adminOnly>
                  <AdminMaintenancePage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;