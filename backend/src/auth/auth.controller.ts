// src/auth/auth.controller.ts — VERSION MISE À JOUR
// Remplace intégralement ton fichier existant.
//
// AJOUTS uniquement :
//   GET  /auth/google           → redirige vers Google
//   GET  /auth/google/callback  → reçoit le callback Google, génère les tokens
//                                  et redirige vers le frontend

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  TwoFactorCodeDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard, JwtRefreshAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── Inscription ──────────────────────────────────────────────────────────

  @Post('register')
  @ApiOperation({ summary: 'Créer un nouveau compte' })
  @ApiResponse({ status: 201, description: 'Compte créé' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // ─── Connexion ────────────────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ─── Refresh token ────────────────────────────────────────────────────────

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renouveler le token' })
  async refresh(@CurrentUser() user: any, @Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(user.id, refreshTokenDto.refreshToken);
  }

  // ─── Déconnexion ──────────────────────────────────────────────────────────

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Se déconnecter' })
  async logout(@CurrentUser() user: any) {
    await this.authService.logout(user.id);
    return { message: 'Logged out successfully' };
  }

  // ─── Profil courant ───────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer le profil connecté' })
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  // ─── Vérification email ───────────────────────────────────────────────────

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier email via le lien reçu' })
  @ApiQuery({ name: 'token', required: true })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renvoyer le lien de vérification' })
  async resendVerification(@CurrentUser() user: any) {
    return this.authService.resendVerificationEmail(user.id);
  }

  // ─── Mot de passe oublié ──────────────────────────────────────────────────

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander un lien de réinitialisation' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ─── 2FA ──────────────────────────────────────────────────────────────────

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configurer la 2FA' })
  async setup2FA(@CurrentUser() user: any) {
    return this.authService.setup2FA(user.id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer la 2FA' })
  async verify2FA(@CurrentUser() user: any, @Body() dto: TwoFactorCodeDto) {
    return this.authService.verify2FA(user.id, dto.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Désactiver la 2FA' })
  async disable2FA(@CurrentUser() user: any, @Body() dto: TwoFactorCodeDto) {
    return this.authService.disable2FA(user.id, dto.code);
  }

  // ─── ✅ NOUVEAU : Google OAuth ────────────────────────────────────────────

  // ✅ NOUVEAU — Route intermédiaire qui encode le ref dans le state OAuth2
  @Get('google/init')
  async googleInit(@Query('ref') ref: string, @Res() res: any) {
    const clientID = process.env.GOOGLE_CLIENT_ID!;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL!;

    // Encoder le ref dans le state base64
    const statePayload = ref ? { ref } : {};
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientID);
    googleAuthUrl.searchParams.set('redirect_uri', callbackURL);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'email profile');
    googleAuthUrl.searchParams.set('state', state);
    googleAuthUrl.searchParams.set('access_type', 'offline');

    return res.redirect(googleAuthUrl.toString());
  }

  // Route Google originale — gardée pour compatibilité (connexion sans ref)
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Connexion via Google' })
  async googleAuth() {
    // Passport gère la redirection
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback Google' })
  async googleCallback(@CurrentUser() user: any, @Res() res: any) {
    // Générer les tokens JWT pour cet utilisateur
    const tokens = await this.authService.googleLogin(user.id);

    // Rediriger vers la page de callback frontend avec les tokens en query params
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/google/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;

    return res.redirect(redirectUrl);
  }
}