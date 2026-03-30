# MeSomb 403 Error - Quick Fix

## 🔴 Le Problème

```
[MeSombService] MeSomb payment failed: HTTP 403
```

**Signification:** Les credentials MeSomb sont invalides ou manquants.

---

## ✅ Solution Rapide (3 étapes)

### 1. Vérifiez vos credentials MeSomb

```bash
node diagnostic.js
```

### 2. Si vide ou par défaut, obtenez les vraies clés

1. Allez sur **https://mesomb.hachther.com**
2. Créez un compte (gratuit)
3. **Dashboard** → **Applications**
4. Copiez:
   - API Key
   - API Secret

### 3. Mettez à jour `backend/.env`

```env
MESOMB_APP_KEY=<votre_api_key>
MESOMB_APP_SECRET=<votre_api_secret>
```

**Redémarrez le serveur:**

```bash
cd backend
npm run start
```

---

## 🧪 Test

Cherchez dans les logs:

```
✅ "MeSomb initialized with credentials"
```

Si vous voyez:

```
❌ "MeSomb credentials not configured"
```

C'est que `.env` n'a pas été chargé. Vérifiez:
- Les valeurs sont remplies (pas vides)
- Pas d'espaces avant/après
- Pas de guillemets supplémentaires

---

## 📚 Documentation Complète

Voir **`MESOMB_403_DEBUG.md`** pour:
- Diagnostic détaillé
- Causes du 403
- Test avec curl
- Troubleshooting avancé

---

## ⚡ TL;DR

```bash
# 1. Diagnostic
node diagnostic.js

# 2. Créez compte MeSomb
# https://mesomb.hachther.com

# 3. Mettez à jour
# backend/.env

# 4. Redémarrez
cd backend && npm run start
```

**Done! 🎉**
