import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private prisma: PrismaService) {}

  async getLeaderboard(limit?: number) {
    const leaderboard = await this.prisma.leaderboardEntry.findMany({
      take: limit,
      include: {
        candidate: {
          select: {
            id: true,
            stageName: true,
            bio: true,
            videoUrl: true,
            thumbnailUrl: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [
        { totalVotes: 'desc' },
        { totalAmount: 'desc' },
      ],
    });

    // Assign ranks
    return leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  async getCandidateRank(candidateId: string) {
    const entry = await this.prisma.leaderboardEntry.findUnique({
      where: { candidateId },
      include: {
        candidate: {
          select: {
            id: true,
            stageName: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    if (!entry) {
      return {
        candidateId,
        rank: null,
        totalVotes: 0,
        totalAmount: 0,
        message: 'Candidate not in leaderboard yet',
      };
    }

    // Calculate rank
    const higherRanked = await this.prisma.leaderboardEntry.count({
      where: {
        OR: [
          { totalVotes: { gt: entry.totalVotes } },
          {
            totalVotes: entry.totalVotes,
            totalAmount: { gt: entry.totalAmount },
          },
        ],
      },
    });

    return {
      ...entry,
      rank: higherRanked + 1,
    };
  }

  async recalculateLeaderboard() {
    this.logger.log('Starting leaderboard recalculation...');

    // Get all active candidates with their vote stats
    const candidates = await this.prisma.candidate.findMany({
      where: { status: 'ACTIVE' },
      include: {
        votesReceived: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    // Recalculate for each candidate
    for (const candidate of candidates) {
      const totalVotes = candidate.votesReceived.length;
      const totalAmount = candidate.votesReceived.reduce(
        (sum, vote) => sum + vote.amount,
        0,
      );

      await this.prisma.leaderboardEntry.upsert({
        where: { candidateId: candidate.id },
        create: {
          candidateId: candidate.id,
          totalVotes,
          totalAmount,
          lastUpdated: new Date(),
        },
        update: {
          totalVotes,
          totalAmount,
          lastUpdated: new Date(),
        },
      });
    }

    // Update ranks
    const entries = await this.prisma.leaderboardEntry.findMany({
      orderBy: [
        { totalVotes: 'desc' },
        { totalAmount: 'desc' },
      ],
    });

    for (let i = 0; i < entries.length; i++) {
      await this.prisma.leaderboardEntry.update({
        where: { id: entries[i].id },
        data: { rank: i + 1 },
      });
    }

    this.logger.log('Leaderboard recalculation completed');
    return { message: 'Leaderboard recalculated successfully' };
  }
}
