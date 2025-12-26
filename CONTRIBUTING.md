# Contributing to Executive Brand Automation

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/executive-brand-automation.git
   cd executive-brand-automation
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Locally

```bash
# Start services with Docker
docker-compose up -d

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Making Changes

1. **Write clean, documented code**
   - Follow TypeScript best practices
   - Add JSDoc comments for public APIs
   - Keep functions small and focused

2. **Add tests for new features**
   - Unit tests for business logic
   - Integration tests for API endpoints

3. **Update documentation**
   - Update README.md if needed
   - Add API documentation to API.md
   - Include inline code comments

### Commit Messages

Follow conventional commits:

```
feat: Add voice profile caching
fix: Resolve LinkedIn token refresh bug
docs: Update API documentation
refactor: Simplify content generation logic
test: Add tests for scheduler service
```

### Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Provide clear description
   - Reference related issues
   - Include screenshots if UI changes

4. **Code Review**
   - Address review comments
   - Keep discussions focused
   - Be patient and respectful

## Code Style

### TypeScript

- Use TypeScript strict mode
- Define interfaces for all data structures
- Avoid `any` type when possible
- Use async/await over promises

### File Organization

```
src/
├── controllers/    # Request handlers
├── services/       # Business logic
├── models/         # Data models
├── middleware/     # Express middleware
├── config/         # Configuration
└── utils/          # Utility functions
```

### Naming Conventions

- **Files:** camelCase.ts
- **Classes:** PascalCase
- **Functions:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **Interfaces:** PascalCase (no I prefix)

## Testing

### Writing Tests

```typescript
describe('ContentGenerator', () => {
  it('should generate LinkedIn post', async () => {
    const result = await ContentGenerator.generateContent({
      userId: 1,
      topic: 'AI',
      contentType: 'linkedin_post',
    });

    expect(result.content).toBeDefined();
    expect(result.metadata.wordCount).toBeGreaterThan(0);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- ContentGenerator.test.ts
```

## Documentation

### Code Comments

```typescript
/**
 * Generate personalized content based on user's voice profile
 *
 * @param request - Content generation parameters
 * @returns Generated content with metadata
 * @throws Error if content generation fails
 */
static async generateContent(request: ContentGenerationRequest): Promise<GeneratedContentResult>
```

### API Documentation

Update API.md when adding/changing endpoints:
- Request/response examples
- Error cases
- Authentication requirements

## Issue Reporting

### Bug Reports

Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Relevant logs/screenshots

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternative approaches
- Impact on existing features

## Security

**Do not commit:**
- API keys or secrets
- Personal data
- Database credentials

**Report security issues to:** security@executive-brand.com

## Questions?

- Open a GitHub issue
- Join our Discord (link)
- Email: dev@executive-brand.com

Thank you for contributing! 🚀
