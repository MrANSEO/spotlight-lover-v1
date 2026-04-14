import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Headers,
  Req,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  constructor(private webhooksService: WebhooksService) {}

  @Post('mesomb')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook MeSomb — callback de paiement (public)' })
  async handleMesombWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-mesomb-signature') signature: string,
    @Headers('x-mesomb-date') mesombDate: string, // ← LIGNE AJOUTÉE
    @Headers('x-mesomb-nonce') mesombNonce: string, // ← LIGNE AJOUTÉE
    @Body() payload: any,
  ) {
    this.logger.log(`MeSomb webhook received: ${JSON.stringify(payload)}`);
    return this.webhooksService.processMesombWebhook(
      payload,
      signature,
      mesombDate, // ← LIGNE AJOUTÉE
      mesombNonce, // ← LIGNE AJOUTÉE
    );
  }

  @Post('payunit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook PayUnit — callback de paiement (public)' })
  payunitWebhook(@Body() payload: any) {
    this.logger.log(`PayUnit webhook received: ${JSON.stringify(payload)}`);
    return this.webhooksService.processPayunitWebhook(payload);
  }

  // ─── Logs webhooks (Admin) ────────────────────────────────────────────────

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Lister les logs webhooks' })
  getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('processed') processed?: string,
    @Query('provider') provider?: string,
  ) {
    return this.webhooksService.getLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      processed: processed !== undefined ? processed === 'true' : undefined,
      provider,
    });
  }

  @Get('logs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "[ADMIN] Détail d'un log webhook" })
  getLog(@Param('id') id: string) {
    return this.webhooksService.getLog(id);
  }

  // ─── Retry (Admin) ────────────────────────────────────────────────────────

  @Post(':id/retry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[ADMIN] Relancer le traitement d'un webhook" })
  retryWebhook(@Param('id') id: string) {
    return this.webhooksService.retryWebhook(id);
  }
}
