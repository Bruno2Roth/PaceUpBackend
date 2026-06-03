export class Achievement {
  constructor({
    id,
    user_id,
    achievement_type,
    title,
    description,
    icon_url,
    earned_at,
    metadata,
    created_at,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.achievement_type = achievement_type;
    this.title = title;
    this.description = description;
    this.icon_url = icon_url;
    this.earned_at = earned_at;
    this.metadata = metadata;
    this.created_at = created_at;
  }
}

export default Achievement;
