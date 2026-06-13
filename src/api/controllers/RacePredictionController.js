import RacePredictionService from '../../application/services/RacePredictionService.js';

export class RacePredictionController {
  constructor() {
    this.racePredictionService = new RacePredictionService();
  }

  async getPredictions(req, res, next) {
    try {
      const predictions = await this.racePredictionService.getAllPredictions(req.userId);
      return res.status(200).json({ data: predictions });
    } catch (error) {
      next(error);
    }
  }

  async predictDistance(req, res, next) {
    try {
      const { distance } = req.body;
      if (!distance) {
        return res.status(400).json({ error: 'distance is required' });
      }
      const prediction = await this.racePredictionService.predictRaceTime(req.userId, parseInt(distance, 10));
      await this.racePredictionService.racePredictionRepository.upsert(req.userId, parseInt(distance, 10), prediction);
      return res.status(200).json({ data: prediction });
    } catch (error) {
      next(error);
    }
  }

  async simulateTraining(req, res, next) {
    try {
      const simulation = await this.racePredictionService.simulateTraining(req.userId, req.body);
      return res.status(201).json({ data: simulation });
    } catch (error) {
      next(error);
    }
  }

  async getSimulations(req, res, next) {
    try {
      const simulations = await this.racePredictionService.getSimulations(req.userId);
      return res.status(200).json({ data: simulations });
    } catch (error) {
      next(error);
    }
  }
}

export default RacePredictionController;
