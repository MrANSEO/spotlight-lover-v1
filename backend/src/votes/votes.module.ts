import { Module } from '@nestjs/common';
import { WebhooksController } from '../webhooks/webhooks.controller';
import { WebhooksService } from '../webhooks/webhooks.service';
import { PaymentModule } from '../payments/payment.module';
import { PrismaService } from '../prisma.service';
import { ReferralModule } from '../referral/referral.module'; // ← ajoute cet import

@Module({
  imports: [
    PaymentModule,
    ReferralModule, // ← ajoute cette ligne
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, PrismaService],
})
export class WebhooksModule {}