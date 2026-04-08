import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Lock, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Gift, Copy, ExternalLink } from 'lucide-react';

interface ProfileForm { firstName: string; lastName: string; phone: string; email: string; }
interface PasswordForm { currentPassword: string; newPassword: string; confirmPassword: string; }

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'profile' | 'password' | 'danger'>('profile');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const profileForm = useForm<ProfileForm>({
    defaultValues: { firstName: user?.firstName || '', lastName: user?.lastName || '', phone: '', email: user?.email || '' },
  });
  const passwordForm = useForm<PasswordForm>();
  
	  // Ajoute après const passwordForm = useForm<PasswordForm>();
	useEffect(() => {
	  const loadProfile = async () => {
	    try {
	      const res = await api.get('/me');
	      profileForm.reset({
		firstName: res.data.firstName || '',
		lastName: res.data.lastName || '',
		phone: res.data.phone || '',
		email: res.data.email || '',
	      });
	    } catch {}
	  };
	  loadProfile();
	}, []);
  
	const saveProfile = async (data: ProfileForm) => {
	  setLoading(true);
	  try {
	    await api.patch('/me', data);
	    await refreshUser();
	    // ← ajoute ces lignes pour recharger le formulaire
	    const res = await api.get('/me');
	    profileForm.reset({
	      firstName: res.data.firstName || '',
	      lastName: res.data.lastName || '',
	      phone: res.data.phone || '',
	      email: res.data.email || '',
	    });
	    toast.success('Profil mis à jour !');
	  } catch (err: any) {
	    toast.error(err.response?.data?.message || 'Erreur.');
	  } finally { setLoading(false); }
	};

  const changePassword = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    try {
      await api.patch('/me', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Mot de passe modifié !');
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mot de passe actuel incorrect.');
    } finally { setLoading(false); }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete('/me');
      logout();
      toast.success('Compte supprimé.');
      navigate('/');
    } catch { toast.error('Erreur lors de la suppression.'); }
    finally { setLoading(false); }
  };

	 const tabs: { id: 'profile' | 'password' | 'danger'; icon: any; label: string }[] = [
	  { id: 'profile', icon: User, label: 'Profil' },
	  { id: 'password', icon: Lock, label: user?.googleId ? 'Définir MDP' : 'Mot de passe' },
	  { id: 'danger', icon: Trash2, label: 'Compte' },
	];
	
	const [referralStats, setReferralStats] = useState<any>(null);

	// Ajoute ce useEffect :
	useEffect(() => {
	  api.get('/referral/stats').then(r => setReferralStats(r.data)).catch(() => {});
	}, []);
	

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-700 to-pink-600 text-white px-4 pt-10 pb-16">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold">{user?.firstName || 'Mon profil'} {user?.lastName || ''}</h1>
            <p className="text-purple-200 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{user?.role}</span>
          </div>
        </div>
      </div>
      
      

      <div className="px-4 -mt-6">
      
      {user?.role === 'USER' && (
  <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-bold text-gray-900">🎬 Devenir candidat</p>
        <p className="text-sm text-gray-500 mt-0.5">Participez au concours et gagnez des prix</p>
      </div>
      <Link
        to="/become-candidate"
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition flex-shrink-0"
      >
        S'inscrire →
      </Link>
    </div>
  </div>
)}

{/* ─── Section Parrainage ─── */}
{referralStats && (
  <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
    <div className="flex items-center gap-2 mb-3">
      <Gift size={18} className="text-purple-600" />
      <p className="font-bold text-gray-900">Parrainage</p>
      <span className="ml-auto px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
        💰 {referralStats.walletBalance} FCFA
      </span>
    </div>

    <p className="text-xs text-gray-500 mb-3">
      Invitez vos amis et gagnez <strong>50 FCFA</strong> par inscription !
    </p>

    {/* Lien de parrainage */}
    <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 mb-3">
      <p className="flex-1 text-xs text-gray-700 truncate font-mono">
        {referralStats.referralLink}
      </p>
      <button
        onClick={() => {
          navigator.clipboard.writeText(referralStats.referralLink);
          toast.success('Lien copié !');
        }}
        className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition flex-shrink-0"
      >
        <Copy size={14} />
      </button>
    </div>

  {/* Boutons de partage */}

<div className="space-y-2 mb-3">

  

  {/* WhatsApp */}

  <a

    href={`https://wa.me/?text=${encodeURIComponent(`🎬 Rejoins SpotLightLover et vote pour tes talents préférés ! Inscris-toi ici : ${referralStats.referralLink}`)}`}

    target="_blank"

    rel="noopener noreferrer"

    className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition"

  >

    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">

      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>

      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.089.534 4.049 1.475 5.762L.057 23.5l5.91-1.395A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.643-.518-5.148-1.419l-.369-.219-3.816.901.963-3.67-.241-.379A9.934 9.934 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>

    </svg>

    Partager sur WhatsApp

  </a>

  {/* Facebook */}

  <a

    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralStats.referralLink)}`}

    target="_blank"

    rel="noopener noreferrer"

    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"

  >

    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">

      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>

    </svg>

    Partager sur Facebook

  </a>

  {/* TikTok — pas d'API de partage direct, on copie le lien */}

  <button

    onClick={() => {

      navigator.clipboard.writeText(

        `🎬 Rejoins SpotLightLover ! Vote pour tes talents préférés 🎤🏆\n👉 ${referralStats.referralLink}`

      );

      toast.success('Texte copié ! Colle-le dans ta bio TikTok ou un post');

    }}

    className="w-full flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition"

  >

    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">

      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.84 1.56V6.81a4.85 4.85 0 01-1.07-.12z"/>

    </svg>

    Copier pour TikTok / Instagram

  </button>



</div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-2 text-center">
      <div className="bg-purple-50 rounded-xl p-2">
        <p className="text-lg font-bold text-purple-700">{referralStats.totalReferrals}</p>
        <p className="text-xs text-gray-500">Amis invités</p>
      </div>
      <div className="bg-green-50 rounded-xl p-2">
        <p className="text-lg font-bold text-green-700">{referralStats.totalEarned} FCFA</p>
        <p className="text-xs text-gray-500">Crédits gagnés</p>
      </div>
    </div>
  </div>
)}
      
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0 transition ${tab === id ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={tab === id ? 'text-purple-600' : 'text-gray-400'} />
                <span className={`font-medium ${tab === id ? 'text-purple-700' : 'text-gray-700'}`}>{label}</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Informations personnelles</h2>
            <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Prénom</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base" {...profileForm.register('firstName')} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nom</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base" {...profileForm.register('lastName')} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base" {...profileForm.register('email')} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
                <input type="tel" placeholder="6XXXXXXXX" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base" {...profileForm.register('phone')} />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 size={16} className="animate-spin" />}
                Enregistrer
              </button>
            </form>
          </div>
        )}

      {/* Password Tab */}
	{tab === 'password' && (
	  <div className="bg-white rounded-2xl shadow-sm p-5">
	    <h2 className="font-bold text-gray-900 mb-4">
	      {user?.googleId ? '🔐 Définir un mot de passe' : 'Changer le mot de passe'}
	    </h2>

	    {/* Info pour users Google */}
	    {user?.googleId && (
	      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
		<p className="text-blue-700 text-sm">
		  Votre compte utilise Google. Définissez un mot de passe pour pouvoir vous connecter aussi par email.
		</p>
	      </div>
	    )}

	    <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4">
	      {/* Champ mot de passe actuel — seulement si pas Google */}
	      {!user?.googleId && (
		<div>
		  <label className="block text-sm text-gray-600 mb-1">Mot de passe actuel</label>
		  <input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base" placeholder="••••••••"
		    {...passwordForm.register('currentPassword', { required: !user?.googleId })} />
		</div>
	      )}
	      <div>
		<label className="block text-sm text-gray-600 mb-1">Nouveau mot de passe</label>
		<input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base" placeholder="••••••••"
		  {...passwordForm.register('newPassword', { required: true, minLength: 8 })} />
	      </div>
	      <div>
		<label className="block text-sm text-gray-600 mb-1">Confirmer le mot de passe</label>
		<input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base" placeholder="••••••••"
		  {...passwordForm.register('confirmPassword', { required: true })} />
	      </div>
	      <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
		{loading && <Loader2 size={16} className="animate-spin" />}
		{user?.googleId ? 'Définir mon mot de passe' : 'Changer le mot de passe'}
	      </button>
	    </form>
	  </div>
	)}

        {/* Danger Tab */}
        {tab === 'danger' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-red-600 mb-2">Zone dangereuse</h2>
            <p className="text-sm text-gray-600 mb-5">La suppression de votre compte est irréversible. Toutes vos données seront effacées.</p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold flex items-center justify-center gap-2">
                <Trash2 size={16} /> Supprimer mon compte
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  ⚠️ Êtes-vous sûr ? Cette action est définitive et ne peut pas être annulée.
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold">Annuler</button>
                  <button onClick={deleteAccount} disabled={loading} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    Confirmer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
