import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateVoteDto } from './dto/vote.dto';
import { PaymentStatus, CandidateStatus, PaymentProvider } from '@prisma/client';

@Injectable()
export class VotesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async initiateVote(userId: string, createVoteDto: CreateVoteDto, ipAddress?: string, userAgent?: string) {
    // Verify candidate exists and is active
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: createVoteDto.candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (candidate.status !== CandidateStatus.ACTIVE) {
      throw new BadRequestException('Cannot vote for inactive candidate');
    }

    const votePrice = parseInt(this.configService.get('VOTE_PRICE') || '100');
    const amount = createVoteDto.amount || votePrice;

    // Create vote with PENDING status
    const vote = await this.prisma.vote.create({
      data: {
        candidateId: createVoteDto.candidateId,
        voterId: userId,
        amount,
        currency: 'XOF',
        status: PaymentStatus.PENDING,
        provider: createVoteDto.paymentProvider,
        ipAddress,
        userAgent,
      },
    });

    // Create transaction record
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        type: 'VOTE',
        amount,
        currency: 'XOF',
        status: PaymentStatus.PENDING,
        provider: createVoteDto.paymentProvider,
        idempotencyKey: `vote-${vote.id}`,
        ipAddress,
        userAgent,
      },
    });

    // Link vote to transaction
    await this.prisma.vote.update({
      where: { id: vote.id },
      data: { transactionId: transaction.id },
    });

    return {
      vote,
      transaction,
      message: 'Vote initiated. Please complete payment.',
      paymentUrl: `/api/payments/vote/${vote.id}/process`,
    };
  }

  async confirmVote(voteId: string) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
      include: { candidate: true, transaction: true },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    // Update vote status
    await this.prisma.vote.update({
      where: { id: voteId },
      data: {
        status: PaymentStatus.COMPLETED,
        isVerified: true,
      },
    });

    // Update transaction
    if (vote.transactionId) {
      await this.prisma.transaction.update({
        where: { id: vote.transactionId },
        data: {
          status: PaymentStatus.COMPLETED,
          webhookReceived: true,
        },
      });
    }

    // Update leaderboard (will be handled by LeaderboardService)
    // For now, just ensure entry exists
    const leaderboardEntry = await this.prisma.leaderboardEntry.findUnique({
      where: { candidateId: vote.candidateId },
    });

    if (leaderboardEntry) {
      await this.prisma.leaderboardEntry.update({
        where: { candidateId: vote.candidateId },
        data: {
          totalVotes: { increment: 1 },
          totalAmount: { increment: vote.amount },
          lastUpdated: new Date(),
        },
      });
    } else {
      await this.prisma.leaderboardEntry.create({
        data: {
          candidateId: vote.candidateId,
          totalVotes: 1,
          totalAmount: vote.amount,
          lastUpdated: new Date(),
        },
      });
    }

    return {
      message: 'Vote confirmed successfully',
      vote,
    };
  }

  async getMyVotes(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [votes, total] = await Promise.all([
      this.prisma.vote.findMany({
        where: { voterId: userId },
        skip,
        take: limit,
        include: {
          candidate: {
            select: {
              id: true,
              stageName: true,
              thumbnailUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vote.count({ where: { voterId: userId } }),
    ]);

    return {
      data: votes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCandidateVoteStats(candidateId: string) {
    const [totalVotes, totalAmount, verifiedVotes] = await Promise.all([
      this.prisma.vote.count({
        where: {
          candidateId,
          status: PaymentStatus.COMPLETED,
        },
      }),
      this.prisma.vote.aggregate({
        where: {
          candidateId,
          status: PaymentStatus.COMPLETED,
        },
        _sum: { amount: true },
      }),
      this.prisma.vote.count({
        where: {
          candidateId,
          status: PaymentStatus.COMPLETED,
          isVerified: true,
        },
      }),
    ]);

    return {
      candidateId,
      totalVotes,
      totalAmount: totalAmount._sum.amount || 0,
      verifiedVotes,
      currency: 'XOF',
    };
  }

  async getAllVotes(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [votes, total] = await Promise.all([
      this.prisma.vote.findMany({
        skip,
        take: limit,
        include: {
          candidate: {
            select: {
              id: true,
              stageName: true,
            },
          },
          voter: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vote.count(),
    ]);

    return {
      data: votes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
