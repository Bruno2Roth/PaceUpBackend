export class XpEvent {
  constructor({ id, event_key, xp_amount, description, created_at }) {
    this.id = id;
    this.event_key = event_key;
    this.xp_amount = xp_amount;
    this.description = description;
    this.created_at = created_at;
  }
}

export default XpEvent;
