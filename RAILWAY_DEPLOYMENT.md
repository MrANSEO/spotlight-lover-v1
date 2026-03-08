# 🚂 Guide de Déploiement Railway - Spotlight Lover

## Configuration Initiale

### 1. Créer Compte Railway
- Aller sur https://railway.app
- S'inscrire avec GitHub
- Créer nouveau projet

### 2. Ajouter Service PostgreSQL
```bash
railway add --plugin postgresql
```

### 3. Variables d'Environnement Backend

**Sur Railway Dashboard → Backend Service → Variables:**

```env
# Auto-configuré par Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}

# À configurer manuellement
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://votre-frontend-url.up.railway.app

# JWT Secrets (générer avec: openssl rand -base64 32)
JWT_SECRET=<votre-secret-jwt-64-caracteres>
JWT_REFRESH_SECRET=<votre-refresh-secret-64-caracteres>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# MeSomb Configuration
MESOMB_APP_KEY=<votre-app-key-mesomb>
MESOMB_API_KEY=<votre-api-key-mesomb>
MESOMB_SECRET_KEY=<votre-secret-key-mesomb>
MESOMB_ENV=production

# Stripe Configuration
STRIPE_SECRET_KEY=<sk_live_votre_cle>
STRIPE_WEBHOOK_SECRET=<whsec_votre_secret>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<votre-cloud-name>
CLOUDINARY_API_KEY=<votre-api-key>
CLOUDINARY_API_SECRET=<votre-api-secret>

# Limites Vidéo
MAX_VIDEO_SIZE_MB=200
MAX_VIDEO_DURATION_SEC=90
ALLOWED_VIDEO_FORMATS=mp4,webm,mov

# Prix (FCFA)
CANDIDATE_REGISTRATION_FEE=500
VOTE_PRICE=100

# Sécurité
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=10

# Monitoring (optionnel)
SENTRY_DSN=<votre-sentry-dsn>
LOG_LEVEL=info
```

### 4. Variables d'Environnement Frontend

**Sur Railway Dashboard → Frontend Service → Variables:**

```env
VITE_API_URL=https://votre-backend-url.up.railway.app
VITE_WS_URL=https://votre-backend-url.up.railway.app
```

## Déploiement Backend

### Option 1: Via Railway CLI

```bash
cd backend

# Login Railway
railway login

# Link au projet
railway link

# Deploy
railway up

# Appliquer migrations
railway run npx prisma migrate deploy

# Générer Prisma Client
railway run npx prisma generate

# Vérifier logs
railway logs
```

### Option 2: Via GitHub Integration

1. Push code sur GitHub
2. Railway Dashboard → Connect Repo
3. Sélectionner `webapp` repository
4. Railway détecte automatiquement:
   - `backend/` avec `package.json`
   - `Dockerfile` si présent
5. Build et deploy automatique à chaque push

## Déploiement Frontend

```bash
cd frontend

# Build production
npm run build

# Deploy sur Railway
railway up

# Ou utiliser GitHub integration
```

## Configuration Webhooks

### MeSomb Webhook URL
```
https://votre-backend.up.railway.app/api/webhooks/mesomb
```

**Configuration MeSomb Dashboard:**
1. Aller sur https://mesomb.hachther.com
2. Settings → Webhooks
3. Ajouter URL ci-dessus
4. Sauvegarder

### Stripe Webhook URL
```
https://votre-backend.up.railway.app/api/webhooks/stripe
```

**Configuration Stripe Dashboard:**
1. Aller sur https://dashboard.stripe.com/webhooks
2. Add endpoint
3. URL: ci-dessus
4. Events à écouter:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copier Signing Secret → `STRIPE_WEBHOOK_SECRET`

## Vérifications Post-Déploiement

### 1. Health Check Backend
```bash
curl https://votre-backend.up.railway.app/api/health

# Réponse attendue:
{
  "status": "ok",
  "timestamp": "2026-03-08T...",
  "database": "connected"
}
```

### 2. Swagger Documentation
```
https://votre-backend.up.railway.app/api/docs
```

### 3. Test Frontend
```
https://votre-frontend.up.railway.app
```

### 4. Test WebSocket Leaderboard
```javascript
// Dans console navigateur
const socket = io('https://votre-backend.up.railway.app/leaderboard');
socket.on('connect', () => console.log('Connected!'));
socket.emit('getLeaderboard', { limit: 10 });
socket.on('leaderboard', (data) => console.log(data));
```

## Maintenance

### Logs
```bash
# Backend logs
railway logs --service backend

# Frontend logs
railway logs --service frontend

# Database logs
railway logs --service postgres
```

### Migrations
```bash
# Créer nouvelle migration (local)
cd backend
npx prisma migrate dev --name nom_migration

# Appliquer en production
railway run npx prisma migrate deploy
```

### Rollback
```bash
# Railway garde historique des deployments
# Dashboard → Deployments → Rollback to previous version
```

### Scaling
```bash
# Railway Dashboard → Service → Settings
# Ajuster:
# - Memory: 512MB → 2GB
# - CPU: 1 vCPU → 4 vCPU
# - Replicas: 1 → Multiple (pour scaling horizontal)
```

## Monitoring Production

### Métriques Railway
- CPU Usage
- Memory Usage
- Network I/O
- Request Count
- Response Time

### Alertes (à configurer)
```bash
# Sentry pour erreurs
SENTRY_DSN=https://...@sentry.io/...

# Logs structurés pour parsing
# Railway automatiquement agrège logs
```

## Coûts Estimés

**Railway Pricing (Hobby Plan):**
- $5/month par service
- Backend: ~$5-10/month
- Frontend: ~$5/month
- PostgreSQL: ~$5/month
- **Total**: ~$15-20/month

**Add-ons externes:**
- Cloudinary: Free tier (10GB storage, 25 credits/month)
- MeSomb: Frais par transaction
- Stripe: 2.9% + $0.30 par transaction

## Troubleshooting

### Backend ne démarre pas
```bash
# Vérifier logs
railway logs --service backend

# Vérifier DATABASE_URL
railway variables

# Rebuild
railway up --service backend
```

### Migrations échouent
```bash
# Reset migrations (DANGER: perte données)
railway run npx prisma migrate reset

# Ou manuellement:
railway run psql $DATABASE_URL
# Puis DROP TABLE...
```

### Frontend 404 errors
```bash
# Vérifier VITE_API_URL
railway variables --service frontend

# Rebuild avec bonnes variables
railway up --service frontend
```

### WebSocket ne connecte pas
- Vérifier CORS dans backend (FRONTEND_URL)
- Vérifier port 3000 accessible
- Tester avec: `curl -I https://backend-url.up.railway.app`

## Sécurité Production

### Checklist
- [x] JWT_SECRET différent de dev
- [x] MESOMB_ENV=production
- [x] Stripe live keys (sk_live_...)
- [x] CORS restricted to FRONTEND_URL
- [x] Rate limiting activé
- [x] Webhooks avec signature verification
- [x] HTTPS forcé (Railway par défaut)
- [x] Secrets dans Railway Variables (pas .env commité)

## Backup & Restore

### Backup PostgreSQL
```bash
# Export base de données
railway run pg_dump $DATABASE_URL > backup.sql

# Ou via Railway Dashboard:
# PostgreSQL Service → Backups → Download
```

### Restore PostgreSQL
```bash
# Import backup
railway run psql $DATABASE_URL < backup.sql
```

---

**Support Railway:** https://docs.railway.app  
**Discord Railway:** https://discord.gg/railway
