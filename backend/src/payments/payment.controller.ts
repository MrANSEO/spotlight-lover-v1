import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  InitiateCandidatePaymentDto,
  InitiateVotePaymentDto,
  AdminVoteDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  // ─── Inscription Candidat (route originale) ───────────────────────────────

  @Post('candidate/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initier paiement inscription candidat (500 FCFA)' })
  async initiateCandidateRegistration(
    @CurrentUser() user: any,
    @Body() dto: InitiateCandidatePaymentDto,
    @Req() req: any,
  ) {
    return this.paymentService.initiateCandidateRegistration(
      user.id,
      dto,
      req.ip || req.socket?.remoteAddress || 'unknown',
      req.headers['user-agent'] || '',
    );
  }

  // ─── ✅ ALIAS : Route attendue par le frontend ─────────────────────────────
  // Frontend appelle POST /payments/candidate-registration

  @Post('candidate-registration')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alias → POST candidate/register (compatibilité frontend)' })
  async initiateCandidateRegistrationAlias(
    @CurrentUser() user: any,
    @Body() dto: InitiateCandidatePaymentDto,
    @Req() req: any,
  ) {
    return this.paymentService.initiateCandidateRegistration(
      user.id,
      dto,
      req.ip || req.socket?.remoteAddress || 'unknown',
      req.headers['user-agent'] || '',
    );
  }

  // ─── Vote Payant ──────────────────────────────────────────────────────────

  @Post('vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Voter pour un candidat (100 FCFA par vote)' })
  async initiateVote(
    @CurrentUser() user: any,
    @Body() dto: InitiateVotePaymentDto,
    @Req() req: any,
  ) {
    return this.paymentService.initiateVote(
      user.id,
      dto,
      req.ip || req.socket?.remoteAddress || 'unknown',
      req.headers['user-agent'] || '',
    );
  }

  // ─── Vote Admin Gratuit ───────────────────────────────────────────────────

  @Post('admin/vote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Voter gratuitement pour un candidat' })
  async adminVote(@CurrentUser() user: any, @Body() dto: AdminVoteDto) {
    return this.paymentService.adminVote(user.id, dto);
  }

  // ─── Vérification Statut (route originale) ───────────────────────────────

  @Get('transaction/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier statut transaction (polling — route originale)' })
  async checkTransactionStatusOriginal(
    @Param('id') transactionId: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentService.checkPaymentStatus(transactionId, user.id);
  }

  // ─── ✅ ALIAS : Route attendue par le frontend ─────────────────────────────
  // Frontend appelle GET /payments/status/:id (BecomeCandidatePage, VideoFeedPage)

  @Get('status/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alias → transaction/:id/status (compatibilité frontend)' })
  async checkTransactionStatusAlias(
    @Param('id') transactionId: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentService.checkPaymentStatus(transactionId, user.id);
  }

  // ─── Historique transactions de l'utilisateur ────────────────────────────

  @Get('my-transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique de mes transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyTransactions(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentService.getUserTransactions(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('my-vote-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Statistiques de mes votes et dépenses' })
  async getMyVoteStats(@CurrentUser() user: any) {
    return this.paymentService.getUserVoteStats(user.id);
  }
}
