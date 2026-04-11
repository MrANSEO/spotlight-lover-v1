// src/auth/auth.service.ts — VERSION MISE À JOUR
// Remplace intégralement ton fichier existant.
//
// AJOUTS uniquement (rien de supprimé) :
//   - findOrCreateGoogleUser() : crée ou retrouve un user via Google OAuth
//   - googleLogin()            : génère les tokens JWT après auth Google

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,  // ← ajoute cet import
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { EmailService } from '../mails/email.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { ReferralService } from '../referral/referral.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name); // ← ajoute cette ligne

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
     private referralService: ReferralService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // INSCRIPTION (inchangé)
  // ═══════════════════════════════════════════════════════════════════════════

async register(registerDto: RegisterDto) {
  const existingUser = await this.prisma.user.findUnique({
    where: { email: registerDto.email },
  });

  if (existingUser) {
    throw new ConflictException('Cet email est déjà utilisé.');
  }

  const bcryptRounds = parseInt(this.configService.get('BCRYPT_ROUNDS') || '12');
  const hashedPassword = await bcrypt.hash(registerDto.password, bcryptRounds);

  const user = await this.prisma.user.create({
    data: {
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      isVerified: false,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  // ✅ Traitement parrainage APRÈS création
  if (registerDto.referralCode) {
    await this.referralService.processReferral(user.id, registerDto.referralCode);
  }

  const verificationToken = await this.generateEmailVerificationToken(user.id, user.email);
  this.emailService.sendVerificationEmail(
    user.email,
    verificationToken,
    user.firstName ?? undefined,
  ).catch((err) => {
    console.warn(`Email non envoyé à ${user.email}:`, err.message);
  });

  const tokens = await this.generateTokens(user.id, user.email, user.role);
  await this.storeHashedRefreshToken(user.id, tokens.refreshToken);

  return {
    user,
    ...tokens,
    requiresEmailVerification: true,
    message: 'Inscription réussie ! Un email de vérification a été envoyé.',
  };
}

  // ═══════════════════════════════════════════════════════════════════════════
  // CONNEXION (inchangé)
  // ═══════════════════════════════════════════════════════════════════════════

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    // ✅ Vérifier si le compte est verrouillé
    if (user && user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Compte verrouillé. Réessayez dans ${minutes} minute(s).`);
    }

    const isPasswordValid =
      user && user.password && (await bcrypt.compare(loginDto.password, user.password));

    if (!user || !isPasswordValid) {
      // ✅ Incrémenter les tentatives échouées
      if (user) {
        const newAttempts = (user.loginAttempts || 0) + 1;
        const shouldLock = newAttempts >= 5; // Verrouiller après 5 tentatives
        
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: newAttempts,
            lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null, // 15 min
          },
        });

        if (shouldLock) {
          throw new UnauthorizedException(`Trop de tentatives échouées. Compte verrouillé pour 15 minutes.`);
        }
      }
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Votre compte a été désactivé. Contactez le support.');
    }

    if (user.twoFactorEnabled) {
      if (!loginDto.twoFactorCode) {
        return { requiresTwoFactor: true, userId: user.id, message: 'Code 2FA requis.' };
      }
      const isValid = this.verify2FACode(user.twoFactorSecret!, loginDto.twoFactorCode);
      if (!isValid) throw new UnauthorizedException('Code 2FA invalide.');
    }

    // ✅ Login réussi — réinitialiser les tentatives et verrouillage
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeHashedRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
      },
      ...tokens,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ NOUVEAU : Connexion via Google OAuth
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Trouve un user existant par googleId ou email, ou le crée.
   * Appelé par GoogleStrategy après validation du token Google.
   */
  async findOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    referralCode?: string;  // ← nouveau paramètre
  }) {
    // Chercher un user existant par googleId ou email
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId: data.googleId },
          { email: data.email },
        ],
      },
    });

    const isNewUser = !user;

    if (user) {
      // Mettre à jour le googleId si connexion email existante
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: data.googleId, avatar: data.avatar },
        });
      }
    } else {
      // Créer le nouvel utilisateur
      user = await this.prisma.user.create({
        data: {
          googleId: data.googleId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          avatar: data.avatar,
          password: '',
          isVerified: true,  // Google vérifie l'email
          isActive: true,
        },
      });
    }

    // ✅ Traiter le parrainage seulement si c'est un nouvel utilisateur
    if (isNewUser && data.referralCode) {
      await this.referralService.processReferral(user.id, data.referralCode);
      this.logger.log(`Google OAuth referral processed for ${user.email}`);
    }

    return user;
  }

  /**
   * Génère les tokens JWT après connexion Google réussie.
   * Appelé par AuthController dans le callback Google.
   */
  async googleLogin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable.');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeHashedRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
      },
      ...tokens,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VÉRIFICATION EMAIL (inchangé)
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyEmail(token: string) {
    let payload: { sub: string; email: string; purpose: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_VERIFY_SECRET') || this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new BadRequestException('Lien de vérification invalide ou expiré.');
    }

    if (payload.purpose !== 'email-verification') throw new BadRequestException('Token invalide.');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user.isVerified) return { message: 'Votre email est déjà vérifié.', alreadyVerified: true };

    await this.prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    return { message: '✅ Email vérifié avec succès !' };
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user.isVerified) throw new BadRequestException('Votre email est déjà vérifié.');

    const token = await this.generateEmailVerificationToken(user.id, user.email);
    await this.emailService.sendVerificationEmail(user.email, token, user.firstName ?? undefined);
    return { message: 'Email de vérification renvoyé.' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOT DE PASSE OUBLIÉ / RÉINITIALISATION (inchangé)
  // ═══════════════════════════════════════════════════════════════════════════

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: forgotPasswordDto.email } });
    const genericResponse = { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
    if (!user || !user.isActive) return genericResponse;

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, purpose: 'password-reset' },
      {
        secret: this.configService.get('JWT_RESET_SECRET') || this.configService.get('JWT_SECRET'),
        expiresIn: '1h',
      },
    );

    await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName ?? undefined);
    return genericResponse;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    let payload: { sub: string; email: string; purpose: string };
    try {
      payload = await this.jwtService.verifyAsync(resetPasswordDto.token, {
        secret: this.configService.get('JWT_RESET_SECRET') || this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré.');
    }

    if (payload.purpose !== 'password-reset') throw new BadRequestException('Token invalide.');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new NotFoundException('Utilisateur introuvable.');

    const bcryptRounds = parseInt(this.configService.get('BCRYPT_ROUNDS') || '12');
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, bcryptRounds);
    await this.prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword, refreshToken: null } });

    return { message: '✅ Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REFRESH & LOGOUT (inchangé)
  // ═══════════════════════════════════════════════════════════════════════════

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) throw new UnauthorizedException('Session invalide.');

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
      throw new UnauthorizedException('Refresh token invalide.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeHashedRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    return { message: 'Déconnexion réussie.' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2FA (inchangé)
  // ═══════════════════════════════════════════════════════════════════════════

  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Utilisateur introuvable.');
    if (user.twoFactorEnabled) throw new BadRequestException('La 2FA est déjà activée.');

    const secret = speakeasy.generateSecret({ name: `SpotLightLover (${user.email})` });
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret.base32 } });
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    return { secret: secret.base32, qrCode: qrCodeUrl };
  }

  async verify2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new BadRequestException('2FA non configurée.');
    if (!this.verify2FACode(user.twoFactorSecret, code)) throw new BadRequestException('Code 2FA invalide.');
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    return { message: '✅ 2FA activée.' };
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled) throw new BadRequestException('2FA non activée.');
    if (!this.verify2FACode(user.twoFactorSecret!, code)) throw new BadRequestException('Code 2FA invalide.');
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
    return { message: '2FA désactivée.' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFIL (inchangé)
  // ═══════════════════════════════════════════════════════════════════════════

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        role: true, twoFactorEnabled: true, isVerified: true, createdAt: true,
        avatar: true,
        candidate: {
          select: { id: true, stageName: true, status: true, videoUrl: true, thumbnailUrl: true, bio: true },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable.');
    return user;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTHODES PRIVÉES (inchangées)
  // ═══════════════════════════════════════════════════════════════════════════

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || !user.password) return null;
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;
    return user;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { secret: this.configService.get('JWT_SECRET'), expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { secret: this.configService.get('JWT_REFRESH_SECRET'), expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d' },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async storeHashedRefreshToken(userId: string, refreshToken: string) {
    const bcryptRounds = parseInt(this.configService.get('BCRYPT_ROUNDS') || '12');
    const hashed = await bcrypt.hash(refreshToken, bcryptRounds);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: hashed } });
  }

  private async generateEmailVerificationToken(userId: string, email: string) {
    return this.jwtService.signAsync(
      { sub: userId, email, purpose: 'email-verification' },
      { secret: this.configService.get('JWT_VERIFY_SECRET') || this.configService.get('JWT_SECRET'), expiresIn: '24h' },
    );
  }

  private verify2FACode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 2 });
  }
}
