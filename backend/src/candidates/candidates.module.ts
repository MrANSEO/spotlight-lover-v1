// ═══════════════════════════════════════════════════════════════════════════════
// candidates.module.ts — SpotLightLover (VERSION CORRIGÉE)
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { PrismaService } from '../prisma.service';
import { EmailModule } from '../mails/email.module'; // ← IMPORTATION DU MODULE EMAIL

@Module({
  imports: [ConfigModule, EmailModule], // ✅ AJOUT EmailModule
  controllers: [CandidatesController],
  providers: [CandidatesService, PrismaService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
