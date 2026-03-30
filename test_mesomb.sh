#!/bin/bash
# Test MeSomb API avec les vraies credentials

echo "════════════════════════════════════════════════════════════════"
echo "🧪 Testing MeSomb API Directly"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Récupérer les credentials du .env
APP_KEY=$(grep "MESOMB_APP_KEY=" backend/.env | cut -d'=' -f2 | tr -d ' ')
APP_SECRET=$(grep "MESOMB_APP_SECRET=" backend/.env | cut -d'=' -f2 | tr -d ' ')

if [ -z "$APP_KEY" ] || [ -z "$APP_SECRET" ]; then
    echo "❌ Credentials not found in backend/.env"
    exit 1
fi

echo "✅ Credentials loaded"
echo "   APP_KEY: ${APP_KEY:0:10}...${APP_KEY: -10}"
echo "   APP_SECRET: ${APP_SECRET:0:10}...${APP_SECRET: -10}"
echo ""

# Paramètres
DATE=$(date -u +'%Y-%m-%dT%H:%M:%S.000Z')
NONCE=$(date +%s%N | sha256sum | cut -c 1-32)
PATH="/payment/collect/"
PAYER="237699999999"

# Body
BODY=$(cat <<EOF
{
  "amount": 500,
  "currency": "XAF",
  "service": "MTN",
  "payer": "$PAYER",
  "nonce": "$NONCE",
  "message": "Test SpotLightLover"
}
EOF
)

echo "📝 Request Parameters:"
echo "   Date: $DATE"
echo "   Nonce: $NONCE"
echo "   Payer: $PAYER"
echo ""

# Calculer signature (simplifié pour test)
# NOTA: Ceci est pour test local seulement
echo "🔐 Calculating HMAC-SHA256 signature..."

# Construire stringToSign
BODY_HASH=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | openssl enc -base64 -A)

STRINGTOSIGN="POST
$PATH
$DATE
$NONCE
$BODY_HASH"

echo "   StringToSign:"
echo "   ─────────────────────────────────────"
echo "$STRINGTOSIGN" | sed 's/^/   /'
echo "   ─────────────────────────────────────"
echo ""

SIGNATURE=$(echo -n "$STRINGTOSIGN" | openssl dgst -sha256 -hmac "$APP_SECRET" | awk '{print $2}')

echo "✅ Signature: ${SIGNATURE:0:20}...${SIGNATURE: -20}"
echo ""

echo "🌐 Sending request to MeSomb..."
echo "   URL: https://mesomb.hachther.com/api/v1.1$PATH"
echo ""

# Envoyer requête
RESPONSE=$(curl -X POST \
  "https://mesomb.hachther.com/api/v1.1$PATH" \
  -H "X-MeSomb-Application: $APP_KEY" \
  -H "X-MeSomb-Date: $DATE" \
  -H "X-MeSomb-Nonce: $NONCE" \
  -H "Authorization: HMAC-SHA256 $APP_KEY:$SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$BODY" \
  -s -w "\n%{http_code}" 2>&1)

# Séparer body et status
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY_RESPONSE=$(echo "$RESPONSE" | head -n -1)

echo "📊 Response:"
echo "   HTTP Status: $HTTP_CODE"
echo ""
echo "   Body:"
echo "$BODY_RESPONSE" | jq '.' 2>/dev/null || echo "$BODY_RESPONSE" | sed 's/^/   /'
echo ""

# Analyser le résultat
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS! MeSomb is working correctly"
elif [ "$HTTP_CODE" = "403" ]; then
    echo "❌ 403 Forbidden - Credentials might be invalid"
    echo "   → Check API Key and API Secret on https://mesomb.hachther.com"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "⚠️  400 Bad Request - Check request format"
elif [ "$HTTP_CODE" = "424" ]; then
    echo "⚠️  424 Failed Dependency - Phone number invalid"
else
    echo "❓ Unknown error code: $HTTP_CODE"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
