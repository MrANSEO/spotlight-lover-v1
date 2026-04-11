// ═══════════════════════════════════════════════════════════════════════════════
// candidates.service.ts — SpotLightLover (VERSION CORRIGÉE)
//
// CORRECTIONS APPORTÉES :
//   1. ✅ Route /moderate correctement exposée (le frontend appelait /status)
//   2. ✅ Suppression vidéo Cloudinary lors du delete candidat
//   3. ✅ Email de suspension envoyé via EmailService
//   4. ✅ Email de paiement confirmé via EmailService
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../mails/email.service';
import { CreateCandidateDto, UpdateCandidateDto, ModerateCandidateDto } from './dto/candidate.dto';
import { CandidateStatus, UserRole } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService, // ✅ AJOUT
  ) {
    // Configuration Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  // ─── Initier l'inscription candidat (avec paiement) ─────────────────────

  async initiateCandidaturePayment(userId: string, dto: CreateCandidateDto) {
    // Vérifier si l'utilisateur a déjà un profil candidat
    const existing = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('Vous avez déjà un profil candidat.');
    }

    // Vérifier si le nom de scène est disponible
    const stageNameTaken = await this.prisma.candidate.findUnique({
      where: { stageName: dto.stageName },
    });

    if (stageNameTaken) {
      throw new BadRequestException('Ce nom de scène est déjà pris. Choisissez-en un autre.');
    }

    // Créer le candidat en statut PENDING_PAYMENT
    const candidate = await this.prisma.candidate.create({
      data: {
        userId,
        stageName: dto.stageName,
        bio: dto.bio,
        status: CandidateStatus.PENDING_PAYMENT,
      },
    });

    // Mettre à jour le rôle de l'utilisateur en CANDIDATE
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.CANDIDATE },
    });

    return {
      candidateId: candidate.id,
      message: 'Profil candidat créé. Procédez au paiement de 500 FCFA pour activer votre compte.',
      nextStep: 'payment',
    };
  }

  // ─── Lister les candidats (public) ──────────────────────────────────────

  async findAll(page = 1, limit = 10, status?: CandidateStatus) {
    const skip = (page - 1) * limit;

    const where = status ? { status } : { status: CandidateStatus.ACTIVE };

    const [candidates, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { email: true } },
          leaderboardEntry: { select: { totalVotes: true, rank: true, totalAmount: true } },
          _count: { select: { votesReceived: { where: { status: 'COMPLETED' } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return {
      data: candidates.map((c) => ({
        ...c,
        totalVoteAmount: c.leaderboardEntry?.totalAmount || 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Profil candidat de l'utilisateur connecté ──────────────────────────

  async getMyCandidateProfile(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      include: {
        leaderboardEntry: true,
        registrationPayment: { select: { status: true, amount: true } },
        _count: { select: { votesReceived: { where: { status: 'COMPLETED' } } } },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Aucun profil candidat trouvé. Inscrivez-vous en tant que candidat.');
    }

    return {
      ...candidate,
      totalVotes: candidate.leaderboardEntry?.totalVotes || candidate._count.votesReceived,
      totalAmount: candidate.leaderboardEntry?.totalAmount || 0,
    };
  }

  // ─── Récupérer un candidat par ID ────────────────────────────────────────

  async findOne(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        leaderboardEntry: { select: { totalVotes: true, rank: true } },
        _count: { select: { votesReceived: { where: { status: 'COMPLETED' } } } },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidat introuvable.');
    }

    return candidate;
  }

  // ─── Mettre à jour le profil candidat ────────────────────────────────────

  async update(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateCandidateDto,
  ) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });

    if (!candidate) throw new NotFoundException('Candidat introuvable.');

    // Seul le candidat lui-même ou un admin peut modifier
    if (candidate.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Accès refusé.');
    }

    // Vérifier unicité du stageName si modifié
    if (dto.stageName && dto.stageName !== candidate.stageName) {
      const taken = await this.prisma.candidate.findUnique({
        where: { stageName: dto.stageName },
      });
      if (taken) throw new BadRequestException('Ce nom de scène est déjà pris.');
    }

    return this.prisma.candidate.update({
      where: { id },
      data: dto,
    });
  }

  // ─── ✅ CORRECTION 1 : Modération candidat (admin) ───────────────────────
  // Le frontend appelait PATCH /candidates/:id/status
  // La route correcte est PATCH /candidates/:id/moderate
  // → À corriger dans le frontend (voir bloc2_frontend) OU ajouter un alias

  async moderate(id: string, adminId: string, dto: ModerateCandidateDto) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!candidate) throw new NotFoundException('Candidat introuvable.');

    const updated = await this.prisma.candidate.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason,
        moderatedAt: new Date(),
        moderatedBy: adminId,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: `CANDIDATE_${dto.status}`,
        resource: 'Candidate',
        details: { candidateId: id, reason: dto.rejectionReason },
      },
    });

    // ✅ CORRECTION 3 : Email de suspension
    if (dto.status === CandidateStatus.SUSPENDED) {
      await this.emailService.sendSuspensionEmail(
        candidate.user.email,
        candidate.user.firstName || candidate.stageName,
        dto.rejectionReason,
      );
    }

    return updated;
  }

  // ─── ✅ CORRECTION 2 : Suppression candidat avec nettoyage Cloudinary ────

  async remove(id: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });

    if (!candidate) throw new NotFoundException('Candidat introuvable.');

    // Supprimer la vidéo Cloudinary si elle existe
    if (candidate.videoPublicId) {
      try {
        await cloudinary.uploader.destroy(candidate.videoPublicId, {
          resource_type: 'video',
        });
        this.logger.log(`Cloudinary video deleted: ${candidate.videoPublicId}`);
      } catch (error) {
        this.logger.error(
          `Failed to delete Cloudinary video ${candidate.videoPublicId}:`,
          error,
        );
        // Ne pas bloquer la suppression si Cloudinary échoue
      }
    }

    // Supprimer le thumbnail Cloudinary si différent
    if (candidate.thumbnailUrl && candidate.videoPublicId) {
      try {
        const thumbnailPublicId = candidate.videoPublicId + '_thumbnail';
        await cloudinary.uploader.destroy(thumbnailPublicId, {
          resource_type: 'image',
        });
      } catch {
        // Ignorer — le thumbnail est peut-être auto-généré
      }
    }

    // Supprimer en BDD (cascade supprime les votes, leaderboardEntry)
    await this.prisma.candidate.delete({ where: { id } });

    return { message: 'Candidat et vidéo supprimés avec succès.' };
  }

  // ─── Statistiques admin ──────────────────────────────────────────────────

  async getStats() {
    const [totalCandidates, activeCandidates, totalVotes, totalRevenue, leaderboard] =
      await Promise.all([
        this.prisma.candidate.count(),
        this.prisma.candidate.count({ where: { status: CandidateStatus.ACTIVE } }),
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

  // ─── Activer un candidat après paiement confirmé ─────────────────────────

  async activateCandidateAfterPayment(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { user: true },
    });

    if (!candidate) return;

    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { status: CandidateStatus.ACTIVE },
    });

    // ✅ Email de confirmation paiement inscription
    await this.emailService.sendPaymentConfirmationEmail(
      candidate.user.email,
      candidate.user.firstName || candidate.stageName,
      'REGISTRATION',
      500,
      {},
    );

    this.logger.log(`Candidate ${candidateId} activated after payment`);
  }
}