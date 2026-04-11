import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MeSombService } from './mesomb/mesomb.service';
import { ConfigService } from '@nestjs/config';
import { ReferralService } from '../referral/referral.service';
import {
  InitiateCandidatePaymentDto,
  InitiateVotePaymentDto,
  AdminVoteDto,
} from './dto/payment.dto';
import { CandidateStatus, PaymentStatus, UserRole } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private mesomb: MeSombService,
    private config: ConfigService,
    private referralService: ReferralService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // INSCRIPTION CANDIDAT (500 FCFA)
  // ═══════════════════════════════════════════════════════════════════════════

  async initiateCandidateRegistration(
    userId: string,
    dto: InitiateCandidatePaymentDto,
    ipAddress: string,
    userAgent: string,
  ) {
    // ✅ CORRECTION : chercher le candidat existant par candidateId
    // (le candidat a été créé à l'étape 1 via POST /candidates)
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
    });

    // Vérifications de sécurité
    if (!candidate) {
      throw new NotFoundException(
        "Candidat introuvable. Recommencez l'étape 1.",
      );
    }

    if (candidate.userId !== userId) {
      throw new ForbiddenException('Ce candidat ne vous appartient pas.');
    }

    if (candidate.status === CandidateStatus.ACTIVE) {
      throw new BadRequestException('Vous êtes déjà un candidat actif.');
    }

    if (candidate.status === CandidateStatus.SUSPENDED) {
      throw new BadRequestException(
        "Votre compte candidat est suspendu. Contactez l'administrateur.",
      );
    }

    // Vérifier si un paiement n'est pas déjà en cours ou complété
    const existingPayment =
      await this.prisma.candidateRegistrationPayment.findUnique({
        where: { candidateId: candidate.id },
      });

    if (existingPayment?.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException("Paiement d'inscription déjà effectué.");
    }

    if (existingPayment?.status === PaymentStatus.PROCESSING) {
      throw new BadRequestException(
        'Un paiement est déjà en cours. Vérifiez votre téléphone ou attendez quelques minutes.',
      );
    }

    const registrationFee = parseInt(
      this.config.get('CANDIDATE_REGISTRATION_FEE', '500'),
    );

    // Normaliser le numéro de téléphone
    const phone = this.mesomb.normalizePhoneNumber(dto.phone);

    // Générer une clé d'idempotence unique
    const idempotencyKey = `reg_${userId}_${Date.now()}`;

    // Créer ou mettre à jour l'enregistrement de paiement
    let paymentRecord;
    if (existingPayment) {
      paymentRecord = await this.prisma.candidateRegistrationPayment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.PENDING,
          ipAddress,
          userAgent,
        },
      });
    } else {
      paymentRecord = await this.prisma.candidateRegistrationPayment.create({
        data: {
          candidateId: candidate.id,
          userId,
          amount: registrationFee,
          currency: 'XAF',
          status: PaymentStatus.PENDING,
          provider: 'MESOMB',
          ipAddress,
          userAgent,
        },
      });
    }

    // Créer la transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        type: 'REGISTRATION',
        amount: registrationFee,
        currency: 'XAF',
        status: PaymentStatus.PENDING,
        provider: 'MESOMB',
        idempotencyKey,
        ipAddress,
        userAgent,
      },
    });

    // Appeler MeSomb pour déclencher le paiement
    try {
      const mesombResult = await this.mesomb.initiatePayment({
        amount: registrationFee,
        service: dto.operator,
        payer: phone,
        nonce: idempotencyKey,
        message: `SpotLightLover - Inscription candidat: ${candidate.stageName}`,
      });

      // Mettre à jour avec la référence MeSomb
      if (mesombResult.transaction?.pk) {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            providerReference: mesombResult.transaction.pk,
            providerResponse: mesombResult.transaction as any,
            status: mesombResult.success
              ? PaymentStatus.COMPLETED
              : PaymentStatus.PROCESSING,
          },
        });

        await this.prisma.candidateRegistrationPayment.update({
          where: { id: paymentRecord.id },
          data: {
            transactionId: transaction.id,
            providerReference: mesombResult.transaction.pk,
            status: mesombResult.success
              ? PaymentStatus.COMPLETED
              : PaymentStatus.PROCESSING,
          },
        });
      }

      // Si paiement synchrone immédiatement confirmé
      if (mesombResult.success) {
        await this.activateCandidate(candidate.id, userId);
        return {
          success: true,
          message: '✅ Paiement confirmé ! Votre compte candidat est actif.',
          candidateId: candidate.id,
          transactionId: transaction.id,
          amount: registrationFee,
          status: 'COMPLETED',
        };
      }

      // Paiement en attente (USSD push envoyé sur le téléphone)
      return {
        success: true,
        message: '📱 Confirmez le paiement sur votre téléphone.',
        candidateId: candidate.id,
        transactionId: transaction.id,
        amount: registrationFee,
        status: 'PROCESSING',
        instructions: `Vous allez recevoir une notification USSD sur le ${phone}. Confirmez le paiement de ${registrationFee} FCFA pour activer votre compte candidat.`,
      };
    } catch (error) {
      // En cas d'échec MeSomb, remettre le paiement en PENDING (pas supprimer le candidat)
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: PaymentStatus.FAILED },
      });
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVATION CANDIDAT (inchangé)
  // ═══════════════════════════════════════════════════════════════════════════

  async activateCandidate(candidateId: string, userId: string) {
    this.logger.log(`Activating candidate ${candidateId}`);

    await this.prisma.$transaction([
      this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          status: CandidateStatus.ACTIVE,
          moderatedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.CANDIDATE },
      }),
      this.prisma.leaderboardEntry.upsert({
        where: { candidateId },
        create: { candidateId, totalVotes: 0, totalAmount: 0 },
        update: {},
      }),
      this.prisma.dailyStats.upsert({
        where: { date: this.getTodayDate() },
        create: {
          date: this.getTodayDate(),
          newCandidates: 1,
          totalRevenue: 500,
        },
        update: {
          newCandidates: { increment: 1 },
          totalRevenue: { increment: 500 },
        },
      }),
    ]);

    this.logger.log(`Candidate ${candidateId} activated successfully`);
  }

  async confirmCandidateRegistrationPayment(paymentId: string, payload: any) {
    const payment = await this.prisma.candidateRegistrationPayment.findUnique({
      where: { id: paymentId },
      include: { candidate: true },
    });

    if (!payment) throw new NotFoundException('Payment not found.');

    await this.prisma.candidateRegistrationPayment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.COMPLETED },
    });

    await this.activateCandidate(payment.candidate.id, payment.userId);
    this.logger.log(`Candidate registration payment confirmed: ${paymentId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VOTE PAYANT (100 FCFA par vote) — INCHANGÉ
  // ═══════════════════════════════════════════════════════════════════════════

  async initiateVote(
    voterId: string,
    dto: InitiateVotePaymentDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const quantity = dto.quantity || 1;
    const voteAmount = parseInt(this.config.get('VOTE_AMOUNT', '100'));
    const totalAmount = voteAmount * quantity;

    const activeContest = await this.prisma.contest.findFirst({
      where: { status: 'OPEN' },
    });

    if (!activeContest) {
      throw new BadRequestException(
        "Le concours n'est pas ouvert. Les votes ne sont pas acceptés pour le moment.",
      );
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
      include: { user: { select: { id: true } } },
    });

    if (!candidate || candidate.status !== CandidateStatus.ACTIVE) {
      throw new NotFoundException('Candidat non trouvé ou non actif.');
    }

    if (candidate.userId === voterId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas voter pour votre propre profil.',
      );
    }

    await this.checkVotingFraud(voterId, dto.candidateId, ipAddress);

    // ✅ NOUVEAU — Vérifier si l'utilisateur a des crédits wallet EN PREMIER
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: voterId }
    });

    const walletBalance = wallet?.balance || 0;

    // Si le wallet couvre tout le montant
    if (walletBalance >= totalAmount) {
      // Vote entièrement gratuit via crédits
      const used = await this.referralService.debitWallet(
        voterId, 
        totalAmount,
        `vote_${dto.candidateId}`
      );
      
      if (used) {
        // Créer et confirmer les votes directement sans MeSomb
        const votes = await Promise.all(
          Array.from({ length: quantity }, () =>
            this.prisma.vote.create({
              data: {
                candidateId: dto.candidateId,
                voterId,
                amount: voteAmount,
                currency: 'XAF',
                status: PaymentStatus.COMPLETED,
                provider: 'MESOMB',
                isVerified: true,
              },
            }),
          ),
        );

        const bonusVotes = dto.bonusVotes || 0;
        await this.confirmVotes(votes.map(v => v.id), 'wallet_payment', bonusVotes);

        return {
          success: true,
          message: `✅ ${quantity} vote(s) payé(s) avec vos crédits${bonusVotes > 0 ? ` + ${bonusVotes} GRATUIT(S)` : ''} !`,
          voteIds: votes.map(v => v.id),
          transactionId: 'wallet_payment',
          status: 'COMPLETED',
          paidWithCredits: true,
          creditsUsed: totalAmount,
          amount: totalAmount,
        };
      }
    }

    // ✅ Seulement ici on normalise le téléphone — après la vérification wallet
    const phone = this.mesomb.normalizePhoneNumber(dto.phone);
    const idempotencyKey = `vote_${voterId}_${dto.candidateId}_${Date.now()}`;

    const transaction = await this.prisma.transaction.create({
      data: {
        userId: voterId,
        type: 'VOTE',
        amount: totalAmount,
        currency: 'XAF',
        status: PaymentStatus.PENDING,
        provider: 'MESOMB',
        idempotencyKey,
        ipAddress,
        userAgent,
      },
    });

    const votes = await Promise.all(
      Array.from({ length: quantity }, () =>
        this.prisma.vote.create({
          data: {
            candidateId: dto.candidateId,
            voterId,
            amount: voteAmount,
            currency: 'XAF',
            status: PaymentStatus.PENDING,
            provider: 'MESOMB',
            transactionId: transaction.id,
            ipAddress,
            userAgent,
          },
        }),
      ),
    );

    try {
      const mesombResult = await this.mesomb.initiatePayment({
        amount: totalAmount,
        service: dto.operator,
        payer: phone,
        nonce: idempotencyKey,
        message: `SpotLightLover - ${quantity} vote(s) pour ${candidate.stageName}`,
      });

      if (mesombResult.transaction?.pk) {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            providerReference: mesombResult.transaction.pk,
            providerResponse: mesombResult.transaction as any,
            status: mesombResult.success
              ? PaymentStatus.COMPLETED
              : PaymentStatus.PROCESSING,
          },
        });
      }

      if (mesombResult.success) {
        const bonusVotes = dto.bonusVotes || 0;
        await this.confirmVotes(
          votes.map((v) => v.id),
          transaction.id,
          bonusVotes,
        );
        return {
          success: true,
          message: `✅ ${quantity} vote(s) confirmé(s)${bonusVotes > 0 ? ` + ${bonusVotes} GRATUIT(S)` : ''} pour ${candidate.stageName} !`,
          voteIds: votes.map((v) => v.id),
          transactionId: transaction.id,
          amount: totalAmount,
          status: 'COMPLETED',
        };
      }

      return {
        success: true,
        message: '📱 Confirmez le paiement sur votre téléphone.',
        voteIds: votes.map((v) => v.id),
        transactionId: transaction.id,
        amount: totalAmount,
        status: 'PROCESSING',
        instructions: `Confirmez le paiement de ${totalAmount} FCFA sur le ${phone} pour valider vos vote(s).`,
      };
    } catch (error) {
      await this.prisma.vote.deleteMany({
        where: { id: { in: votes.map((v) => v.id) } },
      });
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: PaymentStatus.FAILED },
      });
      throw error;
    }
  }

  async confirmVotes(
    voteIds: string[],
    transactionId: string,
    bonusVotes: number = 0, // ← nouveau paramètre
  ) {
    const votes = await this.prisma.vote.findMany({
      where: { id: { in: voteIds } },
    });

    if (votes.length === 0) return;

    const candidateId = votes[0].candidateId;
    const voterId = votes[0].voterId;
    const totalVoteAmount = votes.reduce((sum, v) => sum + v.amount, 0);

    // Créer les votes bonus si nécessaire
    let bonusVoteIds: string[] = [];
    if (bonusVotes > 0) {
      const bonusVoteRecords = await Promise.all(
        Array.from({ length: bonusVotes }, () =>
          this.prisma.vote.create({
            data: {
              candidateId,
              voterId,
              amount: 0, // gratuit
              currency: 'XAF',
              status: PaymentStatus.COMPLETED,
              provider: 'MESOMB',
              transactionId,
              isVerified: true,
              isSuspicious: false,
            },
          }),
        ),
      );
      bonusVoteIds = bonusVoteRecords.map((v) => v.id);
      this.logger.log(
        `${bonusVotes} vote(s) bonus créé(s) pour transaction ${transactionId}`,
      );
    }

    const totalVotesCount = voteIds.length + bonusVoteIds.length;

    await this.prisma.$transaction([
      // Confirmer les votes payés
      this.prisma.vote.updateMany({
        where: { id: { in: voteIds } },
        data: { status: PaymentStatus.COMPLETED, isVerified: true },
      }),
      // Mettre à jour le leaderboard avec TOUS les votes (payés + bonus)
      this.prisma.leaderboardEntry.upsert({
        where: { candidateId },
        create: {
          candidateId,
          totalVotes: totalVotesCount,
          totalAmount: totalVoteAmount,
          lastUpdated: new Date(),
        },
        update: {
          totalVotes: { increment: totalVotesCount },
          totalAmount: { increment: totalVoteAmount },
          lastUpdated: new Date(),
        },
      }),
      this.prisma.dailyStats.upsert({
        where: { date: this.getTodayDate() },
        create: {
          date: this.getTodayDate(),
          totalVotes: totalVotesCount,
          totalRevenue: totalVoteAmount,
        },
        update: {
          totalVotes: { increment: totalVotesCount },
          totalRevenue: { increment: totalVoteAmount },
        },
      }),
    ]);

    await this.recalculateRanks();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VOTE ADMIN GRATUIT (inchangé)
  // ═══════════════════════════════════════════════════════════════════════════

  async adminVote(adminId: string, dto: AdminVoteDto) {
    const quantity = dto.quantity || 1;

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
    });

    if (!candidate || candidate.status !== CandidateStatus.ACTIVE) {
      throw new NotFoundException('Candidat non trouvé ou non actif.');
    }

    const votes = await Promise.all(
      Array.from({ length: quantity }, () =>
        this.prisma.vote.create({
          data: {
            candidateId: dto.candidateId,
            voterId: adminId,
            amount: 0,
            currency: 'XAF',
            status: PaymentStatus.COMPLETED,
            provider: 'MESOMB',
            isVerified: true,
          },
        }),
      ),
    );

    await this.prisma.leaderboardEntry.upsert({
      where: { candidateId: dto.candidateId },
      create: {
        candidateId: dto.candidateId,
        totalVotes: quantity,
        totalAmount: 0,
        lastUpdated: new Date(),
      },
      update: {
        totalVotes: { increment: quantity },
        lastUpdated: new Date(),
      },
    });

    await this.recalculateRanks();

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_VOTE',
        resource: 'Vote',
        details: {
          candidateId: dto.candidateId,
          quantity,
          reason: dto.reason || 'Vote admin',
        },
      },
    });

    this.logger.log(
      `Admin ${adminId} added ${quantity} free vote(s) to candidate ${dto.candidateId}`,
    );

    return {
      success: true,
      message: `✅ ${quantity} vote(s) admin ajouté(s) avec succès.`,
      votes: votes.map((v) => v.id),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VÉRIFICATION STATUT TRANSACTION (inchangé)
  // ═══════════════════════════════════════════════════════════════════════════

  async checkPaymentStatus(transactionId: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        votes: { select: { id: true, status: true, candidateId: true } },
      },
    });

    if (!transaction) throw new NotFoundException('Transaction non trouvée.');
    if (transaction.userId !== userId)
      throw new ForbiddenException('Accès refusé.');

    if (
      transaction.status === PaymentStatus.COMPLETED ||
      transaction.status === PaymentStatus.FAILED
    ) {
      return {
        status: transaction.status,
        transactionId: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
      };
    }

    if (transaction.providerReference) {
      const mesombStatus = await this.mesomb.checkTransactionStatus(
        transaction.providerReference,
      );

      if (
        mesombStatus.status === 'SUCCESS' &&
        transaction.status === 'PENDING'
      ) {
        await this.prisma.transaction.update({
          where: { id: transactionId },
          data: { status: PaymentStatus.COMPLETED, webhookReceived: true },
        });

        if (transaction.type === 'VOTE' && transaction.votes.length > 0) {
          await this.confirmVotes(
            transaction.votes.map((v) => v.id),
            transactionId,
          );
        } else if (transaction.type === 'REGISTRATION') {
          const regPayment =
            await this.prisma.candidateRegistrationPayment.findFirst({
              where: { userId: transaction.userId },
              include: { candidate: true },
            });
          if (regPayment?.candidate) {
            await this.activateCandidate(
              regPayment.candidate.id,
              transaction.userId,
            );
          }
        }

        return {
          status: 'COMPLETED',
          transactionId,
          amount: transaction.amount,
        };
      }

      if (mesombStatus.status === 'FAILED') {
        await this.prisma.transaction.update({
          where: { id: transactionId },
          data: { status: PaymentStatus.FAILED },
        });
        return { status: 'FAILED', transactionId, amount: transaction.amount };
      }
    }

    return {
      status: transaction.status,
      transactionId,
      amount: transaction.amount,
      message: 'Paiement en attente de confirmation.',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATISTIQUES ET HISTORIQUE (inchangés)
  // ═══════════════════════════════════════════════════════════════════════════

  async getUserTransactions(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          votes: {
            include: {
              candidate: { select: { stageName: true } },
            },
          },
        },
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserVoteStats(userId: string) {
    const [totalVotes, totalSpent, votedCandidates] = await Promise.all([
      this.prisma.vote.count({
        where: { voterId: userId, status: PaymentStatus.COMPLETED },
      }),
      this.prisma.vote.aggregate({
        where: { voterId: userId, status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      this.prisma.vote.findMany({
        where: { voterId: userId, status: PaymentStatus.COMPLETED },
        distinct: ['candidateId'],
        include: {
          candidate: { select: { stageName: true, thumbnailUrl: true } },
        },
      }),
    ]);

    return {
      totalVotes,
      totalSpent: totalSpent._sum.amount || 0,
      uniqueCandidates: votedCandidates.length,
      votedCandidates: votedCandidates.map((v) => ({
        candidateId: v.candidateId,
        stageName: v.candidate.stageName,
        thumbnailUrl: v.candidate.thumbnailUrl,
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTHODES PRIVÉES (inchangées)
  // ═══════════════════════════════════════════════════════════════════════════

  private async checkVotingFraud(
    voterId: string,
    candidateId: string,
    ipAddress: string,
  ) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const blacklisted = await this.prisma.ipBlacklist.findUnique({
      where: { ipAddress },
    });

    if (blacklisted) {
      const expired =
        blacklisted.expiresAt && blacklisted.expiresAt < new Date();
      if (!expired) {
        throw new ForbiddenException(
          'Votre adresse IP est bloquée pour activité suspecte.',
        );
      }
    }

    const recentVotesFromIp = await this.prisma.vote.count({
      where: {
        ipAddress,
        createdAt: { gte: oneHourAgo },
        status: { in: [PaymentStatus.COMPLETED, PaymentStatus.PENDING] },
      },
    });

    const maxVotesPerHourPerIp = parseInt(
      this.config.get('MAX_VOTES_PER_HOUR_PER_IP', '50'),
    );

    if (recentVotesFromIp >= maxVotesPerHourPerIp) {
      await this.prisma.ipBlacklist.upsert({
        where: { ipAddress },
        create: {
          ipAddress,
          reason: 'Trop de votes en une heure',
          isPermanent: false,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        update: {
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      throw new ForbiddenException(
        'Trop de votes détectés. Activité suspecte bloquée pendant 24h.',
      );
    }
  }

  private async recalculateRanks() {
    const entries = await this.prisma.leaderboardEntry.findMany({
      orderBy: [{ totalVotes: 'desc' }, { totalAmount: 'desc' }],
    });

    await this.prisma.$transaction(
      entries.map((entry, index) =>
        this.prisma.leaderboardEntry.update({
          where: { id: entry.id },
          data: { rank: index + 1 },
        }),
      ),
    );
  }

  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
}
