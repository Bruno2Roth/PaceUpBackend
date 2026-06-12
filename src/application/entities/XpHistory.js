export class XpHistory {
  constructor({ id, user_id, xp_event_id, xp_amount, activity_id, challenge_id, achievement_id, created_at }) {
    this.id = id;
    this.user_id = user_id;
    this.xp_event_id = xp_event_id;
    this.xp_amount = xp_amount;
    this.activity_id = activity_id;
    this.challenge_id = challenge_id;
    this.achievement_id = achievement_id;
    this.created_at = created_at;
  }
}

export default XpHistory;
