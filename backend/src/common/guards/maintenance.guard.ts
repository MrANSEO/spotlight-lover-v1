// src/common/guards/maintenance.guard.ts — VERSION CORRIGÉE
// Remplace intégralement ton fichier existant.
//
// CORRECTION du problème : l'admin était bloqué par la maintenance
//
// CAUSE : MaintenanceGuard est un APP_GUARD global qui s'exécute AVANT JwtAuthGuard.
// Donc request.user est toujours undefined quand le guard vérifie le rôle.
// La vérification "if (request.user?.role === 'ADMIN') return true" ne fonctionnait jamais.
//
// SOLUTION : décoder le JWT manuellement depuis le header Authorization
// sans passer par Passport, ce qui permet de récupérer le rôle directement.

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as jwt from 'jsonwebtoken';

export const BYPASS_MAINTENANCE_KEY = 'bypassMaintenance';
export const BypassMaintenance = () => SetMetadata(BYPASS_MAINTENANCE_KEY, true);

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Routes marquées @BypassMaintenance() → toujours accessibles
    const bypass = this.reflector.getAllAndOverride<boolean>(
      BYPASS_MAINTENANCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (bypass) return true;

    // Lire le mode maintenance en base
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'maintenanceMode' },
    });
    if (setting?.value !== 'true') return true;

    // ✅ CORRECTION : décoder le JWT manuellement car request.user n'est pas
    // encore hydraté à ce stade (MaintenanceGuard tourne avant JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET || 'default-secret';
        const decoded = jwt.verify(token, secret) as any;

        // Si l'utilisateur est ADMIN → accès autorisé même en maintenance
        if (decoded?.role === 'ADMIN') return true;
      } catch {
        // Token invalide ou expiré → continuer (sera bloqué par JwtAuthGuard ensuite)
      }
    }

    // Lire le message personnalisé
    const messageSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'maintenanceMessage' },
    });

    throw new ServiceUnavailableException({
      statusCode: 503,
      error: 'Service Unavailable',
      message:
        messageSetting?.value ||
        'La plateforme est en maintenance. Revenez dans quelques instants.',
      maintenance: true,
    });
  }
}