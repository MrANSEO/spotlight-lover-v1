// src/webhooks/webhooks.service.ts — VERSION COMPLÈTE ET FINALE
// Remplace intégralement ton fichier existant.
//
// Modification par rapport à l'original :
//   isValid: true (hardcodé) → remplacé par vraie vérification HMAC via mesomb.verifyWebhookSignature()
//   La méthode processMesombWebhook() accepte maintenant mesombDate et mesombNonce
//   (transmis depuis le controller via les headers HTTP)
//
// Tout le reste (getLogs, getLog, retryWebhook, traitement SUCCESS/FAILED) est IDENTIQUE.

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { PaymentService } from '../payments/payment.service';
import { MeSombService } from '../payments/mesomb/mesomb.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private mesombService: MeSombService,
    private configService: ConfigService,
  ) {}

  // ─── Traitement du webhook MeSomb — CORRIGÉ ───────────────────────────────

  async processMesombWebhook(
    payload: any,
    signature?: string,
    mesombDate?: string,    // ✅ NOUVEAU : header x-mesomb-date
    mesombNonce?: string,   // ✅ NOUVEAU : header x-mesomb-nonce
  ) {
    // ─── Vérification de la signature HMAC ───────────────────────────────

    let isValid = false;

    if (signature && mesombDate && mesombNonce) {
      // ✅ Vraie vérification (remplace isValid: true hardcodé)
      const rawPayload = JSON.stringify(payload);
      isValid = this.mesombService.verifyWebhookSignature(
        rawPayload,
        signature,
        mesombDate,
        mesombNonce,
      );

      if (!isValid) {
        this.logger.warn(
          `Webhook MeSomb signature invalide. sig=${signature?.substring(0, 12)}... date=${mesombDate}`,
        );
      }
    } else {
      // En développement, accepter sans signature pour les tests
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        this.logger.warn('Webhook sans signature accepté en mode développement.');
        isValid = true;
      } else {
        this.logger.warn('Webhook sans signature rejeté en production.');
        isValid = false;
      }
    }

    // ─── Enregistrer le webhook en base ──────────────────────────────────

    const webhookLog = await this.prisma.webhookLog.create({
      data: {
        provider: 'MESOMB',
        event: payload.status || 'PAYMENT',
        payload,
        signature: signature || null,
        isValid,          // ✅ Maintenant reflète la vraie vérification
        isProcessed: false,
      },
    });

    // En production, rejeter les webhooks invalides sans les traiter
    if (!isValid && process.env.NODE_ENV === 'production') {
      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { isProcessed: true, processingError: 'Signature invalide' },
      });
      return { received: true, processed: false };
    }

    // ─── Traitement du payload (inchangé) ────────────────────────────────

    try {
      const { pk: providerReference, status, reference } = payload;

      if (!providerReference) {
        this.logger.warn('MeSomb webhook without pk (providerReference)');
        return { received: true };
      }

      const transaction = await this.prisma.transaction.findFirst({
        where: {
          OR: [{ providerReference }, { idempotencyKey: reference }],
        },
        include: {
          votes: { select: { id: true, candidateId: true } },
        },
      });

      if (!transaction) {
        this.logger.warn(`No transaction found for providerReference: ${providerReference}`);
        await this.prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: { isProcessed: true, processingError: 'Transaction not found' },
        });
        return { received: true };
      }

      if (status === 'SUCCESS' && transaction.status !== 'COMPLETED') {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'COMPLETED', webhookReceived: true, webhookData: payload },
        });

        if (transaction.type === 'VOTE' && transaction.votes.length > 0) {
          await this.paymentService.confirmVotes(
            transaction.votes.map((v) => v.id),
            transaction.id,
          );
          this.logger.log(`Votes confirmed via webhook for transaction ${transaction.id}`);
        } else if (transaction.type === 'REGISTRATION') {
          const regPayment = await this.prisma.candidateRegistrationPayment.findFirst({
            where: { userId: transaction.userId },
            include: { candidate: true },
          });
          if (regPayment?.candidate) {
            await this.prisma.candidate.update({
              where: { id: regPayment.candidate.id },
              data: { status: 'ACTIVE' },
            });
            this.logger.log(`Candidate ${regPayment.candidate.id} activated via webhook`);
          }
        }
      } else if (status === 'FAILED' && transaction.status !== 'FAILED') {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED', webhookReceived: true, webhookData: payload },
        });
      }

      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { isProcessed: true },
      });

      return { received: true, processed: true };
    } catch (error: any) {
      this.logger.error('Error processing MeSomb webhook:', error);
      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          isProcessed: false,
          processingError: this.configService.get('NODE_ENV') === 'production' ? 'Processing error' : error.message,
        },
      });
      return { received: true, processed: false };
    }
  }

  // ─── getLogs (inchangé) ──────────────────────────────────────────────────

  async getLogs(params: {
    page: number;
    limit: number;
    processed?: boolean;
    provider?: string;
  }) {
    const { page, limit, processed, provider } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (processed !== undefined) where.isProcessed = processed;
    if (provider) where.provider = provider;

    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookLog.count({ where }),
    ]);

    return {
      data: logs.map((l) => ({
        id: l.id,
        provider: l.provider,
        event: l.event,
        payload: l.payload,
        status: l.isProcessed ? 'SUCCESS' : l.processingError ? 'FAILED' : 'PENDING',
        error: l.processingError,
        receivedAt: l.createdAt,
        isValid: l.isValid,
        isProcessed: l.isProcessed,
        processingError: l.processingError,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── getLog (inchangé) ───────────────────────────────────────────────────

  async getLog(id: string) {
    const log = await this.prisma.webhookLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Log webhook introuvable.');
    return log;
  }

  // ─── retryWebhook (inchangé) ─────────────────────────────────────────────

  async retryWebhook(id: string) {
    const log = await this.prisma.webhookLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Log webhook introuvable.');
    // En retry, on ne passe pas les headers (non disponibles) → sera accepté en dev
    return this.processMesombWebhook(log.payload, log.signature || undefined);
  }
}