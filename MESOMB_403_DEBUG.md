# 🔧 DEBUG: MeSomb HTTP 403 Error

**Erreur:** `[MeSombService] MeSomb payment failed: HTTP 403 - Request failed with status code 403`

**Signification:** ❌ Impossible de s'authentifier auprès de l'API MeSomb

---

## 🎯 Diagnostic Rapide

### Étape 1: Vérifiez vos credentials

```bash
# Dans backend/.env, cherchez:
MESOMB_APP_KEY=d6461c22d0bb1fb371ab3a1cec9971c41ce79356
MESOMB_APP_SECRET=3627ee5d-8fa4-457e-952a-5ef4c4d4322e
```

**Questions:**
- ✅ Ces valeurs sont-elles vides ou par défaut?
- ✅ Sont-elles les VRAIES clés de votre compte MeSomb?
- ✅ Votre compte MeSomb est-il ACTIF?

---

## 🔴 Causes du 403

### Cause 1: Credentials Invalides (PLUS COURANT)

Les clés MeSomb par défaut ne fonctionnent PAS. Vous devez utiliser les vôtres.

**Comment obtenir les vraies clés:**

1. Allez sur https://mesomb.hachther.com
2. Connectez-vous avec votre compte (ou créez-en un)
3. Allez dans **Dashboard** → **Applications**
4. Créez une application ou utilisez l'existante
5. Copiez:
   - **API Key** → `MESOMB_APP_KEY`
   - **API Secret** → `MESOMB_APP_SECRET`

**Mettez à jour** `backend/.env`:

```bash
MESOMB_APP_KEY=<votre_vraie_api_key>
MESOMB_APP_SECRET=<votre_vrai_api_secret>
```

**Redémarrez** le serveur:

```bash
cd backend
npm run start
```

---

### Cause 2: Headers Manquants

La requête doit avoir tous les headers d'authentification. Vérifiez dans les logs:

```
MeSomb Request Details:
  Path: /payment/collect/
  Date: 2026-03-23T10:28:08.000Z
  Nonce: abc123def456
  Signature: abcd1234567890...
  Body: {"amount": 500, ...}
```

**Si vous ne voyez pas ces logs:**
- C'est que les credentials ne sont pas chargés
- Vérifiez `MESOMB_APP_KEY` et `MESOMB_APP_SECRET` dans `.env`

---

### Cause 3: Signature HMAC Incorrecte

MeSomb valide la signature pour garantir l'intégrité de la requête.

La signature est calculée ainsi:

```typescript
stringToSign = [
  "POST",
  "/payment/collect/",
  "2026-03-23T10:28:08.000Z",  // Date ISO
  "abc123def456",               // Nonce unique
  SHA256(body)                  // Hash du body
].join('\n')

signature = HMAC-SHA256(stringToSign, appSecret)
```

**Si la signature est fausse:** HTTP 403

**Comment vérifier:**
- Les logs montrent le début et la fin de la signature
- Vérifiez que `MESOMB_APP_SECRET` est exactement correct (pas d'espaces)

---

### Cause 4: Compte MeSomb Désactivé

Si votre compte est suspendu, tous les paiements retournent 403.

**Vérifiez:**
1. Allez sur https://mesomb.hachther.com
2. Vérifiez que votre compte est **ACTIF**
3. Vérifiez que votre application est **ACTIVE**
4. Vérifiez les **limites de quota** (ne pas dépasser)

---

## ✅ Checklist de Résolution

### Étape 1: Vérifier les Credentials

```bash
# Afficher les variables d'environnement
grep "MESOMB" backend/.env

# Vérifier que le service charge les credentials
npm run start 2>&1 | grep -A2 "MeSomb initialized"
```

**Sortie attendue:**
```
[MeSombService] MeSomb initialized with credentials (key length: 40)
```

**Sortie du problème:**
```
[MeSombService] MeSomb credentials not configured. Payment service will not work.
```

**Action:** Mettez à jour `MESOMB_APP_KEY` et `MESOMB_APP_SECRET`

---

### Étape 2: Tester avec curl

Testez directement l'API MeSomb pour isoler le problème:

```bash
#!/bin/bash
# Script de test MeSomb

APP_KEY="votre_app_key"
APP_SECRET="votre_app_secret"
DATE=$(date -u +'%Y-%m-%dT%H:%M:%S.000Z')
NONCE=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
PAYER="237699999999"  # Numéro de test

# Body
BODY="{\"amount\":500,\"currency\":\"XAF\",\"service\":\"MTN\",\"payer\":\"$PAYER\",\"nonce\":\"$NONCE\",\"message\":\"Test SpotLightLover\"}"

# Calculer la signature
BODY_HASH=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64)

STRING_TO_SIGN="POST
/payment/collect/
$DATE
$NONCE
$BODY_HASH"

SIGNATURE=$(echo -n "$STRING_TO_SIGN" | openssl dgst -sha256 -hmac "$APP_SECRET" -hex | cut -d' ' -f2)

# Envoyer la requête
curl -X POST "https://mesomb.hachther.com/api/v1.1/payment/collect/" \
  -H "X-MeSomb-Application: $APP_KEY" \
  -H "X-MeSomb-Date: $DATE" \
  -H "X-MeSomb-Nonce: $NONCE" \
  -H "Authorization: HMAC-SHA256 $APP_KEY:$SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$BODY" \
  -v
```

**Sortie attendue (Sandbox):**
- `200 OK` si les credentials sont corrects
- `424` si le numéro est invalide
- `403` si les credentials sont faux

---

### Étape 3: Vérifier les Logs Détaillés

Modifiez `backend/.env`:

```env
LOG_LEVEL=debug
```

Redémarrez et cherchez les logs MeSomb:

```bash
npm run start 2>&1 | grep -i mesomb
```

**Logs attendus:**
```
[MeSombService] MeSomb initialized with credentials
[MeSombService] Initiating MeSomb payment: 500 XAF for 237699999999
[MeSombService] MeSomb Request Details:
[MeSombService]   Path: /payment/collect/
[MeSombService]   Date: 2026-03-23T...
[MeSombService]   Nonce: abc123...
[MeSombService]   Signature: abcd...
[MeSombService]   Body: {"amount":500,...}
```

---

## 🎯 Solution Complète

### 1. Créer/Obtenir les Credentials MeSomb

```
1. Allez sur https://mesomb.hachther.com
2. Créez un compte (gratuit)
3. Vérifiez votre email
4. Créez une application
5. Copiez la clé API et le secret
```

### 2. Mettre à Jour le `.env`

```bash
# backend/.env

MESOMB_APP_KEY=<votre_api_key_reelle>
MESOMB_APP_SECRET=<votre_api_secret_reel>

# Optionnel - pour les logs détaillés
LOG_LEVEL=debug
```

### 3. Redémarrer le Serveur

```bash
cd backend
npm run start
```

### 4. Vérifier les Logs

```bash
# Cherchez ces messages
[MeSombService] MeSomb initialized with credentials
[MeSombService] MeSomb Request Details
```

### 5. Tester un Paiement

```bash
# Via l'UI ou API
POST /api/candidates
{
  "stageName": "TestArtist",
  "bio": "Test bio",
  "phone": "237699999999",
  "paymentProvider": "MTN"
}

# Vérifiez les logs pour voir la requête MeSomb
```

---

## 🚨 Problèmes Courants

### Problème: "MeSomb credentials not configured"
**Cause:** `MESOMB_APP_KEY` ou `MESOMB_APP_SECRET` vide
**Solution:** Mettez à jour `backend/.env` avec les vraies clés

### Problème: HTTP 403 même après mise à jour
**Cause:** Le serveur n'a pas rechargé `.env`
**Solution:** 
```bash
# Arrêtez le serveur (Ctrl+C)
# Attendez quelques secondes
npm run start
```

### Problème: Signature HMAC invalide
**Cause:** `MESOMB_APP_SECRET` contient des espaces
**Solution:** Vérifiez `backend/.env` - pas d'espaces avant/après

### Problème: "Solde insuffisant"
**Cause:** Votre compte MeSomb n'a pas de crédit
**Solution:** Rechargez votre compte sur https://mesomb.hachther.com

---

## ✅ Test de Succès

Quand ça fonctionne, vous verrez:

```
[MeSombService] Initiating MeSomb payment: 500 XAF for 237699999999
[MeSombService] MeSomb payment response: status=PENDING, pk=abc123...
```

Puis le webhook MeSomb confirmera le paiement:

```
[WebhookController] MeSomb webhook received...
[PaymentService] Candidate registration payment confirmed
```

---

## 📞 Support MeSomb

Si après tous ces tests vous avez toujours 403:

1. Contactez support@mesomb.hachther.com
2. Fournissez:
   - Votre API Key (sans secret)
   - La requête complète (avec logs)
   - La réponse d'erreur
3. Demandez si votre compte/application est ACTIF

---

**Last Updated:** 23 Mars 2026
