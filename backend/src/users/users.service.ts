// ═══════════════════════════════════════════════════════════════════════════════
// users.service.ts — SpotLightLover
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Liste paginée avec recherche ────────────────────────────────────

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    role?: UserRole;
  }) {
    const { page, limit, search, role } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              votesGiven: { where: { status: 'COMPLETED' } },
              transactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Détail d'un utilisateur ─────────────────────────────────────────

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLogin: true,
        candidate: {
          select: {
            id: true,
            stageName: true,
            status: true,
            videoUrl: true,
          },
        },
        _count: {
          select: {
            votesGiven: { where: { status: 'COMPLETED' } },
            transactions: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return user;
  }

  // ─── Modifier son propre profil ───────────────────────────────────────

  async updateProfile(userId: string, dto: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const updateData: any = {};

    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;

    // Changement de mot de passe
    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Le mot de passe actuel est requis pour le modifier.');
      }
      const isValid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isValid) {
        throw new BadRequestException('Mot de passe actuel incorrect.');
      }
      updateData.password = await bcrypt.hash(dto.newPassword, 12);
      updateData.refreshToken = null; // Invalider toutes les sessions
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
      },
    });

    return { user: updated, message: 'Profil mis à jour.' };
  }

  // ─── Supprimer son propre compte ──────────────────────────────────────

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Un compte admin ne peut pas être supprimé de cette façon.');
    }

    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Compte supprimé avec succès.' };
  }

  // ─── Admin : modifier un utilisateur ─────────────────────────────────

  async adminUpdate(
    userId: string,
    dto: { isActive?: boolean; role?: UserRole },
    adminId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    // Empêcher l'admin de se désactiver lui-même
    if (userId === adminId && dto.isActive === false) {
      throw new ForbiddenException('Vous ne pouvez pas désactiver votre propre compte.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, email: true, role: true, isActive: true },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_UPDATE',
        resource: 'User',
        details: { targetUserId: userId, changes: dto },
      },
    });

    return { user: updated, message: 'Utilisateur mis à jour.' };
  }

  // ─── Admin : supprimer un utilisateur ────────────────────────────────

  async adminDelete(userId: string, adminId: string) {
    if (userId === adminId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte admin.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    await this.prisma.user.delete({ where: { id: userId } });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_DELETE',
        resource: 'User',
        details: { deletedUserId: userId, deletedEmail: user.email },
      },
    });

    return { message: 'Utilisateur supprimé.' };
  }
}
