import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { PrismaService } from '../prisma.service';
import { PaymentsModule } from '../payments/payments.module';
import { VotesModule } from '../votes/votes.module';

@Module({
  imports: [PaymentsModule, VotesModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, PrismaService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
