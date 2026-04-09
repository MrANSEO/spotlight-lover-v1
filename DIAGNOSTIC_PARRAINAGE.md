# Diagnostic Parrainage Non Fonctionnel

## Problème:
User A invité User B avec code de parrainage, mais User A n'a pas reçu les 50 FCFA de bonus.

## Vérifications Effectuées:

### 1. Code Génération
- ✅ Frontend: `RegisterPage.tsx` lit le paramètre `?ref=CODE` depuis l'URL
- ✅ Frontend: Passe `referralCode: refCode` à `authRegister()`
- ✅ Backend: `auth.service.ts` appelle `referralService.processReferral()` après création user

### 2. Code Backend
- ✅ `referral.service.ts` existe et est importé
- ✅ Logique: Cherche user par `referralCode`, crée `Referral`, crédite wallet

### 3. Point d'Echec Probable

**Option A: Code de Parrainage Mal Généré**
- Vérifier que User A a bien un `referralCode` dans la DB
- Le code doit être unique et non-null

**Option B: Code de Parrainage ne correspond pas**
- Frontend envoie: `?ref=ABC123`
- Backend cherche: `WHERE referralCode = 'ABC123'`
- Problème possible: majuscules/minuscules, espaces, format

**Option C: Wallet non créé**
- `creditWallet()` crée le wallet s'il n'existe pas
- Mais peut-être que la transaction échoue

## Actions de Diagnostic:

### 1. Vérifier le Code de Parrainage de User A

```sql
SELECT id, email, referralCode FROM "User" WHERE email = 'user_a@email.com';
```

**Résultat attendu:**
```
id       | email            | referralCode
---------|------------------|-------------
abc123   | user_a@email.com | A3F9B2C1
```

Si `referralCode` est NULL → Problème! Doit être généré à la première utilisation.

### 2. Vérifier que le Lien de Parrainage est Correct

Aller sur `GET /referral/stats` (authentifié comme User A)

```json
{
  "referralCode": "A3F9B2C1",
  "referralLink": "https://spotlight-lover-v1.vercel.app/register?ref=A3F9B2C1",
  "totalReferrals": 0,
  "totalEarned": 0,
  "walletBalance": 0
}
```

Si `referralLink` est incorrect → Problème!

### 3. Vérifier le Bonus Après Inscription User B

Une fois User B inscrit via `?ref=A3F9B2C1`:

```sql
-- Vérifier le record Referral
SELECT * FROM "Referral" WHERE "referredId" = 'user_b_id';

-- Vérifier le wallet de User A
SELECT * FROM "Wallet" WHERE "userId" = 'user_a_id';

-- Vérifier les transactions
SELECT * FROM "WalletTransaction" WHERE "walletId" = 'user_a_wallet_id';
```

## Tests à Faire:

### Test 1: Vérifier le Code dans l'URL
1. Aller sur ton profil → Copier le lien de parrainage
2. Ouvrir dans navigateur incognito
3. **Vérifier l'URL finale** - elle doit contenir `?ref=XXXX`

### Test 2: Vérifier les Logs Backend
Regarde les logs de production Render pour:
- ✅ `Referral processed: ...` (success)
- ❌ `processReferral error: ...` (failure - l'erreur est piégée!)

### Test 3: Tester Manuellement

Si le code de parrainage existe mais ne crédite pas:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "referralCode": "A3F9B2C1"  // ← remplacer par le vrai code
  }'
```

## Solution si Parrainage est Cassé:

Si les données manquent dans la DB (Wallet, Referral), recréer manuellement:

```sql
-- Créer le Wallet pour User A (s'il n'existe pas)
INSERT INTO "Wallet" (id, "userId", balance, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'USER_A_ID',
  50,
  NOW(),
  NOW()
);

-- Créer la transaction
INSERT INTO "WalletTransaction" (id, "walletId", type, amount, description, "createdAt")
SELECT id, 50, 'REFERRAL_BONUS', now(), '+50 FCFA — Bonus parrainage'
FROM "Wallet" WHERE "userId" = 'USER_A_ID';
```

## Pour Candidats Votant Pour Eux-Mêmes:

**Pourquoi c'est bloqué:**
- Éviter la triche (quelqu'un vote pour lui pour augmenter artificiellement son score)
- Logique métier: tu dois être voté par d'autres

**Utilisation du crédit de parrainage:**
- ✅ Candidat peut voter pour AUTRES candidats avec son crédit
- ❌ Candidat ne peut pas voter pour lui

**Exemple d'utilisation logique:**
1. User A invité 10 amis → 500 FCFA de bonus
2. User A devient candidat
3. User A vote pour ses 5 amis candidats avec le crédit de parrainage
4. Les 5 amis reçoivent des votes grâce à User A
5. Cela crée une communauté engagée

Cela encourage l'engagement plutôt que la triche! 🎯

---

## Prochaines Actions:

1. Exécute les requêtes SQL du "Test 1" pour vérifier l'état de la BDD
2. Envoie-moi les résultats
3. On corriger le problème ensemble!
