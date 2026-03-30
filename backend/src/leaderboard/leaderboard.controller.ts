import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Classement en temps réel (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLeaderboard(@Query('limit') limit?: string) {
    return this.leaderboardService.getLeaderboard(limit ? parseInt(limit) : 20);
  }

  @Get('candidate/:id')
  @ApiOperation({ summary: 'Rang d\'un candidat spécifique' })
  getCandidateRank(@Param('id') id: string) {
    return this.leaderboardService.getCandidateRank(id);
  }
}
