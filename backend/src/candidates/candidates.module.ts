import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [CandidatesController],
  providers: [CandidatesService, PrismaService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
