import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { AnalyticsService } from '../services/analytics/AnalyticsService';
import { query } from '../config/database';
import logger from '../config/logger';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { tier, status } = req.query;
    const users = await UserModel.list({ tier: tier as string, status: status as string });

    res.json({ users, count: users.length });
  } catch (error: any) {
    logger.error('Get all users error', { error: error.message });
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const getPlatformStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await AnalyticsService.getPlatformStats();
    const tierDistribution = await AnalyticsService.getTierDistribution();

    res.json({ stats, tierDistribution });
  } catch (error: any) {
    logger.error('Get platform stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

export const updateUserTier = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { tier } = req.body;

    const user = await UserModel.updateTier(parseInt(userId), tier);

    logger.info('User tier updated by admin', { userId, tier, adminId: req.user!.id });

    res.json({ user });
  } catch (error: any) {
    logger.error('Update user tier error', { error: error.message });
    res.status(500).json({ error: 'Failed to update tier' });
  }
};

export const suspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    await query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['suspended', parseInt(userId)]
    );

    logger.warn('User suspended by admin', { userId, adminId: req.user!.id });

    res.json({ message: 'User suspended' });
  } catch (error: any) {
    logger.error('Suspend user error', { error: error.message });
    res.status(500).json({ error: 'Failed to suspend user' });
  }
};

export const getRecentActivity = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM activity_logs
       ORDER BY created_at DESC
       LIMIT 100`
    );

    res.json({ activity: result.rows });
  } catch (error: any) {
    logger.error('Get recent activity error', { error: error.message });
    res.status(500).json({ error: 'Failed to get activity' });
  }
};
