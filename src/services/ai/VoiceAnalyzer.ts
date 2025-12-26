import OpenAI from 'openai';
import logger from '../../config/logger';
import { VoiceProfileModel } from '../../models/VoiceProfile';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VoiceAnalysisResult {
  tone: string;
  style_keywords: string[];
  common_phrases: string[];
  vocabulary_level: string;
  sentence_structure: {
    avg_length: number;
    complexity: string;
    patterns: string[];
  };
  topics_of_interest: string[];
}

export class VoiceAnalyzer {
  /**
   * Analyze writing samples to build voice profile
   */
  static async analyzeWritingSamples(
    userId: number,
    samples: string[]
  ): Promise<VoiceAnalysisResult> {
    if (samples.length === 0) {
      throw new Error('At least one writing sample is required');
    }

    logger.info('Analyzing voice profile', { userId, sampleCount: samples.length });

    const combinedText = samples.join('\n\n---\n\n');

    const prompt = `Analyze the following writing samples and extract the author's unique voice characteristics:

${combinedText}

Provide a detailed analysis in JSON format with the following structure:
{
  "tone": "overall tone (e.g., professional, conversational, authoritative)",
  "style_keywords": ["array", "of", "style", "descriptors"],
  "common_phrases": ["frequently", "used", "phrases"],
  "vocabulary_level": "executive/professional/casual",
  "sentence_structure": {
    "avg_length": estimated_average_word_count,
    "complexity": "simple/moderate/complex",
    "patterns": ["observed", "patterns"]
  },
  "topics_of_interest": ["identified", "topics"]
}

Focus on unique characteristics that can be replicated in generated content.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert linguistic analyst specializing in voice profiling for executive communications.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');

      // Save to database
      await VoiceProfileModel.create(userId, analysis);

      logger.info('Voice profile analysis completed', { userId });

      return analysis;
    } catch (error) {
      logger.error('Error analyzing voice profile', { error, userId });
      throw new Error('Failed to analyze voice profile');
    }
  }

  /**
   * Update voice profile with new samples
   */
  static async updateVoiceProfile(userId: number, newSamples: string[]): Promise<void> {
    const existingProfile = await VoiceProfileModel.findByUserId(userId);

    if (!existingProfile) {
      await this.analyzeWritingSamples(userId, newSamples);
      return;
    }

    // Analyze new samples
    const newAnalysis = await this.analyzeWritingSamples(userId, newSamples);

    // Merge with existing profile (weighted average)
    const mergedProfile = this.mergeProfiles(existingProfile, newAnalysis);

    await VoiceProfileModel.update(userId, mergedProfile);

    logger.info('Voice profile updated', { userId });
  }

  /**
   * Merge existing profile with new analysis
   */
  private static mergeProfiles(existing: any, newAnalysis: VoiceAnalysisResult): any {
    return {
      tone: newAnalysis.tone, // Use latest tone
      style_keywords: [
        ...new Set([...(existing.style_keywords || []), ...newAnalysis.style_keywords]),
      ].slice(0, 10),
      common_phrases: [
        ...new Set([...(existing.common_phrases || []), ...newAnalysis.common_phrases]),
      ].slice(0, 15),
      vocabulary_level: newAnalysis.vocabulary_level,
      sentence_structure: newAnalysis.sentence_structure,
      topics_of_interest: [
        ...new Set([...(existing.topics_of_interest || []), ...newAnalysis.topics_of_interest]),
      ].slice(0, 10),
    };
  }

  /**
   * Get voice profile suggestions for improvement
   */
  static async getSuggestions(userId: number): Promise<string[]> {
    const profile = await VoiceProfileModel.findByUserId(userId);

    if (!profile) {
      return ['Upload writing samples to create your voice profile'];
    }

    const suggestions: string[] = [];

    if (profile.analyzed_samples_count < 5) {
      suggestions.push('Add more writing samples for better accuracy (minimum 5 recommended)');
    }

    if (!profile.topics_of_interest || profile.topics_of_interest.length < 3) {
      suggestions.push('Define your core topics of interest for more relevant content');
    }

    return suggestions;
  }

  /**
   * Validate if generated content matches voice profile
   */
  static async validateContentMatch(
    userId: number,
    generatedContent: string
  ): Promise<{ matches: boolean; score: number; feedback: string }> {
    const profile = await VoiceProfileModel.findByUserId(userId);

    if (!profile) {
      return {
        matches: true,
        score: 1.0,
        feedback: 'No voice profile available for comparison',
      };
    }

    const prompt = `Compare this generated content with the author's voice profile and rate how well it matches:

VOICE PROFILE:
- Tone: ${profile.tone}
- Style: ${profile.style_keywords?.join(', ')}
- Vocabulary: ${profile.vocabulary_level}

GENERATED CONTENT:
${generatedContent}

Provide a match score (0-1) and brief feedback on authenticity.
Return JSON: {"score": 0.85, "feedback": "explanation"}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"score": 0.5}');

      return {
        matches: result.score >= 0.7,
        score: result.score,
        feedback: result.feedback || 'Content analyzed',
      };
    } catch (error) {
      logger.error('Error validating content match', { error });
      return { matches: true, score: 0.5, feedback: 'Validation unavailable' };
    }
  }
}
