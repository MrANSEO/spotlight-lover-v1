const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

// Charger les credentials
const envPath = './backend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');

const appKey = envContent.match(/MESOMB_APP_KEY=(.+)/)?.[1]?.trim();
const appSecret = envContent.match(/MESOMB_APP_SECRET=(.+)/)?.[1]?.trim();

console.log('════════════════════════════════════════════════════════════════');
console.log('🧪 Testing MeSomb API Directly');
console.log('════════════════════════════════════════════════════════════════');
console.log('');

if (!appKey || !appSecret) {
  console.error('❌ Credentials not found in backend/.env');
  process.exit(1);
}

console.log('✅ Credentials loaded');
console.log(`   APP_KEY: ${appKey.substring(0, 10)}...${appKey.substring(appKey.length - 10)}`);
console.log(`   APP_SECRET: ${appSecret.substring(0, 10)}...${appSecret.substring(appSecret.length - 10)}`);
console.log('');

// Paramètres
const date = new Date().toISOString();
const nonce = crypto.randomBytes(16).toString('hex');
const path = '/payment/collect/';
const payer = '237699999999';

const body = {
  amount: 500,
  currency: 'XAF',
  service: 'MTN',
  payer: payer,
  nonce: nonce,
  message: 'Test SpotLightLover'
};

const bodyString = JSON.stringify(body);

console.log('📝 Request Parameters:');
console.log(`   Date: ${date}`);
console.log(`   Nonce: ${nonce}`);
console.log(`   Payer: ${payer}`);
console.log('');

console.log('🔐 Calculating HMAC-SHA256 signature...');

// Calculer signature (même algorithme que dans mesomb.service.ts)
const bodyHash = crypto
  .createHmac('sha256', appSecret)
  .update(bodyString)
  .digest('base64');  // 🔑 IMPORTANT: base64, not hex!

const stringToSign = [
  'POST',
  path,
  date,
  nonce,
  bodyHash
].join('\n');

console.log('   StringToSign:');
console.log('   ─────────────────────────────────────');
console.log(stringToSign.split('\n').map(line => `   ${line}`).join('\n'));
console.log('   ─────────────────────────────────────');
console.log('');

const signature = crypto
  .createHmac('sha256', appSecret)
  .update(stringToSign)
  .digest('hex');

console.log(`✅ Signature: ${signature.substring(0, 20)}...${signature.substring(signature.length - 20)}`);
console.log('');

console.log('🌐 Sending request to MeSomb...');
console.log(`   URL: https://mesomb.hachther.com/api/v1.1${path}`);
console.log('');

// Envoyer requête
const options = {
  hostname: 'mesomb.hachther.com',
  port: 443,
  path: `/api/v1.1${path}`,
  method: 'POST',
  headers: {
    'X-MeSomb-Application': appKey,
    'X-MeSomb-Date': date,
    'X-MeSomb-Nonce': nonce,
    'Authorization': `HMAC-SHA256 ${appKey}:${signature}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(bodyString)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📊 Response:');
    console.log(`   HTTP Status: ${res.statusCode}`);
    console.log('');
    console.log('   Body:');
    try {
      const parsed = JSON.parse(data);
      console.log('   ' + JSON.stringify(parsed, null, 2).split('\n').join('\n   '));
    } catch {
      console.log('   ' + (data || 'Empty'));
    }
    console.log('');

    // Analyser le résultat
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS! MeSomb is working correctly');
    } else if (res.statusCode === 403) {
      console.log('❌ 403 Forbidden - Credentials might be invalid');
      console.log('   → Check API Key and API Secret on https://mesomb.hachther.com');
    } else if (res.statusCode === 400) {
      console.log('⚠️  400 Bad Request - Check request format');
    } else if (res.statusCode === 424) {
      console.log('⚠️  424 Failed Dependency - Phone number invalid');
    } else {
      console.log(`❓ Unknown error code: ${res.statusCode}`);
    }

    console.log('');
    console.log('════════════════════════════════════════════════════════════════');
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  console.log('');
  console.log('════════════════════════════════════════════════════════════════');
  process.exit(1);
});

req.write(bodyString);
req.end();
