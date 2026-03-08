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
import { CreateCandidateDto, UpdateCandidateDto, ModerateCandidateDto } from './dto/candidate.dto';
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
  @ApiOperation({ summary: 'Initiate candidate registration (requires payment)' })
  @ApiResponse({ status: 201, description: 'Candidate registration initiated' })
  @ApiResponse({ status: 400, description: 'Already has candidate profile' })
  create(@CurrentUser() user: any, @Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.initiateCandidaturePayment(user.id, createCandidateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all candidates (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: CandidateStatus })
  @ApiResponse({ status: 200, description: 'Candidates retrieved successfully' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: CandidateStatus,
  ) {
    return this.candidatesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my candidate profile' })
  @ApiResponse({ status: 200, description: 'Candidate profile retrieved' })
  @ApiResponse({ status: 404, description: 'No candidate profile found' })
  getMyCandidateProfile(@CurrentUser() user: any) {
    return this.candidatesService.getMyCandidateProfile(user.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get candidate statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getStats() {
    return this.candidatesService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a candidate by ID (public)' })
  @ApiResponse({ status: 200, description: 'Candidate found' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update candidate profile' })
  @ApiResponse({ status: 200, description: 'Candidate updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateCandidateDto: UpdateCandidateDto,
  ) {
    return this.candidatesService.update(id, user.id, user.role, updateCandidateDto);
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moderate candidate (validate/suspend/reject) - Admin only' })
  @ApiResponse({ status: 200, description: 'Candidate moderated successfully' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  moderate(
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
  @ApiOperation({ summary: 'Delete a candidate (Admin only)' })
  @ApiResponse({ status: 200, description: 'Candidate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
