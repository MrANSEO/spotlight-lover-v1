# ⚡ DÉMARRAGE RAPIDE - 5 MINUTES

**Pour les développeurs qui ont déjà Node.js et PostgreSQL installés**

---

## 📥 1. TÉLÉCHARGER (30 secondes)

```bash
# Télécharger le backup
curl -L https://www.genspark.ai/api/files/s/QaTh0r0W -o spotlight.tar.gz

# Extraire
tar -xzf spotlight.tar.gz

# Naviguer
cd home/user/webapp
```

---

## 🗄️ 2. CRÉER LA DB (1 minute)

```bash
# Créer la base de données
psql postgres -c "CREATE DATABASE spotlight_lover;"
psql postgres -c "CREATE USER spotlight_user WITH PASSWORD 'password123';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE spotlight_lover TO spotlight_user;"
```

---

## ⚙️ 3. CONFIGURER .ENV (2 minutes)

### Backend
```bash
cd backend
cat > .env << 'EOF'
DATABASE_URL="postgresql://spotlight_user:password123@localhost:5432/spotlight_lover?schema=public"
JWT_ACCESS_SECRET="secret_access_key_change_in_production_123456789"
JWT_REFRESH_SECRET="secret_refresh_key_change_in_production_987654321"
MESOMB_APP_KEY="test"
MESOMB_API_KEY="test"
MESOMB_ENV="sandbox"
STRIPE_SECRET_KEY="sk_test_test"
STRIPE_WEBHOOK_SECRET="whsec_test"
CLOUDINARY_CLOUD_NAME="test"
CLOUDINARY_API_KEY="test"
CLOUDINARY_API_SECRET="test"
MAX_VIDEO_SIZE_MB="200"
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"
EOF
```

### Frontend
```bash
cd ../frontend
cat > .env << 'EOF'
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
EOF
cd ..
```

---

## 📦 4. INSTALLER & INIT (2 minutes)

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init

# Frontend
cd ../frontend
npm install
```

---

## 🚀 5. LANCER (30 secondes)

### Terminal 1 - Backend
```bash
cd backend
npm run start:dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

---

## 🌐 6. ACCÉDER

- **Frontend** : http://localhost:5173
- **API** : http://localhost:3000
- **Swagger** : http://localhost:3000/api/docs

---

## 👤 7. CRÉER UN ADMIN

### Via Swagger
1. http://localhost:3000/api/docs
2. POST /auth/register
3. Body :
```json
{
  "email": "admin@test.com",
  "password": "Admin123!"
}
```

### Se connecter
- http://localhost:5173/login
- Email : admin@test.com
- Password : Admin123!
- Cliquer sur **"🛡️ Admin"**

---

## ✅ TERMINÉ !

**Le projet fonctionne maintenant sur votre machine locale ! 🎉**

---

## 🐳 ALTERNATIVE : DOCKER (1 commande)

Si vous avez Docker :

```bash
# Tout en un
docker-compose up -d

# Accéder
# Frontend : http://localhost:5173
# Backend : http://localhost:3000
```

---

## 📚 DOCUMENTATION COMPLÈTE

- **Installation détaillée** : INSTALLATION_LOCALE.md
- **Admin panel** : ADMIN_COMPLETE.md
- **Design** : DESIGN_SYSTEM.md
- **README** : README.md

---

**Temps total** : 5-6 minutes ⚡
