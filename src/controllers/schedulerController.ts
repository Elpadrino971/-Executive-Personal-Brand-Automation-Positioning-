import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ContentScheduler } from '../services/queue/ContentScheduler';
import logger from '../config/logger';

export const schedulePost = async (req: AuthRequest, res: Response) => {
  try {
    const { contentId, socialAccountId, scheduledTime } = req.body;

    if (!contentId || !socialAccountId || !scheduledTime) {
      return res.status(400).json({
        error: 'Missing required fields: contentId, socialAccountId, scheduledTime',
      });
    }

    const scheduledPostId = await ContentScheduler.schedulePost(
      req.user!.id,
      contentId,
      socialAccountId,
      new Date(scheduledTime)
    );

    logger.info('Post scheduled', {
      userId: req.user!.id,
      scheduledPostId,
    });

    res.json({
      message: 'Post scheduled successfully',
      scheduledPostId,
      scheduledTime,
    });
  } catch (error: any) {
    logger.error('Schedule post error', { error: error.message });
    res.status(500).json({ error: 'Failed to schedule post' });
  }
};

export const getScheduledPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await ContentScheduler.getScheduledPosts(req.user!.id);

    res.json({
      posts,
      count: posts.length,
    });
  } catch (error: any) {
    logger.error('Get scheduled posts error', { error: error.message });
    res.status(500).json({ error: 'Failed to get scheduled posts' });
  }
};

export const cancelScheduledPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await ContentScheduler.cancelScheduledPost(parseInt(id));

    res.json({
      message: 'Scheduled post cancelled',
    });
  } catch (error: any) {
    logger.error('Cancel scheduled post error', { error: error.message });
    res.status(500).json({ error: 'Failed to cancel scheduled post' });
  }
};

export const reschedulePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledTime } = req.body;

    if (!scheduledTime) {
      return res.status(400).json({ error: 'scheduledTime is required' });
    }

    await ContentScheduler.reschedulePost(parseInt(id), new Date(scheduledTime));

    res.json({
      message: 'Post rescheduled successfully',
      scheduledTime,
    });
  } catch (error: any) {
    logger.error('Reschedule post error', { error: error.message });
    res.status(500).json({ error: 'Failed to reschedule post' });
  }
};
