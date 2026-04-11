# 🚀 Guide de Déploiement Sécurisé — SpotLightLover

**Version:** 1.0  
**Date:** 11 Avril 2026  
**Target:** Production (Railway/AWS/GCP)

---

## 1️⃣ Préparation de l'Environnement

### Variables d'Environnement Critiques

Créer un fichier `.env.production` (NE JAMAIS committer):

```env
# === CORE ===
NODE_ENV=production
PORT=3000
APP_URL=https://api.spotlightlover.cm

# === DATABASE ===
DATABASE_URL=postgresql://user:password@db.railway.app:5432/spotlight
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=300

# === JWT & AUTH ===
JWT_SECRET=<generate-256-bit-random>
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# === GOOGLE OAUTH ===
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=https://api.spotlightlover.cm/auth/google/callback

# === PAYMENTS (MeSomb) ===
MESOMB_APP_KEY=xxx
MESOMB_APP_SECRET=xxx
MESOMB_SERVICE_USER_ID=xxx
MESOMB_SERVICE_USER_PASSWORD=xxx

# === STORAGE (Cloudinary) ===
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLOUDINARY_UPLOAD_PRESET=xxx

# === SECURITY ===
CORS_ORIGINS=https://spotlightlover.cm,https://www.spotlightlover.cm
HSTS_MAX_AGE=31536000
RATE_LIMIT_WINDOW_MS=1000
RATE_LIMIT_MAX_REQUESTS=10

# === EMAIL (Optionnel pour notifications) ===
SENDGRID_API_KEY=xxx
ADMIN_EMAIL=admin@spotlightlover.cm

# === MONITORING ===
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info
ENVIRONMENT=production
```

### Générer JWT_SECRET Sécurisé

```bash
# Méthode 1: OpenSSL
openssl rand -base64 32

# Méthode 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Résultat: Copier dans JWT_SECRET
```

---

## 2️⃣ Déploiement sur Railway

### Connecter la Repository

```bash
# 1. Créer un nouveau projet Railway
# https://railway.app/new

# 2. Connecter GitHub
# Select: SPOTLIGHT-LOVER repository

# 3. Configuration automatique
# Railway détecte Dockerfile et docker-compose.yml
```

### Configurer les Variables d'Environnement

```bash
# Sur le dashboard Railway:
# Settings → Environment Variables

# Ajouter depuis .env.production
# Remplacer les valeurs sensibles
```

### Configurer PostgreSQL

```bash
# Railway → Add Service → PostgreSQL
# Generate DATABASE_URL automatiquement

# Vérifier la connection:
# psql $DATABASE_URL -c "SELECT 1"
```

### Configurer Redis (Optionnel pour Caching)

```bash
# Railway → Add Service → Redis
# Copier REDIS_URL dans variables
```

### Deploy

```bash
# 1. Push changes to main
git push origin main

# 2. Railway détecte le push
# Builds automatiquement

# 3. Voir les logs
railway logs
```

---

## 3️⃣ Déploiement sur AWS (ECS + RDS)

### Architecture

```
                    ┌─────────────────┐
                    │  Route 53       │
                    │  (DNS)          │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ CloudFront      │
                    │ + WAF           │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ ALB (Port 443)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ ECS Cluster     │
                    │ (backend pods)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼────┐          ┌───▼────┐          ┌───▼────┐
    │ RDS    │          │ ElastiC│          │ S3     │
    │PostgreS│          │ache    │          │(videos)│
    └────────┘          └────────┘          └────────┘
```

### Setup ECS

```bash
# 1. Créer ECR Repository
aws ecr create-repository --repository-name spotlight-backend

# 2. Build & Push Docker Image
docker build -t spotlight-backend:latest .
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
docker tag spotlight-backend:latest $ECR_REGISTRY/spotlight-backend:latest
docker push $ECR_REGISTRY/spotlight-backend:latest

# 3. Créer ECS Task Definition
# File: ecs-task-definition.json
{
  "family": "spotlight-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "$ECR_REGISTRY/spotlight-backend:latest",
      "portMappings": [{"containerPort": 3000}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
      ]
    }
  ]
}

# 4. Register Task Definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# 5. Create ECS Service
aws ecs create-service \
  --cluster spotlight \
  --service-name backend \
  --task-definition spotlight-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### RDS PostgreSQL Setup

```bash
# 1. Créer RDS Instance
aws rds create-db-instance \
  --db-instance-identifier spotlight-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --allocated-storage 20 \
  --master-username admin \
  --master-user-password $(openssl rand -base64 32) \
  --publicly-accessible false \
  --storage-encrypted true \
  --backup-retention-period 30

# 2. Activer Automated Backups
aws rds modify-db-instance \
  --db-instance-identifier spotlight-db \
  --backup-retention-period 30 \
  --apply-immediately

# 3. Vérifier la connection
psql -h spotlight-db.xxx.rds.amazonaws.com -U admin -d spotlight
```

### ALB (Application Load Balancer)

```bash
# 1. Créer ALB
aws elbv2 create-load-balancer \
  --name spotlight-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# 2. Ajouter HTTPS Listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...

# 3. Configurer Certificate (ACM)
# AWS → Certificate Manager → Request Certificate
# Domain: api.spotlightlover.cm, spotlightlover.cm
```

### CloudFront + WAF

```bash
# 1. Créer CloudFront Distribution
# Source: ALB
# Behaviors → Redirect HTTP to HTTPS
# Edge Caching → Minimum TTL: 0, Maximum: 31536000

# 2. Ajouter AWS WAF
# Managed Rules: AWSManagedRulesCommonRuleSet
# Custom Rules: Rate limiting, Geo-blocking
```

---

## 4️⃣ Sécurisation SSL/TLS

### Certificat Let's Encrypt (Auto-renew)

```bash
# Si Certbot est configuré:
certbot renew --quiet --no-eff-email

# Ajouter à cron:
0 3 * * * /usr/bin/certbot renew --quiet --no-eff-email >> /var/log/certbot.log 2>&1
```

### Vérifier SSL Grade

```bash
# Testez votre configuration
https://www.ssllabs.com/ssltest/analyze.html?d=api.spotlightlover.cm
```

---

## 5️⃣ Database Migrations & Backups

### Exécuter Migrations

```bash
# 1. Connecter au serveur production
ssh ubuntu@api.spotlightlover.cm

# 2. Exécuter Prisma migrations
cd /app
npm run prisma:migrate:deploy

# 3. Seed données (si nécessaire)
npm run prisma:seed
```

### Configurer Backups Automatiques

```bash
# Daily backup script:
# /opt/spotlight-backup.sh

#!/bin/bash
BACKUP_DIR="/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="spotlight"

# PostgreSQL backup
pg_dump $DATABASE_URL > $BACKUP_DIR/spotlight_$TIMESTAMP.sql
gzip $BACKUP_DIR/spotlight_$TIMESTAMP.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/spotlight_$TIMESTAMP.sql.gz \
  s3://spotlight-backups/$TIMESTAMP.sql.gz

# Garder 30 jours
find $BACKUP_DIR -mtime +30 -delete

# Ajouter à cron:
# 0 2 * * * /opt/spotlight-backup.sh
```

---

## 6️⃣ Monitoring & Alerting

### Setup Sentry (Error Tracking)

```bash
# 1. Créer account: https://sentry.io

# 2. Créer project: Node.js → NestJS

# 3. Copier DSN dans .env.production
SENTRY_DSN=https://xxx@sentry.io/xxx

# 4. Initialiser dans main.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: configService.get('SENTRY_DSN'),
  environment: 'production',
  tracesSampleRate: 0.1,
});
```

### Setup DataDog (Monitoring)

```bash
# 1. Installer agent
npm install dd-trace

# 2. Initialiser en premier du code
require('dd-trace').init({
  service: 'spotlight-backend',
  env: 'production',
  version: '1.0.0'
});

# 3. Visualiser sur dashboard DataDog
```

### CloudWatch Logs (AWS)

```bash
# Logs sont automatiquement envoyés à CloudWatch si déployé sur ECS

# Visualiser:
aws logs tail /ecs/spotlight-backend --follow

# Configurer alarms:
aws cloudwatch put-metric-alarm \
  --alarm-name spotlight-high-error-rate \
  --metric-name ErrorCount \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## 7️⃣ Health Check & Monitoring

### Endpoint Santé

```bash
# GET /health

# Production response:
{
  "status": "ok",
  "timestamp": "2026-04-11T14:30:00Z",
  "database": "connected",
  "redis": "connected"
}
```

### Configure Health Check sur ALB

```bash
# Target Group → Health Check Settings
# Protocol: HTTP
# Path: /health
# Interval: 30 seconds
# Timeout: 5 seconds
# Healthy Threshold: 2
# Unhealthy Threshold: 3
```

---

## 8️⃣ Performance & Caching

### Redis Caching (Optionnel)

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 300, // 5 minutes
    }),
  ],
})
export class AppModule {}
```

### CDN pour Static Assets

```typescript
// Frontend deployment sur CloudFront
// Images, CSS, JS servis par CDN
// Cache-Control: max-age=31536000 pour versioned assets
```

---

## 9️⃣ Post-Deployment Checklist

```bash
# 1. Vérifier les logs
tail -f /var/log/spotlight/app.log

# 2. Tester health endpoint
curl https://api.spotlightlover.cm/health

# 3. Vérifier les migrations
npm run prisma:migrate:status

# 4. Test payment flow
# Use staging MeSomb credentials first

# 5. Vérifier HSTS headers
curl -I https://api.spotlightlover.cm | grep Strict-Transport-Security

# 6. Vérifier CSP headers
curl -I https://api.spotlightlover.cm | grep Content-Security-Policy

# 7. Test brute-force protection
for i in {1..6}; do
  curl -X POST https://api.spotlightlover.cm/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# Should return 429 (Too Many Requests) after 5 attempts

# 8. Vérifier CORS whitelist
curl -H "Origin: https://spotlightlover.cm" -I https://api.spotlightlover.cm

# 9. Test database connection
psql $DATABASE_URL -c "SELECT NOW();"

# 10. Check certificate validity
openssl s_client -connect api.spotlightlover.cm:443 | grep "Verify return code"
```

---

## 🔟 Rollback Procedure

```bash
# Si quelque chose se passe mal:

# 1. Revert dernière version
git revert HEAD
git push origin main

# 2. Railway / AWS redéploiera automatiquement

# 3. Database: Restore depuis backup
psql $DATABASE_URL < /backups/postgresql/spotlight_backup.sql

# 4. Vérifier les logs
# Railway: railway logs
# AWS: aws logs tail /ecs/spotlight-backend
```

---

## 📊 Métriques à Monitorer

| Métrique | Seuil | Action |
|----------|-------|--------|
| Error Rate | > 1% | Alert + Investigation |
| P95 Latency | > 500ms | Investigate + Optimize |
| Database Connection Pool | > 90% | Scale up |
| CPU Usage | > 80% | Scale up |
| Memory Usage | > 85% | Scale up |
| Failed Payments | > 5% | Investigate MeSomb |
| SSL/TLS Errors | > 0 | Immediate Fix |

---

## 🎯 Conclusion

✅ **Environnement sécurisé**  
✅ **Haute disponibilité**  
✅ **Monitoring complet**  
✅ **Backups automatiques**  
✅ **Rollback rapide**  
✅ **Prêt pour 100k+ utilisateurs**

---

**Support:** devops@spotlightlover.cm  
**Documentation:** https://docs.spotlightlover.cm  
**Status Page:** https://status.spotlightlover.cm
