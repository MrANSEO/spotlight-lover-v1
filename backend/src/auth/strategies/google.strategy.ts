// src/auth/strategies/google.strategy.ts — NOUVEAU FICHIER
// À créer dans : backend/src/auth/strategies/google.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
      passReqToCallback: true,
      // ✅ Passe le state pour conserver le ref
      state: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, photos, name } = profile;

    // ✅ Récupère le refCode depuis le state ou la query
    const refCode = req.query?.ref || req.query?.state || null;

    const user = await this.authService.findOrCreateGoogleUser({
      googleId: id,
      email: emails[0].value,
      firstName: name?.givenName || profile.displayName || 'Utilisateur',
      lastName: name?.familyName || '',
      avatar: photos?.[0]?.value,
      referralCode: refCode,  // ← passe le refCode
    });

    done(null, user);
  }
}
