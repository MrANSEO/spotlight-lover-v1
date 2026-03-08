import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { VotesService } from '../votes/votes.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private votesService: VotesService,
  ) {}

  async handleMeSombWebhook(payload: any, signature?: string) {
    this.logger.log('Received MeSomb webhook');

    // Log webhook
    const webhookLog = await this.prisma.webhookLog.create({
      data: {
        provider: 'MESOMB',
        event: payload.event || 'payment.completed',
        payload,
        signature,
        isValid: true, // TODO: Verify signature
      },
    });

    try {
      // Check idempotency
      const idempotencyKey = payload.reference || payload.transaction_id;
      const existingTransaction = await this.prisma.transaction.findUnique({
        where: { idempotencyKey },
      });

      if (existingTransaction && existingTransaction.webhookReceived) {
        this.logger.warn(`Duplicate webhook for transaction: ${idempotencyKey}`);
        await this.prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: { isProcessed: true },
        });
        return { message: 'Webhook already processed (idempotency)' };
      }

      // Determine transaction type and process
      if (payload.type === 'VOTE' || payload.reference?.startsWith('vote-')) {
        await this.processVoteWebhook(payload);
      } else if (payload.type === 'REGISTRATION' || payload.reference?.startsWith('candidate-')) {
        await this.processCandidateRegistrationWebhook(payload);
      } else {
        this.logger.warn(`Unknown webhook type: ${payload.type}`);
      }

      // Mark webhook as processed
      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { isProcessed: true },
      });

      return { message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`);
      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          isProcessed: false,
          processingError: error.message,
        },
      });
      throw error;
    }
  }

  private async processVoteWebhook(payload: any) {
    const voteId = payload.reference?.replace('vote-', '');
    
    if (!voteId) {
      throw new BadRequestException('Invalid vote reference in webhook');
    }

    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
    });

    if (!vote) {
      throw new BadRequestException(`Vote not found: ${voteId}`);
    }

    if (vote.status === PaymentStatus.COMPLETED) {
      this.logger.warn(`Vote already completed: ${voteId}`);
      return;
    }

    await this.votesService.confirmVote(voteId);
    this.logger.log(`Vote confirmed: ${voteId}`);
  }

  private async processCandidateRegistrationWebhook(payload: any) {
    const paymentId = payload.reference;

    if (!paymentId) {
      throw new BadRequestException('Invalid payment reference in webhook');
    }

    const payment = await this.prisma.candidateRegistrationPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new BadRequestException(`Payment not found: ${paymentId}`);
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.warn(`Payment already completed: ${paymentId}`);
      return;
    }

    await this.paymentsService.confirmCandidateRegistrationPayment(paymentId, payload);
    this.logger.log(`Candidate registration payment confirmed: ${paymentId}`);
  }

  async handleStripeWebhook(payload: any, signature?: string) {
    this.logger.log('Received Stripe webhook');

    // Log webhook
    const webhookLog = await this.prisma.webhookLog.create({
      data: {
        provider: 'STRIPE',
        event: payload.type || 'payment_intent.succeeded',
        payload,
        signature,
        isValid: true, // TODO: Verify signature
      },
    });

    try {
      // Process based on event type
      if (payload.type === 'payment_intent.succeeded') {
        const paymentIntent = payload.data.object;
        const reference = paymentIntent.metadata.reference;

        if (reference.startsWith('vote-')) {
          await this.processVoteWebhook({ reference, ...paymentIntent });
        } else {
          await this.processCandidateRegistrationWebhook({ reference, ...paymentIntent });
        }
      }

      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { isProcessed: true },
      });

      return { message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error(`Stripe webhook error: ${error.message}`);
      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          isProcessed: false,
          processingError: error.message,
        },
      });
      throw error;
    }
  }

  async getWebhookLogs(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookLog.count(),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
