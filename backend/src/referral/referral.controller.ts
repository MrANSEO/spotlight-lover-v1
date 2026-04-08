import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReferralService } from './referral.service';

@ApiTags('Referral')
@Controller('referral')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReferralController {
  constructor(private referralService: ReferralService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Mes stats de parrainage + solde wallet' })
  async getStats(@CurrentUser() user: any) {
    return this.referralService.getReferralStats(user.id);
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Historique de mon wallet' })
  async getWallet(@CurrentUser() user: any) {
    return this.referralService.getWalletHistory(user.id);
  }
}
