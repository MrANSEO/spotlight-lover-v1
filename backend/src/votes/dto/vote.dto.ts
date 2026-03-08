import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { PaymentProvider } from '@prisma/client';

export class CreateVoteDto {
  @ApiProperty()
  @IsString()
  candidateId: string;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  amount?: number; // Optional - defaults to 100 FCFA

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string; // Required for MeSomb/MTN/Orange
}
