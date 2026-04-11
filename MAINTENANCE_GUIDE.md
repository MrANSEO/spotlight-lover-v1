# 🛠️ Guide Maintenance & Monitoring — SpotLightLover

**Version:** 1.0  
**Date:** 11 Avril 2026  
**Audience:** DevOps, Backend Developers, Operations Team

---

## 📅 Calendrier de Maintenance Préventive

### Quotidiennement (Daily)

```bash
# 0. Check system health
./scripts/health-check.sh

# 1. Review error logs
grep ERROR /var/log/spotlight/app.log | tail -20

# 2. Check database connections
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity LIMIT 10;"

# 3. Verify payment processing (MeSomb)
curl -s https://api.spotlightlover.cm/health | jq .

# 4. Check SSL certificate expiry
certbot certificates

# 5. Review suspicious login attempts
SELECT * FROM AuditLog 
WHERE action = 'LOGIN_FAILED' 
AND createdAt > NOW() - INTERVAL '24 hours' 
ORDER BY createdAt DESC;
```

### Hebdomadairement (Weekly)

```bash
# 1. Database VACUUM & ANALYZE
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# 2. Backup verification
# Restore backup to test environment
pg_restore /backups/postgresql/latest.sql -h test-db

# 3. Security updates check
npm audit
docker image ls | grep -E "(spotlight|postgres|redis)"

# 4. Certificate renewal test
certbot renew --dry-run

# 5. Review failed transactions
SELECT * FROM Payment 
WHERE status = 'FAILED' 
AND createdAt > NOW() - INTERVAL '7 days';

# 6. Performance metrics review
# Check P95 latency, error rates, CPU/memory
```

### Mensuellement (Monthly)

```bash
# 1. Full database backup test
pg_dump $DATABASE_URL | gzip > /backups/full-backup-$(date +%Y%m%d).sql.gz

# 2. SSL certificate status review
# Check expiry dates, update if needed

# 3. Dependency updates
npm outdated
npm update --save

# 4. Security audit
npm audit
npx snyk test

# 5. Performance optimization
# Review slow queries in logs
# Check database indexes

# 6. Rotate sensitive credentials
# Regenerate JWT_SECRET (optional, if compromised)
# Update API keys if needed

# 7. Review and update firewall rules
# AWS Security Groups, Cloudflare WAF rules
```

### Trimestriellement (Quarterly)

```bash
# 1. Major version updates
npm update --save --legacy-peer-deps

# 2. Load testing
# Use Apache JMeter or k6 to simulate 10k concurrent users

# 3. Disaster recovery drill
# Test full restoration from backup

# 4. Security assessment
# Re-run OWASP ZAP scan
# Review user access logs

# 5. Capacity planning
# Analyze growth trends
# Plan for scaling needs

# 6. Documentation review
# Update deployment guides
# Update runbooks
```

---

## 🚨 Incident Response Procedures

### Scenario 1: High Error Rate (> 1%)

```bash
#!/bin/bash
# /scripts/incident-high-errors.sh

# 1. Immediate assessment
echo "🔍 Assessing error rate..."
curl -s https://api.spotlightlover.cm/health | jq .

# 2. Check recent logs
tail -100 /var/log/spotlight/app.log | grep ERROR

# 3. Check database health
psql $DATABASE_URL -c "SELECT datname, numbackends FROM pg_stat_database WHERE datname='spotlight';"

# 4. Check memory/CPU
free -h
top -bn1 | head -20

# 5. Possible causes & fixes
# Cause: Database connection pool exhausted
# Fix: Increase DB_POOL_SIZE or restart service
systemctl restart spotlight-backend

# Cause: Memory leak
# Fix: Restart the service
pm2 restart spotlight-backend

# Cause: External API timeout (MeSomb, Cloudinary)
# Fix: Check API status, implement retry logic
curl -I https://www.mesomb.com/api

# 6. Alert team
echo "⚠️ High error rate detected. Investigating..." | \
  slack-notify -c incident-alerts

# 7. Escalate if unresolved after 5 minutes
if [ error_rate > 1% ]; then
  page-on-call "High error rate persisting"
fi
```

### Scenario 2: Database Connection Pool Exhausted

```bash
# 1. Check current connections
psql $DATABASE_URL -c "
  SELECT count(*) as total_connections,
         count(*) FILTER (WHERE state='active') as active,
         count(*) FILTER (WHERE state='idle') as idle
  FROM pg_stat_activity;
"

# 2. Kill idle connections
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state='idle'
  AND query_start < NOW() - INTERVAL '10 minutes';
"

# 3. Increase pool size temporarily
export DB_POOL_SIZE=50
systemctl restart spotlight-backend

# 4. Investigate why pool is exhausted
psql $DATABASE_URL -c "
  SELECT datname, usename, count(*)
  FROM pg_stat_activity
  GROUP BY datname, usename;
"

# 5. Implement query timeout
export DB_CONNECTION_TIMEOUT=30
```

### Scenario 3: Payment Processing Failures

```bash
# 1. Check MeSomb API status
curl -s https://www.mesomb.com/api | jq .
# If down, display maintenance message

# 2. Review failed payments
psql $DATABASE_URL -c "
  SELECT id, userId, amount, status, errorMessage, createdAt
  FROM Payment
  WHERE status = 'FAILED'
  AND createdAt > NOW() - INTERVAL '1 hour'
  ORDER BY createdAt DESC;
"

# 3. Check MeSomb webhook queue
SELECT * FROM WebhookQueue 
WHERE status = 'PENDING' 
AND attempt > 3;

# 4. Retry failed webhooks
UPDATE WebhookQueue 
SET status = 'PENDING', attempt = 0
WHERE status = 'FAILED'
AND createdAt > NOW() - INTERVAL '1 hour';

# 5. Alert MeSomb support
# Email: support@mesomb.com
# Include: Failed payment IDs, timeframes, error messages

# 6. For users who paid but votes not created:
# Manual intervention: Verify payment in MeSomb dashboard
# Create votes manually if confirmed

# 7. Refund if payment failed and user charged
# Contact MeSomb to reverse transaction
```

### Scenario 4: DDoS Attack

```bash
# 1. Enable CloudFlare protection
# Settings → Security → Advanced DDoS Protection

# 2. Check attack characteristics
# Cloudflare Analytics → Traffic
# Is it volumetric? Application-layer?

# 3. Temporary rate limiting
# Cloudflare → Rate Limiting Rules
# 1. Rule: Rate limit all requests from same IP to 10/min
# 2. Rule: Block requests from countries not in whitelist

# 4. Scale infrastructure
# AWS: Auto Scaling Group → increase min/max instances
# Railway: Scale up number of dynos

# 5. Monitor during attack
watch -n 1 'curl -I https://api.spotlightlover.cm'

# 6. Update WAF rules
# Block suspicious User-Agents
# Block requests with suspicious patterns

# 7. Post-attack analysis
# Collect logs: aws logs tail /ecs/spotlight-backend
# Identify attack sources
# Add permanent blocks if needed
```

### Scenario 5: Security Breach (Suspected)

```bash
# ⚠️ CRITICAL INCIDENT - FOLLOW EXACTLY

# 1. IMMEDIATELY rotate all secrets
export NEW_JWT_SECRET=$(openssl rand -base64 32)
export NEW_DATABASE_PASSWORD=$(openssl rand -base64 32)
export NEW_GOOGLE_CLIENT_SECRET=xxx

# 2. Invalidate all existing JWT tokens
UPDATE Session SET expiresAt = NOW();

# 3. Force password reset for all users
UPDATE User SET passwordResetRequired = true;

# 4. Review audit logs for unauthorized access
SELECT * FROM AuditLog 
ORDER BY createdAt DESC 
LIMIT 1000;

# 5. Check payment transactions for fraud
SELECT * FROM Payment 
WHERE status = 'SUCCESS'
AND createdAt > (SELECT MAX(createdAt) FROM Payment WHERE status = 'FAILED')
AND userId IN (SELECT userId FROM User WHERE passwordResetRequired = true);

# 6. Notify affected users
INSERT INTO Notification (userId, title, message, type)
SELECT id, 'Security Alert', 
  'Your account was affected. Please reset password immediately.', 
  'SECURITY_ALERT'
FROM User WHERE passwordResetRequired = true;

# 7. Document incident
cat > /incidents/$(date +%Y%m%d-%H%M%S)-breach.log << EOF
Time: $(date)
Type: Security Breach
Actions taken: Rotated secrets, invalidated tokens, reset passwords
Affected users: $(psql $DATABASE_URL -tc "SELECT COUNT(*) FROM User WHERE passwordResetRequired = true;")
EOF

# 8. Alert security team
escalate-to-ciso "CRITICAL: Potential security breach detected"

# 9. Contact legal/compliance
# Prepare user notification (required by law in many jurisdictions)

# 10. Review WAF logs for exploit patterns
aws wafv2 describe-logging-configuration
```

---

## 📊 Monitoring Dashboard (Prometheus/Grafana)

### Métriques à Tracker

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'spotlight-backend'
    static_configs:
      - targets: ['localhost:3000/metrics']
    metrics_path: '/metrics'

  - job_name: 'database'
    static_configs:
      - targets: ['localhost:9187']  # postgres_exporter

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']  # redis_exporter
```

### Custom Metrics

```typescript
// metrics.service.ts
import { Gauge, Counter, Histogram } from 'prom-client';

export class MetricsService {
  // Gauges
  activeUsers = new Gauge({
    name: 'spotlight_active_users',
    help: 'Number of active users',
  });

  // Counters
  loginAttempts = new Counter({
    name: 'spotlight_login_attempts',
    help: 'Total login attempts',
    labelNames: ['status'], // success, failed
  });

  paymentCounter = new Counter({
    name: 'spotlight_payments',
    help: 'Total payments processed',
    labelNames: ['status'], // success, failed
  });

  // Histograms (for latency)
  apiLatency = new Histogram({
    name: 'spotlight_api_latency_ms',
    help: 'API endpoint latency',
    labelNames: ['endpoint', 'method'],
  });

  voteLatency = new Histogram({
    name: 'spotlight_vote_latency_ms',
    help: 'Vote processing time',
  });
}
```

### Grafana Alerts

```json
{
  "alert": "HighErrorRate",
  "condition": "B",
  "data": [
    {
      "refId": "B",
      "expression": "A > 0.01",
      "condition": "gt",
      "reducer": "avg",
      "threshold": 0.01
    }
  ],
  "for": "5m",
  "message": "Error rate exceeds 1% for 5 minutes",
  "noDataState": "NoData"
}
```

---

## 🔐 Security Monitoring

### Failed Login Attempts

```sql
-- View failed login attempts
SELECT 
  userId,
  COUNT(*) as failed_attempts,
  MAX(createdAt) as last_attempt,
  EXTRACT(EPOCH FROM (NOW() - MAX(createdAt))) as seconds_ago
FROM AuditLog
WHERE action = 'LOGIN_FAILED'
AND createdAt > NOW() - INTERVAL '1 hour'
GROUP BY userId
HAVING COUNT(*) > 3
ORDER BY failed_attempts DESC;

-- Alert if > 100 failed attempts in 1 hour
SELECT COUNT(*) as total_failures
FROM AuditLog
WHERE action = 'LOGIN_FAILED'
AND createdAt > NOW() - INTERVAL '1 hour';
-- If > 100, trigger alert
```

### Suspicious Payment Patterns

```sql
-- Unusually high payments from single user
SELECT 
  userId,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  MAX(amount) as max_amount
FROM Payment
WHERE status = 'SUCCESS'
AND createdAt > NOW() - INTERVAL '24 hours'
GROUP BY userId
HAVING SUM(amount) > 10000 OR COUNT(*) > 100;

-- Multiple payments from same IP in short time
SELECT 
  ip_address,
  COUNT(*) as payment_count,
  COUNT(DISTINCT userId) as unique_users
FROM Payment p
JOIN AuditLog a ON p.id = a.resourceId
WHERE a.createdAt > NOW() - INTERVAL '10 minutes'
GROUP BY ip_address
HAVING COUNT(*) > 10;
```

### SQL Injection Attempts

```sql
-- Check request logs for SQL patterns
-- (This would be in application logs or WAF logs)
grep -E "('|\"|\-\-|/\*|;|UNION|SELECT|DROP)" /var/log/spotlight/requests.log | \
  tee -a /var/log/spotlight/security-incidents.log

-- Block these IPs at WAF level
```

---

## 📈 Performance Optimization Queries

### Find Slow Queries

```sql
-- PostgreSQL slow query log
-- In postgresql.conf:
-- log_min_duration_statement = 1000  # Log queries > 1 second

-- View slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

-- Identify missing indexes
SELECT schemaname, tablename, attname, null_frac, avg_width, n_distinct
FROM pg_stats
WHERE null_frac > 0.5  -- Might need filtering
ORDER BY schemaname, tablename;
```

### Database Optimization

```sql
-- Add missing indexes
CREATE INDEX idx_payment_user_id ON Payment(userId);
CREATE INDEX idx_payment_status_date ON Payment(status, createdAt);
CREATE INDEX idx_vote_candidate_date ON Vote(candidateId, createdAt);

-- Optimize leaderboard query (run daily)
REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_view;

-- Analyze table statistics
ANALYZE Payment;
ANALYZE Vote;
ANALYZE User;
```

---

## 🔄 Rolling Deployment Strategy

```bash
#!/bin/bash
# /scripts/deploy-rolling.sh

set -e

BLUE_VERSION="v1.0.0"
GREEN_VERSION="v1.0.1"
ACTIVE="BLUE"

echo "🚀 Rolling deployment: $BLUE_VERSION → $GREEN_VERSION"

# 1. Build new version
docker build -t spotlight-backend:$GREEN_VERSION .

# 2. Start GREEN in background
docker run -d \
  --name spotlight-green \
  -p 3001:3000 \
  -e NODE_ENV=production \
  --env-file .env.production \
  spotlight-backend:$GREEN_VERSION

# 3. Wait for GREEN to be healthy
for i in {1..30}; do
  if curl -f http://localhost:3001/health > /dev/null; then
    echo "✅ GREEN is healthy"
    break
  fi
  echo "⏳ Waiting for GREEN... ($i/30)"
  sleep 2
done

# 4. Run smoke tests against GREEN
./scripts/smoke-tests.sh http://localhost:3001 || {
  echo "❌ Smoke tests failed. Rolling back..."
  docker stop spotlight-green
  exit 1
}

# 5. Switch traffic from BLUE to GREEN
# Update load balancer or reverse proxy
sed -i 's/:3000/:3001/g' /etc/nginx/nginx.conf
nginx -t && systemctl reload nginx

# 6. Stop BLUE
docker stop spotlight-blue
docker rm spotlight-blue

# 7. Rename GREEN → BLUE
docker rename spotlight-green spotlight-blue

# 8. Verify new version
for i in {1..5}; do
  if curl -f https://api.spotlightlover.cm/health > /dev/null; then
    echo "✅ Deployment successful!"
    break
  fi
  sleep 1
done

echo "✅ Rolling deployment complete"
```

---

## 📞 Escalation & Contact Procedures

```
Level 1 — Automated Monitoring
├─ Sentry alerts → Slack #incidents
├─ CloudWatch alarms → SMS to on-call
└─ DataDog monitors → PagerDuty

Level 2 — On-Call Engineer (5 min)
├─ Acknowledge incident
├─ Assess severity (P1/P2/P3)
└─ Implement immediate fix if known

Level 3 — Engineering Manager (15 min)
├─ Coordinate response
├─ Escalate if needed
└─ Update stakeholders

Level 4 — CTO (30 min)
├─ Critical incidents only
├─ Business impact assessment
└─ Executive communication

Contact Information:
┌─────────────────────────────────────┐
│ Backend Lead     │ +237 xxx xxx      │
│ DevOps Lead      │ +237 xxx xxx      │
│ Security Officer │ security@...      │
│ CEO              │ +237 xxx xxx      │
└─────────────────────────────────────┘
```

---

## ✅ Maintenance Checklist Template

```markdown
## Weekly Maintenance — [Date]

- [ ] Review error logs (date: ___)
- [ ] Check database health
- [ ] Verify payment processing
- [ ] Review SSL certificate status
- [ ] Check failed login attempts
- [ ] Database VACUUM & ANALYZE
- [ ] Performance metrics review
- [ ] Security audit check
- [ ] Backup verification
- [ ] Team notification sent

**Issues Found:**
- [ ] Issue #1: ____________
- [ ] Issue #2: ____________

**Actions Taken:**
1. ________________
2. ________________

**Sign-Off:** _____________ Date: _______
```

---

**Last Updated:** 2026-04-11  
**Maintenance Contact:** devops@spotlightlover.cm  
**Emergency Hotline:** +237 xxx xxx xxx
