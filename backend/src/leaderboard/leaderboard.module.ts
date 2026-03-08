import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardGateway } from './leaderboard.gateway';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [LeaderboardController],
  providers: [LeaderboardService, LeaderboardGateway, PrismaService],
  exports: [LeaderboardService, LeaderboardGateway],
})
export class LeaderboardModule {}
