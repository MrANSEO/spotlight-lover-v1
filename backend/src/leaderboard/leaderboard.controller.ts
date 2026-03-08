import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardGateway } from './leaderboard.gateway';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    private leaderboardService: LeaderboardService,
    private leaderboardGateway: LeaderboardGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get full leaderboard (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved' })
  getLeaderboard(@Query('limit') limit?: string) {
    return this.leaderboardService.getLeaderboard(limit ? parseInt(limit) : undefined);
  }

  @Get('top/:limit')
  @ApiOperation({ summary: 'Get top N candidates (public)' })
  @ApiResponse({ status: 200, description: 'Top candidates retrieved' })
  getTopCandidates(@Param('limit') limit: string) {
    return this.leaderboardService.getLeaderboard(parseInt(limit));
  }

  @Get('candidate/:candidateId')
  @ApiOperation({ summary: 'Get candidate rank (public)' })
  @ApiResponse({ status: 200, description: 'Candidate rank retrieved' })
  getCandidateRank(@Param('candidateId') candidateId: string) {
    return this.leaderboardService.getCandidateRank(candidateId);
  }

  @Post('recalculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually recalculate leaderboard (Admin only)' })
  @ApiResponse({ status: 200, description: 'Leaderboard recalculated' })
  async recalculateLeaderboard() {
    const result = await this.leaderboardService.recalculateLeaderboard();
    
    // Broadcast update to all websocket clients
    await this.leaderboardGateway.broadcastLeaderboardUpdate();
    
    return result;
  }
}
