// ═══════════════════════════════════════════════════════════════════════════════
// candidates.controller.ts — SpotLightLover (VERSION CORRIGÉE)
//
// CORRECTION BUG ROUTE :
//   Le frontend appelait PATCH /candidates/:id/status
//   Le backend exposait PATCH /candidates/:id/moderate
//   → Les deux routes sont maintenant exposées pour compatibilité
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  ModerateCandidateDto,
} from './dto/candidate.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, CandidateStatus } from '@prisma/client';

@ApiTags('Candidates')
@Controller('candidates')
export class CandidatesController {
  constructor(private candidatesService: CandidatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initier l\'inscription candidat' })
  @ApiResponse({ status: 201, description: 'Profil candidat créé, paiement requis' })
  create(@CurrentUser() user: any, @Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.initiateCandidaturePayment(user.id, createCandidateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les candidats (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: CandidateStatus })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: CandidateStatus,
  ) {
    return this.candidatesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 12,
      status,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon profil candidat' })
  getMyCandidateProfile(@CurrentUser() user: any) {
    return this.candidatesService.getMyCandidateProfile(user.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Statistiques candidats (Admin)' })
  getStats() {
    return this.candidatesService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un candidat par ID (public)' })
  findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier le profil candidat' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateCandidateDto: UpdateCandidateDto,
  ) {
    return this.candidatesService.update(id, user.id, user.role, updateCandidateDto);
  }

  // ✅ CORRECTION : Route principale utilisée par les specs backend
  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modérer un candidat (Admin) — valider, suspendre, rejeter' })
  moderate(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() moderateCandidateDto: ModerateCandidateDto,
  ) {
    return this.candidatesService.moderate(id, user.id, moderateCandidateDto);
  }

  // ✅ ALIAS : Pour compatibilité avec le frontend qui appelait /status
  // → Le frontend sera mis à jour dans le Bloc 2, mais cet alias assure la
  //   rétrocompatibilité pendant la migration
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alias /status → /moderate (compatibilité frontend)' })
  moderateAlias(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() moderateCandidateDto: ModerateCandidateDto,
  ) {
    return this.candidatesService.moderate(id, user.id, moderateCandidateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un candidat et sa vidéo Cloudinary (Admin)' })
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}