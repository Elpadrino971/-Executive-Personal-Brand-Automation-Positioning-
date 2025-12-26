import request from 'supertest';
import app from '../../app';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'Test123!@#',
          full_name: 'Test User',
          tier: 'starter',
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const email = `duplicate${Date.now()}@example.com`;

      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test123!@#',
          full_name: 'Test User',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test123!@#',
          full_name: 'Test User 2',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const email = `login${Date.now()}@example.com`;
      const password = 'Test123!@#';

      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password,
          full_name: 'Test User',
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });
});
