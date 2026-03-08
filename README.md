# 🎬 Spotlight Lover - Plateforme de Concours Vidéo Monétisé

## 📋 Vue d'ensemble
**Spotlight Lover** est une plateforme de concours vidéo monétisé ciblant l'Afrique francophone, avec un focus mobile-first.

### Caractéristiques principales
- ✅ Inscription candidat payante (500 FCFA)
- ✅ Système de vote payant illimité (100 FCFA/vote)
- ✅ Paiements via MeSomb (MTN/Orange) et Stripe
- ✅ Leaderboard temps réel avec Socket.IO
- ✅ Upload vidéo sécurisé via Cloudinary
- ✅ Modération admin complète
- ✅ Anti-fraude et audit logs

---

## 🏗️ Architecture Technique

### Backend
- **Framework**: NestJS + TypeScript
- **Base de données**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (access + refresh tokens) + 2FA optionnel
- **Paiements**: MeSomb (prioritaire) + Stripe
- **Upload**: Cloudinary
- **Temps réel**: Socket.IO
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Routing**: React Router v6
- **HTTP**: Axios
- **WebSocket**: socket.io-client
- **UI**: Mobile-first, responsive

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone <repo-url>
cd webapp

# Backend
cd backend
npm install
cp .env.example .env
# Configurer les variables d'environnement dans .env

# Générer Prisma Client
npx prisma generate

# Créer et migrer la base de données
npx prisma migrate dev

# Démarrer le backend
npm run start:dev

# Frontend (dans un nouveau terminal)
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

### Avec Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Accéder aux services
Backend: http://localhost:3000
Frontend: http://localhost:5173
Swagger: http://localhost:3000/api/docs
```

---

## 📁 Structure du Projet

```
webapp/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # Module d'authentification
│   │   ├── users/          # Gestion utilisateurs
│   │   ├── candidates/     # Gestion candidats
│   │   ├── upload/         # Upload vidéo Cloudinary
│   │   ├── votes/          # Système de vote
│   │   ├── payments/       # Intégration paiements
│   │   ├── webhooks/       # Webhooks providers
│   │   ├── leaderboard/    # Classement temps réel
│   │   ├── analytics/      # Statistiques admin
│   │   ├── health/         # Health checks
│   │   └── common/         # Guards, decorators, filters
│   ├── prisma/
│   │   └── schema.prisma   # Modèle de données
│   └── test/               # Tests E2E
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── services/       # Services API
│   │   └── utils/          # Utilitaires
│   └── public/             # Assets statiques
│
└── docker-compose.yml      # Configuration Docker
```

---

## 🗄️ Modèle de Données

### Entités Principales
- **User**: Utilisateurs (USER, CANDIDATE, ADMIN)
- **Candidate**: Candidats au concours
- **CandidateRegistrationPayment**: Paiements d'inscription
- **Vote**: Votes des utilisateurs
- **Transaction**: Historique des transactions
- **LeaderboardEntry**: Classement temps réel
- **SystemSetting**: Configuration système
- **AuditLog**: Logs d'audit admin
- **DailyStats**: Statistiques quotidiennes
- **WebhookLog**: Logs webhooks paiements
- **IpBlacklist**: Liste noire IP anti-fraude

---

## 🔐 Sécurité

### Implémentation
- Hash passwords: **bcrypt** (10 rounds)
- JWT access token: 15 minutes
- JWT refresh token: 7 jours avec rotation
- RBAC Guards: USER / CANDIDATE / ADMIN
- Rate limiting global + endpoints sensibles
- Audit logs pour toutes actions admin
- Anti-fraude:
  - Blacklist IP temporaire/permanente
  - Velocity checks (votes/minute)
  - Device/IP heuristics
  - Détection anomalies géographiques

---

## 💳 Paiements

### Providers Supportés
1. **MeSomb** (Prioritaire - MTN + Orange Money)
2. **Stripe** (Cartes bancaires)

### Montants (FCFA - XOF)
- Inscription candidat: **500 FCFA**
- Vote: **100 FCFA** (illimité)

### Flow de Paiement
1. Utilisateur initie paiement
2. Transaction créée avec status PENDING
3. Redirection vers provider de paiement
4. Webhook reçu → validation signature
5. Transaction confirmée → vote/inscription validé
6. Leaderboard mis à jour en temps réel

### Gestion des Erreurs
- Idempotence stricte (idempotency keys)
- Job de réconciliation (webhooks manqués)
- Retry contrôlé pour timeouts
- Logs exhaustifs pour debugging

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Profil utilisateur
- `POST /api/auth/2fa/setup` - Configuration 2FA

### Candidates
- `GET /api/candidates` - Liste candidats
- `POST /api/candidates` - Créer candidature
- `PATCH /api/candidates/:id/validate` - Valider (admin)
- `PATCH /api/candidates/:id/suspend` - Suspendre (admin)

### Votes
- `POST /api/votes` - Voter pour un candidat
- `GET /api/votes/my-votes` - Mes votes
- `GET /api/votes/candidate/:id/stats` - Statistiques candidat

### Leaderboard
- `GET /api/leaderboard` - Classement complet
- `GET /api/leaderboard/top/:limit` - Top N candidats
- `POST /api/leaderboard/recalculate` - Recalcul (admin)

### Webhooks
- `POST /api/webhooks/mesomb` - Webhook MeSomb
- `POST /api/webhooks/stripe` - Webhook Stripe

**Documentation complète**: http://localhost:3000/api/docs

---

## 🎯 Statut du Développement

### ✅ Complété (Itération 1)
- [x] Structure monorepo backend/frontend
- [x] Configuration NestJS + Prisma
- [x] Schéma de base de données complet
- [x] Configuration Docker + docker-compose
- [x] Setup React + Vite
- [x] Variables d'environnement
- [x] Git initialization

### ⏳ En cours
- [ ] Module Auth (JWT + 2FA)
- [ ] Module Users + Guards RBAC
- [ ] Module Candidates
- [ ] Module Upload (Cloudinary)
- [ ] Module Payments (MeSomb + Stripe)
- [ ] Module Votes
- [ ] Webhooks avec idempotence
- [ ] Leaderboard temps réel (Socket.IO)
- [ ] Frontend complet
- [ ] Tests E2E

### 🎯 Prochaines Étapes
1. **Itération 2**: Auth + Users + Guards RBAC
2. **Itération 3**: Candidates + Upload + Payments
3. **Itération 4**: Votes + Webhooks + Transactions
4. **Itération 5**: Leaderboard + Analytics + Admin
5. **Itération 6**: Frontend React complet
6. **Itération 7**: Tests + Documentation

---

## 🌍 Déploiement Railway

### Configuration Railway
```bash
# Créer projet Railway
railway init

# Ajouter PostgreSQL
railway add --plugin postgresql

# Déployer backend
cd backend
railway up

# Variables d'environnement à configurer sur Railway:
- DATABASE_URL (auto-configuré)
- JWT_SECRET
- JWT_REFRESH_SECRET
- MESOMB_APP_KEY
- MESOMB_API_KEY
- MESOMB_SECRET_KEY
- STRIPE_SECRET_KEY
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- FRONTEND_URL
```

### URLs Production
- **Backend API**: `https://spotlight-backend.up.railway.app`
- **Frontend**: `https://spotlight-frontend.up.railway.app`
- **Swagger**: `https://spotlight-backend.up.railway.app/api/docs`

---

## 🧪 Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Tests Critiques Requis
- ✅ Parcours candidature + paiement + activation
- ✅ Vote + webhook + leaderboard update
- ✅ Gestion webhook en double (idempotence)
- ✅ Auth refresh token rotation

---

## 📊 Monitoring & Observabilité

- **Logs structurés**: requestId, userId, transactionId
- **Sentry**: Erreurs backend + frontend
- **Health check**: `/api/health`
- **Swagger**: Documentation API auto-générée

---

## 📝 Licence & Contact

**Projet**: Spotlight Lover  
**Type**: Production-ready (pas un prototype)  
**Cible**: Afrique francophone, mobile-first  
**Monnaie**: FCFA (XOF)

---

## 🚨 Règles Business (Non Négociables)

1. ✅ Inscription candidat = **500 FCFA** obligatoire
2. ✅ Vote = **100 FCFA** par vote, illimité
3. ✅ Vote validé UNIQUEMENT après confirmation paiement
4. ✅ Candidat validé UNIQUEMENT après paiement inscription
5. ✅ Admin modère candidats/vidéos/votes
6. ✅ Classement temps réel fiable et instantané

---

**Dernière mise à jour**: 2026-03-08  
**Version**: 1.0.0-alpha  
**Status**: 🚧 En développement actif
