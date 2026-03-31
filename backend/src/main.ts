import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    rawBody: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  // ─── ✅ Timeout HTTP augmenté pour l'upload vidéo ─────────────────────────
  // Par défaut Node.js = 60s → timeout sur gros fichiers Cloudinary
  const server = app.getHttpServer();
  server.setTimeout(300_000); // 5 minutes

  // ─── Préfixe global API ───────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Sécurité HTTP headers ────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ─── CORS ─────────────────────────────────────────────────────────────────
  const allowedOrigins = config
    .get<string>('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'ngrok-skip-browser-warning',  // ✅ obligatoire pour ngrok
    ],
    credentials: true,
  });

  // ─── Validation globale des DTOs ──────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Swagger (documentation API) ──────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SpotLightLover API')
      .setDescription(
        '🎬 Plateforme de concours vidéo avec vote payant Mobile Money (MeSomb)',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentification et gestion de session')
      .addTag('Payments', 'Paiements Mobile Money via MeSomb')
      .addTag('Webhooks', 'Callbacks MeSomb')
      .addTag('Candidates', 'Gestion des candidats')
      .addTag('Votes', 'Système de vote')
      .addTag('Leaderboard', 'Classement en temps réel')
      .addTag('Analytics', 'Statistiques (Admin)')
      .addTag('Users', 'Gestion utilisateurs (Admin)')
      .addTag('Video', 'Upload vidéo Cloudinary')
      .addTag('Settings', 'Paramètres système (Admin)')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
      },
    });

    console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);

  console.log(`
🚀 SpotLightLover Backend démarré !
📍 URL: http://localhost:${port}/api
🌍 Environnement: ${nodeEnv}
⏱️  Timeout HTTP: 300s (upload vidéo)
💳 MeSomb: ${config.get('MESOMB_APP_KEY') ? '✅ Configuré' : '❌ Non configuré'}
☁️  Cloudinary: ${config.get('CLOUDINARY_API_KEY') ? '✅ Configuré' : '❌ Non configuré'}
🗄️  Database: ${config.get('DATABASE_URL') ? '✅ Configuré' : '❌ Non configuré'}
📧 Email: ${config.get('SMTP_USER') ? '✅ Configuré' : '❌ Non configuré'}
  `);
}

bootstrap();
