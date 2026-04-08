// src/auth/auth.module.ts — VERSION MISE À JOUR
// Remplace intégralement ton fichier existant.
//
// AJOUT : GoogleStrategy dans providers

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy'; // ✅ NOUVEAU
import { PrismaService } from '../prisma.service';
import { EmailModule } from '../mails/email.module';

@Module({
  imports: [PassportModule, JwtModule.register({}), ConfigModule, EmailModule,ReferralModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
    GoogleStrategy, // ✅ NOUVEAU
  ],
  exports: [AuthService],
})
export class AuthModule {}
