import BaseRepository from './BaseRepository.js';

export class ChatParticipantRepository extends BaseRepository {
  constructor() {
    super('chat_participants');
  }

  async findByChat(chatId) {
    const query = `
      SELECT cp.*, u.name AS user_name, u.profile_picture_url AS user_avatar
      FROM chat_participants cp
      INNER JOIN users u ON cp.user_id = u.id
      WHERE cp.chat_id = $1
    `;
    const result = await this.pool.query(query, [chatId]);
    return result.rows;
  }

  async findByUser(userId) {
    return this.findMany('user_id = $1', [userId]);
  }

  async updateLastRead(chatId, userId) {
    const query = `
      UPDATE chat_participants
      SET last_read_at = CURRENT_TIMESTAMP
      WHERE chat_id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [chatId, userId]);
    return result.rows[0];
  }

  async addParticipant(chatId, userId) {
    const query = `
      INSERT INTO chat_participants (chat_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (chat_id, user_id) DO NOTHING
      RETURNING *
    `;
    const result = await this.pool.query(query, [chatId, userId]);
    return result.rows[0];
  }
}

export default ChatParticipantRepository;
