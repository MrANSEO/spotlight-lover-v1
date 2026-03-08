import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('candidate/:paymentId/process')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process candidate registration payment' })
  @ApiResponse({ status: 200, description: 'Payment processing initiated' })
  async processCandidatePayment(@Param('paymentId') paymentId: string) {
    return this.paymentsService.processCandidateRegistrationPayment(paymentId);
  }

  @Get('candidate/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get candidate registration payment details' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved' })
  async getCandidatePayment(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getCandidateRegistrationPayment(paymentId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getStats() {
    return this.paymentsService.getPaymentStats();
  }
}
