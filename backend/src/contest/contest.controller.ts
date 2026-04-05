// src/contest/contest.controller.ts — VERSION CORRIGÉE
// Remplace intégralement ton fichier existant.
//
// AJOUT : POST /contest — crée un nouveau concours
// C'est la route manquante qui causait "Cannot POST /api/contest 404"

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ContestStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class CreateContestDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  prizeAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  prizeDescription?: string;
}

class UpdateContestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  prizeAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  prizeDescription?: string;
}

class UpdateContestStatusDto {
  @ApiProperty({ enum: ContestStatus })
  @IsEnum(ContestStatus)
  status: ContestStatus;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Contest')
@Controller('contest')
export class ContestController {
 private readonly logger = new Logger(ContestController.name);
  constructor(private prisma: PrismaService) {}

  // ─── PUBLIC : Résultats officiels ─────────────────────────────────────────

  @Get('results')
  @ApiOperation({ summary: 'Résultats officiels (public)' })
  async getPublicResults() {
    const contest = await this.prisma.contest.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!contest || contest.status !== ContestStatus.RESULTS_PUBLISHED) {
      return {
        published: false,
        message: 'Les résultats ne sont pas encore disponibles.',
      };
    }

    const leaderboard = await this.prisma.leaderboardEntry.findMany({
      orderBy: { totalVotes: 'desc' },
      take: 20,
      include: {
        candidate: {
          select: { stageName: true, thumbnailUrl: true },
        },
      },
    });

    const winner = leaderboard[0];

    return {
      published: true,
      contest: {
        title: contest.title,
        endDate: contest.endDate,
        prizeAmount: contest.prizeAmount,
        prizeDescription: contest.prizeDescription,
        resultsPublishedAt: contest.resultsPublishedAt,
      },
      winner: winner
        ? {
            rank: 1,
            stageName: winner.candidate.stageName,
            thumbnailUrl: winner.candidate.thumbnailUrl,
            totalVotes: winner.totalVotes,
          }
        : null,
      leaderboard: leaderboard.map((e, i) => ({
        rank: e.rank || i + 1,
        stageName: e.candidate.stageName,
        thumbnailUrl: e.candidate.thumbnailUrl,
        totalVotes: e.totalVotes,
      })),
    };
  }

  // ─── ADMIN : Récupérer le concours le plus récent ─────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Récupérer le concours actif' })
  async getContest() {
    return this.prisma.contest.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── ✅ NOUVEAU : Créer un concours ───────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Créer un nouveau concours' })
  async createContest(@Body() dto: CreateContestDto) {
    // Vérifier qu'il n'y a pas déjà un concours OPEN ou DRAFT actif
    const existing = await this.prisma.contest.findFirst({
      where: {
        status: { in: [ContestStatus.OPEN, ContestStatus.DRAFT] },
      },
    });

    if (existing) {
      throw new BadRequestException(
        "Un concours est déjà en cours ou en brouillon. Clôturez-le avant d'en créer un nouveau.",
      );
    }

    return this.prisma.contest.create({
      data: {
        title: dto.title,
        status: ContestStatus.DRAFT,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        prizeAmount: dto.prizeAmount ?? null,
        prizeDescription: dto.prizeDescription ?? null,
      },
    });
  }

  // ─── ADMIN : Modifier les infos ───────────────────────────────────────────

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Modifier le concours' })
  async updateContest(@Param('id') id: string, @Body() dto: UpdateContestDto) {
    return this.prisma.contest.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.prizeAmount !== undefined && {
          prizeAmount: Number(dto.prizeAmount),
        }),
        ...(dto.prizeDescription !== undefined && {
          prizeDescription: dto.prizeDescription,
        }),
      },
    });
  }

  // ─── ADMIN : Changer le statut ────────────────────────────────────────────

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Changer le statut du concours' })
  async updateContestStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContestStatusDto,
  ) {
    const updateData: any = { status: dto.status };

    if (dto.status === ContestStatus.RESULTS_PUBLISHED) {
      updateData.resultsPublishedAt = new Date();
      const winner = await this.prisma.leaderboardEntry.findFirst({
        orderBy: { totalVotes: 'desc' },
      });
      if (winner) {
        updateData.winnerCandidateId = winner.candidateId;
      }
    }

    return this.prisma.contest.update({
      where: { id },
      data: updateData,
    });
  }
  // ─── ADMIN : Nouvelle saison ──────────────────────────────────────────────
  @Post('new-season')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Démarrer une nouvelle saison' })
  async startNewSeason(@Body() body: { contestId: string; deleteVideos: boolean }) {
    const contest = await this.prisma.contest.findUnique({ where: { id: body.contestId } });
    if (!contest) throw new BadRequestException('Concours introuvable.');
    if (contest.status !== ContestStatus.RESULTS_PUBLISHED) {
      throw new BadRequestException('Publiez les résultats avant de démarrer une nouvelle saison.');
    }

    const [totalVotes, totalRevenueAgg, totalCandidates] = await Promise.all([
      this.prisma.vote.count({ where: { status: 'COMPLETED' } }),
      this.prisma.vote.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      this.prisma.candidate.count(),
    ]);

    const totalVoters = await this.prisma.vote.groupBy({
      by: ['voterId'], where: { status: 'COMPLETED' }
    }).then(r => r.length);

    const top3Entries = await this.prisma.leaderboardEntry.findMany({
      orderBy: { totalVotes: 'desc' }, take: 3,
      include: { candidate: { select: { stageName: true } } },
    });
    const top3 = top3Entries.map((e, i) => ({
      rank: i + 1, stageName: e.candidate.stageName, totalVotes: e.totalVotes,
    }));

    const candidates = await this.prisma.candidate.findMany({
      include: {
        leaderboardEntry: { select: { totalVotes: true, totalAmount: true, rank: true } },
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });
    const candidatesSnapshot = candidates.map(c => ({
      stageName: c.stageName, bio: c.bio, status: c.status,
      email: c.user.email, firstName: c.user.firstName, lastName: c.user.lastName,
      totalVotes: c.leaderboardEntry?.totalVotes || 0,
      totalAmount: c.leaderboardEntry?.totalAmount || 0,
      rank: c.leaderboardEntry?.rank || null,
    }));

    await this.prisma.seasonArchive.create({
      data: {
        contestId: contest.id, title: contest.title,
        startDate: contest.startDate, endDate: contest.endDate,
        prizeAmount: contest.prizeAmount, prizeDescription: contest.prizeDescription,
        resultsPublishedAt: contest.resultsPublishedAt,
        totalVotes, totalRevenue: totalRevenueAgg._sum.amount || 0,
        totalCandidates, totalVoters, top3, candidatesSnapshot,
      },
    });

    if (body.deleteVideos) {
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      const candidatesWithVideos = await this.prisma.candidate.findMany({
        where: { videoPublicId: { not: null } },
        select: { id: true, videoPublicId: true },
      });
      for (const c of candidatesWithVideos) {
        try {
          await cloudinary.uploader.destroy(c.videoPublicId!, { resource_type: 'video' });
        } catch (e) {
          this.logger.warn(`Failed to delete video ${c.videoPublicId}`);
        }
      }
    }

    await this.prisma.candidate.updateMany({
      data: {
        status: 'PENDING_PAYMENT', videoUrl: null,
        thumbnailUrl: null, videoPublicId: null,
        rejectionReason: null, moderatedAt: null, moderatedBy: null,
      },
    });
    await this.prisma.user.updateMany({
      where: { role: 'CANDIDATE' }, data: { role: 'USER' },
    });
    await this.prisma.leaderboardEntry.deleteMany({});
    await this.prisma.vote.deleteMany({});
    await this.prisma.candidateRegistrationPayment.deleteMany({});

    return {
      message: '✅ Nouvelle saison démarrée ! Données archivées.',
      archived: { title: contest.title, totalVotes, totalRevenue: totalRevenueAgg._sum.amount || 0, totalCandidates, top3 },
    };
  }

}
