// frontend/src/pages/admin/AdminContestPage.tsx — VERSION CORRIGÉE
// Remplace intégralement ton fichier existant.
//
// CORRECTION problème 3 :
//   Le bouton "Créer un nouveau concours" apparaît maintenant :
//   - Quand aucun concours n'existe (null)
//   - Quand le concours est en RESULTS_PUBLISHED (concours terminé)
//   Avant, il n'apparaissait que quand contest === null.

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Play, Square, Star, Save, Loader, CheckCircle,
  AlertTriangle, Plus, Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Contest {
  id: string;
  title: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'RESULTS_PUBLISHED';
  startDate: string | null;
  endDate: string | null;
  prizeAmount: number | null;
  prizeDescription: string | null;
  resultsPublishedAt: string | null;
}

interface LeaderEntry {
  rank: number;
  candidateId: string;
  stageName: string;
  thumbnailUrl?: string;
  totalVotes: number;
  totalAmount: number;
}

interface ContestFormData {
  title: string;
  startDate: string;
  endDate: string;
  prizeAmount: number;
  prizeDescription: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:             { label: '📝 Brouillon',        color: 'bg-gray-100 text-gray-700' },
  OPEN:              { label: '🟢 Ouvert aux votes',  color: 'bg-green-100 text-green-700' },
  CLOSED:            { label: '🔴 Clôturé',           color: 'bg-red-100 text-red-700' },
  RESULTS_PUBLISHED: { label: '🏆 Résultats publiés', color: 'bg-yellow-100 text-yellow-700' },
};

export default function AdminContestPage() {
  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } =
    useForm<ContestFormData>();

  const { register: registerCreate, handleSubmit: handleCreateSubmit, reset: resetCreate, formState: { isSubmitting: isCreating } } =
    useForm<ContestFormData>({ defaultValues: { prizeAmount: 50000 } });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contestRes, leaderRes] = await Promise.all([
        api.get('/contest').catch(() => ({ data: null })),
        api.get('/leaderboard?limit=10').catch(() => ({ data: { entries: [] } })),
      ]);
      setContest(contestRes.data);
      setLeaderboard(leaderRes.data.entries || []);

      if (contestRes.data) {
        reset({
          title: contestRes.data.title,
          startDate: contestRes.data.startDate?.split('T')[0] || '',
          endDate: contestRes.data.endDate?.split('T')[0] || '',
          prizeAmount: contestRes.data.prizeAmount || 0,
          prizeDescription: contestRes.data.prizeDescription || '',
        });
      }
    } catch {
      toast.error('Impossible de charger les données du concours.');
    } finally {
      setLoading(false);
    }
  };

  const onCreateContest = async (data: ContestFormData) => {
    try {
      await api.post('/contest', {
        title: data.title,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        prizeAmount: Number(data.prizeAmount),
        prizeDescription: data.prizeDescription,
      });
      toast.success('✅ Concours créé ! Ouvrez-le pour accepter les votes.');
      setCreateMode(false);
      resetCreate();
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création.');
    }
  };

  const onSaveContest = async (data: ContestFormData) => {
    try {
      await api.patch(`/contest/${contest?.id}`, {
        title: data.title,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        prizeAmount: Number(data.prizeAmount),
        prizeDescription: data.prizeDescription,
      });
      toast.success('Concours mis à jour !');
      setEditMode(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    }
  };
  
  //----------------------------startNewSeason--------------------------------------
  
  const startNewSeason = async () => {
  if (!contest) return;
  
  const confirmDelete = window.confirm(
    '⚠️ ATTENTION — Nouvelle saison\n\n' +
    'Cette action va :\n' +
    '• Archiver toutes les données de cette saison\n' +
    '• Supprimer toutes les vidéos des candidats\n' +
    '• Remettre tous les candidats en attente de paiement\n' +
    '• Vider tous les votes\n\n' +
    'Voulez-vous SUPPRIMER les vidéos Cloudinary ? (Recommandé pour éviter les surcoûts)'
  );
  
  const deleteVideos = confirmDelete;
  
  const finalConfirm = window.confirm(
    `✅ Confirmer le démarrage de la nouvelle saison ?\n\n` +
    `Saison archivée : "${contest.title}"\n` +
    `Vidéos : ${deleteVideos ? 'SUPPRIMÉES' : 'conservées'}\n\n` +
    `Cette action est IRRÉVERSIBLE.`
  );
  
  if (!finalConfirm) return;
  
  setActionLoading('new-season');
  try {
    const res = await api.post('/contest/new-season', {
      contestId: contest.id,
      deleteVideos,
    });
    toast.success('✅ Nouvelle saison démarrée ! Données archivées.');
    await loadData();
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Erreur.');
  } finally {
    setActionLoading(null);
  }
};
  
  //------------------------------------------------------------------

  const changeStatus = async (newStatus: string) => {
    const confirmMessages: Record<string, string> = {
      OPEN:              'Ouvrir le concours aux votes ?',
      CLOSED:            'Clôturer le concours ? Les votes seront arrêtés.',
      RESULTS_PUBLISHED: 'Publier les résultats officiels ? Cette action est définitive.',
    };
    if (!window.confirm(confirmMessages[newStatus] || `Passer en statut ${newStatus} ?`)) return;

    setActionLoading(newStatus);
    try {
      await api.patch(`/contest/${contest?.id}/status`, { status: newStatus });
      toast.success('Statut mis à jour !');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // ─── Formulaire de création (affiché quand pas de concours OU concours terminé) ───

  const showCreatePanel = !contest || contest.status === 'RESULTS_PUBLISHED';

  if (showCreatePanel && createMode) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🏆 Nouveau concours</h1>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <form onSubmit={handleCreateSubmit(onCreateContest)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre *</label>
              <input
                {...registerCreate('title', { required: 'Titre requis' })}
                placeholder="Ex : SpotLightLover — Saison 2"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date de début</label>
                <input type="date" {...registerCreate('startDate')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date de fin</label>
                <input type="date" {...registerCreate('endDate')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix (FCFA)</label>
                <input type="number" {...registerCreate('prizeAmount', { min: 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description du prix</label>
                <input {...registerCreate('prizeDescription')} placeholder="Ex : Trophée + 50 000 FCFA"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isCreating}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition disabled:opacity-60">
                {isCreating ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                Créer le concours
              </button>
              <button type="button" onClick={() => setCreateMode(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── Pas de concours + pas en mode création ─────────────────────────────────

  if (!contest) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🏆 Gestion du concours</h1>
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <Trophy size={48} className="text-purple-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun concours</h2>
          <p className="text-gray-500 mb-6 text-sm">Il n'y a pas encore de concours. Créez-en un pour commencer.</p>
          <button onClick={() => setCreateMode(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition mx-auto">
            <Plus size={18} /> Créer un concours
          </button>
        </div>
      </div>
    );
  }

  // ─── Concours existant ───────────────────────────────────────────────────────

  const statusCfg = STATUS_LABELS[contest.status] || STATUS_LABELS.DRAFT;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">🏆 Gestion du concours</h1>

      {/* ─── Statut + Actions ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{contest.title}</h2>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>

          <div className="flex gap-3 flex-wrap">
            {contest.status === 'DRAFT' && (
              <button onClick={() => changeStatus('OPEN')} disabled={actionLoading === 'OPEN'}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition disabled:opacity-60">
                {actionLoading === 'OPEN' ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
                Ouvrir le concours
              </button>
            )}
            {contest.status === 'OPEN' && (
              <button onClick={() => changeStatus('CLOSED')} disabled={actionLoading === 'CLOSED'}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition disabled:opacity-60">
                {actionLoading === 'CLOSED' ? <Loader size={16} className="animate-spin" /> : <Square size={16} />}
                Clôturer
              </button>
            )}
            {contest.status === 'CLOSED' && (
              <button onClick={() => changeStatus('RESULTS_PUBLISHED')} disabled={actionLoading === 'RESULTS_PUBLISHED'}
                className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 text-white rounded-xl font-semibold text-sm hover:bg-yellow-600 transition disabled:opacity-60">
                {actionLoading === 'RESULTS_PUBLISHED' ? <Loader size={16} className="animate-spin" /> : <Star size={16} />}
                Publier les résultats
              </button>
            )}
            {/* ✅ CORRECTION : bouton créer visible quand le concours est terminé */}
            {contest.status === 'RESULTS_PUBLISHED' && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-100 text-yellow-700 rounded-xl font-semibold text-sm">
                  <CheckCircle size={16} />
                  Résultats publiés le {new Date(contest.resultsPublishedAt!).toLocaleDateString('fr-FR')}
                </div>
                <button onClick={() => setCreateMode(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition">
                  <Plus size={16} /> Nouveau concours
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-1">Début</p>
            <p className="font-semibold">{contest.startDate ? new Date(contest.startDate).toLocaleDateString('fr-FR') : '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-1">Fin</p>
            <p className="font-semibold">{contest.endDate ? new Date(contest.endDate).toLocaleDateString('fr-FR') : '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-1">Prix</p>
            <p className="font-semibold text-purple-700">{contest.prizeAmount?.toLocaleString('fr-FR') || '—'} FCFA</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-1">Description</p>
            <p className="font-semibold truncate">{contest.prizeDescription || '—'}</p>
          </div>
        </div>

        <button onClick={() => setEditMode((v) => !v)} className="mt-4 text-sm text-purple-600 hover:underline">
          {editMode ? '← Annuler' : '✏️ Modifier les informations'}
        </button>
      </div>

      {/* ─── Formulaire édition ──────────────────────────────────────────── */}
      {editMode && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-5">Modifier le concours</h2>
          <form onSubmit={handleSubmit(onSaveContest)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre *</label>
              <input {...register('title', { required: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date de début</label>
                <input type="date" {...register('startDate')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date de fin</label>
                <input type="date" {...register('endDate')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix (FCFA)</label>
                <input type="number" {...register('prizeAmount', { min: 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <input {...register('prizeDescription')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-sm" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition disabled:opacity-60">
              {isSubmitting ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              Enregistrer
            </button>
          </form>
        </div>
      )}
      
	      {contest.status === 'RESULTS_PUBLISHED' && (
	  <button
	    onClick={startNewSeason}
	    disabled={actionLoading === 'new-season'}
	    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-60"
	  >
	    {actionLoading === 'new-season'
	      ? <Loader size={16} className="animate-spin" />
	      : '🔄'}
	    Démarrer nouvelle saison
	  </button>
	)}

      {/* ─── Classement ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">🏅 Classement actuel (Top 10)</h2>
          <button onClick={loadData} className="text-xs text-purple-600 hover:underline">Actualiser</button>
        </div>
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Aucun vote enregistré pour le moment.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {leaderboard.map((e, i) => (
              <div key={e.candidateId} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 text-center">
                  {i < 3
                    ? <span className="text-xl">{['🥇', '🥈', '🥉'][i]}</span>
                    : <span className="font-bold text-gray-400 text-sm">#{e.rank}</span>}
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 flex-shrink-0">
                  {e.stageName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{e.stageName}</p>
                  
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-pink-600">{e.totalVotes.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">votes</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
