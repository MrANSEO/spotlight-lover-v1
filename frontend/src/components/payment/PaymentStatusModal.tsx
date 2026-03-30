import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2, Smartphone } from 'lucide-react';
import api from '../../services/api';

interface Props {
  transactionId: string;
  amount: number;
  onSuccess: () => void;
  onFailure: () => void;
  onClose: () => void;
  candidateName?: string;
}

type TxStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PENDING'| 'CANCELLED';

export default function PaymentStatusModal({
  transactionId,
  amount,
  onSuccess,
  onFailure,
  onClose,
  candidateName,
}: Props) {
  const [status, setStatus] = useState<TxStatus>('PROCESSING');
  const [dots, setDots] = useState('.');
  const [elapsed, setElapsed] = useState(0);

  // Animate dots
  useEffect(() => {
    if (status !== 'PROCESSING' && status !== 'PENDING') return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '.' : d + '.')), 500);
    return () => clearInterval(t);
  }, [status]);

  // Elapsed timer
  useEffect(() => {
    if (status !== 'PROCESSING' && status !== 'PENDING') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Poll every 3 seconds
  const poll = useCallback(async () => {
    try {
      const res = await api.get(`/payments/transaction/${transactionId}/status`);
      const s: TxStatus = res.data.status;
      if (s === 'COMPLETED') {
        setStatus('COMPLETED');
        setTimeout(onSuccess, 1500);
      } else if (s === 'FAILED' || s === 'CANCELLED') {
        setStatus('FAILED');
        setTimeout(onFailure, 2000);
      }
    } catch {
      // silently retry
    }
  }, [transactionId, onSuccess, onFailure]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 3000);
    // Timeout après 3 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setStatus('FAILED');
      setTimeout(onFailure, 2000);
    }, 3 * 60 * 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [poll]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">

        {/* PENDING / PROCESSING */}
        {(status === 'PROCESSING' || status === 'PENDING') && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Confirmez sur votre téléphone
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Une notification USSD a été envoyée.{'\n'}
              Entrez votre code PIN Mobile Money pour valider.
            </p>
            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <p className="text-3xl font-bold text-purple-700">
                {amount.toLocaleString('fr-FR')} FCFA
              </p>
              {candidateName && (
                <p className="text-sm text-purple-600 mt-1">pour {candidateName}</p>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>En attente de confirmation{dots}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{elapsed}s</p>
            <button
              onClick={onClose}
              className="mt-4 text-xs text-gray-400 underline"
            >
              Annuler
            </button>
          </>
        )}

        {/* SUCCESS */}
        {status === 'COMPLETED' && (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Paiement confirmé !</h3>
            <p className="text-gray-600 text-sm">
              {candidateName
                ? `Votre vote pour ${candidateName} a été validé.`
                : 'Votre compte candidat est maintenant actif.'}
            </p>
          </>
        )}

        {/* FAILED */}
        {status === 'FAILED' && (
          <>
            <div className="flex justify-center mb-4">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Paiement échoué</h3>
            <p className="text-gray-600 text-sm mb-6">
              Le paiement n'a pas pu être confirmé. Vérifiez votre solde Mobile Money et réessayez.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
            >
              Fermer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
