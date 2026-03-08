import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [VotesController],
  providers: [VotesService, PrismaService],
  exports: [VotesService],
})
export class VotesModule {}
