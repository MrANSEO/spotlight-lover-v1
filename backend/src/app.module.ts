import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { CandidatesModule } from './candidates/candidates.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';
import { EmailModule } from './mails/email.module';
import { VideoModule } from './upload/video.module';
import { UsersModule } from './users/users.module';
import { ContestModule } from './contest/contest.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { PaymentModule } from './payments/payment.module';
import { VotesModule } from './votes/votes.module';
import { WebhooksModule } from './webhooks/webhooks.module';

// ✅ NOUVEAUX imports
import { SettingsModule } from './settings/settings.module';
import { MaintenanceGuard } from './common/guards/maintenance.guard';
import { PrismaService } from './prisma.service';
import { ReferralModule } from './referral/referral.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    EmailModule,
    AuthModule,
    CandidatesModule,
    LeaderboardModule,
    AnalyticsModule,
    HealthModule,
    VideoModule,
    UsersModule,
    ContestModule,
    AuditLogsModule,
    PaymentModule,
    VotesModule,
    WebhooksModule,
    SettingsModule, // ✅ NOUVEAU
    ReferralModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    PrismaService, // ✅ NOUVEAU (requis par MaintenanceGuard)
    { provide: APP_GUARD, useClass: MaintenanceGuard }, // ✅ NOUVEAU
  ],
})
export class AppModule {}
