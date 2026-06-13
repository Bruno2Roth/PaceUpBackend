import ClubService from '../../application/services/ClubService.js';

export class ClubController {
  constructor() {
    this.clubService = new ClubService();
  }

  async createClub(req, res, next) {
    try {
      const club = await this.clubService.createClub(req.userId, req.body);
      return res.status(201).json({ club });
    } catch (error) {
      next(error);
    }
  }

  async getClub(req, res, next) {
    try {
      const club = await this.clubService.getClub(req.params.id, req.userId);
      return res.status(200).json({ club });
    } catch (error) {
      next(error);
    }
  }

  async getPublicClubs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const clubs = await this.clubService.getPublicClubs(limit, offset);
      return res.status(200).json({ clubs });
    } catch (error) {
      next(error);
    }
  }

  async searchClubs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const query = req.query.q || req.query.query || req.query.name || req.query.search;
      const clubs = await this.clubService.searchClubs(query, limit, offset);
      return res.status(200).json({ clubs });
    } catch (error) {
      next(error);
    }
  }

  async updateClub(req, res, next) {
    try {
      const club = await this.clubService.updateClub(req.params.id, req.userId, req.body);
      return res.status(200).json({ club });
    } catch (error) {
      next(error);
    }
  }

  async deleteClub(req, res, next) {
    try {
      await this.clubService.deleteClub(req.params.id, req.userId);
      return res.status(200).json({ message: 'Club deleted' });
    } catch (error) {
      next(error);
    }
  }

  async joinClub(req, res, next) {
    try {
      const result = await this.clubService.joinClub(req.params.id, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async leaveClub(req, res, next) {
    try {
      const result = await this.clubService.leaveClub(req.params.id, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getClubMembers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const members = await this.clubService.getClubMembers(req.params.id, limit, offset);
      return res.status(200).json({ members });
    } catch (error) {
      next(error);
    }
  }

  async getClubActivities(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const activities = await this.clubService.getClubActivities(req.params.id, limit, offset);
      return res.status(200).json({ activities });
    } catch (error) {
      next(error);
    }
  }

  async getUserClubs(req, res, next) {
    try {
      const clubs = await this.clubService.getUserClubs(req.userId);
      return res.status(200).json({ clubs });
    } catch (error) {
      next(error);
    }
  }

  async inviteMember(req, res, next) {
    try {
      const invitation = await this.clubService.inviteMember(req.params.id, req.userId, req.body.user_id);
      return res.status(201).json({ invitation });
    } catch (error) {
      next(error);
    }
  }

  async acceptInvitation(req, res, next) {
    try {
      const result = await this.clubService.acceptInvitation(req.params.invitationId, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async rejectInvitation(req, res, next) {
    try {
      const result = await this.clubService.rejectInvitation(req.params.invitationId, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPendingInvitations(req, res, next) {
    try {
      const invitations = await this.clubService.getPendingInvitations(req.userId);
      return res.status(200).json({ invitations });
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const result = await this.clubService.updateMemberRole(
        req.params.id, req.userId, req.body.user_id, req.body.role,
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default ClubController;
