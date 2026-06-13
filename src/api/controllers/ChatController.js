import ChatService from '../../application/services/ChatService.js';

export class ChatController {
  constructor() {
    this.chatService = new ChatService();
  }

  async list(req, res, next) {
    try {
      const chats = await this.chatService.getChats(req.userId);
      return res.status(200).json({ chats });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit, 10) || 50;
      const before = req.query.before || null;
      const messages = await this.chatService.getMessages(id, req.userId, limit, before);
      return res.status(200).json({ messages });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { content, message_type, image_url } = req.body;
      const message = await this.chatService.sendMessage(id, req.userId, content, message_type, image_url);
      return res.status(201).json({ message });
    } catch (error) {
      next(error);
    }
  }
}

export default ChatController;
