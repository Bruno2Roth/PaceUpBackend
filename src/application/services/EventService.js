import EventRepository from '../../data/repositories/EventRepository.js';
import EventParticipantRepository from '../../data/repositories/EventParticipantRepository.js';

export class EventService {
  constructor() {
    this.eventRepository = new EventRepository();
    this.eventParticipantRepository = new EventParticipantRepository();
  }

  async create(data, userId) {
    if (!data.title || !data.eventType || !data.startDate) {
      const err = new Error('Missing required fields: title, eventType, startDate');
      err.status = 400;
      throw err;
    }

    const event = await this.eventRepository.create({
      title: data.title.trim(),
      description: data.description || null,
      event_type: data.eventType,
      club_id: data.clubId || null,
      created_by: userId,
      location: data.location || null,
      lat: data.lat || null,
      lng: data.lng || null,
      start_date: new Date(data.startDate),
      end_date: data.endDate ? new Date(data.endDate) : null,
      max_participants: data.maxParticipants || 0,
      participant_count: 0,
      distance_km: data.distanceKm || null,
      difficulty: data.difficulty || null,
      is_paid: data.isPaid || false,
      price: data.price || null,
      currency: data.currency || 'USD',
      metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
      is_canceled: false,
      is_private: data.isPrivate || false,
    });

    return event;
  }

  async getById(id) {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }
    return event;
  }

  async list(query = {}) {
    const { type, nearLat, nearLng, radiusKm = 10, limit = 20, offset = 0 } = query;

    if (nearLat && nearLng) {
      return this.eventRepository.findNearby(
        parseFloat(nearLat), parseFloat(nearLng),
        parseFloat(radiusKm), parseInt(limit, 10), parseInt(offset, 10),
      );
    }

    if (type) {
      return this.eventRepository.findByType(type, parseInt(limit, 10), parseInt(offset, 10));
    }

    return this.eventRepository.findAll(parseInt(limit, 10), parseInt(offset, 10));
  }

  async join(eventId, userId) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    if (event.is_canceled) {
      const err = new Error('Event has been canceled');
      err.status = 400;
      throw err;
    }

    if (event.max_participants > 0 && event.participant_count >= event.max_participants) {
      const err = new Error('Event is full');
      err.status = 400;
      throw err;
    }

    const existing = await this.eventParticipantRepository.findByUserAndEvent(userId, eventId);
    if (existing) {
      if (existing.status === 'canceled') {
        await this.eventParticipantRepository.update(existing.id, { status: 'registered' });
        const count = await this.eventParticipantRepository.countByEvent(eventId);
        await this.eventRepository.update(eventId, { participant_count: count });
        return { participant: { ...existing, status: 'registered' }, participant_count: count };
      }
      const err = new Error('Already registered for this event');
      err.status = 409;
      throw err;
    }

    const participant = await this.eventParticipantRepository.create({
      event_id: eventId,
      user_id: userId,
      status: 'registered',
    });

    const count = await this.eventParticipantRepository.countByEvent(eventId);
    await this.eventRepository.update(eventId, { participant_count: count });

    return { participant, participant_count: count };
  }

  async leave(eventId, userId) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    const existing = await this.eventParticipantRepository.findByUserAndEvent(userId, eventId);
    if (!existing) {
      const err = new Error('Not registered for this event');
      err.status = 404;
      throw err;
    }

    await this.eventParticipantRepository.update(existing.id, { status: 'canceled' });

    const count = await this.eventParticipantRepository.countByEvent(eventId);
    await this.eventRepository.update(eventId, { participant_count: count });

    return { message: 'Successfully left the event' };
  }

  async getParticipants(eventId) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }
    return this.eventParticipantRepository.findByEvent(eventId);
  }

  async cancel(eventId, userId) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }
    if (event.created_by !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    return this.eventRepository.update(eventId, { is_canceled: true });
  }
}

export default EventService;
