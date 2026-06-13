export class ChatMessage {
  constructor({
    id,
    chat_id,
    sender_id,
    message_type,
    content,
    image_url,
    metadata,
    created_at,
  }) {
    this.id = id;
    this.chat_id = chat_id;
    this.sender_id = sender_id;
    this.message_type = message_type;
    this.content = content;
    this.image_url = image_url;
    this.metadata = metadata;
    this.created_at = created_at;
  }
}

export default ChatMessage;
