import {
  Controller,
  Get,
  Query,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved' })
  getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue by day (Admin only)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Revenue data retrieved' })
  getRevenueByDay(@Query('days') days?: string) {
    return this.analyticsService.getRevenueByDay(days ? parseInt(days) : 30);
  }

  @Get('votes')
  @ApiOperation({ summary: 'Get votes by candidate (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Vote statistics retrieved' })
  getVotesByCandidate(@Query('limit') limit?: string) {
    return this.analyticsService.getVotesByCandidate(limit ? parseInt(limit) : 10);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payment statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment stats retrieved' })
  getPaymentStats() {
    return this.analyticsService.getPaymentStats();
  }

  @Get('candidates')
  @ApiOperation({ summary: 'Get candidate statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Candidate stats retrieved' })
  getCandidateStats() {
    return this.analyticsService.getCandidateStats();
  }

  @Get('users/growth')
  @ApiOperation({ summary: 'Get user growth statistics (Admin only)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User growth data retrieved' })
  getUserGrowth(@Query('days') days?: string) {
    return this.analyticsService.getUserGrowth(days ? parseInt(days) : 30);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export data to CSV (Admin only)' })
  @ApiQuery({ name: 'type', enum: ['users', 'candidates', 'votes', 'transactions'] })
  @ApiResponse({ status: 200, description: 'CSV data exported' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="export.csv"')
  async exportData(@Query('type') type: 'users' | 'candidates' | 'votes' | 'transactions') {
    return this.analyticsService.exportDataToCsv(type);
  }
}
