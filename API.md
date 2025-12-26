# API Reference Guide

Complete API documentation for the Executive Brand Automation Platform.

## Overview

**Base URL:** `https://api.executive-brand.com/api` (Production)
**Base URL:** `http://localhost:3000/api` (Development)

**Content-Type:** `application/json`
**Authentication:** Bearer Token (JWT)

---

## Authentication Flow

### 1. Register New User

Creates a new executive account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "company": "Tech Innovations Inc",
  "position": "CEO",
  "tier": "professional"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "tier": "professional"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login

Authenticate and receive JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "tier": "professional"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Get Profile

Retrieve authenticated user's profile.

**Endpoint:** `GET /auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "company": "Tech Innovations Inc",
    "position": "CEO",
    "tier": "professional",
    "status": "active",
    "created_at": "2025-12-26T10:00:00Z"
  }
}
```

---

## Voice Profile Management

### 1. Analyze Voice

Create or update voice profile by analyzing writing samples.

**Endpoint:** `POST /voice/analyze`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "samples": [
    "In my 20 years of leading tech companies, I've learned that innovation isn't about being first—it's about being right. The best leaders don't chase trends; they create them.",
    "Today's business landscape demands more than traditional leadership. We need executives who can blend strategic thinking with empathy, data with intuition.",
    "Here's what nobody tells you about scaling: The processes that got you to $10M will break at $50M. Build for where you're going, not where you are."
  ]
}
```

**Response:** `200 OK`
```json
{
  "message": "Voice profile created successfully",
  "profile": {
    "tone": "authoritative yet approachable",
    "style_keywords": ["strategic", "insightful", "actionable", "authentic"],
    "common_phrases": ["In my experience", "Here's what", "The key is"],
    "vocabulary_level": "executive",
    "sentence_structure": {
      "avg_length": 18,
      "complexity": "moderate",
      "patterns": ["rhetorical questions", "em-dashes", "strong openings"]
    },
    "topics_of_interest": ["leadership", "innovation", "scaling", "tech"]
  }
}
```

### 2. Get Voice Profile

Retrieve existing voice profile.

**Endpoint:** `GET /voice/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK` or `404 Not Found`

### 3. Update Voice Profile

Add new writing samples to refine the profile.

**Endpoint:** `PUT /voice/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "samples": [
    "New writing sample to refine the voice profile..."
  ]
}
```

**Response:** `200 OK`

### 4. Get Voice Suggestions

Get recommendations to improve voice profile accuracy.

**Endpoint:** `GET /voice/suggestions`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "suggestions": [
    "Add more writing samples for better accuracy (minimum 5 recommended)",
    "Define your core topics of interest for more relevant content"
  ],
  "count": 2
}
```

---

## Content Generation

### 1. Generate Content

Create AI-powered content based on voice profile.

**Endpoint:** `POST /content/generate`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "topic": "The future of AI in business leadership",
  "contentType": "linkedin_post",
  "tone": "thought-provoking",
  "additionalContext": "Focus on practical applications, not hype",
  "includeHashtags": true,
  "targetAudience": "C-level executives in tech and finance"
}
```

**Content Types:**
- `linkedin_post` - Professional LinkedIn post (up to 3000 chars)
- `twitter_post` - Single tweet (up to 280 chars)
- `twitter_thread` - Twitter thread (8-10 tweets)

**Response:** `200 OK`
```json
{
  "message": "Content generated successfully",
  "content": {
    "id": 42,
    "user_id": 1,
    "content_type": "linkedin_post",
    "title": "AI isn't replacing leaders—it's revealing who the real leaders are",
    "content": "Here's what 20 years in tech has taught me about AI and leadership:\n\nAI isn't replacing leaders—it's revealing who the real leaders are.\n\nThe executives thriving today aren't the ones with the biggest AI budgets. They're the ones asking better questions...\n\n[Full content]",
    "tone": "thought-provoking",
    "topic": "The future of AI in business leadership",
    "hashtags": ["#AILeadership", "#FutureOfWork", "#ExecutiveInsights"],
    "status": "draft",
    "metadata": {
      "wordCount": 287,
      "estimatedReadTime": 2,
      "aiModel": "gpt-4-turbo-preview"
    },
    "created_at": "2025-12-26T15:30:00Z"
  }
}
```

### 2. List Content

Get all generated content for the authenticated user.

**Endpoint:** `GET /content?limit=50`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional) - Number of items to return (default: 50)

**Response:** `200 OK`
```json
{
  "contents": [
    {
      "id": 42,
      "content_type": "linkedin_post",
      "title": "AI isn't replacing leaders...",
      "status": "draft",
      "created_at": "2025-12-26T15:30:00Z"
    }
  ],
  "count": 15
}
```

### 3. Get Content by ID

Retrieve specific content piece.

**Endpoint:** `GET /content/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK` or `403 Forbidden` or `404 Not Found`

### 4. Update Content Status

Change content status (draft → approved → scheduled → published).

**Endpoint:** `PATCH /content/:id/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "approved"
}
```

**Valid Statuses:**
- `draft` - Initial state
- `approved` - Ready for scheduling
- `scheduled` - Queued for publishing
- `published` - Successfully posted
- `failed` - Publishing failed

**Response:** `200 OK`

### 5. Delete Content

Permanently delete content.

**Endpoint:** `DELETE /content/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`

---

## Trends & Ideas

### 1. Get Trending Topics

Discover trending topics personalized to your profile.

**Endpoint:** `GET /trends?limit=10`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional) - Number of trends to return (default: 5)

**Response:** `200 OK`
```json
{
  "trends": [
    {
      "topic": "AI Governance and Ethics in 2025",
      "platform": "linkedin",
      "relevance_score": 0.92,
      "engagement_potential": 0.88,
      "keywords": ["AI ethics", "governance", "regulation"],
      "suggested_angles": [
        "How your company should prepare for AI regulations",
        "Building ethical AI frameworks from the ground up",
        "What executives get wrong about AI governance"
      ]
    }
  ],
  "count": 10
}
```

### 2. Get Content Ideas

Generate content ideas for a specific topic.

**Endpoint:** `GET /content/ideas?topic=leadership`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `topic` (required) - Topic to generate ideas for

**Response:** `200 OK`
```json
{
  "topic": "leadership",
  "ideas": [
    "The 3 leadership lessons I learned from my biggest failure",
    "Why the best leaders schedule time to be 'useless'",
    "How to lead through uncertainty: A framework from 20 years in the C-suite",
    "The leadership advice everyone gives (that actually hurts your team)",
    "What chess taught me about strategic leadership"
  ],
  "count": 5
}
```

---

## Content Scheduling

### 1. Schedule Post

Queue content for automatic publishing.

**Endpoint:** `POST /schedule`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "contentId": 42,
  "socialAccountId": 7,
  "scheduledTime": "2025-12-27T09:00:00Z"
}
```

**Response:** `200 OK`
```json
{
  "message": "Post scheduled successfully",
  "scheduledPostId": 123,
  "scheduledTime": "2025-12-27T09:00:00Z"
}
```

### 2. Get Scheduled Posts

List all scheduled posts.

**Endpoint:** `GET /schedule`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "posts": [
    {
      "id": 123,
      "content_id": 42,
      "scheduled_time": "2025-12-27T09:00:00Z",
      "status": "pending",
      "platform": "linkedin",
      "account_username": "John Doe"
    }
  ],
  "count": 5
}
```

**Post Statuses:**
- `pending` - Waiting to publish
- `publishing` - Currently publishing
- `published` - Successfully posted
- `failed` - Publishing failed
- `cancelled` - User cancelled

### 3. Cancel Scheduled Post

Cancel a pending scheduled post.

**Endpoint:** `DELETE /schedule/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Scheduled post cancelled"
}
```

### 4. Reschedule Post

Change the scheduled time for a post.

**Endpoint:** `PATCH /schedule/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "scheduledTime": "2025-12-28T14:00:00Z"
}
```

**Response:** `200 OK`
```json
{
  "message": "Post rescheduled successfully",
  "scheduledTime": "2025-12-28T14:00:00Z"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Example Error Response

```json
{
  "error": "Authentication required",
  "message": "No token provided"
}
```

---

## Rate Limiting

- **Window:** 15 minutes
- **Limit:** 100 requests per window per IP

When limit is exceeded:
```json
{
  "error": "Too many requests",
  "retryAfter": 900
}
```

---

## Webhooks (Coming Soon)

Subscribe to events:
- `content.generated` - New content created
- `post.published` - Post successfully published
- `post.failed` - Publishing failed
- `voice.analyzed` - Voice profile updated

---

## Support

- **Email:** api-support@executive-brand.com
- **Docs:** https://docs.executive-brand.com
- **Status:** https://status.executive-brand.com
