export class ChatParticipant {
  constructor({
    id,
    chat_id,
    user_id,
    last_read_at,
    created_at,
  }) {
    this.id = id;
    this.chat_id = chat_id;
    this.user_id = user_id;
    this.last_read_at = last_read_at;
    this.created_at = created_at;
  }
}

export default ChatParticipant;
