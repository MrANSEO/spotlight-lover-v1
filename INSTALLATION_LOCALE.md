# 🖥️ GUIDE D'INSTALLATION VS CODE LOCAL

**Pour faire fonctionner Spotlight Lover sur votre machine locale avec VS Code**

---

## ⚠️ SITUATION ACTUELLE

Le projet a été développé dans un **sandbox cloud** (environnement en ligne). Le code est **100% terminé et fonctionnel**, mais pour l'utiliser sur **votre ordinateur avec VS Code**, vous devez :

1. Télécharger le projet
2. Installer les outils nécessaires
3. Configurer les services
4. Lancer l'application

**Temps estimé** : 30-45 minutes

---

## 📥 ÉTAPE 1 : TÉLÉCHARGER LE PROJET

### Option A : Via Backup CDN (Recommandé)

**URL du backup** : https://www.genspark.ai/api/files/s/QaTh0r0W

```bash
# 1. Télécharger l'archive
curl -L https://www.genspark.ai/api/files/s/QaTh0r0W -o spotlight-lover.tar.gz

# 2. Extraire
tar -xzf spotlight-lover.tar.gz

# 3. Le projet sera dans /home/user/webapp/
# Copier vers votre dossier de travail
cp -r home/user/webapp ~/Documents/spotlight-lover

# 4. Naviguer
cd ~/Documents/spotlight-lover
```

### Option B : Via Git (Si vous avez configuré GitHub)

```bash
git clone https://github.com/VOTRE-USERNAME/spotlight-lover.git
cd spotlight-lover
```

---

## 🔧 ÉTAPE 2 : INSTALLER LES PRÉREQUIS

### A) Node.js (v18+ LTS)

**Vérifier si installé** :
```bash
node --version  # Doit afficher v18.x ou v20.x
npm --version   # Doit afficher 9.x ou 10.x
```

**Si pas installé** :
- **Windows** : https://nodejs.org/en/download/ (LTS version)
- **macOS** : `brew install node@20` (avec Homebrew)
- **Linux** : `sudo apt install nodejs npm` (Ubuntu/Debian)

### B) PostgreSQL (v15+)

**Vérifier si installé** :
```bash
psql --version  # Doit afficher PostgreSQL 15.x ou 16.x
```

**Si pas installé** :
- **Windows** : https://www.postgresql.org/download/windows/ (installer + pgAdmin)
- **macOS** : `brew install postgresql@15` puis `brew services start postgresql@15`
- **Linux** : `sudo apt install postgresql postgresql-contrib`

**Démarrer PostgreSQL** :
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Windows
# PostgreSQL démarre automatiquement en service
```

### C) Git (optionnel mais recommandé)

```bash
git --version  # Si pas installé : https://git-scm.com/downloads
```

---

## 🗄️ ÉTAPE 3 : CONFIGURER LA BASE DE DONNÉES

### 1. Créer la base de données

```bash
# Se connecter à PostgreSQL
psql postgres

# Dans psql :
CREATE DATABASE spotlight_lover;
CREATE USER spotlight_user WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE spotlight_lover TO spotlight_user;

# Quitter
\q
```

### 2. Tester la connexion

```bash
psql -U spotlight_user -d spotlight_lover -h localhost
# Entrer le mot de passe
# Si ça marche, taper \q pour quitter
```

---

## ⚙️ ÉTAPE 4 : CONFIGURER L'ENVIRONNEMENT

### Backend (.env)

```bash
cd backend
cp .env.example .env
```

**Éditer `backend/.env`** (avec VS Code ou nano) :

```env
# Database
DATABASE_URL="postgresql://spotlight_user:votre_mot_de_passe_securise@localhost:5432/spotlight_lover?schema=public"

# JWT Secrets (générer des valeurs aléatoires fortes)
JWT_ACCESS_SECRET="CHANGEZ_CECI_PAR_UNE_VALEUR_ALEATOIRE_LONGUE_123456789"
JWT_REFRESH_SECRET="AUTRE_VALEUR_ALEATOIRE_DIFFERENTE_987654321"

# MeSomb (Mobile Money) - MODE TEST
MESOMB_APP_KEY="votre-app-key-mesomb"
MESOMB_API_KEY="votre-api-key-mesomb"
MESOMB_ENV="sandbox"  # Utilisez "sandbox" pour les tests

# Stripe (Cartes bancaires) - MODE TEST
STRIPE_SECRET_KEY="sk_test_VOTRE_CLE_TEST_STRIPE"
STRIPE_WEBHOOK_SECRET="whsec_VOTRE_SECRET_WEBHOOK"

# Cloudinary (Upload vidéo)
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"

# Configuration
MAX_VIDEO_SIZE_MB="200"
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"

# Monitoring (optionnel)
# SENTRY_DSN="https://..."
```

**⚠️ IMPORTANT** :
- Les clés MeSomb, Stripe, Cloudinary sont **optionnelles en développement local**
- Pour tester sans services externes, vous pouvez laisser des valeurs fictives
- Le projet fonctionnera, mais les fonctionnalités de paiement/upload ne marcheront pas

### Frontend (.env)

```bash
cd ../frontend
cp .env.example .env
```

**Éditer `frontend/.env`** :

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

---

## 📦 ÉTAPE 5 : INSTALLER LES DÉPENDANCES

### Backend

```bash
cd backend
npm install
```

**Temps estimé** : 2-3 minutes

### Frontend

```bash
cd ../frontend
npm install
```

**Temps estimé** : 2-3 minutes

---

## 🗄️ ÉTAPE 6 : INITIALISER LA BASE DE DONNÉES

```bash
cd backend

# 1. Générer le client Prisma
npx prisma generate

# 2. Créer les tables (migration)
npx prisma migrate dev --name init

# 3. (Optionnel) Voir les tables créées
npx prisma studio  # Ouvre une interface web sur http://localhost:5555
```

**Vous devriez voir** :
- 11 tables créées (User, Candidate, Vote, Transaction, etc.)
- Prisma Studio vous permet de voir/éditer les données

---

## 🚀 ÉTAPE 7 : LANCER L'APPLICATION

### Option A : Mode Développement (2 terminaux)

**Terminal 1 - Backend** :
```bash
cd backend
npm run start:dev

# ✅ Backend démarré sur http://localhost:3000
# ✅ Swagger UI sur http://localhost:3000/api/docs
```

**Terminal 2 - Frontend** :
```bash
cd frontend
npm run dev

# ✅ Frontend démarré sur http://localhost:5173
```

### Option B : Avec PM2 (Recommandé)

**Installer PM2** :
```bash
npm install -g pm2
```

**Lancer les services** :
```bash
# Backend
cd backend
pm2 start npm --name "spotlight-backend" -- run start:dev

# Frontend
cd ../frontend
pm2 start npm --name "spotlight-frontend" -- run dev

# Voir les logs
pm2 logs

# Arrêter
pm2 stop all
pm2 delete all
```

### Option C : Docker (Si Docker installé)

```bash
cd ~/Documents/spotlight-lover
docker-compose up -d

# Backend : http://localhost:3000
# Frontend : http://localhost:5173
# PostgreSQL : localhost:5432
```

---

## 🌐 ÉTAPE 8 : ACCÉDER À L'APPLICATION

### Ouvrir dans le navigateur

1. **Frontend** : http://localhost:5173
   - Page d'accueil avec Hero violet/rose
   - Boutons "Devenir Candidat" et "Voir les Talents"

2. **Backend API** : http://localhost:3000
   - Retourne un JSON `{"message": "Welcome to Spotlight Lover API"}`

3. **Swagger UI** : http://localhost:3000/api/docs
   - Documentation interactive de l'API
   - Tester tous les endpoints

---

## 🧪 ÉTAPE 9 : CRÉER UN COMPTE ADMIN

### Via Swagger UI (Facile)

1. Aller sur http://localhost:3000/api/docs
2. Cliquer sur `POST /auth/register`
3. Cliquer "Try it out"
4. Body :
```json
{
  "email": "admin@test.com",
  "password": "Admin123!",
  "role": "ADMIN"
}
```
5. Execute

**Ensuite** :
- Aller sur http://localhost:5173/login
- Se connecter avec admin@test.com / Admin123!
- Cliquer sur "🛡️ Admin" dans le header
- Explorer toutes les pages admin

---

## 🔍 ÉTAPE 10 : VÉRIFIER QUE TOUT FONCTIONNE

### Checklist ✅

```bash
# 1. Backend répond
curl http://localhost:3000
# ✅ Doit retourner JSON

# 2. Frontend répond
curl http://localhost:5173
# ✅ Doit retourner HTML

# 3. Database connectée
cd backend
npx prisma studio
# ✅ Interface web s'ouvre

# 4. Swagger accessible
open http://localhost:3000/api/docs
# ✅ Documentation API visible
```

---

## 📂 OUVRIR DANS VS CODE

```bash
cd ~/Documents/spotlight-lover
code .
```

**Structure du projet dans VS Code** :
```
spotlight-lover/
├── backend/              # ← API NestJS
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── .env
├── frontend/             # ← React App
│   ├── src/
│   ├── package.json
│   └── .env
├── docker-compose.yml
├── README.md
└── ADMIN_COMPLETE.md
```

---

## 🛠️ COMMANDES UTILES VS CODE

### Extensions VS Code Recommandées

```
- ESLint
- Prettier
- Prisma
- GitLens
- Docker (si vous utilisez Docker)
- Thunder Client (alternative Postman)
```

### Raccourcis utiles

- **Ouvrir terminal** : Ctrl+` (backtick)
- **Split terminal** : Ctrl+Shift+5
- **Recherche globale** : Ctrl+Shift+F
- **Formater code** : Shift+Alt+F

---

## ⚠️ PROBLÈMES COURANTS

### 1. "Cannot connect to database"

**Solution** :
```bash
# Vérifier que PostgreSQL tourne
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Redémarrer si nécessaire
brew services restart postgresql@15  # macOS
sudo systemctl restart postgresql    # Linux
```

### 2. "Port 3000 already in use"

**Solution** :
```bash
# Trouver le processus
lsof -ti:3000

# Tuer le processus
kill -9 $(lsof -ti:3000)
```

### 3. "Module not found"

**Solution** :
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### 4. "Prisma Client not generated"

**Solution** :
```bash
cd backend
npx prisma generate
```

---

## 🎯 MODE PRODUCTION LOCAL

Si vous voulez tester en mode production (optimisé) :

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm run preview
```

---

## 📊 STATUT FONCTIONNALITÉS

### ✅ Fonctionne 100% en local (sans API externes)

- ✅ Authentification (JWT + refresh)
- ✅ Gestion utilisateurs
- ✅ Navigation complète
- ✅ Interface admin
- ✅ Base de données
- ✅ Leaderboard temps réel (Socket.IO)

### ⚠️ Nécessite API Keys externes

- ⚠️ Paiements MeSomb (nécessite clés API MeSomb)
- ⚠️ Paiements Stripe (nécessite clés API Stripe)
- ⚠️ Upload vidéo (nécessite compte Cloudinary)

**Solution** : En mode développement, vous pouvez :
1. Laisser des valeurs fictives dans `.env`
2. Tester le flow sans vraiment payer
3. Créer des comptes sandbox gratuits (MeSomb, Stripe, Cloudinary)

---

## 🚀 RÉSUMÉ COMMANDES RAPIDES

```bash
# 1. Télécharger
curl -L https://www.genspark.ai/api/files/s/QaTh0r0W -o spotlight.tar.gz
tar -xzf spotlight.tar.gz
cd home/user/webapp

# 2. Installer
cd backend && npm install
cd ../frontend && npm install

# 3. Configurer DB
psql postgres -c "CREATE DATABASE spotlight_lover;"

# 4. Configurer .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Éditer les fichiers .env

# 5. Initialiser DB
cd backend
npx prisma generate
npx prisma migrate dev --name init

# 6. Lancer (2 terminaux)
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd frontend && npm run dev

# 7. Ouvrir
# http://localhost:5173 (Frontend)
# http://localhost:3000/api/docs (Swagger)
```

---

## ✅ CHECKLIST FINALE

- [ ] Node.js v18+ installé
- [ ] PostgreSQL 15+ installé et démarré
- [ ] Base de données créée
- [ ] Fichiers .env configurés (backend + frontend)
- [ ] `npm install` executé (backend + frontend)
- [ ] `npx prisma generate` executé
- [ ] `npx prisma migrate dev` executé
- [ ] Backend démarré sur :3000
- [ ] Frontend démarré sur :5173
- [ ] Compte admin créé
- [ ] Accès admin panel fonctionne

---

## 🎉 CONCLUSION

**OUI, le projet est 100% terminé et fonctionnel !**

Mais il a été développé dans un **sandbox cloud**, donc pour VS Code local :
1. ✅ Le code est complet
2. ✅ Tout fonctionne
3. ⚠️ Mais vous devez **installer les dépendances** (Node.js, PostgreSQL)
4. ⚠️ Et **configurer l'environnement** (.env files)

**Temps total setup** : 30-45 minutes (si outils déjà installés)

**Besoin d'aide ?** Suivez ce guide étape par étape ! 🚀
