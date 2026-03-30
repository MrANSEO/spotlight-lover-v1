const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const envPath = './backend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');

const appKey = envContent.match(/MESOMB_APP_KEY=(.+)/)?.[1]?.trim();
const appSecret = envContent.match(/MESOMB_APP_SECRET=(.+)/)?.[1]?.trim();

console.log('════════════════════════════════════════════════════════════════');
console.log('🧪 Testing Authorization Header Formats');
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

const signature = crypto
  .createHmac('sha256', appSecret)
  .update(stringToSign)
  .digest('hex');

console.log('🔐 Signature Formats to Test:');
console.log(`  Format 1: HMAC-SHA256 ${appKey}:${signature.substring(0, 20)}...`);
console.log(`  Format 2: HMAC-SHA256 ${signature.substring(0, 20)}...`);
console.log(`  Format 3: HMAC-SHA256 keyId=${appKey}, signature=${signature.substring(0, 20)}...`);
console.log('');

let completed = 0;

function testAuthFormat(label, authHeader) {
  const options = {
    hostname: 'mesomb.hachther.com',
    port: 443,
    path: `/api/v1.1${path}`,
    method: 'POST',
    headers: {
      'X-MeSomb-Application': appKey,
      'X-MeSomb-Date': date,
      'X-MeSomb-Nonce': nonce,
      'Authorization': authHeader,
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
        console.log(`  Error: ${parsed.code}`);
      } catch {
        console.log(`  Response: OK or error`);
      }
      
      completed++;
      if (completed === 3) {
        console.log('');
        console.log('════════════════════════════════════════════════════════════════');
      }
    });
  });

  req.on('error', (error) => {
    console.log(`${label}: ERROR - ${error.message}`);
    completed++;
    if (completed === 3) {
      console.log('');
      console.log('════════════════════════════════════════════════════════════════');
    }
  });

  req.write(bodyString);
  req.end();
}

testAuthFormat('1️⃣  HMAC-SHA256 appKey:signature', `HMAC-SHA256 ${appKey}:${signature}`);
testAuthFormat('2️⃣  HMAC-SHA256 signature only', `HMAC-SHA256 ${signature}`);
testAuthFormat('3️⃣  HMAC-SHA256 keyId=..., signature=...', `HMAC-SHA256 keyId=${appKey}, signature=${signature}`);
