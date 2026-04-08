import { useState, useEffect } from 'react';
import { X, Share, Plus } from 'lucide-react';

export default function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Détecte iPhone/iPad
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    // Détecte si déjà installé (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // Vérifie si déjà fermé
    const dismissed = localStorage.getItem('ios-banner-dismissed');

    if (isIOS && !isStandalone && !dismissed) {
      // Affiche après 3 secondes
      setTimeout(() => setShow(true), 3000);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('ios-banner-dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">SL</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Installer SpotLightLover</p>
              <p className="text-xs text-gray-500">Accès rapide depuis votre écran d'accueil</p>
            </div>
          </div>
          <button onClick={dismiss} className="text-gray-400 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 font-bold text-xs">1</span>
            </div>
            <p className="text-sm text-gray-700">
              Appuyez sur <span className="inline-flex items-center gap-1 font-semibold">
                <Share size={14} className="text-blue-500" /> Partager
              </span> en bas de Safari
            </p>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 font-bold text-xs">2</span>
            </div>
            <p className="text-sm text-gray-700">
              Appuyez sur <span className="inline-flex items-center gap-1 font-semibold">
                <Plus size={14} className="text-blue-500" /> Sur l'écran d'accueil
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-700 font-bold text-xs">3</span>
            </div>
            <p className="text-sm text-gray-700">
              Appuyez sur <span className="font-semibold text-green-700">Ajouter</span> — c'est installé !
            </p>
          </div>
        </div>

        <p className="text-xs text-red-500 mt-3 text-center font-medium">
          ⚠️ Fonctionne uniquement sur Safari (pas Chrome/Firefox)
        </p>
      </div>
    </div>
  );
}