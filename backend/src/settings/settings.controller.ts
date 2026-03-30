
import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BypassMaintenance } from '../common/guards/maintenance.guard';
import { UserRole } from '@prisma/client';
 
class SetMaintenanceDto {
  @ApiProperty() @IsBoolean() enabled: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) message?: string;
}
 
class UpdateSettingDto {
  @ApiProperty() @IsString() @MaxLength(1000) value: string;
}
 
@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}
 
  // PUBLIC — doit être accessible même en maintenance (le frontend en a besoin)
  @Get('maintenance')
  @BypassMaintenance()
  @ApiOperation({ summary: 'Statut maintenance (public)' })
  getMaintenanceStatus() {
    return this.settingsService.getMaintenanceStatus();
  }
 
  @Post('maintenance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Activer/désactiver la maintenance' })
  setMaintenance(@Body() dto: SetMaintenanceDto) {
    return this.settingsService.setMaintenanceMode(dto.enabled, dto.message);
  }
 
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Tous les paramètres système' })
  getAllSettings() {
    return this.settingsService.getAll();
  }
 
  @Patch(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Modifier un paramètre par clé' })
  updateSetting(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.set(key, dto.value);
  }
}