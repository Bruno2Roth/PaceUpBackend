export class EventParticipant {
  constructor({
    id,
    eventId,
    userId,
    status = 'registered',
    resultTimeSeconds,
    resultPosition,
    notes,
    createdAt,
  }) {
    this.id = id;
    this.eventId = eventId;
    this.userId = userId;
    this.status = status;
    this.resultTimeSeconds = resultTimeSeconds;
    this.resultPosition = resultPosition;
    this.notes = notes;
    this.createdAt = createdAt;
  }
}

export default EventParticipant;
