import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(private prisma: PrismaService) {}

  // Génère ou récupère le code de parrainage d'un user
  async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (user.referralCode) return user.referralCode;

    const code = uuidv4().split('-')[0].toUpperCase(); // Ex: A3F9B2C1
    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
    return code;
  }

  // Appelé lors de l'inscription avec un code parrain
  async processReferral(newUserId: string, referralCode: string): Promise<void> {
    try {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode },
      });

      if (!referrer || referrer.id === newUserId) return;

      // Vérifier que ce user n'a pas déjà un parrain
      const existing = await this.prisma.referral.findUnique({
        where: { referredId: newUserId },
      });
      if (existing) return;

      // Créer le parrainage
      const referral = await this.prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: newUserId,
          bonusAmount: 50,
          bonusPaid: false,
        },
      });

      // Créditer le wallet du parrain
      await this.creditWallet(referrer.id, 50, 'REFERRAL_BONUS', referral.id);

      this.logger.log(`Referral processed: ${referrer.email} → +50 FCFA`);
    } catch (e) {
      this.logger.error('processReferral error:', e);
    }
  }

  // Crédite le wallet d'un user
  async creditWallet(
    userId: string,
    amount: number,
    type: string,
    referenceId?: string,
  ): Promise<void> {
    // Crée le wallet si inexistant
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0 },
      });
    }

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount,
          description: type === 'REFERRAL_BONUS'
            ? `+${amount} FCFA — Bonus parrainage`
            : `${amount} FCFA — Vote`,
          referenceId,
        },
      }),
    ]);
  }

  // Débite le wallet (pour voter avec les crédits)
  async debitWallet(userId: string, amount: number, referenceId?: string): Promise<boolean> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < amount) return false;

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'VOTE_DEBIT',
          amount: -amount,
          description: `-${amount} FCFA — Vote payé avec crédits`,
          referenceId,
        },
      }),
    ]);
    return true;
  }

  // Stats de parrainage pour un user
  async getReferralStats(userId: string) {
    const code = await this.getOrCreateReferralCode(userId);
    const frontendUrl = process.env.FRONTEND_URL || 'https://spotlight-lover-v1.vercel.app';

    const [referrals, wallet] = await Promise.all([
      this.prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referred: { select: { firstName: true, lastName: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wallet.findUnique({ where: { userId } }),
    ]);

    return {
      referralCode: code,
      referralLink: `${frontendUrl}/register?ref=${code}`,
      totalReferrals: referrals.length,
      totalEarned: referrals.length * 50,
      walletBalance: wallet?.balance || 0,
      referrals: referrals.map(r => ({
        name: `${r.referred.firstName || ''} ${r.referred.lastName || ''}`.trim() || 'Anonyme',
        date: r.createdAt,
        bonus: r.bonusAmount,
      })),
    };
  }

  // Historique wallet
  async getWalletHistory(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    return {
      balance: wallet?.balance || 0,
      transactions: wallet?.transactions || [],
    };
  }
}
