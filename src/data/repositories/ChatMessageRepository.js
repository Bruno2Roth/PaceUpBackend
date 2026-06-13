import BaseRepository from './BaseRepository.js';

export class ChatMessageRepository extends BaseRepository {
  constructor() {
    super('chat_messages');
  }

  async findByChat(chatId, limit = 50, offset = 0) {
    const query = `
      SELECT cm.*, u.name AS sender_name, u.profile_picture_url AS sender_avatar
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.chat_id = $1
      ORDER BY cm.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [chatId, limit, offset]);
    return result.rows;
  }

  async findRecent(chatId, since) {
    const query = `
      SELECT cm.*, u.name AS sender_name, u.profile_picture_url AS sender_avatar
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.chat_id = $1 AND cm.created_at > $2
      ORDER BY cm.created_at ASC
    `;
    const result = await this.pool.query(query, [chatId, since]);
    return result.rows;
  }

  async countUnread(chatId, userId) {
    const query = `
      SELECT COUNT(*)::int as count
      FROM chat_messages cm
      WHERE cm.chat_id = $1
        AND cm.sender_id != $2
        AND cm.created_at > COALESCE(
          (SELECT last_read_at FROM chat_participants
           WHERE chat_id = $1 AND user_id = $2),
          '1970-01-01'
        )
    `;
    const result = await this.pool.query(query, [chatId, userId]);
    return result.rows[0].count;
  }
}

export default ChatMessageRepository;
