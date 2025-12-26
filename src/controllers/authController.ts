import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { generateToken } from '../middleware/auth';
import logger from '../config/logger';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, company, position, tier } = req.body;

    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, full_name',
      });
    }

    // Check if user exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user
    const user = await UserModel.create({
      email,
      password,
      full_name,
      company,
      position,
      tier: tier || 'starter',
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      tier: user.tier,
    });

    logger.info('User registered', { userId: user.id, email: user.email });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        tier: user.tier,
      },
      token,
    });
  } catch (error: any) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await UserModel.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      tier: user.tier,
    });

    logger.info('User logged in', { userId: user.id });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        tier: user.tier,
      },
      token,
    });
  } catch (error: any) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        company: user.company,
        position: user.position,
        tier: user.tier,
        status: user.status,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    logger.error('Get profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to get profile' });
  }
};
