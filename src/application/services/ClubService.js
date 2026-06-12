import ClubRepository from '../../data/repositories/ClubRepository.js';
import ClubInvitationRepository from '../../data/repositories/ClubInvitationRepository.js';
import XpService from './XpService.js';
import NotificationService from './NotificationService.js';

export class ClubService {
  constructor() {
    this.clubRepository = new ClubRepository();
    this.clubInvitationRepository = new ClubInvitationRepository();
    this.xpService = new XpService();
    this.notificationService = new NotificationService();
  }

  async createClub(userId, clubData) {
    if (!clubData.name || clubData.name.trim().length === 0) {
      const err = new Error('Club name is required');
      err.status = 400;
      throw err;
    }

    const club = await this.clubRepository.create({
      name: clubData.name.trim(),
      description: clubData.description || null,
      logo_url: clubData.logo_url || null,
      founder_id: userId,
      is_private: clubData.is_private === true,
      member_count: 1,
    });

    await this.clubRepository.addMember(club.id, userId, 'admin');

    await this.xpService.awardXp(userId, 'club_created');

    return club;
  }

  async getClub(clubId, requesterId = null) {
    const club = await this.clubRepository.findNonDeletedById(clubId);
    if (!club) {
      const err = new Error('Club not found');
      err.status = 404;
      throw err;
    }

    const memberCount = await this.clubRepository.getMemberCount(clubId);
    let isMember = false;
    let memberRole = null;

    if (requesterId) {
      isMember = await this.clubRepository.isMember(clubId, requesterId);
      memberRole = await this.clubRepository.getMemberRole(clubId, requesterId);
    }

    return {
      ...club,
      member_count: memberCount,
      is_member: isMember,
      member_role: memberRole,
    };
  }

  async getPublicClubs(limit = 20, offset = 0) {
    return this.clubRepository.findPublicClubs(limit, offset);
  }

  async searchClubs(query, limit = 20, offset = 0) {
    if (!query || query.trim().length === 0) {
      const err = new Error('Search query is required');
      err.status = 400;
      throw err;
    }
    return this.clubRepository.searchClubs(query.trim(), limit, offset);
  }

  async updateClub(clubId, userId, updateData) {
    const club = await this.clubRepository.findNonDeletedById(clubId);
    if (!club) {
      const err = new Error('Club not found');
      err.status = 404;
      throw err;
    }

    const role = await this.clubRepository.getMemberRole(clubId, userId);
    if (!role || (role !== 'admin' && userId !== club.founder_id)) {
      const err = new Error('Only club admins can update the club');
      err.status = 403;
      throw err;
    }

    const allowedFields = ['name', 'description', 'logo_url', 'is_private'];
    const payload = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        payload[field] = updateData[field];
      }
    }

    if (Object.keys(payload).length === 0) {
      const err = new Error('No valid fields to update');
      err.status = 400;
      throw err;
    }

    return this.clubRepository.update(clubId, payload);
  }

  async deleteClub(clubId, userId) {
    const club = await this.clubRepository.findNonDeletedById(clubId);
    if (!club) {
      const err = new Error('Club not found');
      err.status = 404;
      throw err;
    }

    if (club.founder_id !== userId) {
      const err = new Error('Only the club founder can delete the club');
      err.status = 403;
      throw err;
    }

    return this.clubRepository.softDelete(clubId);
  }

  async joinClub(clubId, userId) {
    const club = await this.clubRepository.findNonDeletedById(clubId);
    if (!club) {
      const err = new Error('Club not found');
      err.status = 404;
      throw err;
    }

    if (club.is_private) {
      const err = new Error('This club is private. You need an invitation to join.');
      err.status = 403;
      throw err;
    }

    const alreadyMember = await this.clubRepository.isMember(clubId, userId);
    if (alreadyMember) {
      const err = new Error('Already a member of this club');
      err.status = 409;
      throw err;
    }

    await this.clubRepository.addMember(clubId, userId, 'member');
    const memberCount = await this.clubRepository.getMemberCount(clubId);
    await this.clubRepository.updateMemberCount(clubId, memberCount);

    await this.xpService.awardXp(userId, 'club_joined');

    return { message: 'Successfully joined the club' };
  }

  async leaveClub(clubId, userId) {
    const club = await this.clubRepository.findNonDeletedById(clubId);
    if (!club) {
      const err = new Error('Club not found');
      err.status = 404;
      throw err;
    }

    if (club.founder_id === userId) {
      const err = new Error('Club founder cannot leave. Transfer ownership or delete the club.');
      err.status = 403;
      throw err;
    }

    const isMember = await this.clubRepository.isMember(clubId, userId);
    if (!isMember) {
      const err = new Error('Not a member of this club');
      err.status = 404;
      throw err;
    }

    await this.clubRepository.removeMember(clubId, userId);
    const memberCount = await this.clubRepository.getMemberCount(clubId);
    await this.clubRepository.updateMemberCount(clubId, memberCount);

    return { message: 'Successfully left the club' };
  }

  async getClubMembers(clubId, limit = 20, offset = 0) {
    const club = await this.clubRepository.findNonDeletedById(clubId);
    if (!club) {
      const err = new Error('Club not found');
      err.status = 404;
      throw err;
    }

    return this.clubRepository.getMembers(clubId, limit, offset);
  }

  async getClubActivities(clubId, limit = 20, offset = 0) {
    const club = await this.clubRepository.findNonDeletedById(clubId);
    if (!club) {
      const err = new Error('Club not found');
      err.status = 404;
      throw err;
    }

    return this.clubRepository.getClubActivities(clubId, limit, offset);
  }

  async getUserClubs(userId) {
    return this.clubRepository.getUserClubs(userId);
  }

  async inviteMember(clubId, inviterId, inviteeId) {
    const club = await this.clubRepository.findNonDeletedById(clubId);
    if (!club) {
      const err = new Error('Club not found');
      err.status = 404;
      throw err;
    }

    const role = await this.clubRepository.getMemberRole(clubId, inviterId);
    if (!role || (role !== 'admin' && role !== 'moderator' && club.founder_id !== inviterId)) {
      const err = new Error('Only admins and moderators can invite members');
      err.status = 403;
      throw err;
    }

    const alreadyMember = await this.clubRepository.isMember(clubId, inviteeId);
    if (alreadyMember) {
      const err = new Error('User is already a member');
      err.status = 409;
      throw err;
    }

    const existingInvitation = await this.clubInvitationRepository.findPending(clubId, inviteeId);
    if (existingInvitation) {
      const err = new Error('User already has a pending invitation');
      err.status = 409;
      throw err;
    }

    const invitation = await this.clubInvitationRepository.create({
      club_id: clubId,
      user_id: inviteeId,
      invited_by: inviterId,
      status: 'pending',
    });

    await this.notificationService.notifyClubInvitation(inviteeId, inviterId, club);

    return invitation;
  }

  async acceptInvitation(invitationId, userId) {
    const invitation = await this.clubInvitationRepository.findById(invitationId);
    if (!invitation || invitation.status !== 'pending') {
      const err = new Error('Invitation not found or already processed');
      err.status = 404;
      throw err;
    }

    if (invitation.user_id !== userId) {
      const err = new Error('This invitation is not for you');
      err.status = 403;
      throw err;
    }

    await this.clubInvitationRepository.accept(invitationId);
    await this.clubRepository.addMember(invitation.club_id, userId, 'member');
    const memberCount = await this.clubRepository.getMemberCount(invitation.club_id);
    await this.clubRepository.updateMemberCount(invitation.club_id, memberCount);

    await this.xpService.awardXp(userId, 'club_joined');

    return { message: 'Invitation accepted' };
  }

  async rejectInvitation(invitationId, userId) {
    const invitation = await this.clubInvitationRepository.findById(invitationId);
    if (!invitation || invitation.status !== 'pending') {
      const err = new Error('Invitation not found or already processed');
      err.status = 404;
      throw err;
    }

    if (invitation.user_id !== userId) {
      const err = new Error('This invitation is not for you');
      err.status = 403;
      throw err;
    }

    await this.clubInvitationRepository.reject(invitationId);
    return { message: 'Invitation rejected' };
  }

  async getPendingInvitations(userId) {
    return this.clubInvitationRepository.findPendingByUser(userId);
  }

  async updateMemberRole(clubId, requesterId, targetUserId, newRole) {
    const club = await this.clubRepository.findNonDeletedById(clubId);
    if (!club) {
      const err = new Error('Club not found');
      err.status = 404;
      throw err;
    }

    const requesterRole = await this.clubRepository.getMemberRole(clubId, requesterId);
    if (club.founder_id !== requesterId && requesterRole !== 'admin') {
      const err = new Error('Only the founder or admins can change roles');
      err.status = 403;
      throw err;
    }

    if (targetUserId === club.founder_id) {
      const err = new Error('Cannot change the founder role');
      err.status = 403;
      throw err;
    }

    const validRoles = ['member', 'moderator', 'admin'];
    if (!validRoles.includes(newRole)) {
      const err = new Error('Invalid role. Must be: member, moderator, or admin');
      err.status = 400;
      throw err;
    }

    const target = await this.clubRepository.findNonDeletedById(targetUserId);
    if (!target) {
      const err = new Error('Target user not found');
      err.status = 404;
      throw err;
    }

    await this.clubRepository.pool.query(`
      UPDATE club_members SET role = $1 WHERE club_id = $2 AND user_id = $3
    `, [newRole, clubId, targetUserId]);

    return { message: `Role updated to ${newRole}` };
  }
}

export default ClubService;
