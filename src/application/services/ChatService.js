import ChatRepository from '../../data/repositories/ChatRepository.js';
import ChatMessageRepository from '../../data/repositories/ChatMessageRepository.js';
import ChatParticipantRepository from '../../data/repositories/ChatParticipantRepository.js';
import { emitToUser } from '../../sockets/emitter.js';

export class ChatService {
  constructor() {
    this.chatRepository = new ChatRepository();
    this.chatMessageRepository = new ChatMessageRepository();
    this.chatParticipantRepository = new ChatParticipantRepository();
  }

  async getChats(userId) {
    const chats = await this.chatRepository.findUserChats(userId);
    const result = [];
    for (const chat of chats) {
      const lastMessage = (await this.chatMessageRepository.findByChat(chat.id, 1, 0))[0] || null;
      const unreadCount = await this.chatMessageRepository.countUnread(chat.id, userId);
      result.push({
        ...chat,
        last_message: lastMessage,
        unread_count: unreadCount,
      });
    }
    return result;
  }

  async getOrCreateDirectChat(user1Id, user2Id) {
    let chat = await this.chatRepository.findDirectChat(user1Id, user2Id);
    if (!chat) {
      chat = await this.chatRepository.createDirectChat(user1Id, user2Id);
    }
    return chat;
  }

  async getClubChat(clubId) {
    let chat = await this.chatRepository.findClubChat(clubId);
    if (!chat) {
      const err = new Error('Club chat not found');
      err.status = 404;
      throw err;
    }
    return chat;
  }

  async getMessages(chatId, userId, limit = 50, before = null) {
    let messages;
    if (before) {
      const query = `
        SELECT cm.*, u.name AS sender_name, u.profile_picture_url AS sender_avatar
        FROM chat_messages cm
        LEFT JOIN users u ON cm.sender_id = u.id
        WHERE cm.chat_id = $1
          AND cm.created_at < (SELECT created_at FROM chat_messages WHERE id = $2)
        ORDER BY cm.created_at DESC
        LIMIT $3
      `;
      const result = await this.chatMessageRepository.pool.query(query, [chatId, before, limit]);
      messages = result.rows;
    } else {
      messages = await this.chatMessageRepository.findByChat(chatId, limit, 0);
    }
    await this.chatParticipantRepository.updateLastRead(chatId, userId);
    return messages;
  }

  async sendMessage(chatId, userId, content, messageType = 'text', imageUrl = null) {
    const message = await this.chatMessageRepository.create({
      chat_id: chatId,
      sender_id: userId,
      message_type: messageType,
      content,
      image_url: imageUrl,
      metadata: {},
    });

    await this.chatRepository.update(chatId, { last_message_at: new Date() });

    const enriched = {
      ...message,
      sender_name: null,
      sender_avatar: null,
    };

    const userResult = await this.chatMessageRepository.pool.query(
      'SELECT name, profile_picture_url FROM users WHERE id = $1',
      [userId],
    );
    if (userResult.rows[0]) {
      enriched.sender_name = userResult.rows[0].name;
      enriched.sender_avatar = userResult.rows[0].profile_picture_url;
    }

    const participants = await this.chatParticipantRepository.findByChat(chatId);
    for (const participant of participants) {
      if (participant.user_id !== userId) {
        emitToUser(participant.user_id, 'chat_message', enriched);
      }
    }

    return enriched;
  }

  async addParticipant(chatId, userId) {
    return this.chatParticipantRepository.addParticipant(chatId, userId);
  }

  async markAsRead(chatId, userId) {
    return this.chatParticipantRepository.updateLastRead(chatId, userId);
  }
}

export default ChatService;
