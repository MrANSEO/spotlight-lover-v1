import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaService } from '../prisma.service';
import { MeSombProvider } from './providers/mesomb.provider';
import { StripeProvider } from './providers/stripe.provider';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, MeSombProvider, StripeProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
