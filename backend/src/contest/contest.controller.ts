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
}
