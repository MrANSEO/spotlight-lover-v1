import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalCandidates,
      activeCandidates,
      totalVotes,
      completedVotes,
      totalRevenue,
      candidateRegistrationRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.candidate.count(),
      this.prisma.candidate.count({ where: { status: 'ACTIVE' } }),
      this.prisma.vote.count(),
      this.prisma.vote.count({ where: { status: 'COMPLETED' } }),
      this.prisma.vote.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.candidateRegistrationPayment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      candidates: {
        total: totalCandidates,
        active: activeCandidates,
        pending: totalCandidates - activeCandidates,
      },
      votes: {
        total: totalVotes,
        completed: completedVotes,
        pending: totalVotes - completedVotes,
      },
      revenue: {
        votes: totalRevenue._sum.amount || 0,
        registrations: candidateRegistrationRevenue._sum.amount || 0,
        total: (totalRevenue._sum.amount || 0) + (candidateRegistrationRevenue._sum.amount || 0),
        currency: 'XOF',
      },
    };
  }

  async getRevenueByDay(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyStats = await this.prisma.dailyStats.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    return dailyStats;
  }

  async getVotesByCandidate(limit: number = 10) {
    const candidates = await this.prisma.candidate.findMany({
      take: limit,
      include: {
        _count: {
          select: {
            votesReceived: {
              where: { status: 'COMPLETED' },
            },
          },
        },
      },
      orderBy: {
        votesReceived: {
          _count: 'desc',
        },
      },
    });

    return candidates.map((candidate) => ({
      id: candidate.id,
      stageName: candidate.stageName,
      totalVotes: candidate._count.votesReceived,
    }));
  }

  async getPaymentStats() {
    const [
      totalTransactions,
      completedTransactions,
      failedTransactions,
      totalAmount,
      byProvider,
    ] = await Promise.all([
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      this.prisma.transaction.count({ where: { status: 'FAILED' } }),
      this.prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['provider'],
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    return {
      transactions: {
        total: totalTransactions,
        completed: completedTransactions,
        failed: failedTransactions,
        pending: totalTransactions - completedTransactions - failedTransactions,
      },
      revenue: {
        total: totalAmount._sum.amount || 0,
        currency: 'XOF',
      },
      byProvider: byProvider.map((p) => ({
        provider: p.provider,
        count: p._count._all,
        amount: p._sum.amount || 0,
      })),
    };
  }

  async getCandidateStats() {
    const statusGroups = await this.prisma.candidate.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return statusGroups.map((group) => ({
      status: group.status,
      count: group._count._all,
    }));
  }

  async getUserGrowth(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyStats = await this.prisma.dailyStats.findMany({
      where: {
        date: { gte: startDate },
      },
      select: {
        date: true,
        newUsers: true,
        newCandidates: true,
      },
      orderBy: { date: 'asc' },
    });

    return dailyStats;
  }

  async exportDataToCsv(type: 'users' | 'candidates' | 'votes' | 'transactions') {
    let data: any[] = [];

    switch (type) {
      case 'users':
        data = await this.prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });
        break;

      case 'candidates':
        data = await this.prisma.candidate.findMany({
          select: {
            id: true,
            stageName: true,
            status: true,
            createdAt: true,
            user: {
              select: { email: true },
            },
          },
        });
        break;

      case 'votes':
        data = await this.prisma.vote.findMany({
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            candidate: {
              select: { stageName: true },
            },
            voter: {
              select: { email: true },
            },
          },
        });
        break;

      case 'transactions':
        data = await this.prisma.transaction.findMany({
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            provider: true,
            createdAt: true,
          },
        });
        break;
    }

    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => {
          if (typeof val === 'object' && val !== null) {
            return JSON.stringify(val);
          }
          return val;
        })
        .join(',')
    );

    return [headers, ...rows].join('\n');
  }
}
