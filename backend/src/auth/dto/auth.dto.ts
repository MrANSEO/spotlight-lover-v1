// ═══════════════════════════════════════════════════════════════════════════════
// auth.dto.ts — SpotLightLover (VERSION COMPLÈTE)
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'jean@example.com' })
  @IsEmail({}, { message: 'Email invalide.' })
  email: string;

  @ApiProperty({ example: 'MonMotDePasse@123' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, {
    message:
      'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&#).',
  })
  password: string;

  @ApiProperty({ required: false, example: 'Jean' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({ required: false, example: 'Dupont' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({ required: false, example: '690000001' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'jean@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MonMotDePasse@123' })
  @IsString()
  password: string;

  @ApiProperty({ required: false, example: '123456', description: 'Code TOTP si 2FA activée' })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}

// ✅ NOUVEAU
export class ForgotPasswordDto {
  @ApiProperty({ example: 'jean@example.com' })
  @IsEmail({}, { message: 'Email invalide.' })
  email: string;
}

// ✅ NOUVEAU
export class ResetPasswordDto {
  @ApiProperty({ description: 'Token reçu par email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NouveauMotDePasse@456' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, {
    message:
      'Le mot de passe doit contenir une minuscule, une majuscule, un chiffre et un caractère spécial.',
  })
  newPassword: string;
}

export class TwoFactorCodeDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}