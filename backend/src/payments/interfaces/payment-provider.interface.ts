import { PaymentProvider, PaymentStatus } from '@prisma/client';

export interface IPaymentProvider {
  initiatePayment(amount: number, currency: string, metadata: any): Promise<PaymentInitResult>;
  verifyPayment(transactionId: string): Promise<PaymentVerifyResult>;
  refundPayment(transactionId: string, amount: number): Promise<PaymentRefundResult>;
}

export interface PaymentInitResult {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  providerReference?: string;
  error?: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  status: PaymentStatus;
  transactionId: string;
  amount: number;
  currency: string;
  metadata?: any;
  error?: string;
}

export interface PaymentRefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}
