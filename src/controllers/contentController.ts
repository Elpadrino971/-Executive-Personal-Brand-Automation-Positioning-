import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ContentGenerator } from '../services/ai/ContentGenerator';
import { ContentModel } from '../models/Content';
import { TrendAnalyzer } from '../services/ai/TrendAnalyzer';
import logger from '../config/logger';

export const generateContent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      topic,
      contentType,
      tone,
      additionalContext,
      includeHashtags,
      targetAudience,
    } = req.body;

    if (!topic || !contentType) {
      return res.status(400).json({
        error: 'Missing required fields: topic, contentType',
      });
    }

    // Generate content
    const result = await ContentGenerator.generateContent({
      userId: req.user!.id,
      topic,
      contentType,
      tone,
      additionalContext,
      includeHashtags,
      targetAudience,
    });

    // Save to database
    const savedContent = await ContentModel.create({
      user_id: req.user!.id,
      content_type: contentType,
      title: result.title,
      content: result.content,
      tone: result.tone,
      topic,
      hashtags: result.hashtags,
      metadata: result.metadata,
    });

    logger.info('Content generated', {
      userId: req.user!.id,
      contentId: savedContent.id,
    });

    res.json({
      message: 'Content generated successfully',
      content: savedContent,
    });
  } catch (error: any) {
    logger.error('Content generation error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate content' });
  }
};

export const getContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const content = await ContentModel.findById(parseInt(id));

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Check ownership
    if (content.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ content });
  } catch (error: any) {
    logger.error('Get content error', { error: error.message });
    res.status(500).json({ error: 'Failed to get content' });
  }
};

export const listContent = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const contents = await ContentModel.findByUser(req.user!.id, limit);

    res.json({
      contents,
      count: contents.length,
    });
  } catch (error: any) {
    logger.error('List content error', { error: error.message });
    res.status(500).json({ error: 'Failed to list content' });
  }
};

export const updateContentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const content = await ContentModel.findById(parseInt(id));
    if (!content || content.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const updated = await ContentModel.updateStatus(parseInt(id), status);

    res.json({
      message: 'Content status updated',
      content: updated,
    });
  } catch (error: any) {
    logger.error('Update content error', { error: error.message });
    res.status(500).json({ error: 'Failed to update content' });
  }
};

export const deleteContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const content = await ContentModel.findById(parseInt(id));
    if (!content || content.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Content not found' });
    }

    await ContentModel.delete(parseInt(id));

    res.json({ message: 'Content deleted successfully' });
  } catch (error: any) {
    logger.error('Delete content error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete content' });
  }
};

export const getTrends = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const trends = await TrendAnalyzer.getRecommendations(req.user!.id, limit);

    res.json({
      trends,
      count: trends.length,
    });
  } catch (error: any) {
    logger.error('Get trends error', { error: error.message });
    res.status(500).json({ error: 'Failed to get trends' });
  }
};

export const getContentIdeas = async (req: AuthRequest, res: Response) => {
  try {
    const { topic } = req.query;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const ideas = await TrendAnalyzer.generateContentIdeas(topic as string);

    res.json({
      topic,
      ideas,
      count: ideas.length,
    });
  } catch (error: any) {
    logger.error('Get content ideas error', { error: error.message });
    res.status(500).json({ error: 'Failed to get content ideas' });
  }
};
