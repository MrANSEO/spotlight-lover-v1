// src/contest/contest.service.ts — VERSION COMPLÈTE ET FINALE
// Remplace intégralement ton fichier existant.
//
// Modifications par rapport à l'original :
//   1. Injection d'EmailService (déjà dans contest.module.ts via EmailModule)
//   2. publishResults() : logique prix = prizeAmount (fixe) + % revenus
//      - Le 1er reçoit un email avec le prix en FCFA
//      - Le 2ème et 3ème reçoivent un email de position (sans prix)
//      - Tous les votants reçoivent un email de résultats
//   3. Aucune autre méthode n'est modifiée.

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ContestStatus } from '@prisma/client';
import { EmailService } from '../mails/email.service';

@Injectable()
export class ContestService {
  private readonly logger = new Logger(ContestService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ─── Créer ou obtenir le concours actif (inchangé) ────────────────────────

  async getActiveContest() {
    return this.prisma.contest.findFirst({
      where: { status: { in: [ContestStatus.OPEN, ContestStatus.DRAFT] } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Créer un nouveau concours (inchangé) ────────────────────────────────

  async createContest(data: {
    title: string;
    startDate?: Date;
    endDate?: Date;
    prizeAmount?: number;
    prizeDescription?: string;
  }) {
    const existing = await this.prisma.contest.findFirst({
      where: { status: ContestStatus.OPEN },
    });

    if (existing) {
      throw new BadRequestException(
        'Un concours est déjà en cours. Clôturez-le avant d\'en créer un nouveau.',
      );
    }

    return this.prisma.contest.create({
      data: {
        title: data.title,
        status: ContestStatus.DRAFT,
        startDate: data.startDate,
        endDate: data.endDate,
        prizeAmount: data.prizeAmount,
        prizeDescription: data.prizeDescription,
      },
    });
  }

  // ─── Ouvrir le concours (inchangé) ───────────────────────────────────────

  async openContest(contestId: string) {
    const contest = await this.prisma.contest.findUnique({ where: { id: contestId } });

    if (!contest) throw new NotFoundException('Concours non trouvé.');
    if (contest.status !== ContestStatus.DRAFT) {
      throw new BadRequestException('Seul un concours en DRAFT peut être ouvert.');
    }

    return this.prisma.contest.update({
      where: { id: contestId },
      data: {
        status: ContestStatus.OPEN,
        startDate: contest.startDate || new Date(),
      },
    });
  }

  // ─── Clôturer le concours (inchangé) ─────────────────────────────────────

  async closeContest(contestId: string, adminId: string) {
    const contest = await this.prisma.contest.findUnique({ where: { id: contestId } });

    if (!contest) throw new NotFoundException('Concours non trouvé.');
    if (contest.status !== ContestStatus.OPEN) {
      throw new BadRequestException('Seul un concours OPEN peut être clôturé.');
    }

    this.logger.log(`Admin ${adminId} closing contest ${contestId}`);

    await this.prisma.contest.update({
      where: { id: contestId },
      data: { status: ContestStatus.CLOSED, endDate: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CONTEST_CLOSED',
        resource: 'Contest',
        details: { contestId },
      },
    });

    return { message: 'Concours clôturé. Vous pouvez maintenant publier les résultats.' };
  }

  // ─── Publier les résultats — VERSION CORRIGÉE ─────────────────────────────
  //
  // Règles business :
  //   - Seul le 1er reçoit le prix financier
  //   - Le 2ème et 3ème reçoivent une notification de position (sans prix)
  //   - Tous les votants reçoivent un récapitulatif avec le top 3

  async publishResults(contestId: string, adminId: string) {
    const contest = await this.prisma.contest.findUnique({ where: { id: contestId } });

    if (!contest) throw new NotFoundException('Concours non trouvé.');
    if (contest.status !== ContestStatus.CLOSED) {
      throw new BadRequestException('Clôturez le concours avant de publier les résultats.');
    }

    // ─── Classement final ────────────────────────────────────────────────

    const leaderboard = await this.prisma.leaderboardEntry.findMany({
      include: {
        candidate: {
          include: {
            user: { select: { email: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ totalVotes: 'desc' }, { totalAmount: 'desc' }],
    });

    if (leaderboard.length === 0) {
      throw new BadRequestException('Aucun candidat avec des votes.');
    }

    // ─── Calcul du prix ──────────────────────────────────────────────────
    //
    // Prix total = prizeAmount (fixe défini à la création) + bonus lié aux revenus.
    // Le bonus = % des revenus totaux du concours (votes + inscriptions).
    // Le % est lisible depuis SystemSetting 'prizePoolPercent' (modifiable sans redéploiement).
    // Si non défini, on utilise 30% par défaut.
    //
    // Exemple :
    //   prizeAmount = 25 000 FCFA (fixe, promis aux candidats)
    //   revenus = 200 000 FCFA (votes 100F chacun + inscriptions 500F)
    //   prizePoolPercent = 30%
    //   bonus = 200 000 × 30% = 60 000 FCFA
    //   prix total au 1er = 25 000 + 60 000 = 85 000 FCFA

    const [voteRevenue, regRevenue, percentSetting] = await Promise.all([
      this.prisma.vote.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.candidateRegistrationPayment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.systemSetting.findUnique({
        where: { key: 'prizePoolPercent' },
      }),
    ]);

    const totalRevenue = (voteRevenue._sum.amount ?? 0) + (regRevenue._sum.amount ?? 0);
    const prizePoolPercent = parseInt(percentSetting?.value ?? '30');
    const basePrize = contest.prizeAmount ?? 0;
    const bonusPrize = Math.floor(totalRevenue * prizePoolPercent / 100);
    const finalPrize = basePrize + bonusPrize;

    // ─── Mise à jour des rangs définitifs ────────────────────────────────

    await Promise.all(
      leaderboard.map((entry, index) =>
        this.prisma.leaderboardEntry.update({
          where: { id: entry.id },
          data: { rank: index + 1 },
        }),
      ),
    );

    // ─── Publication en base ──────────────────────────────────────────────

    const winner = leaderboard[0];

    await this.prisma.contest.update({
      where: { id: contestId },
      data: {
        status: ContestStatus.RESULTS_PUBLISHED,
        winnerCandidateId: winner.candidateId,
        resultsPublishedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'RESULTS_PUBLISHED',
        resource: 'Contest',
        details: {
          contestId,
          winnerId: winner.candidateId,
          winnerName: winner.candidate.stageName,
          totalVotes: winner.totalVotes,
          finalPrize,
          totalRevenue,
          prizePoolPercent,
        },
      },
    });

    this.logger.log(
      `Results published. Winner: ${winner.candidate.stageName} (${winner.totalVotes} votes). Prize: ${finalPrize} FCFA`,
    );

    // ─── Notifications email (async — ne bloque pas la réponse HTTP) ─────

    this.sendResultNotificationsAsync(leaderboard, finalPrize, totalRevenue).catch(
      (e) => this.logger.error('Result notifications failed:', e),
    );

    // ─── Réponse API ─────────────────────────────────────────────────────

    return {
      message: '🏆 Résultats publiés avec succès !',
      prize: {
        base: basePrize,
        bonus: bonusPrize,
        total: finalPrize,
        prizePoolPercent,
        totalRevenue,
      },
      winner: {
        candidateId: winner.candidateId,
        stageName: winner.candidate.stageName,
        totalVotes: winner.totalVotes,
        totalAmount: winner.totalAmount,
        prize: finalPrize,
      },
      top3: leaderboard.slice(0, 3).map((entry, index) => ({
        rank: index + 1,
        candidateId: entry.candidateId,
        stageName: entry.candidate.stageName,
        totalVotes: entry.totalVotes,
        // Seul le 1er a un prix
        prize: index === 0 ? finalPrize : null,
      })),
      totalParticipants: leaderboard.length,
      leaderboard: leaderboard.slice(0, 10).map((entry, index) => ({
        rank: index + 1,
        candidateId: entry.candidateId,
        stageName: entry.candidate.stageName,
        totalVotes: entry.totalVotes,
      })),
    };
  }

  // ─── Méthode privée : envoyer toutes les notifications ───────────────────

  private async sendResultNotificationsAsync(
    leaderboard: any[],
    finalPrize: number,
    totalRevenue: number,
  ): Promise<void> {
    const top3 = leaderboard.slice(0, 3).map((e, i) => ({
      rank: i + 1,
      stageName: e.candidate.stageName,
      votes: e.totalVotes,
    }));

    const totalVotes = leaderboard.reduce((s, e) => s + e.totalVotes, 0);

    // 1er : email gagnant avec prix
    if (leaderboard[0]) {
      const w = leaderboard[0];
      await this.emailService.sendWinnerNotificationEmail(
        w.candidate.user.email,
        w.candidate.user.firstName || w.candidate.stageName,
        w.candidate.stageName,
        w.totalVotes,
        finalPrize,
      );
    }

    // 2ème : email position sans prix
    if (leaderboard[1]) {
      const s = leaderboard[1];
      await this.emailService.sendTop3NotificationEmail(
        s.candidate.user.email,
        s.candidate.user.firstName || s.candidate.stageName,
        s.candidate.stageName,
        2,
        s.totalVotes,
      );
    }

    // 3ème : email position sans prix
    if (leaderboard[2]) {
      const t = leaderboard[2];
      await this.emailService.sendTop3NotificationEmail(
        t.candidate.user.email,
        t.candidate.user.firstName || t.candidate.stageName,
        t.candidate.stageName,
        3,
        t.totalVotes,
      );
    }

    // Tous les votants uniques
    const voters = await this.prisma.vote.findMany({
      where: { status: 'COMPLETED' },
      distinct: ['voterId'],
      include: { voter: { select: { email: true, firstName: true } } },
    });

    // Envoi par batch de 20 pour ne pas surcharger Gmail
    const batchSize = 20;
    for (let i = 0; i < voters.length; i += batchSize) {
      const batch = voters.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map((v) =>
          this.emailService.sendContestClosedEmailToVoters(
            v.voter.email,
            v.voter.firstName || 'Participant',
            totalVotes,
            totalRevenue,
            top3,
          ),
        ),
      );
      if (i + batchSize < voters.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    this.logger.log(
      `Notifications envoyées : 1 gagnant + 2 top3 + ${voters.length} votants`,
    );
  }

  // ─── Résultats publics (inchangé) ────────────────────────────────────────

  async getPublicResults() {
    const contest = await this.prisma.contest.findFirst({
      where: { status: ContestStatus.RESULTS_PUBLISHED },
      orderBy: { resultsPublishedAt: 'desc' },
    });

    if (!contest) {
      return { published: false, message: 'Les résultats ne sont pas encore disponibles.' };
    }

    const leaderboard = await this.prisma.leaderboardEntry.findMany({
      include: {
        candidate: {
          select: { stageName: true, bio: true, thumbnailUrl: true },
        },
      },
      orderBy: { rank: 'asc' },
      take: 20,
    });

    return {
      published: true,
      contest: {
        title: contest.title,
        endDate: contest.endDate,
        resultsPublishedAt: contest.resultsPublishedAt,
        prizeAmount: contest.prizeAmount,
        prizeDescription: contest.prizeDescription,
      },
      winner: contest.winnerCandidateId
        ? leaderboard.find((e) => e.candidateId === contest.winnerCandidateId)
        : null,
      leaderboard: leaderboard.map((entry) => ({
        rank: entry.rank,
        stageName: entry.candidate.stageName,
        bio: entry.candidate.bio,
        thumbnailUrl: entry.candidate.thumbnailUrl,
        totalVotes: entry.totalVotes,
      })),
    };
  }

  // ─── Statistiques du concours (inchangé) ─────────────────────────────────

  async getContestStats(contestId: string) {
    const [totalCandidates, activeCandidates, totalVotes, totalRevenue, leaderboard] =
      await Promise.all([
        this.prisma.candidate.count(),
        this.prisma.candidate.count({ where: { status: 'ACTIVE' } }),
        this.prisma.vote.count({ where: { status: 'COMPLETED' } }),
        this.prisma.vote.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true },
        }),
        this.prisma.leaderboardEntry.findMany({
          include: { candidate: { select: { stageName: true } } },
          orderBy: { totalVotes: 'desc' },
          take: 5,
        }),
      ]);

    return {
      totalCandidates,
      activeCandidates,
      totalVotes,
      totalRevenue: totalRevenue._sum.amount || 0,
      top5: leaderboard.map((e) => ({
        rank: e.rank,
        stageName: e.candidate.stageName,
        votes: e.totalVotes,
      })),
    };
  }
}