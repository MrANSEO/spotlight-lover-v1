import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin par défaut (inchangé) ─────────────────────────────────────────

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@spotlightlover.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@SpotLight2025!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashed,
        firstName: 'Admin',
        lastName: 'SpotLightLover',
        role: 'ADMIN',
        isActive: true,
        isVerified: true,
      },
    });
    console.log(`✅ Admin créé: ${adminEmail}`);
    console.log(`🔑 Mot de passe: ${adminPassword}`);
    console.log(
      '⚠️  CHANGEZ le mot de passe admin après la première connexion !',
    );
  } else {
    console.log(`ℹ️  Admin déjà existant: ${adminEmail}`);
  }

  // ─── Premier concours en DRAFT (inchangé) ────────────────────────────────

  const existingContest = await prisma.contest.findFirst();
  if (!existingContest) {
    await prisma.contest.create({
      data: {
        title: 'SpotLightLover — Saison 1',
        status: 'DRAFT',
        prizeAmount: 50000,
        prizeDescription: '50 000 FCFA + Trophée SpotLightLover',
      },
    });
    console.log('✅ Premier concours créé (DRAFT)');
  }

  // ─── SystemSettings par défaut ✅ NOUVEAU ────────────────────────────────
  // upsert = crée si absent, ne modifie pas si déjà là (valeur personnalisée conservée)

  const defaults = [
    { key: 'maintenanceMode', value: 'false' },
    {
      key: 'maintenanceMessage',
      value:
        'La plateforme est en maintenance. Revenez dans quelques instants.',
    },
    { key: 'prizePoolPercent', value: '30' }, // 30% des revenus reversés au 1er
    { key: 'registrationFee', value: '500' }, // FCFA
    { key: 'votePrice', value: '100' }, // FCFA
  ];

  for (const s of defaults) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: s,
      update: {}, // Ne pas écraser une valeur déjà personnalisée
    });
  }
  console.log(`✅ ${defaults.length} paramètres système initialisés`);

  console.log('✅ Seed terminé !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
