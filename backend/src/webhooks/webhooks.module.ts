import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma.service';
// PaymentService est injecté pour confirmer les votes/registrations via webhook
import { PaymentService } from '../payments/payment.service';
import { MeSombService } from '../payments/mesomb/mesomb.service';
import { ConfigModule } from '@nestjs/config';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [ConfigModule, LeaderboardModule],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhooksController,
    PrismaService,
    PaymentService,
    MeSombService,
  ],
  exports: [WebhooksService],
})
export class WebhooksModule {}
