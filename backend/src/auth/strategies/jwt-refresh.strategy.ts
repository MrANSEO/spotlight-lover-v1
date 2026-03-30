// src/auth/strategies/jwt-refresh.strategy.ts — VERSION CORRIGÉE
// Remplace intégralement ton fichier existant.
//
// CORRECTION :
//   ❌ AVANT : user.refreshToken !== refreshToken
//      (comparaison directe : le token en clair ne correspondra JAMAIS
//       au hash bcrypt stocké en base → toujours false → refresh impossible)
//
//   ✅ APRÈS : await bcrypt.compare(refreshToken, user.refreshToken)
//      (comparaison hash bcrypt correcte)

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('JWT_REFRESH_SECRET') || 'default-refresh-secret',
      passReqToCallback: true,
    } as any);
  }

  async validate(req: any, payload: any) {
    const refreshToken = req.body.refreshToken;

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    // ✅ CORRECTION : bcrypt.compare au lieu de ===
    if (!user || !user.isActive || !user.refreshToken) {
      return null;
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}