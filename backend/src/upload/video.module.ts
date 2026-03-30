// ═══════════════════════════════════════════════════════════════
// video.module.ts
// ═══════════════════════════════════════════════════════════════
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
  controllers: [VideoController],
  providers: [VideoService, PrismaService],
  exports: [VideoService],
})
export class VideoModule {}