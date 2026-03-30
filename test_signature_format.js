const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const envPath = './backend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');

const appKey = envContent.match(/MESOMB_APP_KEY=(.+)/)?.[1]?.trim();
const appSecret = envContent.match(/MESOMB_APP_SECRET=(.+)/)?.[1]?.trim();

console.log('════════════════════════════════════════════════════════════════');
console.log('🧪 Testing Different Signature Formats');
console.log('════════════════════════════════════════════════════════════════\n');

const date = new Date().toISOString();
const nonce = crypto.randomBytes(16).toString('hex');
const path = '/payment/collect/';

const body = {
  amount: 500,
  currency: 'XAF',
  service: 'MTN',
  payer: '237699999999',
  nonce: nonce,
  message: 'Test SpotLightLover'
};

const bodyString = JSON.stringify(body);

// Calcul du bodyHash
const bodyHash = crypto
  .createHmac('sha256', appSecret)
  .update(bodyString)
  .digest('base64');

const stringToSign = [
  'POST',
  path,
  date,
  nonce,
  bodyHash
].join('\n');

// Test 1: Signature en HEX (format actuel)
const sigHex = crypto
  .createHmac('sha256', appSecret)
  .update(stringToSign)
  .digest('hex');

// Test 2: Signature en BASE64
const sigBase64 = crypto
  .createHmac('sha256', appSecret)
  .update(stringToSign)
  .digest('base64');

console.log('📋 Input Parameters:');
console.log(`  bodyHash (base64): ${bodyHash}`);
console.log('');
console.log('🔐 Signature Formats:');
console.log(`  Hex (40 chars):    ${sigHex.substring(0, 20)}...`);
console.log(`  Base64 (44 chars): ${sigBase64.substring(0, 20)}...`);
console.log('');

// Teste les deux formats
let completed = 0;

function testFormat(label, signature) {
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
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`${label}:`);
      console.log(`  HTTP: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(data);
        const error = parsed.code || parsed.detail?.substring(0, 50);
        console.log(`  Error: ${error}`);
      } catch {
        console.log(`  Response: ${data.substring(0, 50)}`);
      }
      
      completed++;
      if (completed === 2) {
        console.log('');
        console.log('════════════════════════════════════════════════════════════════');
      }
    });
  });

  req.on('error', (error) => {
    console.log(`${label}: ERROR - ${error.message}`);
    completed++;
    if (completed === 2) {
      console.log('');
      console.log('════════════════════════════════════════════════════════════════');
    }
  });

  req.write(bodyString);
  req.end();
}

testFormat('1️⃣  HEX Signature (current)', sigHex);
testFormat('2️⃣  BASE64 Signature', sigBase64);
