import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
  // Enable CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:5173',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Spotlight Lover API')
    .setDescription('Plateforme de concours vidéo monétisé')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = configService.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Backend running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
