# Executive Personal Brand Automation Platform

**IA Ghostwriting + Multi-channel Distribution for C-Level Executives**

A comprehensive SaaS platform that automates personal branding for executives through AI-powered content generation, voice analysis, and multi-platform publishing.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Pricing Tiers](#pricing-tiers)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

### Core Capabilities

- **AI-Powered Content Generation**
  - Personalized LinkedIn posts and Twitter threads
  - Maintains authentic executive voice
  - Context-aware, industry-specific content
  - Multi-variation generation for A/B testing

- **Voice Profile Analysis**
  - Deep analysis of writing samples
  - Tone, style, and vocabulary extraction
  - Continuous learning from new content
  - Voice authenticity validation

- **Trend Intelligence**
  - Real-time trend discovery
  - Industry-specific topic recommendations
  - Engagement potential scoring
  - Content idea generation

- **Multi-Platform Publishing**
  - LinkedIn integration
  - Twitter/X integration
  - Automated scheduling
  - Queue management with retry logic

- **Analytics & Insights**
  - Post performance tracking
  - Engagement metrics
  - Content effectiveness analysis

### Pricing Tiers

| Tier | Price (EUR/month) | Posts/Month | Features |
|------|------------------|-------------|----------|
| **Starter** | €800 | 20 | Basic AI generation, 1 platform |
| **Professional** | €1,500 | 50 | Advanced AI, 2 platforms, analytics |
| **Enterprise** | €3,000 | 150 | All features, priority support |
| **Done-For-You** | Custom | Unlimited | Full service, dedicated account manager |

**Target Market:** 500K+ French-speaking executives with high CAC but enormous LTV.

---

## Tech Stack

### Backend
- **Node.js 18+** - Runtime environment
- **TypeScript** - Type-safe development
- **Express.js** - Web framework
- **PostgreSQL 15** - Primary database
- **Redis** - Caching & queue management

### AI & Services
- **OpenAI GPT-4** - Content generation & analysis
- **Bull** - Job queue for scheduling
- **JWT** - Authentication

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│              Express API Server (Node.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     Auth     │  │   Content    │  │  Scheduler   │  │
│  │  Middleware  │  │  Controller  │  │  Controller  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────┬─────────────────────────────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌──────────────┐  ┌──────────────────┐
│  PostgreSQL  │  │  AI Services     │
│   Database   │  │  - OpenAI GPT-4  │
│              │  │  - Voice Analyzer│
│              │  │  - Trend Analyzer│
└──────────────┘  └──────────────────┘
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────────┐
│    Redis     │  │ Social Platforms │
│ Cache/Queue  │  │  - LinkedIn API  │
│              │  │  - Twitter API   │
└──────────────┘  └──────────────────┘
```

### Database Schema

**Key Tables:**
- `users` - Executive accounts
- `voice_profiles` - AI-analyzed writing styles
- `generated_content` - AI-created posts
- `scheduled_posts` - Publishing queue
- `social_accounts` - Connected platforms
- `trends` - Topic recommendations
- `subscriptions` - Billing & limits

---

## Quick Start

### Prerequisites

- **Node.js 18+**
- **Docker & Docker Compose**
- **PostgreSQL 15**
- **Redis 7**
- **OpenAI API Key**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/executive-brand-automation.git
cd executive-brand-automation
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Start with Docker Compose**
```bash
docker-compose up -d
```

5. **Initialize database**
```bash
docker exec -it executive-brand-db psql -U user -d executive_brand -f /docker-entrypoint-initdb.d/schema.sql
```

6. **Verify installation**
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication

**Register**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "executive@company.com",
  "password": "SecureP@ss123",
  "full_name": "Jean Dupont",
  "company": "Tech Corp",
  "position": "CEO",
  "tier": "professional"
}
```

**Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "executive@company.com",
  "password": "SecureP@ss123"
}
```

**Get Profile**
```http
GET /auth/profile
Authorization: Bearer <token>
```

#### Voice Profile

**Analyze Writing Samples**
```http
POST /voice/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "samples": [
    "First writing sample text...",
    "Second writing sample text...",
    "Third writing sample text..."
  ]
}
```

**Get Voice Profile**
```http
GET /voice/profile
Authorization: Bearer <token>
```

**Update Voice Profile**
```http
PUT /voice/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "samples": ["New sample..."]
}
```

#### Content Generation

**Generate Content**
```http
POST /content/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "The future of AI in business",
  "contentType": "linkedin_post",
  "tone": "thought-provoking",
  "includeHashtags": true,
  "targetAudience": "C-level executives in tech"
}
```

**List Content**
```http
GET /content?limit=20
Authorization: Bearer <token>
```

**Get Content by ID**
```http
GET /content/:id
Authorization: Bearer <token>
```

**Update Content Status**
```http
PATCH /content/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved"
}
```

**Delete Content**
```http
DELETE /content/:id
Authorization: Bearer <token>
```

#### Trends & Ideas

**Get Trending Topics**
```http
GET /trends?limit=10
Authorization: Bearer <token>
```

**Get Content Ideas**
```http
GET /content/ideas?topic=leadership
Authorization: Bearer <token>
```

#### Scheduling

**Schedule Post**
```http
POST /schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "contentId": 123,
  "socialAccountId": 456,
  "scheduledTime": "2025-12-27T10:00:00Z"
}
```

**Get Scheduled Posts**
```http
GET /schedule
Authorization: Bearer <token>
```

**Cancel Scheduled Post**
```http
DELETE /schedule/:id
Authorization: Bearer <token>
```

**Reschedule Post**
```http
PATCH /schedule/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "scheduledTime": "2025-12-28T14:00:00Z"
}
```

---

## Development

### Local Development

**Without Docker:**
```bash
# Start PostgreSQL and Redis locally
# Update .env with local connection strings

npm run dev
```

**With Docker:**
```bash
docker-compose up
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

---

## Deployment

### Environment Variables

Essential variables for production:

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/db

# Redis
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=secret

# JWT
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# LinkedIn
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_REDIRECT_URI=https://yourapp.com/auth/linkedin/callback

# Twitter
TWITTER_BEARER_TOKEN=your-bearer-token
```

### Production Deployment

**Docker:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Manual:**
```bash
npm run build
NODE_ENV=production node dist/app.js
```

### Health Checks

Monitor application health:
```bash
curl https://yourapp.com/api/health
```

---

## Project Structure

```
.
├── src/
│   ├── app.ts                    # Main application entry
│   ├── config/
│   │   ├── database.ts           # PostgreSQL connection
│   │   ├── redis.ts              # Redis connection
│   │   └── logger.ts             # Winston logger
│   ├── controllers/
│   │   ├── authController.ts     # Authentication logic
│   │   ├── contentController.ts  # Content management
│   │   ├── voiceController.ts    # Voice profile handling
│   │   └── schedulerController.ts # Scheduling logic
│   ├── middleware/
│   │   ├── auth.ts               # JWT authentication
│   │   ├── rateLimiter.ts        # Rate limiting
│   │   └── errorHandler.ts       # Error handling
│   ├── models/
│   │   ├── schema.sql            # Database schema
│   │   ├── User.ts               # User model
│   │   ├── Content.ts            # Content model
│   │   └── VoiceProfile.ts       # Voice profile model
│   ├── services/
│   │   ├── ai/
│   │   │   ├── ContentGenerator.ts  # OpenAI content generation
│   │   │   ├── VoiceAnalyzer.ts     # Voice analysis
│   │   │   └── TrendAnalyzer.ts     # Trend discovery
│   │   ├── social/
│   │   │   ├── LinkedInConnector.ts # LinkedIn API
│   │   │   └── TwitterConnector.ts  # Twitter API
│   │   └── queue/
│   │       └── ContentScheduler.ts  # Job queue
│   └── routes/
│       └── index.ts              # API routes
├── docker-compose.yml            # Docker orchestration
├── Dockerfile                    # Container definition
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── .env.example                  # Environment template
└── README.md                     # This file
```

---

## Business Model

### Target Market
- **500,000+ French-speaking executives**
- C-level, VPs, Directors
- Tech, Finance, Consulting industries

### Pricing Strategy
- **Starter**: €800/month - Entry point for individual executives
- **Professional**: €1,500/month - Growing personal brand
- **Enterprise**: €3,000/month - Established thought leaders
- **Done-For-You**: Custom - Full-service white-glove

### Revenue Projections
- **High CAC** but **enormous LTV**
- Focus on retention and upsells
- Cross-sell consulting and speaking opportunities

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

MIT License - see LICENSE file for details

---

## Support

For support inquiries:
- Email: support@executive-brand.com
- Documentation: https://docs.executive-brand.com
- Issues: GitHub Issues

---

## Roadmap

- [ ] Email integration
- [ ] Instagram/Facebook support
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Multi-language support
- [ ] Mobile app (iOS/Android)
- [ ] Browser extension
- [ ] Zapier integration

---

Built with ❤️ for C-level executives who want to build their personal brand at scale.
