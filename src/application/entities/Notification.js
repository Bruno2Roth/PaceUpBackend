export class Notification {
  constructor({
    id,
    user_id,
    type,
    title,
    message,
    related_user_id,
    related_activity_id,
    related_challenge_id,
    is_read = false,
    read_at,
    created_at,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.type = type;
    this.title = title;
    this.message = message;
    this.related_user_id = related_user_id;
    this.related_activity_id = related_activity_id;
    this.related_challenge_id = related_challenge_id;
    this.is_read = is_read;
    this.read_at = read_at;
    this.created_at = created_at;
  }

  markAsRead() {
    this.is_read = true;
    this.read_at = new Date();
  }
}

export default Notification;
