import { query } from '../config/database';

export interface VoiceProfile {
  id: number;
  user_id: number;
  tone?: string;
  style_keywords?: string[];
  common_phrases?: string[];
  vocabulary_level?: string;
  sentence_structure?: any;
  topics_of_interest?: string[];
  analyzed_samples_count: number;
  last_analysis?: Date;
  created_at: Date;
  updated_at: Date;
}

export class VoiceProfileModel {
  static async create(userId: number, profileData: Partial<VoiceProfile>): Promise<VoiceProfile> {
    const result = await query(
      `INSERT INTO voice_profiles
       (user_id, tone, style_keywords, common_phrases, vocabulary_level,
        sentence_structure, topics_of_interest, analyzed_samples_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id)
       DO UPDATE SET
         tone = EXCLUDED.tone,
         style_keywords = EXCLUDED.style_keywords,
         common_phrases = EXCLUDED.common_phrases,
         vocabulary_level = EXCLUDED.vocabulary_level,
         sentence_structure = EXCLUDED.sentence_structure,
         topics_of_interest = EXCLUDED.topics_of_interest,
         analyzed_samples_count = voice_profiles.analyzed_samples_count + 1,
         last_analysis = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        profileData.tone,
        profileData.style_keywords,
        profileData.common_phrases,
        profileData.vocabulary_level,
        JSON.stringify(profileData.sentence_structure || {}),
        profileData.topics_of_interest,
        1
      ]
    );

    return result.rows[0];
  }

  static async findByUserId(userId: number): Promise<VoiceProfile | null> {
    const result = await query('SELECT * FROM voice_profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }

  static async update(userId: number, updates: Partial<VoiceProfile>): Promise<VoiceProfile> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'user_id' && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const result = await query(
      `UPDATE voice_profiles SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async incrementAnalysisCount(userId: number): Promise<void> {
    await query(
      `UPDATE voice_profiles
       SET analyzed_samples_count = analyzed_samples_count + 1,
           last_analysis = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [userId]
    );
  }
}
