#!/usr/bin/env node
// Quick diagnostic pour le problème MeSomb 403

const fs = require('fs');
const path = require('path');

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           🔍 MESOMB 403 DIAGNOSTIC TOOL                        ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\n');

const envPath = path.join(__dirname, 'backend', '.env');

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('✅ .env file found\n');
  
  // Chercher les credentials
  const appKeyMatch = envContent.match(/MESOMB_APP_KEY=(.+)/);
  const appSecretMatch = envContent.match(/MESOMB_APP_SECRET=(.+)/);
  
  if (!appKeyMatch || !appSecretMatch) {
    console.log('❌ Missing MeSomb credentials in .env\n');
    console.log('   Required variables:');
    console.log('   - MESOMB_APP_KEY');
    console.log('   - MESOMB_APP_SECRET\n');
    process.exit(1);
  }
  
  const appKey = appKeyMatch[1].trim();
  const appSecret = appSecretMatch[1].trim();
  
  console.log('📋 MeSomb Configuration Check:\n');
  
  // Vérifier si les valeurs sont remplies
  if (!appKey || appKey === 'your-mesomb-app-key' || appKey.includes('CHANGEZ')) {
    console.log('❌ MESOMB_APP_KEY appears to be not set correctly');
    console.log(`   Current value: ${appKey ? '***PLACEHOLDER***' : '***EMPTY***'}\n`);
  } else {
    console.log(`✅ MESOMB_APP_KEY: ${appKey.substring(0, 10)}...${appKey.substring(appKey.length - 10)}`);
    console.log(`   Length: ${appKey.length} characters\n`);
  }
  
  if (!appSecret || appSecret === 'your-mesomb-secret-key' || appSecret.includes('CHANGEZ')) {
    console.log('❌ MESOMB_APP_SECRET appears to be not set correctly');
    console.log(`   Current value: ${appSecret ? '***PLACEHOLDER***' : '***EMPTY***'}\n`);
  } else {
    console.log(`✅ MESOMB_APP_SECRET: ${appSecret.substring(0, 10)}...${appSecret.substring(appSecret.length - 10)}`);
    console.log(`   Length: ${appSecret.length} characters\n`);
  }
  
  // Conseils
  console.log('📝 Troubleshooting Steps:\n');
  console.log('1️⃣  Get real MeSomb credentials:');
  console.log('   → https://mesomb.hachther.com');
  console.log('   → Dashboard → Applications\n');
  
  console.log('2️⃣  Update backend/.env with real values\n');
  
  console.log('3️⃣  Restart the backend server:');
  console.log('   → npm run start\n');
  
  console.log('4️⃣  Check logs for:');
  console.log('   ✅ "MeSomb initialized with credentials"');
  console.log('   ❌ "MeSomb credentials not configured"\n');
  
  console.log('════════════════════════════════════════════════════════════════\n');
  
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('❌ .env file not found at backend/.env\n');
    console.log('Create one from .env.example:\n');
    console.log('  cp backend/.env.example backend/.env\n');
  } else {
    console.log(`❌ Error reading .env: ${error.message}\n`);
  }
  process.exit(1);
}
