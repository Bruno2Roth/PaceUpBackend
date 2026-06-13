export class Event {
  constructor({
    id,
    title,
    description,
    eventType,
    clubId,
    createdBy,
    location,
    lat,
    lng,
    startDate,
    endDate,
    maxParticipants = 0,
    participantCount = 0,
    distanceKm,
    difficulty,
    isPaid = false,
    price,
    currency = 'USD',
    metadata = {},
    isCanceled = false,
    isPrivate = false,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.eventType = eventType;
    this.clubId = clubId;
    this.createdBy = createdBy;
    this.location = location;
    this.lat = lat;
    this.lng = lng;
    this.startDate = startDate;
    this.endDate = endDate;
    this.maxParticipants = maxParticipants;
    this.participantCount = participantCount;
    this.distanceKm = distanceKm;
    this.difficulty = difficulty;
    this.isPaid = isPaid;
    this.price = price;
    this.currency = currency;
    this.metadata = metadata;
    this.isCanceled = isCanceled;
    this.isPrivate = isPrivate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default Event;
