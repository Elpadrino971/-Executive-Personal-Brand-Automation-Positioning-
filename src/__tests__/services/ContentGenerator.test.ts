import { ContentGenerator } from '../../services/ai/ContentGenerator';

describe('ContentGenerator', () => {
  describe('generateContent', () => {
    it('should generate LinkedIn post', async () => {
      const result = await ContentGenerator.generateContent({
        userId: 1,
        topic: 'AI in Business',
        contentType: 'linkedin_post',
        tone: 'professional',
      });

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.metadata.wordCount).toBeGreaterThan(0);
    }, 30000);

    it('should generate Twitter post', async () => {
      const result = await ContentGenerator.generateContent({
        userId: 1,
        topic: 'Leadership',
        contentType: 'twitter_post',
      });

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeLessThanOrEqual(280);
    }, 30000);
  });

  describe('generateVariations', () => {
    it('should generate multiple content variations', async () => {
      const variations = await ContentGenerator.generateVariations(
        {
          userId: 1,
          topic: 'Innovation',
          contentType: 'linkedin_post',
        },
        3
      );

      expect(variations).toHaveLength(3);
      expect(variations[0].content).not.toBe(variations[1].content);
    }, 60000);
  });
});
