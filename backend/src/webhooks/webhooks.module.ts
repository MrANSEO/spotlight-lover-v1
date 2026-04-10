import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma.service';
import { PaymentModule } from '../payments/payment.module';
import { ConfigModule } from '@nestjs/config';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [ConfigModule, LeaderboardModule, PaymentModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, PrismaService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
