// ═══════════════════════════════════════════════════════════════════════════════
// users.module.ts — SpotLightLover
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import { MeController } from './me.controller';

@Module({
  controllers: [UsersController, MeController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
