import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(limit = 20) {
    const entries = await this.prisma.leaderboardEntry.findMany({
      take: limit,
      orderBy: [{ totalVotes: 'desc' }, { totalAmount: 'desc' }],
      include: {
        candidate: {
          select: {
            id: true,
            stageName: true,
            bio: true,
            thumbnailUrl: true,
            videoUrl: true,
            status: true,
          },
        },
      },
    });

    return {
      entries: entries.map((e, i) => ({
        rank: e.rank || i + 1,
        candidateId: e.candidateId,
        stageName: e.candidate.stageName,
        bio: e.candidate.bio,
        thumbnailUrl: e.candidate.thumbnailUrl,
        videoUrl: e.candidate.videoUrl,
        totalVotes: e.totalVotes,
        totalAmount: e.totalAmount,
        lastUpdated: e.lastUpdated,
      })),
      updatedAt: new Date(),
    };
  }

  async getCandidateRank(candidateId: string) {
    const entry = await this.prisma.leaderboardEntry.findUnique({
      where: { candidateId },
    });
    if (!entry) return null;

    const above = await this.prisma.leaderboardEntry.count({
      where: { totalVotes: { gt: entry.totalVotes } },
    });

    return {
      rank: above + 1,
      totalVotes: entry.totalVotes,
      totalAmount: entry.totalAmount,
    };
  }
}
