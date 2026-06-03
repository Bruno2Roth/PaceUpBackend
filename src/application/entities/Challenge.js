export class Challenge {
  constructor({
    id,
    title,
    description,
    challenge_type,
    goal_value,
    goal_unit,
    creator_id,
    club_id,
    start_date,
    end_date,
    participant_count = 0,
    prize_description,
    is_active = true,
    created_at,
    updated_at,
    deleted_at,
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.challenge_type = challenge_type;
    this.goal_value = goal_value;
    this.goal_unit = goal_unit;
    this.creator_id = creator_id;
    this.club_id = club_id;
    this.start_date = start_date;
    this.end_date = end_date;
    this.participant_count = participant_count;
    this.prize_description = prize_description;
    this.is_active = is_active;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.deleted_at = deleted_at;
  }

  isDistance() {
    return this.challenge_type === 'distance';
  }

  isElevation() {
    return this.challenge_type === 'elevation';
  }

  isFrequency() {
    return this.challenge_type === 'frequency';
  }

  isTime() {
    return this.challenge_type === 'time';
  }

  isCustom() {
    return this.challenge_type === 'custom';
  }

  hasStarted() {
    return new Date() >= new Date(this.start_date);
  }

  hasEnded() {
    return new Date() > new Date(this.end_date);
  }

  getDaysRemaining() {
    const today = new Date();
    const end = new Date(this.end_date);
    const diff = end - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}

export default Challenge;
