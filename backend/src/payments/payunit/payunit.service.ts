import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface PayunitPaymentResponse {
  success: boolean;
  transactionId: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  message?: string;
}

@Injectable()
export class PayunitService {
  private readonly logger = new Logger(PayunitService.name);
  private readonly baseUrl = 'https://gateway.payunit.net';

  constructor(private config: ConfigService) {}

  private getAuthHeader(): string {
    const username = this.config.get('PAYUNIT_USERNAME');
    const password = this.config.get('PAYUNIT_PASSWORD');
    return Buffer.from(`${username}:${password}`).toString('base64');
  }

  private getHeaders() {
    return {
      'x-api-key': this.config.get('PAYUNIT_API_KEY'),
      'mode': this.config.get('PAYUNIT_MODE', 'live'),
      'Content-Type': 'application/json',
      'Authorization': `Basic ${this.getAuthHeader()}`,
    };
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

  detectGateway(phone: string): 'CM_MTNMOMO' | 'CM_ORANGE' {
    const normalized = this.normalizePhoneNumber(phone);
    const prefix = normalized.substring(3, 5);
    return prefix === '69' ? 'CM_ORANGE' : 'CM_MTNMOMO';
  }

  async initiatePayment(params: {
    amount: number;
    phone: string;
    message?: string;
  }): Promise<PayunitPaymentResponse> {
    const normalizedPhone = this.normalizePhoneNumber(params.phone);
    const gateway = this.detectGateway(normalizedPhone);

    // ✅ CORRECTION — PayUnit veut le numéro SANS le 237 (ex: 675286243)
    const phoneForPayunit = normalizedPhone.startsWith('237')
      ? normalizedPhone.substring(3)
      : normalizedPhone;

    const transactionId = `SLL_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const headers = this.getHeaders();

    this.logger.log(
      `PayUnit payment: ${params.amount} XAF → ${normalizedPhone} via ${gateway} (phone envoyé: ${phoneForPayunit})`,
    );

    try {
      // Étape 1 — Initialize
      await axios.post(
        `${this.baseUrl}/api/gateway/initialize`,
        {
          transaction_id: transactionId,
          total_amount: params.amount,
          currency: 'XAF',
        },
        { headers },
      );

      // Étape 2 — Make payment
      const response = await axios.post(
        `${this.baseUrl}/api/gateway/makepayment`,
        {
          gateway,
          amount: params.amount,
          transaction_id: transactionId,
          phone_number: phoneForPayunit, // ✅ sans le 237
          currency: 'XAF',
          paymentType: 'button',
          notify_url: this.config.get('PAYUNIT_NOTIFY_URL'),
          return_url: this.config.get('PAYUNIT_RETURN_URL'),
        },
        { headers },
      );

      const data = response.data;
      this.logger.log(`PayUnit response: ${JSON.stringify(data)}`);

      const paymentStatus = data?.data?.payment_status;
      const success = paymentStatus === 'SUCCESSFUL';

      this.logger.log(
        `PayUnit payment_status: ${paymentStatus}, success: ${success}`,
      );

      return {
        success,
        transactionId: data?.data?.transaction_id || transactionId,
        status: success ? 'COMPLETED' : 'PENDING',
        message: data?.message,
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      this.logger.error(`PayUnit erreur: ${msg}`);

      if (msg?.includes('insufficient')) {
        throw new BadRequestException(
          'Solde insuffisant sur votre Mobile Money.',
        );
      }

      throw new InternalServerErrorException(
        'Erreur de communication avec PayUnit. Réessayez.',
      );
    }
  }

  async checkTransactionStatus(transactionId: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/gateway/transaction/${transactionId}`,
        { headers: this.getHeaders() },
      );

      const data = response.data;
      const status = data?.data?.payment_status || data?.status;

      if (status === 'SUCCESSFUL') return { status: 'SUCCESS' };
      if (status === 'FAILED' || status === 'CANCELLED') return { status: 'FAILED' };
      return { status: 'PENDING' };
    } catch {
      return { status: 'PENDING' };
    }
  }
}