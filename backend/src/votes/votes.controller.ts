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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/vote.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Votes')
@Controller('votes')
export class VotesController {
  constructor(private votesService: VotesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote for a candidate (requires payment)' })
  @ApiResponse({ status: 201, description: 'Vote initiated successfully' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  create(@CurrentUser() user: any, @Body() createVoteDto: CreateVoteDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.votesService.initiateVote(user.id, createVoteDto, ipAddress, userAgent);
  }

  @Get('my-votes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my votes history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Votes retrieved successfully' })
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

  @Get('candidate/:candidateId/stats')
  @ApiOperation({ summary: 'Get vote statistics for a candidate (public)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getCandidateStats(@Param('candidateId') candidateId: string) {
    return this.votesService.getCandidateVoteStats(candidateId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all votes (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Votes retrieved successfully' })
  getAllVotes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.votesService.getAllVotes(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }
}
