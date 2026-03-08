import { Controller, Post, Body, Headers, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('mesomb')
  @ApiOperation({ summary: 'MeSomb payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  handleMeSomb(@Body() payload: any, @Headers('x-mesomb-signature') signature?: string) {
    return this.webhooksService.handleMeSombWebhook(payload, signature);
  }

  @Post('stripe')
  @ApiOperation({ summary: 'Stripe payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  handleStripe(@Body() payload: any, @Headers('stripe-signature') signature?: string) {
    return this.webhooksService.handleStripeWebhook(payload, signature);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook logs (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Webhook logs retrieved' })
  getWebhookLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.webhooksService.getWebhookLogs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }
}
