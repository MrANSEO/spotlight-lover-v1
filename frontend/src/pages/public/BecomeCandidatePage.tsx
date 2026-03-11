import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function BecomeCandidatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    stageName: '',
    bio: '',
    phoneNumber: '',
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [paymentData, setPaymentData] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const validFormats = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validFormats.includes(file.type)) {
      setError('Format vidéo non supporté. Utilisez MP4, WebM ou MOV.');
      return;
    }

    const maxSize = 200 * 1024 * 1024; // 200 MB
    if (file.size > maxSize) {
      setError('Vidéo trop volumineuse (max 200 MB).');
      return;
    }

    setVideoFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Vous devez être connecté pour devenir candidat.');
      navigate('/login');
      return;
    }

    if (!videoFile) {
      setError('Veuillez sélectionner une vidéo.');
      return;
    }

    if (formData.stageName.trim().length < 3) {
      setError('Le nom de scène doit contenir au moins 3 caractères.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Step 1: Upload video to Cloudinary
      const uploadFormData = new FormData();
      uploadFormData.append('file', videoFile);
      uploadFormData.append('type', 'CANDIDATE_VIDEO');

      const uploadResponse = await api.post('/upload/video', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url: videoUrl, thumbnailUrl } = uploadResponse.data;

      // Step 2: Register as candidate (triggers payment)
      const registrationResponse = await api.post('/candidates/register', {
        stageName: formData.stageName,
        bio: formData.bio || null,
        phoneNumber: formData.phoneNumber,
        videoUrl,
        thumbnailUrl,
        paymentProvider: 'MESOMB', // Default payment provider
      });

      const { candidate, payment } = registrationResponse.data;
      
      setPaymentData({
        transactionId: payment.transactionId,
        amount: payment.amount,
        phoneNumber: formData.phoneNumber,
        candidateId: candidate.id,
      });
      
      setStep('payment');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setUploading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await api.get(`/payments/status/${paymentData.transactionId}`);
      const { status } = response.data;

      if (status === 'COMPLETED') {
        setStep('success');
      } else if (status === 'FAILED') {
        setError('Le paiement a échoué. Veuillez réessayer.');
        setStep('form');
      } else {
        // Still pending, check again in 5 seconds
        setTimeout(checkPaymentStatus, 5000);
      }
    } catch (err) {
      console.error('Failed to check payment status:', err);
      setTimeout(checkPaymentStatus, 5000); // Retry
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Devenez Candidat</h1>
        <p className="text-gray-600 mb-8">Vous devez créer un compte pour devenir candidat.</p>
        <a 
          href="/register" 
          className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
        >
          Créer un compte
        </a>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-green-700 mb-4">Félicitations !</h1>
          <p className="text-lg text-gray-700 mb-6">
            Votre inscription est confirmée. Votre vidéo est en cours de modération et sera publiée sous peu.
          </p>
          <button 
            onClick={() => navigate('/feed')}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
          >
            Voir les candidats
          </button>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    // Auto-check payment status
    if (paymentData && !error) {
      setTimeout(checkPaymentStatus, 3000);
    }

    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <div className="text-6xl mb-4">💳</div>
          <h1 className="text-3xl font-bold text-yellow-700 mb-4">Paiement en attente</h1>
          <p className="text-lg text-gray-700 mb-4">
            Montant : <strong className="text-2xl text-purple-600">500 FCFA</strong>
          </p>
          <p className="text-gray-600 mb-6">
            Un message de paiement a été envoyé au <strong>{paymentData?.phoneNumber}</strong>.
            Veuillez valider le paiement sur votre téléphone.
          </p>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Vérification automatique du paiement en cours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold text-center mb-8">🎬 Devenir Candidat</h1>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-lg mb-2">Conditions d'inscription :</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Frais d'inscription : <strong>500 FCFA</strong> (paiement Mobile Money)</li>
          <li>✓ Vidéo de talent (max 90 secondes, 200 MB)</li>
          <li>✓ Formats acceptés : MP4, WebM, MOV</li>
          <li>✓ Votre vidéo sera modérée avant publication</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Nom de scène <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="stageName"
            value={formData.stageName}
            onChange={handleInputChange}
            placeholder="Votre nom d'artiste"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            required
            minLength={3}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Biographie (optionnelle)
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Parlez-nous de vous et de votre talent..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Numéro Mobile Money <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="+237 6XX XXX XXX (MTN/Orange)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Utilisé pour le paiement de l'inscription (500 FCFA)
          </p>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold mb-2">
            Vidéo de talent <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleVideoChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />
          {videoFile && (
            <p className="text-sm text-green-600 mt-2">
              ✓ Vidéo sélectionnée : {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {uploading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Upload en cours...
            </span>
          ) : (
            'Soumettre mon inscription (500 FCFA)'
          )}
        </button>
      </form>
    </div>
  );
}
