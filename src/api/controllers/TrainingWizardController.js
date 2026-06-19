import TrainingWizardService from '../../application/services/TrainingWizardService.js';

export class TrainingWizardController {
  constructor() {
    this.trainingWizardService = new TrainingWizardService();
  }

  async start(req, res, next) {
    try {
      const result = await this.trainingWizardService.startSession(req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async answer(req, res, next) {
    try {
      const { sessionId, questionKey, answer } = req.body;
      if (!sessionId || !questionKey || answer === undefined) {
        return res.status(400).json({ error: 'sessionId, questionKey y answer son requeridos' });
      }
      const result = await this.trainingWizardService.answerQuestion(sessionId, req.userId, questionKey, answer);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async current(req, res, next) {
    try {
      const result = await this.trainingWizardService.getCurrentSession(req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async finish(req, res, next) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId es requerido' });
      }
      const result = await this.trainingWizardService.finishSession(sessionId, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async generatePlan(req, res, next) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId es requerido' });
      }
      const result = await this.trainingWizardService.generatePlan(sessionId, req.userId);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default TrainingWizardController;
