import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MeSombProvider } from './providers/mesomb.provider';
import { StripeProvider } from './providers/stripe.provider';
import { PaymentProvider, PaymentStatus, CandidateStatus } from '@prisma/client';
import { IPaymentProvider } from './interfaces/payment-provider.interface';

@Injectable()
export class PaymentsService {
  private readonly providers: Map<PaymentProvider, IPaymentProvider>;

  constructor(
    private prisma: PrismaService,
    private mesombProvider: MeSombProvider,
    private stripeProvider: StripeProvider,
  ) {
    this.providers = new Map<PaymentProvider, IPaymentProvider>([
      [PaymentProvider.MESOMB, this.mesombProvider as IPaymentProvider],
      [PaymentProvider.STRIPE, this.stripeProvider as IPaymentProvider],
      [PaymentProvider.MTN, this.mesombProvider as IPaymentProvider],
      [PaymentProvider.ORANGE, this.mesombProvider as IPaymentProvider],
    ]);
  }

  async processCandidateRegistrationPayment(paymentId: string) {
    const payment = await this.prisma.candidateRegistrationPayment.findUnique({
      where: { id: paymentId },
      include: {
        candidate: true,
        user: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Payment already ${payment.status.toLowerCase()}`);
    }

    const provider = this.providers.get(payment.provider);
    if (!provider) {
      throw new BadRequestException(`Provider ${payment.provider} not supported`);
    }

    // Update status to PROCESSING
    await this.prisma.candidateRegistrationPayment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.PROCESSING },
    });

    // Initiate payment with provider
    const result = await provider.initiatePayment(payment.amount, payment.currency, {
      reference: payment.id,
      userId: payment.userId,
      candidateId: payment.candidateId,
      service: payment.provider,
      phone: payment.user.phone,
      callbackUrl: `${process.env.BACKEND_URL}/api/webhooks/mesomb`,
    });

    if (!result.success) {
      await this.prisma.candidateRegistrationPayment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.FAILED },
      });
      throw new BadRequestException(`Payment initiation failed: ${result.error}`);
    }

    // Update with provider reference
    await this.prisma.candidateRegistrationPayment.update({
      where: { id: paymentId },
      data: {
        providerReference: result.providerReference,
        transactionId: result.transactionId,
      },
    });

    return {
      message: 'Payment initiated successfully',
      paymentUrl: result.paymentUrl,
      transactionId: result.transactionId,
    };
  }

  async confirmCandidateRegistrationPayment(paymentId: string, providerData: any) {
    const payment = await this.prisma.candidateRegistrationPayment.findUnique({
      where: { id: paymentId },
      include: { candidate: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status
    await this.prisma.candidateRegistrationPayment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.COMPLETED,
        updatedAt: new Date(),
      },
    });

    // Update candidate status to PENDING_VALIDATION
    await this.prisma.candidate.update({
      where: { id: payment.candidateId },
      data: { status: CandidateStatus.PENDING_VALIDATION },
    });

    return {
      message: 'Payment confirmed successfully',
      candidate: payment.candidate,
    };
  }

  async getCandidateRegistrationPayment(paymentId: string) {
    const payment = await this.prisma.candidateRegistrationPayment.findUnique({
      where: { id: paymentId },
      include: {
        candidate: {
          select: {
            id: true,
            stageName: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getPaymentStats() {
    const [total, completed, pending, failed] = await Promise.all([
      this.prisma.candidateRegistrationPayment.count(),
      this.prisma.candidateRegistrationPayment.count({ where: { status: PaymentStatus.COMPLETED } }),
      this.prisma.candidateRegistrationPayment.count({ where: { status: PaymentStatus.PENDING } }),
      this.prisma.candidateRegistrationPayment.count({ where: { status: PaymentStatus.FAILED } }),
    ]);

    const totalRevenue = await this.prisma.candidateRegistrationPayment.aggregate({
      where: { status: PaymentStatus.COMPLETED },
      _sum: { amount: true },
    });

    return {
      registrationPayments: {
        total,
        completed,
        pending,
        failed,
        processing: total - completed - pending - failed,
      },
      revenue: {
        registrations: totalRevenue._sum.amount || 0,
        currency: 'XOF',
      },
    };
  }
}
