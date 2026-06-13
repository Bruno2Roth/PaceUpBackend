import EventService from '../../application/services/EventService.js';

export class EventController {
  constructor() {
    this.eventService = new EventService();
  }

  async create(req, res, next) {
    try {
      const event = await this.eventService.create(req.body, req.userId);
      return res.status(201).json({ event });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const events = await this.eventService.list(req.query);
      return res.status(200).json({ data: events });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const event = await this.eventService.getById(req.params.id);
      return res.status(200).json({ event });
    } catch (error) {
      next(error);
    }
  }

  async join(req, res, next) {
    try {
      const result = await this.eventService.join(req.params.id, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async leave(req, res, next) {
    try {
      const result = await this.eventService.leave(req.params.id, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default EventController;
