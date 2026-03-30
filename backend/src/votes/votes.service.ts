import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentStatus, CandidateStatus } from '@prisma/client';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  // Lecture seule — les votes sont créés via PaymentService
  // Ce service expose uniquement les queries de lecture

  async getCandidateVoteStats(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        _count: {
          select: {
            votesReceived: { where: { status: PaymentStatus.COMPLETED } },
          },
        },
      },
    });

    if (!candidate) throw new NotFoundException('Candidat non trouvé.');

    return {
      candidateId,
      stageName: candidate.stageName,
      totalVotes: candidate._count.votesReceived,
      totalAmount: 0,
      rank: null,
    };
  }

  async getMyVotes(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [votes, total] = await Promise.all([
      this.prisma.vote.findMany({
        where: { voterId: userId, status: PaymentStatus.COMPLETED },
        skip,
        take: limit,
        include: {
          candidate: {
            select: { stageName: true, thumbnailUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vote.count({
        where: { voterId: userId, status: PaymentStatus.COMPLETED },
      }),
    ]);

    return {
      data: votes,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAllVotes(page = 1, limit = 20, status?: PaymentStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [votes, total] = await Promise.all([
      this.prisma.vote.findMany({
        where,
        skip,
        take: limit,
        include: {
          candidate: { select: { stageName: true } },
          voter: { select: { email: true } },
          transaction: { select: { provider: true, providerReference: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vote.count({ where }),
    ]);

    return {
      data: votes,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async cancelVote(voteId: string, adminId: string) {
    const vote = await this.prisma.vote.findUnique({ where: { id: voteId } });
    if (!vote) throw new NotFoundException('Vote non trouvé.');
    if (vote.status !== PaymentStatus.COMPLETED) {
      throw new ForbiddenException('Seul un vote COMPLETED peut être annulé.');
    }

    await this.prisma.$transaction([
      this.prisma.vote.update({
        where: { id: voteId },
        data: { status: PaymentStatus.REFUNDED },
      }),
      this.prisma.leaderboardEntry.update({
        where: { candidateId: vote.candidateId },
        data: {
          totalVotes: { decrement: 1 },
          totalAmount: { decrement: vote.amount },
          lastUpdated: new Date(),
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'VOTE_CANCELLED',
          resource: 'Vote',
          details: {
            voteId,
            candidateId: vote.candidateId,
            amount: vote.amount,
          },
        },
      }),
    ]);

    return { message: 'Vote annulé avec succès.' };
  }

  /**
   * Confirms a single vote (called from webhooks)
   */
  async confirmVote(voteId: string) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
    });

    if (!vote) {
      throw new NotFoundException('Vote non trouvé.');
    }

    // Update vote status to COMPLETED
    await this.prisma.vote.update({
      where: { id: voteId },
      data: {
        status: PaymentStatus.COMPLETED,
        isVerified: true,
      },
    });

    // Update leaderboard
    await this.prisma.leaderboardEntry.upsert({
      where: { candidateId: vote.candidateId },
      create: {
        candidateId: vote.candidateId,
        totalVotes: 1,
        totalAmount: vote.amount,
        lastUpdated: new Date(),
      },
      update: {
        totalVotes: { increment: 1 },
        totalAmount: { increment: vote.amount },
        lastUpdated: new Date(),
      },
    });
  }
}
