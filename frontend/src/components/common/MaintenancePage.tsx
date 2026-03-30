
export function MaintenancePage({ message }: { message?: string }) {
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
          {message ||
            'La plateforme est temporairement indisponible pour maintenance. Revenez dans quelques instants.'}
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