import BaseRepository from './BaseRepository.js';

export class ChatRepository extends BaseRepository {
  constructor() {
    super('chats');
  }

  async findUserChats(userId) {
    const query = `
      SELECT c.*, cp.last_read_at
      FROM chats c
      INNER JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = $1
      ORDER BY c.last_message_at DESC NULLS LAST
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async findDirectChat(user1Id, user2Id) {
    const query = `
      SELECT c.* FROM chats c
      WHERE c.chat_type = 'direct'
        AND EXISTS (
          SELECT 1 FROM chat_participants cp1
          WHERE cp1.chat_id = c.id AND cp1.user_id = $1
        )
        AND EXISTS (
          SELECT 1 FROM chat_participants cp2
          WHERE cp2.chat_id = c.id AND cp2.user_id = $2
        )
      LIMIT 1
    `;
    const result = await this.pool.query(query, [user1Id, user2Id]);
    return result.rows[0];
  }

  async findClubChat(clubId) {
    return this.findOne('club_id = $1', [clubId]);
  }

  async createDirectChat(user1Id, user2Id) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const chatResult = await client.query(`
        INSERT INTO chats (chat_type, created_by)
        VALUES ('direct', $1)
        RETURNING *
      `, [user1Id]);
      const chat = chatResult.rows[0];
      await client.query(`
        INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)
      `, [chat.id, user1Id, user2Id]);
      await client.query('COMMIT');
      return chat;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createClubChat(clubId, name, createdBy) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const chatResult = await client.query(`
        INSERT INTO chats (chat_type, club_id, name, created_by)
        VALUES ('club', $1, $2, $3)
        RETURNING *
      `, [clubId, name, createdBy]);
      const chat = chatResult.rows[0];
      await client.query(`
        INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2)
      `, [chat.id, createdBy]);
      await client.query('COMMIT');
      return chat;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default ChatRepository;
