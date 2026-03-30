// ═══════════════════════════════════════════════════════════════════════════════
// CandidateDashboardPage.tsx — SpotLightLover
//
// CORRECTION APPLIQUÉE :
//   ❌ AVANT : POST /videos/signature → endpoint inexistant → upload impossible
//   ✅ APRÈS : POST /video/upload/:candidateId avec FormData (multer côté serveur)
//              Le serveur gère lui-même l'upload vers Cloudinary.
//              Plus simple, plus sécurisé (pas de credentials Cloudinary côté client).
//
// La barre de progression est conservée via xhr.upload.onprogress.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  Upload, Trophy, Heart, User, Video, AlertTriangle,
  CheckCircle, Loader, Edit2, Save, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CandidateProfile {
  id: string;
  stageName: string;
  bio: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  createdAt: string;
  totalVotes: number;
  totalAmount: number;
  leaderboardEntry?: {
    rank: number | null;
    totalVotes: number;
    totalAmount: number;
  };
  registrationPayment?: {
    status: string;
    amount: number;
  };
}

interface ProfileFormData {
  stageName: string;
  bio: string;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const MAX_VIDEO_SIZE_MB = 200;
const MAX_VIDEO_DURATION_S = 240;
const MIN_VIDEO_DURATION_S = 10;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CandidateDashboardPage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [uploadState, setUploadState] = useState<{
    status: 'idle' | 'validating' | 'uploading' | 'done' | 'error';
    progress: number;
    error?: string;
    preview?: string;
  }>({ status: 'idle', progress: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>();

  // ─── Chargement du profil ───────────────────────────────────────────────

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/candidates/me');
      setProfile(response.data);
      reset({
        stageName: response.data.stageName,
        bio: response.data.bio || '',
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Profil candidat non trouvé. Votre inscription est peut-être en attente.');
      } else {
        toast.error('Impossible de charger votre profil.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── ✅ CORRECTION : Upload vidéo via POST /video/upload/:id (multer) ────

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset l'input pour permettre de re-sélectionner le même fichier
    e.target.value = '';

    // 1. Validation du type MIME
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: 'Format non supporté. Utilisez MP4, MOV ou WebM.',
      });
      return;
    }

    // 2. Validation de la taille
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_VIDEO_SIZE_MB) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: `Fichier trop volumineux (${sizeMB.toFixed(0)}MB). Maximum : ${MAX_VIDEO_SIZE_MB}MB.`,
      });
      return;
    }

    // 3. Validation de la durée (côté client AVANT upload)
    setUploadState({ status: 'validating', progress: 0 });

    const objectUrl = URL.createObjectURL(file);
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';

    const duration = await new Promise<number>((resolve, reject) => {
      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(videoEl.duration);
      };
      videoEl.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Impossible de lire la vidéo.'));
      };
      videoEl.src = objectUrl;
    }).catch((err) => {
      setUploadState({ status: 'error', progress: 0, error: err.message });
      return -1;
    });

    if (duration === -1) return;

    if (duration < MIN_VIDEO_DURATION_S) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: `Vidéo trop courte (${Math.round(duration)}s). Minimum : ${MIN_VIDEO_DURATION_S}s.`,
      });
      return;
    }

    if (duration > MAX_VIDEO_DURATION_S) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: `Vidéo trop longue (${Math.round(duration)}s). Maximum : ${MAX_VIDEO_DURATION_S}s.`,
      });
      return;
    }

    // 4. Prévisualisation locale
    const previewUrl = URL.createObjectURL(file);
    setUploadState({ status: 'uploading', progress: 0, preview: previewUrl });

    // 5. Upload vers le backend via multer
    await uploadVideoToServer(file);
  };

  const uploadVideoToServer = async (file: File) => {
    if (!profile) return;

    try {
      const formData = new FormData();
      formData.append('video', file); // Le champ s'appelle 'video' (FileInterceptor('video'))

      const accessToken = localStorage.getItem('accessToken');

      // XMLHttpRequest pour suivre la progression
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 95);
            setUploadState((s) => ({ ...s, progress: pct }));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve();
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.message || `Erreur serveur (${xhr.status})`));
            } catch {
              reject(new Error(`Erreur serveur (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Erreur réseau lors de l\'upload.'));

        // ✅ CORRECTION : URL correcte → /video/upload/:candidateId (multer)
        //    AVANT : POST /videos/signature → 404
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        xhr.open('POST', `${API_URL}/video/upload/${profile.id}`);

        if (accessToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        }
        // Header ngrok pour les tests
        xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');

        // Ne pas définir Content-Type manuellement avec FormData
        // Le navigateur le fait avec le bon boundary

        xhr.send(formData);
      });

      setUploadState({ status: 'done', progress: 100 });
      toast.success('✅ Vidéo uploadée avec succès !');

      // Recharger le profil pour afficher la nouvelle vidéo
      await loadProfile();
    } catch (error: any) {
      console.error('Video upload error:', error);
      setUploadState({
        status: 'error',
        progress: 0,
        error: error.message || 'Erreur lors de l\'upload. Réessayez.',
      });
      toast.error('Upload échoué. Réessayez.');
    }
  };

  // ─── Modification du profil ────────────────────────────────────────────

  const onSubmitProfile = async (data: ProfileFormData) => {
    if (!profile) return;
    try {
      await api.patch(`/candidates/${profile.id}`, {
        stageName: data.stageName,
        bio: data.bio,
      });
      toast.success('Profil mis à jour !');
      setEditingProfile(false);
      await loadProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur de mise à jour.');
    }
  };

  // ─── Rendu ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <AlertTriangle size={48} className="text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profil candidat introuvable</h2>
          <p className="text-gray-600">Votre inscription est peut-être en cours de validation.</p>
        </div>
      </div>
    );
  }

  const isActive = profile.status === 'ACTIVE';
  const hasVideo = !!profile.videoUrl;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* ─── Header statut ─────────────────────────────────────────────── */}
      <div className={`rounded-2xl p-5 ${
        isActive
          ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white'
          : 'bg-orange-50 border border-orange-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isActive ? 'text-white' : 'text-gray-900'}`}>
              🎬 {profile.stageName}
            </h1>
            <p className={`text-sm mt-1 ${isActive ? 'text-purple-200' : 'text-orange-700'}`}>
              Statut : <strong>{
                profile.status === 'ACTIVE' ? '✅ Actif' :
                profile.status === 'PENDING_PAYMENT' ? '⏳ En attente de paiement' :
                profile.status === 'PENDING_VALIDATION' ? '🔍 En cours de validation' :
                profile.status === 'SUSPENDED' ? '🚫 Suspendu' : profile.status
              }</strong>
            </p>
          </div>
          {isActive && profile.leaderboardEntry?.rank && (
            <div className="text-center">
              <Trophy size={32} className="text-yellow-300 mx-auto" />
              <p className="text-yellow-200 text-sm font-bold">
                #{profile.leaderboardEntry.rank}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Stats ─────────────────────────────────────────────────────── */}
      {isActive && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <Heart size={28} className="text-red-400 fill-red-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {(profile.leaderboardEntry?.totalVotes || profile.totalVotes || 0).toLocaleString('fr-FR')}
            </p>
            <p className="text-sm text-gray-500 mt-1">Votes reçus</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-3xl font-bold text-purple-700">
              {(profile.leaderboardEntry?.totalAmount || profile.totalAmount || 0).toLocaleString('fr-FR')}
            </p>
            <p className="text-sm text-gray-500 mt-1">FCFA générés</p>
          </div>
        </div>
      )}

      {/* ─── Section Upload Vidéo ───────────────────────────────────────── */}
      {isActive && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <Video size={22} className="text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Ma vidéo</h2>
          </div>

          {/* Vidéo existante */}
          {hasVideo && uploadState.status !== 'done' && (
            <div className="mb-4 rounded-xl overflow-hidden bg-black aspect-video">
              <video
                ref={videoPreviewRef}
                src={profile.videoUrl!}
                controls
                className="w-full h-full object-contain"
                poster={profile.thumbnailUrl || undefined}
              />
            </div>
          )}

          {/* Prévisualisation pendant upload */}
          {uploadState.preview && uploadState.status === 'uploading' && (
            <div className="mb-4 rounded-xl overflow-hidden bg-black aspect-video">
              <video
                src={uploadState.preview}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Zone de drop / sélection */}
          {(uploadState.status === 'idle' || uploadState.status === 'error') && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all group"
            >
              <Upload
                size={36}
                className="text-gray-400 group-hover:text-purple-500 mx-auto mb-3 transition-colors"
              />
              <p className="font-semibold text-gray-700 group-hover:text-purple-700 transition-colors">
                {hasVideo ? 'Remplacer la vidéo' : 'Uploader votre vidéo'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                MP4, MOV ou WebM · {MIN_VIDEO_DURATION_S}s min · {MAX_VIDEO_DURATION_S}s max · {MAX_VIDEO_SIZE_MB}MB max
              </p>
              {uploadState.status === 'error' && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  <p className="text-red-600 text-sm font-medium">
                    ⚠️ {uploadState.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Validation en cours */}
          {uploadState.status === 'validating' && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <Loader size={20} className="text-blue-500 animate-spin" />
              <p className="text-blue-700 font-semibold text-sm">Validation de la vidéo...</p>
            </div>
          )}

          {/* Barre de progression upload */}
          {uploadState.status === 'uploading' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>☁️ Upload en cours...</span>
                <span className="font-bold text-purple-700">{uploadState.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                Ne fermez pas cette page pendant l'upload
              </p>
            </div>
          )}

          {/* Succès upload */}
          {uploadState.status === 'done' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle size={24} className="text-green-500" />
              <p className="text-green-700 font-semibold">Vidéo uploadée avec succès !</p>
              <button
                onClick={() => setUploadState({ status: 'idle', progress: 0 })}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Remplacer
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={handleVideoSelect}
          />
        </div>
      )}

      {/* ─── Profil candidat ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <User size={22} className="text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Mon profil</h2>
          </div>
          {!editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 text-sm font-semibold transition"
            >
              <Edit2 size={14} />
              Modifier
            </button>
          )}
        </div>

        {editingProfile ? (
          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nom de scène *
              </label>
              <input
                {...register('stageName', {
                  required: 'Champ obligatoire',
                  minLength: { value: 2, message: 'Minimum 2 caractères' },
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition"
                placeholder="Votre nom de scène"
              />
              {errors.stageName && (
                <p className="text-red-500 text-xs mt-1">{errors.stageName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Biographie
              </label>
              <textarea
                {...register('bio', { maxLength: { value: 500, message: '500 caractères max' } })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition resize-none"
                placeholder="Parlez de vous, de votre talent..."
              />
              {errors.bio && (
                <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setEditingProfile(false); reset(); }}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <X size={16} /> Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Enregistrer
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <span className="font-semibold text-gray-500">Nom de scène</span>
              <p className="text-gray-900 font-bold text-base mt-0.5">{profile.stageName}</p>
            </div>
            {profile.bio && (
              <div>
                <span className="font-semibold text-gray-500">Biographie</span>
                <p className="mt-0.5 leading-relaxed">{profile.bio}</p>
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-500">Membre depuis</span>
              <p className="mt-0.5">
                {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Message si pas encore actif */}
      {!isActive && profile.status !== 'SUSPENDED' && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex gap-3">
            <AlertTriangle size={24} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-orange-800 mb-1">Compte en attente</h3>
              <p className="text-orange-700 text-sm leading-relaxed">
                {profile.status === 'PENDING_PAYMENT'
                  ? 'Votre paiement de 500 FCFA n\'a pas encore été confirmé. Si vous avez payé, attendez quelques minutes.'
                  : 'Votre profil est en cours de validation par notre équipe. Vous serez notifié par email.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}