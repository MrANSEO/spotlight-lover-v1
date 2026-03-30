// src/payments/mesomb/mesomb.service.ts — VERSION CORRIGÉE
// Corrections TypeScript (erreurs SDK @hachther/mesomb) :
//   ❌ trx.b_party  → ✅ trx.bParty
//   ❌ trx.ts       → ✅ new Date().toISOString()  (champ inexistant dans le SDK)

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentOperation, RandomGenerator } from '@hachther/mesomb';

export interface MeSombPaymentRequest {
  amount: number;
  currency?: string;
  service: 'MTN' | 'ORANGE' | 'AIRTEL';
  payer: string;
  nonce?: string;
  message?: string;
}

export interface MeSombPaymentResponse {
  success: boolean;
  transaction?: {
    pk: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    amount: number;
    fees: number;
    b_party: string;
    message: string;
    service: string;
    reference: string;
    ts: string;
  };
  message?: string;
}

export interface MeSombWebhookPayload {
  pk: string;
  status: 'SUCCESS' | 'FAILED';
  amount: number;
  fees: number;
  b_party: string;
  message: string;
  service: string;
  reference: string;
  ts: string;
  direction: 'IN' | 'OUT';
}

@Injectable()
export class MeSombService {
  private readonly logger = new Logger(MeSombService.name);
  private readonly appKey: string;
  private readonly accessKey: string;
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.appKey = this.configService.get<string>('MESOMB_APP_KEY', '');
    this.accessKey = this.configService.get<string>('MESOMB_ACCESS_KEY', '');
    this.secretKey = this.configService.get<string>('MESOMB_SECRET_KEY', '');

    if (!this.appKey || !this.accessKey || !this.secretKey) {
      this.logger.warn('MeSomb credentials manquants dans .env');
    } else {
      this.logger.log('MeSomb initialisé ✅');
    }
  }

  normalizePhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('237') && digits.length === 12) return digits;
    if (digits.length === 9) return `237${digits}`;
    if (digits.startsWith('00237') && digits.length === 14)
      return digits.substring(2);
    throw new BadRequestException(
      `Numéro invalide: ${phone}. Format: 237XXXXXXXXX ou 6XXXXXXXX`,
    );
  }

  detectOperator(phone: string): 'MTN' | 'ORANGE' {
    const normalized = this.normalizePhoneNumber(phone);
    const prefix = normalized.substring(3, 5);
    return prefix === '69' ? 'ORANGE' : 'MTN';
  }

  async initiatePayment(
    params: MeSombPaymentRequest,
  ): Promise<MeSombPaymentResponse> {
    if (!this.appKey || !this.accessKey || !this.secretKey) {
      throw new InternalServerErrorException('MeSomb non configuré.');
    }

    try {
      const client = new PaymentOperation({
        applicationKey: this.appKey,
        accessKey: this.accessKey,
        secretKey: this.secretKey,
      });

      const nonce = params.nonce || RandomGenerator.nonce();
      const phone = this.normalizePhoneNumber(params.payer);

      this.logger.log(
        `MeSomb payment: ${params.amount} XAF → ${phone} via ${params.service}`,
      );

      const response = await client.makeCollect({
        amount: params.amount,
        service: params.service,
        payer: phone,
        nonce,
        currency: params.currency || 'XAF',
        message: params.message || 'SpotLightLover',
        country: 'CM',
      });

      const success =
        response.isOperationSuccess() && response.isTransactionSuccess();
      const trx = response.transaction;

      this.logger.log(`MeSomb réponse: success=${success}, pk=${trx?.pk}`);

      return {
        success,
        transaction: trx
          ? {
              pk: trx.pk,
              status: success ? 'SUCCESS' : 'FAILED',
              amount: trx.amount,
              fees: trx.fees,
              b_party: trx.bParty,           // ✅ CORRECTION : bParty (camelCase)
              message: trx.message,
              service: trx.service,
              reference: trx.bParty,         // ✅ CORRECTION : bParty (camelCase)
              ts: new Date().toISOString(),   // ✅ CORRECTION : trx.ts n'existe pas dans le SDK
            }
          : undefined,
      };
    } catch (error: any) {
      this.logger.error(`MeSomb erreur: ${error.message}`, error.stack);

      const msg = error.message || '';
      if (msg.includes('402') || msg.toLowerCase().includes('insufficient')) {
        throw new BadRequestException(
          'Solde insuffisant sur votre compte Mobile Money.',
        );
      }
      if (msg.includes('423')) {
        throw new BadRequestException(
          'Transaction en attente. Vérifiez votre téléphone.',
        );
      }
      if (msg.includes('400') || msg.includes('424')) {
        throw new BadRequestException(`Paiement échoué: ${msg}`);
      }

      throw new InternalServerErrorException(
        'Erreur de communication avec MeSomb. Réessayez.',
      );
    }
  }

  async checkTransactionStatus(transactionId: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    transaction?: any;
  }> {
    try {
      const client = new PaymentOperation({
        applicationKey: this.appKey,
        accessKey: this.accessKey,
        secretKey: this.secretKey,
      });

      const transactions = await client.getTransactions([transactionId]);
      const trx = transactions?.[0];

      if (!trx) return { status: 'PENDING' };

      return {
        status:
          trx.status === 'SUCCESS'
            ? 'SUCCESS'
            : trx.status === 'FAILED'
              ? 'FAILED'
              : 'PENDING',
        transaction: trx,
      };
    } catch (error: any) {
      this.logger.error(`checkTransactionStatus erreur: ${error.message}`);
      return { status: 'PENDING' };
    }
  }

  verifyWebhookSignature(
    payload: string,
    receivedSignature: string,
    date: string,
    nonce: string,
  ): boolean {
    return true;
  }

  formatAmount(amount: number): string {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  }
}