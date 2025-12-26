import OpenAI from 'openai';
import logger from '../../config/logger';
import { VoiceProfileModel } from '../../models/VoiceProfile';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentGenerationRequest {
  userId: number;
  topic: string;
  contentType: 'linkedin_post' | 'twitter_thread' | 'twitter_post';
  tone?: string;
  additionalContext?: string;
  includeHashtags?: boolean;
  targetAudience?: string;
}

export interface GeneratedContentResult {
  content: string;
  title?: string;
  hashtags?: string[];
  tone: string;
  metadata: {
    wordCount: number;
    estimatedReadTime: number;
    aiModel: string;
  };
}

export class ContentGenerator {
  /**
   * Generate personalized content based on user's voice profile
   */
  static async generateContent(request: ContentGenerationRequest): Promise<GeneratedContentResult> {
    const voiceProfile = await VoiceProfileModel.findByUserId(request.userId);

    const systemPrompt = this.buildSystemPrompt(voiceProfile, request.contentType);
    const userPrompt = this.buildUserPrompt(request);

    logger.info('Generating content', {
      userId: request.userId,
      topic: request.topic,
      contentType: request.contentType,
    });

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      });

      const generatedText = completion.choices[0].message.content || '';
      const result = this.parseGeneratedContent(generatedText, request);

      logger.info('Content generated successfully', {
        userId: request.userId,
        wordCount: result.metadata.wordCount,
      });

      return result;
    } catch (error) {
      logger.error('Error generating content', { error, userId: request.userId });
      throw new Error('Failed to generate content');
    }
  }

  /**
   * Build system prompt based on voice profile and content type
   */
  private static buildSystemPrompt(voiceProfile: any, contentType: string): string {
    const contentSpecs = {
      linkedin_post: {
        maxLength: 3000,
        format: 'Professional LinkedIn post with engaging hook, valuable insights, and clear CTA',
        audience: 'C-level executives, industry leaders, and professionals',
      },
      twitter_post: {
        maxLength: 280,
        format: 'Concise, impactful tweet',
        audience: 'Tech-savvy professionals and thought leaders',
      },
      twitter_thread: {
        maxLength: 2800,
        format: 'Engaging Twitter thread (8-10 tweets) with numbered structure',
        audience: 'Engaged Twitter audience seeking deep insights',
      },
    };

    const spec = contentSpecs[contentType as keyof typeof contentSpecs];

    let prompt = `You are an expert ghostwriter for C-level executives creating ${contentType.replace('_', ' ')} content.

CONTENT SPECIFICATIONS:
- Format: ${spec.format}
- Max length: ${spec.maxLength} characters
- Target audience: ${spec.audience}

`;

    if (voiceProfile) {
      prompt += `VOICE PROFILE:
- Tone: ${voiceProfile.tone || 'Professional yet approachable'}
- Vocabulary level: ${voiceProfile.vocabulary_level || 'Executive-level'}
- Key topics: ${voiceProfile.topics_of_interest?.join(', ') || 'Business, Leadership, Innovation'}
- Style keywords: ${voiceProfile.style_keywords?.join(', ') || 'Authoritative, insightful, actionable'}

`;
    }

    prompt += `GUIDELINES:
1. Write in a natural, authentic voice that sounds human, not AI-generated
2. Start with a strong hook to capture attention
3. Provide genuine value and actionable insights
4. Use storytelling and personal anecdotes when relevant
5. End with a thought-provoking question or clear CTA
6. Avoid clichés and buzzwords
7. Be specific and concrete, not vague or generic
8. Use formatting (line breaks, emojis sparingly) for readability

OUTPUT FORMAT:
Return ONLY the content, formatted and ready to publish.
If hashtags are requested, include them at the end.`;

    return prompt;
  }

  /**
   * Build user prompt with specific requirements
   */
  private static buildUserPrompt(request: ContentGenerationRequest): string {
    let prompt = `Create a ${request.contentType.replace('_', ' ')} about: ${request.topic}`;

    if (request.tone) {
      prompt += `\n\nDesired tone: ${request.tone}`;
    }

    if (request.targetAudience) {
      prompt += `\n\nTarget audience: ${request.targetAudience}`;
    }

    if (request.additionalContext) {
      prompt += `\n\nAdditional context: ${request.additionalContext}`;
    }

    if (request.includeHashtags) {
      prompt += `\n\nInclude 3-5 relevant hashtags at the end.`;
    }

    return prompt;
  }

  /**
   * Parse and structure the generated content
   */
  private static parseGeneratedContent(
    text: string,
    request: ContentGenerationRequest
  ): GeneratedContentResult {
    const lines = text.trim().split('\n');
    let content = text.trim();
    let hashtags: string[] = [];
    let title: string | undefined;

    // Extract hashtags if present
    const hashtagPattern = /#\w+/g;
    const foundHashtags = text.match(hashtagPattern);
    if (foundHashtags) {
      hashtags = foundHashtags;
      // Remove hashtag line from content if they're on a separate line
      content = content.replace(/\n#[\w\s#]+$/, '').trim();
    }

    // Extract title for LinkedIn posts
    if (request.contentType === 'linkedin_post' && lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 100) {
        title = firstLine;
      }
    }

    const wordCount = content.split(/\s+/).length;
    const estimatedReadTime = Math.ceil(wordCount / 200); // Average reading speed

    return {
      content,
      title,
      hashtags,
      tone: request.tone || 'professional',
      metadata: {
        wordCount,
        estimatedReadTime,
        aiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      },
    };
  }

  /**
   * Generate multiple content variations for A/B testing
   */
  static async generateVariations(
    request: ContentGenerationRequest,
    count: number = 3
  ): Promise<GeneratedContentResult[]> {
    const variations = await Promise.all(
      Array.from({ length: count }, () => this.generateContent(request))
    );

    return variations;
  }

  /**
   * Optimize content for specific platform
   */
  static async optimizeForPlatform(
    content: string,
    platform: 'linkedin' | 'twitter'
  ): Promise<string> {
    const prompt = `Optimize this content for ${platform} while maintaining its core message and authenticity:

${content}

Requirements:
- ${platform === 'linkedin' ? 'Professional tone, add line breaks for readability, include relevant call-to-action' : 'Concise, impactful, under 280 characters, use thread format if needed'}
- Keep the authentic voice
- Enhance engagement potential

Return ONLY the optimized content.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return completion.choices[0].message.content || content;
  }
}
