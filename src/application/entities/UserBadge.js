export class UserBadge {
  constructor({
    id,
    user_id,
    badge_id,
    earned_at,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.badge_id = badge_id;
    this.earned_at = earned_at;
  }
}

export default UserBadge;
