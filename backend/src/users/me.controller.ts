import { Controller, Get, Patch, Delete, Body, UseGuards, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import * as bcrypt from 'bcrypt';

class UpdateMyProfileDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() firstName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() lastName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEmail() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MinLength(8) newPassword?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() currentPassword?: string;
}

@ApiTags('Me')
@Controller('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Mon profil complet' })
  async getMe(@CurrentUser() user: any) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isActive: true, isVerified: true,
        googleId: true, createdAt: true,
        candidate: {
          select: {
            id: true, stageName: true, bio: true,
            videoUrl: true, thumbnailUrl: true, status: true,
          },
        },
      },
    });
  }

  @Patch()
  @ApiOperation({ summary: 'Mettre à jour mon profil' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @ApiResponse({ status: 400, description: 'Mot de passe actuel incorrect' })
  async updateMe(@CurrentUser() user: any, @Body() dto: UpdateMyProfileDto) {
    const existing = await this.prisma.user.findUnique({ where: { id: user.id } });
    const updateData: any = {};

    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;

    if (dto.newPassword) {
      if (!existing!.password) {
        // ✅ Compte Google → définir directement
        updateData.password = await bcrypt.hash(dto.newPassword, 12);
      } else {
        // ✅ Compte normal → vérifier mot de passe actuel
        if (!dto.currentPassword) {
          throw new BadRequestException('Le mot de passe actuel est requis.');
        }
        const valid = await bcrypt.compare(dto.currentPassword, existing!.password);
        if (!valid) {
          throw new BadRequestException('Mot de passe actuel incorrect.');
        }
        updateData.password = await bcrypt.hash(dto.newPassword, 12);
      }
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true, email: true, firstName: true,
        lastName: true, phone: true, role: true, updatedAt: true,
      },
    });
  }

  @Delete()
  @HttpCode(200)
  @ApiOperation({ summary: 'Supprimer mon compte (irréversible)' })
  async deleteMe(@CurrentUser() user: any) {
    await this.prisma.user.delete({ where: { id: user.id } });
    return { message: 'Compte supprimé avec succès.' };
  }
}
