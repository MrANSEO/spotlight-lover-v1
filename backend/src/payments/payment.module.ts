import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PayunitService } from './payunit/payunit.service';
import { PrismaService } from '../prisma.service';
import { ReferralModule } from '../referral/referral.module';

@Module({
  imports: [ConfigModule, ReferralModule],
  controllers: [PaymentController],
  providers: [PaymentService, PayunitService, PrismaService],
  exports: [PaymentService, PayunitService],
})
export class PaymentModule {}
