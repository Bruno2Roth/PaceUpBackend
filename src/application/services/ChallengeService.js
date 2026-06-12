import ChallengeRepository from '../../data/repositories/ChallengeRepository.js';
import XpService from './XpService.js';
import NotificationService from './NotificationService.js';

export class ChallengeService {
  constructor() {
    this.challengeRepository = new ChallengeRepository();
    this.xpService = new XpService();
    this.notificationService = new NotificationService();
  }

  async createChallenge(userId, challengeData) {
    if (!challengeData.title || !challengeData.challenge_type || !challengeData.goal_value || !challengeData.goal_unit) {
      const err = new Error('Missing required fields: title, challenge_type, goal_value, goal_unit');
      err.status = 400;
      throw err;
    }

    if (!challengeData.start_date || !challengeData.end_date) {
      const err = new Error('start_date and end_date are required');
      err.status = 400;
      throw err;
    }

    const startDate = new Date(challengeData.start_date);
    const endDate = new Date(challengeData.end_date);

    if (endDate <= startDate) {
      const err = new Error('end_date must be after start_date');
      err.status = 400;
      throw err;
    }

    const challenge = await this.challengeRepository.create({
      title: challengeData.title.trim(),
      description: challengeData.description || null,
      challenge_type: challengeData.challenge_type,
      goal_value: Number(challengeData.goal_value),
      goal_unit: challengeData.goal_unit,
      creator_id: userId,
      club_id: challengeData.club_id || null,
      start_date: startDate,
      end_date: endDate,
      participant_count: 0,
      prize_description: challengeData.prize_description || null,
      is_active: true,
    });

    return challenge;
  }

  async getChallenge(challengeId, requesterId = null) {
    const challenge = await this.challengeRepository.findNonDeletedById(challengeId);
    if (!challenge) {
      const err = new Error('Challenge not found');
      err.status = 404;
      throw err;
    }

    let participantCount = challenge.participant_count;
    let isParticipant = false;
    let myProgress = 0;

    if (requesterId) {
      isParticipant = await this.challengeRepository.isParticipant(challengeId, requesterId);
      if (isParticipant) {
        const participants = await this.challengeRepository.getParticipants(challengeId, 1, 0);
        const me = participants.find((p) => p.id === requesterId);
        if (me) myProgress = me.progress;
      }
      participantCount = await this.challengeRepository.getParticipantCount(challengeId);
    }

    return {
      ...challenge,
      participant_count: participantCount,
      is_participant: isParticipant,
      my_progress: myProgress,
    };
  }

  async getActiveChallenges(limit = 20, offset = 0) {
    return this.challengeRepository.findActiveChallenges(limit, offset);
  }

  async getChallengesByClub(clubId, limit = 20, offset = 0) {
    return this.challengeRepository.findByClubId(clubId, limit, offset);
  }

  async searchChallenges(query, limit = 20, offset = 0) {
    if (!query || query.trim().length === 0) {
      const err = new Error('Search query is required');
      err.status = 400;
      throw err;
    }
    return this.challengeRepository.searchChallenges(query.trim(), limit, offset);
  }

  async joinChallenge(challengeId, userId) {
    const challenge = await this.challengeRepository.findNonDeletedById(challengeId);
    if (!challenge) {
      const err = new Error('Challenge not found');
      err.status = 404;
      throw err;
    }

    if (new Date() > new Date(challenge.end_date)) {
      const err = new Error('Challenge has already ended');
      err.status = 400;
      throw err;
    }

    if (!challenge.is_active) {
      const err = new Error('Challenge is not active');
      err.status = 400;
      throw err;
    }

    const alreadyParticipant = await this.challengeRepository.isParticipant(challengeId, userId);
    if (alreadyParticipant) {
      const err = new Error('Already participating in this challenge');
      err.status = 409;
      throw err;
    }

    const participant = await this.challengeRepository.addParticipant(challengeId, userId);
    const participantCount = await this.challengeRepository.getParticipantCount(challengeId);
    await this.challengeRepository.updateParticipantCount(challengeId, participantCount);

    await this.xpService.awardXp(userId, 'challenge_joined');

    return { participant, participant_count: participantCount };
  }

  async leaveChallenge(challengeId, userId) {
    const challenge = await this.challengeRepository.findNonDeletedById(challengeId);
    if (!challenge) {
      const err = new Error('Challenge not found');
      err.status = 404;
      throw err;
    }

    const isParticipant = await this.challengeRepository.isParticipant(challengeId, userId);
    if (!isParticipant) {
      const err = new Error('Not participating in this challenge');
      err.status = 404;
      throw err;
    }

    await this.challengeRepository.removeParticipant(challengeId, userId);
    const participantCount = await this.challengeRepository.getParticipantCount(challengeId);
    await this.challengeRepository.updateParticipantCount(challengeId, participantCount);

    return { message: 'Successfully left the challenge' };
  }

  async updateParticipantProgress(challengeId, userId, activityData) {
    const challenge = await this.challengeRepository.findNonDeletedById(challengeId);
    if (!challenge) return null;

    const isParticipant = await this.challengeRepository.isParticipant(challengeId, userId);
    if (!isParticipant) return null;

    const sinceDate = challenge.start_date;
    const stats = await this.challengeRepository.getUserProgressOnDate(challengeId, userId, sinceDate);

    let progress = 0;
    const goalValue = Number(challenge.goal_value);

    switch (challenge.challenge_type) {
      case 'distance':
        progress = stats.total_distance;
        break;
      case 'elevation':
        progress = stats.total_elevation;
        break;
      case 'time':
        progress = stats.total_duration;
        break;
      case 'frequency':
        progress = stats.activity_count;
        break;
      default:
        progress = stats.total_distance;
    }

    await this.challengeRepository.updateProgress(challengeId, userId, progress);

    if (progress >= goalValue) {
      await this.xpService.awardXp(userId, 'challenge_completed', { challengeId });
    }

    return { progress, goal: goalValue, completed: progress >= goalValue };
  }

  async getChallengeLeaderboard(challengeId, limit = 20, offset = 0) {
    const challenge = await this.challengeRepository.findNonDeletedById(challengeId);
    if (!challenge) {
      const err = new Error('Challenge not found');
      err.status = 404;
      throw err;
    }

    return this.challengeRepository.getLeaderboard(challengeId, limit, offset);
  }

  async getUserChallenges(userId, status = 'active') {
    return this.challengeRepository.getUserChallenges(userId, status);
  }
}

export default ChallengeService;
