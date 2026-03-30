// ═══════════════════════════════════════════════════════════════════════════════
// audit-logs.controller.ts — SpotLightLover
//
// MANQUANT : Le frontend AdminAuditLogsPage appelle GET /audit-logs
// mais aucun controller n'expose cette route.
//
// Ce fichier crée le module complet :
//   GET /audit-logs         → Liste paginée avec filtres (Admin)
//   GET /audit-logs/:id     → Détail d'un log (Admin)
// ═══════════════════════════════════════════════════════════════════════════════

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: "[ADMIN] Lister les logs d'audit avec filtres" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('userId') userId?: string,
  ) {
    return this.auditLogsService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      action: action && action !== 'ALL' ? action : undefined,
      resource: resource && resource !== 'ALL' ? resource : undefined,
      userId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: "[ADMIN] Détail d'un log d'audit" })
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }
}
