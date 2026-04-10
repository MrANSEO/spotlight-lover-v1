import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { PaymentModule } from '../payments/payment.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [PaymentModule],
  controllers: [VotesController],
  providers: [VotesService, PrismaService],
})
export class VotesModule {}
