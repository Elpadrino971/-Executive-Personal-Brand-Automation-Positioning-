import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { VoiceAnalyzer } from '../services/ai/VoiceAnalyzer';
import { VoiceProfileModel } from '../models/VoiceProfile';
import logger from '../config/logger';

export const analyzeVoice = async (req: AuthRequest, res: Response) => {
  try {
    const { samples } = req.body;

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return res.status(400).json({
        error: 'At least one writing sample is required',
      });
    }

    const analysis = await VoiceAnalyzer.analyzeWritingSamples(
      req.user!.id,
      samples
    );

    logger.info('Voice analysis completed', { userId: req.user!.id });

    res.json({
      message: 'Voice profile created successfully',
      profile: analysis,
    });
  } catch (error: any) {
    logger.error('Voice analysis error', { error: error.message });
    res.status(500).json({ error: 'Failed to analyze voice' });
  }
};

export const getVoiceProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await VoiceProfileModel.findByUserId(req.user!.id);

    if (!profile) {
      return res.status(404).json({
        error: 'Voice profile not found',
        message: 'Please upload writing samples to create your voice profile',
      });
    }

    res.json({ profile });
  } catch (error: any) {
    logger.error('Get voice profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to get voice profile' });
  }
};

export const updateVoiceProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { samples } = req.body;

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return res.status(400).json({
        error: 'At least one writing sample is required',
      });
    }

    await VoiceAnalyzer.updateVoiceProfile(req.user!.id, samples);

    const updatedProfile = await VoiceProfileModel.findByUserId(req.user!.id);

    res.json({
      message: 'Voice profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error: any) {
    logger.error('Update voice profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to update voice profile' });
  }
};

export const getVoiceSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const suggestions = await VoiceAnalyzer.getSuggestions(req.user!.id);

    res.json({
      suggestions,
      count: suggestions.length,
    });
  } catch (error: any) {
    logger.error('Get voice suggestions error', { error: error.message });
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};
