// src/payments/dto/payment.dto.ts — VERSION CORRIGÉE ET COMPLÈTE
// Remplace intégralement ton fichier existant.
//
// CORRECTION du 400 Bad Request sur POST /payments/candidate-registration :
//
// Le frontend envoie :  { candidateId, phone, operator }
// Le backend attendait : { stageName, bio, phone, operator }
// → stageName et bio ne doivent PAS être dans ce DTO (ils sont déjà en DB)
// → candidateId doit être ajouté pour retrouver le candidat existant

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsPositive,
  Matches,
  Min,
  Max,
} from 'class-validator';

export enum MobileOperator {
  MTN = 'MTN',
  ORANGE = 'ORANGE',
}

// ─── Inscription Candidat ─────────────────────────────────────────────────────
//
// ✅ CORRECTION : le frontend envoie candidateId (candidat déjà créé en étape 1)
// Le backend récupère stageName depuis la DB avec le candidateId
// plus besoin de stageName dans ce DTO

export class InitiateCandidatePaymentDto {
  @ApiProperty({ description: "ID du candidat créé à l'étape 1" })
  @IsString()
  candidateId: string;

  @ApiProperty({
    description: 'Numéro Mobile Money (format: 237XXXXXXXXX ou 6XXXXXXXX)',
    example: '237690000001',
  })
  @IsString()
  @Matches(/^(237)?[0-9]{9}$/, {
    message: 'Numéro invalide. Format: 237690000001 ou 690000001',
  })
  phone: string;

  @ApiProperty({ enum: MobileOperator, description: 'Opérateur Mobile Money' })
  @IsEnum(MobileOperator)
  operator: MobileOperator;
}

// ─── Vote ─────────────────────────────────────────────────────────────────────

export class InitiateVotePaymentDto {
  @ApiProperty({ description: 'ID du candidat à voter' })
  @IsString()
  candidateId: string;

  @ApiProperty({
    required: false,
    description: 'Numéro Mobile Money du votant (optionnel si portefeuille suffisant)',
    example: '237690000001',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(237)?[0-9]{9}$/, {
    message: 'Numéro invalide. Format: 237690000001 ou 690000001',
  })
  phone?: string;

  @ApiProperty({ enum: MobileOperator })
  @IsEnum(MobileOperator)
  operator: MobileOperator;

  @ApiProperty({
    required: false,
    description: 'Nombre de votes (1 par défaut, max 100)',
    minimum: 1,
    maximum: 100,
  })

  // ✅ Correct — ajoute @ApiProperty sur bonusVotes aussi :
  @ApiProperty({
    required: false,
    description: 'Votes bonus offerts',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bonusVotes?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(100)
  quantity?: number;
}

// ─── Vote Admin (gratuit) ─────────────────────────────────────────────────────

export class AdminVoteDto {
  @ApiProperty({ description: 'ID du candidat' })
  @IsString()
  candidateId: string;

  @ApiProperty({
    required: false,
    description: 'Nombre de votes à attribuer',
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(10)
  quantity?: number;

  @ApiProperty({ required: false, description: 'Raison (pour audit)' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ─── Vérification Statut ──────────────────────────────────────────────────────

export class CheckTransactionDto {
  @ApiProperty({ description: 'ID de transaction' })
  @IsString()
  transactionId: string;
}
