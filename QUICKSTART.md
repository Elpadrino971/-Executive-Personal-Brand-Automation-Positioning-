# 🚀 Quick Start Guide

Get your Executive Brand Automation Platform running in 5 minutes!

## ✅ Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **Docker & Docker Compose** ([Download](https://www.docker.com/))
- **API Keys** (see below)

## 📝 Required API Keys

Before starting, obtain these API keys:

1. **OpenAI** - https://platform.openai.com/api-keys
2. **Stripe** (test mode) - https://dashboard.stripe.com/test/apikeys
3. **LinkedIn** (optional) - https://www.linkedin.com/developers/
4. **Twitter** (optional) - https://developer.twitter.com/

## 🔧 Setup (5 minutes)

### Step 1: Clone & Configure

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd -Executive-Personal-Brand-Automation-Positioning-

# Copy environment file
cp .env.example .env
```

### Step 2: Edit .env File

Open `.env` and add your API keys:

```bash
# REQUIRED - OpenAI
OPENAI_API_KEY=sk-your-actual-openai-key-here

# REQUIRED - JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here

# OPTIONAL - Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...

# OPTIONAL - Email (use Gmail app password)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

### Step 3: Start Services

```bash
# Option A: Using Docker (RECOMMENDED)
docker-compose up -d

# Wait 10 seconds for services to start
sleep 10

# Run database migrations
docker exec -it executive-brand-api npm run migrate

# Option B: Manual (requires PostgreSQL & Redis installed)
npm install
npm run migrate
npm run dev
```

### Step 4: Verify

```bash
# Test backend
curl http://localhost:3000/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

## 🎉 You're Ready!

### Backend Running
- API: http://localhost:3000/api
- Health Check: http://localhost:3000/api/health

### Test the API

#### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ceo@example.com",
    "password": "Test123!",
    "full_name": "Jane Doe",
    "company": "Tech Corp",
    "position": "CEO",
    "tier": "professional"
  }'
```

#### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ceo@example.com",
    "password": "Test123!"
  }'
```

Save the `token` from the response!

#### 3. Generate Content

```bash
curl -X POST http://localhost:3000/api/content/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "topic": "The future of AI in leadership",
    "contentType": "linkedin_post",
    "tone": "professional",
    "includeHashtags": true
  }'
```

## 🎨 Frontend Setup (Optional)

```bash
cd frontend

# Install dependencies
npm install

# Copy environment
cp .env.example .env

# Edit .env with:
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...

# Start frontend
npm run dev
```

Frontend available at: http://localhost:3001

## 📚 Next Steps

### 1. Explore the API
- Import `postman_collection.json` into Postman
- Test all endpoints
- Read `API.md` for complete documentation

### 2. Configure Voice Profile
```bash
# Analyze writing samples
curl -X POST http://localhost:3000/api/voice/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "samples": [
      "Your first writing sample here...",
      "Your second writing sample here...",
      "Your third writing sample here..."
    ]
  }'
```

### 3. Get Trending Topics
```bash
curl http://localhost:3000/api/trends \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Generate Content Variations
```bash
curl -X POST http://localhost:3000/api/content/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Leadership in 2025",
    "contentType": "twitter_thread",
    "tone": "thought-provoking"
  }'
```

## 🔧 Useful Commands

```bash
# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Database shell
docker exec -it executive-brand-db psql -U user -d executive_brand

# Redis CLI
docker exec -it executive-brand-redis redis-cli

# Run tests
npm test

# Build for production
npm run build
```

## 🐛 Troubleshooting

### API not responding?
```bash
# Check if services are running
docker-compose ps

# Check logs
docker-compose logs api

# Restart
docker-compose restart api
```

### Database connection failed?
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Verify environment variable
echo $DATABASE_URL

# Restart database
docker-compose restart postgres
```

### OpenAI errors?
```bash
# Verify API key is set
grep OPENAI_API_KEY .env

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key"
```

## 📖 Documentation

- **README.md** - Complete platform overview
- **API.md** - Full API reference
- **DEPLOYMENT.md** - Production deployment guide
- **COMPLETE_FEATURES.md** - All features inventory
- **CONTRIBUTING.md** - Development guidelines

## 💡 Pro Tips

1. **Use Test Mode**: Start with Stripe test mode keys
2. **Sample Data**: Use the Postman collection for easy testing
3. **Voice Profile**: Upload 3-5 writing samples for best results
4. **Content Ideas**: Check trending topics before generating content
5. **Monitoring**: Set up Sentry DSN for production error tracking

## 🎯 Production Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET
- [ ] Use production Stripe keys
- [ ] Configure custom domain
- [ ] Enable HTTPS/TLS
- [ ] Set up Sentry monitoring
- [ ] Configure email (SendGrid/Mailgun)
- [ ] Set up database backups
- [ ] Review security settings
- [ ] Test payment flow
- [ ] Configure LinkedIn/Twitter OAuth

## 🆘 Need Help?

- **Documentation**: Read `README.md` and `API.md`
- **Issues**: Check GitHub Issues
- **Email**: support@executive-brand.com (configure this!)

## 🎉 Success!

You now have a fully functional AI-powered personal branding platform!

**Next**: Configure your pricing tiers in Stripe and start onboarding your first executive clients.

---

**Happy Building! 🚀**
