// src/mails/email.service.ts — VERSION COMPLÈTE ET FINALE
// Remplace intégralement ton fichier existant.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: parseInt(this.configService.get('SMTP_PORT', '587')),
      secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  // ─── Helper : enveloppe HTML commune ────────────────────────────────────

  private wrap(headerColor: string, headerContent: string, bodyContent: string): string {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:${headerColor};padding:32px;text-align:center;">${headerContent}</td></tr>
<tr><td style="padding:40px;">${bodyContent}</td></tr>
<tr><td style="background:#f9fafb;padding:20px;text-align:center;">
<p style="color:#9ca3af;font-size:12px;margin:0;">© ${year} SpotLightLover — Tous droits réservés</p>
</td></tr>
</table></td></tr></table></body></html>`;
  }

  private get from(): string {
    return `"SpotLightLover 🎬" <${this.configService.get('SMTP_FROM', 'noreply@spotlightlover.com')}>`;
  }

  private get frontendUrl(): string {
    return this.configService.get('FRONTEND_URL', 'http://localhost:5173');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTHODES EXISTANTES (conservées à l'identique)
  // ═══════════════════════════════════════════════════════════════════════

  async sendVerificationEmail(email: string, token: string, firstName?: string) {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`;
    const name = firstName || 'cher utilisateur';
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '✅ Confirmez votre email — SpotLightLover',
        html: this.wrap(
          'linear-gradient(135deg,#7c3aed,#ec4899)',
          `<h1 style="color:#fff;margin:0;font-size:28px;font-weight:bold;">🎬 SpotLightLover</h1>
           <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">La plateforme de concours vidéo</p>`,
          `<h2 style="color:#1f2937;font-size:22px;margin:0 0 16px;">Bienvenue, ${name} ! 👋</h2>
           <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">
             Merci de vous être inscrit sur SpotLightLover.<br>
             Cliquez sur le bouton ci-dessous pour confirmer votre adresse email.
           </p>
           <div style="text-align:center;margin:32px 0;">
             <a href="${verifyUrl}" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">✅ Confirmer mon email</a>
           </div>
           <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;text-align:center;">
             Ce lien expire dans <strong>24 heures</strong>.<br>
             Si vous n'avez pas créé de compte, ignorez cet email.
           </p>
           <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
           <p style="color:#9ca3af;font-size:12px;margin:0;">Ou copiez ce lien : <span style="color:#7c3aed;word-break:break-all;">${verifyUrl}</span></p>`,
        ),
        text: `Bonjour ${name},\n\nCliquez sur ce lien pour vérifier votre email :\n${verifyUrl}\n\nLe lien expire dans 24 heures.`,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
    }
  }

  async sendPasswordResetEmail(email: string, token: string, firstName?: string) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    const name = firstName || 'cher utilisateur';
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '🔑 Réinitialisation de votre mot de passe — SpotLightLover',
        html: this.wrap(
          'linear-gradient(135deg,#7c3aed,#ec4899)',
          `<h1 style="color:#fff;margin:0;font-size:28px;">🎬 SpotLightLover</h1>`,
          `<h2 style="color:#1f2937;font-size:22px;margin:0 0 16px;">Réinitialisation du mot de passe 🔑</h2>
           <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Bonjour ${name},<br><br>Vous avez demandé à réinitialiser votre mot de passe.</p>
           <div style="text-align:center;margin:32px 0;">
             <a href="${resetUrl}" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">🔑 Réinitialiser mon mot de passe</a>
           </div>
           <p style="color:#ef4444;font-size:13px;text-align:center;margin:0 0 16px;">⏰ Ce lien expire dans <strong>1 heure</strong>.</p>
           <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>`,
        ),
        text: `Bonjour ${name},\n\nLien de réinitialisation :\n${resetUrl}\n\nExpire dans 1 heure.`,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  async sendPaymentConfirmationEmail(
    email: string,
    firstName: string,
    type: 'VOTE' | 'REGISTRATION',
    amount: number,
    details: { candidateName?: string; quantity?: number },
  ) {
    const subject = type === 'VOTE'
      ? `✅ Vos ${details.quantity} vote(s) sont confirmés — SpotLightLover`
      : '✅ Votre inscription candidat est confirmée — SpotLightLover';
    const message = type === 'VOTE'
      ? `Votre paiement de <strong>${amount} FCFA</strong> a été reçu.<br><strong>${details.quantity} vote(s)</strong> ont été attribués à <strong>${details.candidateName}</strong>.`
      : `Votre paiement d'inscription de <strong>${amount} FCFA</strong> a été reçu.<br>Votre compte candidat est maintenant <strong>actif</strong>. Vous pouvez uploader votre vidéo !`;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject,
        html: this.wrap(
          'linear-gradient(135deg,#7c3aed,#ec4899)',
          `<h1 style="color:#fff;margin:0;font-size:28px;">🎬 SpotLightLover</h1>`,
          `<h2 style="color:#16a34a;font-size:22px;margin:0 0 16px;">✅ Paiement confirmé !</h2>
           <p style="color:#4b5563;font-size:16px;line-height:1.8;margin:0 0 24px;">Bonjour <strong>${firstName}</strong>,<br><br>${message}</p>
           <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;">
             <p style="color:#16a34a;margin:0;font-size:14px;">Merci pour votre soutien à SpotLightLover ! 🎉</p>
           </div>`,
        ),
      });
      this.logger.log(`Payment confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send payment confirmation to ${email}:`, error);
    }
  }

  async sendSuspensionEmail(email: string, firstName: string, reason?: string) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '⚠️ Votre compte a été suspendu — SpotLightLover',
        html: this.wrap(
          '#dc2626',
          `<h1 style="color:#fff;margin:0;font-size:28px;">🎬 SpotLightLover</h1>`,
          `<h2 style="color:#dc2626;font-size:22px;margin:0 0 16px;">⚠️ Compte suspendu</h2>
           <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">
             Bonjour <strong>${firstName}</strong>,<br><br>
             Votre compte candidat a été suspendu par notre équipe de modération.
             ${reason ? `<br><br><strong>Raison :</strong> ${reason}` : ''}
           </p>
           <p style="color:#9ca3af;font-size:13px;margin:0;">Pour contester cette décision, contactez notre support.</p>`,
        ),
      });
    } catch (error) {
      this.logger.error(`Failed to send suspension email to ${email}:`, error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NOUVELLES MÉTHODES — Résultats du concours
  //
  // Règle business précisée :
  //   - Le 1er  → reçoit sendWinnerNotificationEmail()    (avec montant du prix)
  //   - Le 2ème → reçoit sendTop3NotificationEmail(2)     (position sans prix)
  //   - Le 3ème → reçoit sendTop3NotificationEmail(3)     (position sans prix)
  //   - Tous les votants → reçoivent sendContestClosedEmailToVoters()
  //   - Tous les candidats → reçoivent sendContestClosedEmailToCandidate()
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * UNIQUEMENT pour le 1er : il gagne le prix en FCFA.
   */
  async sendWinnerNotificationEmail(
    email: string,
    firstName: string,
    stageName: string,
    totalVotes: number,
    prizeAmount: number,
  ) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '🥇 Tu as gagné le concours SpotLightLover !',
        html: this.wrap(
          'linear-gradient(135deg,#f59e0b,#7c3aed)',
          `<p style="font-size:64px;margin:0;">🥇</p>
           <h1 style="color:#fff;margin:8px 0 0;font-size:26px;">Félicitations ${firstName} !</h1>
           <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:14px;">Tu remportes le concours SpotLightLover</p>`,
          `<div style="background:#faf5ff;border:2px solid #c4b5fd;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
             <p style="margin:0;color:#6b7280;font-size:13px;">Nom de scène</p>
             <p style="margin:6px 0 20px;color:#7c3aed;font-size:24px;font-weight:bold;">${stageName}</p>
             <div style="background:#7c3aed;border-radius:8px;padding:12px 24px;display:inline-block;">
               <p style="margin:0;color:#e9d5ff;font-size:12px;">Votes reçus</p>
               <p style="margin:4px 0 0;color:#fff;font-size:28px;font-weight:bold;">${totalVotes.toLocaleString('fr-FR')}</p>
             </div>
             <div style="margin-top:24px;padding-top:24px;border-top:1px solid #c4b5fd;">
               <p style="margin:0;color:#6b7280;font-size:13px;">Prix remporté</p>
               <p style="margin:6px 0 0;color:#7c3aed;font-size:36px;font-weight:bold;">${prizeAmount.toLocaleString('fr-FR')} FCFA</p>
             </div>
           </div>
           <p style="color:#4b5563;text-align:center;line-height:1.6;font-size:15px;margin-bottom:24px;">
             Notre équipe te contactera dans les prochaines <strong>48 heures</strong> pour le versement via Mobile Money.
           </p>
           <div style="text-align:center;">
             <a href="${this.frontendUrl}/results" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;display:inline-block;">Voir les résultats officiels</a>
           </div>`,
        ),
      });
      this.logger.log(`Winner email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send winner email to ${email}:`, error);
    }
  }

  /**
   * Pour le 2ème et le 3ème : félicitations pour la position, PAS de prix.
   * Encouragement à revenir au prochain concours.
   */
  async sendTop3NotificationEmail(
    email: string,
    firstName: string,
    stageName: string,
    position: 2 | 3,
    totalVotes: number,
  ) {
    const medals: Record<number, string> = { 2: '🥈', 3: '🥉' };
    const labels: Record<number, string> = { 2: '2ème', 3: '3ème' };
    const medal = medals[position];
    const label = labels[position];
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: `${medal} Tu termines ${label} du concours SpotLightLover !`,
        html: this.wrap(
          'linear-gradient(135deg,#7c3aed,#ec4899)',
          `<p style="font-size:64px;margin:0;">${medal}</p>
           <h1 style="color:#fff;margin:8px 0 0;font-size:24px;">Bravo ${firstName} !</h1>
           <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:14px;">Tu termines ${label} du concours</p>`,
          `<div style="background:#faf5ff;border:2px solid #c4b5fd;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
             <p style="margin:0;color:#6b7280;font-size:13px;">Nom de scène</p>
             <p style="margin:6px 0 16px;color:#7c3aed;font-size:22px;font-weight:bold;">${stageName}</p>
             <p style="margin:0;color:#6b7280;font-size:13px;">Votes reçus</p>
             <p style="margin:4px 0 0;color:#1f2937;font-size:28px;font-weight:bold;">${totalVotes.toLocaleString('fr-FR')}</p>
           </div>
           <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
             <p style="margin:0;color:#c2410c;font-size:14px;font-weight:600;">Le prochain concours arrive bientôt !</p>
             <p style="margin:6px 0 0;color:#9a3412;font-size:13px;">Continue à te préparer — la 1ère place t'attend au prochain concours.</p>
           </div>
           <div style="text-align:center;">
             <a href="${this.frontendUrl}/results" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;display:inline-block;">Voir les résultats officiels</a>
           </div>`,
        ),
      });
      this.logger.log(`Top3 email sent to ${email} (position ${position})`);
    } catch (error) {
      this.logger.error(`Failed to send top3 email to ${email}:`, error);
    }
  }

  /**
   * Pour tous les votants : résumé du concours avec top 3.
   */
  async sendContestClosedEmailToVoters(
    email: string,
    firstName: string,
    totalVotes: number,
    totalRevenue: number,
    top3: { rank: number; stageName: string; votes: number }[],
  ) {
    const medals = ['🥇', '🥈', '🥉'];
    const rows = top3.map((c, i) =>
      `<tr><td style="padding:12px;text-align:center;font-size:20px;">${medals[i]}</td>
       <td style="padding:12px;color:#1f2937;font-weight:600;">${c.stageName}</td>
       <td style="padding:12px;text-align:right;color:#7c3aed;font-weight:bold;">${c.votes.toLocaleString('fr-FR')} votes</td></tr>`
    ).join('');
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '🏆 Le concours SpotLightLover est terminé — Voici les résultats !',
        html: this.wrap(
          'linear-gradient(135deg,#7c3aed,#ec4899)',
          `<h1 style="color:#fff;margin:0;font-size:28px;">🏆 SpotLightLover</h1>
           <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Le concours est terminé !</p>`,
          `<h2 style="color:#1f2937;font-size:20px;margin:0 0 8px;">Bonjour ${firstName},</h2>
           <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 24px;">Merci d'avoir voté ! Voici le classement final.</p>
           <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:14px;margin-bottom:24px;">
             <tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;">
               <th style="padding:12px;text-align:center;color:#6b7280;">Médaille</th>
               <th style="padding:12px;text-align:left;color:#6b7280;">Candidat</th>
               <th style="padding:12px;text-align:right;color:#6b7280;">Votes</th>
             </tr>${rows}
           </table>
           <div style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
             <p style="color:#6b7280;font-size:13px;margin:0;">
               Total : <strong>${totalVotes.toLocaleString('fr-FR')} votes</strong> —
               Revenus : <strong>${totalRevenue.toLocaleString('fr-FR')} FCFA</strong>
             </p>
           </div>
           <div style="text-align:center;">
             <a href="${this.frontendUrl}/results" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;display:inline-block;">Voir les résultats complets</a>
           </div>`,
        ),
      });
      this.logger.log(`Contest closed email sent to voter ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send contest closed email to voter ${email}:`, error);
    }
  }

  /**
   * Pour les candidats actifs lors de la clôture automatique (scheduler).
   * Chaque candidat reçoit son propre classement.
   */
  async sendContestClosedEmailToCandidate(
    email: string,
    firstName: string,
    stageName: string,
    rank: number | null,
    totalVotes: number,
  ) {
    const rankText = rank
      ? `Tu termines à la <strong>${rank}ème place</strong>.`
      : 'Le classement final sera publié prochainement.';
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '🎬 Le concours SpotLightLover est terminé — Ton classement',
        html: this.wrap(
          'linear-gradient(135deg,#7c3aed,#ec4899)',
          `<h1 style="color:#fff;margin:0;font-size:28px;">🎬 SpotLightLover</h1>
           <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Le concours est terminé</p>`,
          `<h2 style="color:#1f2937;font-size:20px;margin:0 0 16px;">Bonjour ${firstName},</h2>
           <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 24px;">Le concours SpotLightLover est maintenant terminé. Merci d'avoir participé !</p>
           <div style="background:#faf5ff;border:2px solid #c4b5fd;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
             <p style="margin:0;color:#6b7280;font-size:13px;">Nom de scène</p>
             <p style="margin:4px 0 16px;color:#7c3aed;font-size:20px;font-weight:bold;">${stageName}</p>
             <p style="margin:0;color:#6b7280;font-size:13px;">Votes reçus</p>
             <p style="margin:4px 0 16px;color:#1f2937;font-size:28px;font-weight:bold;">${totalVotes.toLocaleString('fr-FR')}</p>
             <p style="margin:0;color:#4b5563;font-size:14px;">${rankText}</p>
           </div>
           <div style="text-align:center;">
             <a href="${this.frontendUrl}/results" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;display:inline-block;">Voir les résultats</a>
           </div>`,
        ),
      });
      this.logger.log(`Contest closed email sent to candidate ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send contest closed email to candidate ${email}:`, error);
    }
  }
}