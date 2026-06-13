import ModerationService from '../../application/services/ModerationService.js';

export class ModerationController {
  constructor() {
    this.moderationService = new ModerationService();
  }

  async createReport(req, res, next) {
    try {
      const { reported_user_id, entity_type, entity_id, reason, description } = req.body;
      if (!entity_type || !entity_id || !reason) {
        return res.status(400).json({ error: 'entity_type, entity_id, and reason are required' });
      }
      const report = await this.moderationService.createReport({
        reporterId: req.userId,
        reportedUserId: reported_user_id || null,
        entityType: entity_type,
        entityId: entity_id,
        reason,
        description,
      });
      return res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  }
}

export default ModerationController;
