#!/bin/bash
# Script de test MeSomb - Déboguer l'erreur 403

echo "════════════════════════════════════════════════════════════════"
echo "🔍 DEBUG MeSomb 403 Error - Test Script"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Vérifions les variables d'environnement
echo "1️⃣  Vérification des credentials MeSomb dans .env:"
echo "─────────────────────────────────────────────────────────────"

if grep -q "MESOMB_APP_KEY=" backend/.env; then
    APP_KEY=$(grep "MESOMB_APP_KEY=" backend/.env | cut -d'=' -f2)
    echo "✅ MESOMB_APP_KEY: ${APP_KEY:0:10}***${APP_KEY: -10}"
else
    echo "❌ MESOMB_APP_KEY not found in .env"
fi

if grep -q "MESOMB_APP_SECRET=" backend/.env; then
    APP_SECRET=$(grep "MESOMB_APP_SECRET=" backend/.env | cut -d'=' -f2)
    echo "✅ MESOMB_APP_SECRET: ${APP_SECRET:0:10}***${APP_SECRET: -10}"
else
    echo "❌ MESOMB_APP_SECRET not found in .env"
fi

echo ""
echo "2️⃣  Causes possibles du 403 MeSomb:"
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "🔴 ERREUR: Invalid credentials"
echo "   → Vérifiez MESOMB_APP_KEY et MESOMB_APP_SECRET"
echo "   → Créer nouveau compte: https://mesomb.hachther.com"
echo "   → Vérifier Dashboard > Applications"
echo ""
echo "🔴 ERREUR: Signature HMAC incorrecte"
echo "   → Vérifiez que la signature est calculée correctement"
echo "   → Format: HMAC-SHA256 appKey:signature"
echo ""
echo "🔴 ERREUR: Headers manquants"
echo "   → X-MeSomb-Date"
echo "   → X-MeSomb-Nonce"
echo "   → X-MeSomb-Application (dans axios defaults)"
echo "   → Authorization"
echo ""
echo "🔴 ERREUR: Compte MeSomb désactivé"
echo "   → Vérifiez que votre compte est actif"
echo "   → Sandbox vs Production"
echo ""

echo "3️⃣  Solution immédiate:"
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "Option A: Utiliser les credentials corrects"
echo "  1. Allez sur https://mesomb.hachther.com"
echo "  2. Créez/accédez à votre application"
echo "  3. Copiez API Key et API Secret"
echo "  4. Mettez à jour backend/.env"
echo ""
echo "Option B: Tester avec curl (pour isoler le problème)"
echo "  curl -X POST https://mesomb.hachther.com/api/v1.1/payment/collect/ \\"
echo "    -H 'X-MeSomb-Application: YOUR_APP_KEY' \\"
echo "    -H 'X-MeSomb-Date: 2026-03-23T10:30:00.000Z' \\"
echo "    -H 'X-MeSomb-Nonce: test123' \\"
echo "    -H 'Authorization: HMAC-SHA256 KEY:SIGNATURE' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"amount\": 500, \"service\": \"MTN\", \"payer\": \"237699999999\"}'"
echo ""

echo "4️⃣  Logs à vérifier:"
echo "─────────────────────────────────────────────────────────────"
echo "npm run start | grep -i mesomb"
echo ""
echo "Cherchez:"
echo "  ✅ 'MeSomb initialized with credentials'"
echo "  ✅ 'MeSomb Request Details'"
echo "  ❌ 'MeSomb credentials not configured'"
echo "  ❌ 'MeSomb payment failed: HTTP 403'"
echo ""

echo "════════════════════════════════════════════════════════════════"
