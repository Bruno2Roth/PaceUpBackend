export class Chat {
  constructor({
    id,
    chat_type,
    club_id,
    name,
    created_by,
    last_message_at,
    created_at,
    updated_at,
  }) {
    this.id = id;
    this.chat_type = chat_type;
    this.club_id = club_id;
    this.name = name;
    this.created_by = created_by;
    this.last_message_at = last_message_at;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

export default Chat;
