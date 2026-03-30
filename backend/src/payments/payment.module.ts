import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MeSombService } from './mesomb/mesomb.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentController],
  providers: [PaymentService, MeSombService, PrismaService],
  exports: [PaymentService, MeSombService],
})
export class PaymentModule {}
