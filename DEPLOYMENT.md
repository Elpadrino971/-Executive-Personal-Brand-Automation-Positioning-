# Deployment Guide

Complete deployment guide for the Executive Brand Automation Platform.

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional but recommended)

## Environment Variables

Before deploying, ensure all environment variables are configured:

```bash
# Copy example and fill in your values
cp .env.example .env
```

### Required Variables

**Database:**
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

**Redis:**
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

**Authentication:**
- `JWT_SECRET` - Strong random secret (use: `openssl rand -base64 32`)
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)

**AI Services:**
- `OPENAI_API_KEY` - Your OpenAI API key

**Social Media:**
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`
- `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_BEARER_TOKEN`

**Payment (Stripe):**
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PROFESSIONAL`, `STRIPE_PRICE_ENTERPRISE`

**Email:**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

**Monitoring:**
- `SENTRY_DSN` (optional but recommended)

**Frontend:**
- `FRONTEND_URL` - Your frontend URL

## Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# Run migrations
docker exec -it executive-brand-api npm run migrate

# Check logs
docker-compose logs -f api
```

### Option 2: Manual Deployment

#### 1. Install Dependencies

```bash
npm ci --production
```

#### 2. Build Application

```bash
npm run build
```

#### 3. Run Migrations

```bash
npm run migrate
```

#### 4. Start Application

```bash
NODE_ENV=production npm start
```

## Production Checklist

### Security

- [ ] Change all default passwords
- [ ] Set strong `JWT_SECRET`
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure Sentry for error tracking

### Database

- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Set up read replicas (if needed)
- [ ] Monitor query performance

### Monitoring

- [ ] Set up Sentry error tracking
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Configure alerts

### Stripe Setup

1. Create Stripe account
2. Get API keys (test & live)
3. Create products and pricing
4. Set up webhook endpoint: `https://yourdomain.com/api/payment/webhook`
5. Configure webhook secret

### Social Media Setup

#### LinkedIn

1. Create LinkedIn App at https://www.linkedin.com/developers/
2. Add redirect URI: `https://yourdomain.com/auth/linkedin/callback`
3. Get Client ID and Secret

#### Twitter

1. Create Twitter App at https://developer.twitter.com/
2. Get API keys and Bearer token
3. Configure OAuth settings

### Email Setup

#### Gmail

1. Enable 2FA
2. Create App Password
3. Use App Password as `SMTP_PASS`

#### SendGrid/Mailgun (Recommended for production)

1. Sign up for service
2. Verify domain
3. Get SMTP credentials

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.prod.yml
services:
  api:
    deploy:
      replicas: 3
```

### Load Balancer

Use nginx or cloud load balancer:

```nginx
upstream api {
    server api1:3000;
    server api2:3000;
    server api3:3000;
}
```

### Queue Workers

Separate queue processing:

```bash
# Start dedicated worker
NODE_ENV=production node dist/services/queue/worker.js
```

## Monitoring & Logs

### Logs

```bash
# Docker logs
docker-compose logs -f

# Application logs
tail -f logs/combined.log

# Error logs
tail -f logs/error.log
```

### Health Check

```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-26T10:00:00.000Z"
}
```

## Backup & Recovery

### Database Backup

```bash
# Automated daily backup
0 2 * * * docker exec executive-brand-db pg_dump -U user executive_brand > backup_$(date +\%Y\%m\%d).sql
```

### Restore

```bash
docker exec -i executive-brand-db psql -U user executive_brand < backup_20251226.sql
```

## Troubleshooting

### API not responding

1. Check logs: `docker-compose logs api`
2. Verify database connection
3. Check Redis connection
4. Verify environment variables

### Database connection failed

1. Check `DATABASE_URL`
2. Verify PostgreSQL is running
3. Check firewall rules
4. Test connection: `psql $DATABASE_URL`

### Queue not processing

1. Check Redis connection
2. Verify Bull queue is running
3. Check logs for errors
4. Restart queue workers

## Performance Optimization

### Database

- Add indexes on frequently queried fields
- Use connection pooling
- Enable query caching
- Regular VACUUM and ANALYZE

### Redis

- Configure maxmemory policy
- Use Redis persistence
- Monitor memory usage

### Application

- Enable production mode: `NODE_ENV=production`
- Use PM2 for process management
- Enable gzip compression
- Implement caching strategies

## Support

For deployment issues:
- Email: devops@executive-brand.com
- Documentation: https://docs.executive-brand.com
- GitHub Issues: https://github.com/yourusername/executive-brand-automation/issues
