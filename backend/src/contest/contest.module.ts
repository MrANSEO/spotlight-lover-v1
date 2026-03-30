// src/contest/contest.module.ts — VERSION MISE À JOUR
// Modification par rapport à ton fichier actuel :
//   ContestService est maintenant dans providers (il était absent)
//   ContestService injecte EmailService → EmailModule doit être dans imports (déjà présent)

import { Module } from '@nestjs/common';
import { ContestController } from './contest.controller';
import { ContestService } from './contest.service';
import { ContestScheduler } from './contest.scheduler';
import { PrismaService } from '../prisma.service';
import { EmailModule } from '../mails/email.module';

@Module({
  imports: [EmailModule],
  controllers: [ContestController],
  providers: [
    ContestService,    // ← était absent dans ton fichier !
    ContestScheduler,
    PrismaService,
  ],
  exports: [ContestService, ContestScheduler],
})
export class ContestModule {}