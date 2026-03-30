const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

// Charger les credentials
const envPath = './backend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');

const appKey = envContent.match(/MESOMB_APP_KEY=(.+)/)?.[1]?.trim();
const appSecret = envContent.match(/MESOMB_APP_SECRET=(.+)/)?.[1]?.trim();

console.log('════════════════════════════════════════════════════════════════');
console.log('🧪 Testing MeSomb API - V3 (Authorization with Bearer/Key format)');
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

// Test 1: Authorization: Bearer <signature>
console.log('═══ ATTEMPT 1: Bearer Token ═══');
let signature = crypto
  .createHmac('sha256', appSecret)
  .update(bodyString)
  .digest('hex');

let options = {
  hostname: 'mesomb.hachther.com',
  port: 443,
  path: `/api/v1.1${path}`,
  method: 'POST',
  headers: {
    'X-MeSomb-Application': appKey,
    'X-MeSomb-Date': date,
    'X-MeSomb-Nonce': nonce,
    'Authorization': `Bearer ${signature}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(bodyString)
  }
};

testRequest(options, 'Bearer format');

function testRequest(options, label) {
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`${label}:`);
      console.log(`  HTTP: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(data);
        console.log(`  Error: ${parsed.code}`);
      } catch {
        console.log(`  Response: ${data.substring(0, 50)}`);
      }
      console.log('');
    });
  });

  req.on('error', (error) => {
    console.log(`${label}: ERROR - ${error.message}`);
  });

  req.write(bodyString);
  req.end();
}
