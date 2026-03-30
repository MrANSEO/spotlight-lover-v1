import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { VotesService } from './votes.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, PaymentStatus } from '@prisma/client';

@ApiTags('Votes')
@Controller('votes')
export class VotesController {
  constructor(private votesService: VotesService) {}

  // ─── Mes votes (historique utilisateur) ──────────────────────────────────

  @Get('my-votes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique de mes votes' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMyVotes(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.votesService.getMyVotes(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  // ─── Stats d'un candidat (public) ────────────────────────────────────────

  @Get('candidate/:candidateId/stats')
  @ApiOperation({ summary: 'Statistiques de votes d\'un candidat (public)' })
  getCandidateStats(@Param('candidateId') id: string) {
    return this.votesService.getCandidateVoteStats(id);
  }

  // ─── Tous les votes (Admin) ───────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Lister tous les votes avec filtres' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  getAllVotes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.votesService.getAllVotes(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  // ─── ✅ ALIAS : Route attendue par le frontend ────────────────────────────
  // Frontend appelle POST /votes/:id/refund (AdminVotesPage)

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Rembourser un vote (alias → DELETE :id)' })
  refundVote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.votesService.cancelVote(id, user.id);
  }

  // ─── Route originale (conservée) ─────────────────────────────────────────

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Annuler / supprimer un vote' })
  cancelVote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.votesService.cancelVote(id, user.id);
  }
}
