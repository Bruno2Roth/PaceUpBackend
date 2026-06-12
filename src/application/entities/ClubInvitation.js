export class ClubInvitation {
  constructor({ id, club_id, user_id, invited_by, status, created_at, updated_at }) {
    this.id = id;
    this.club_id = club_id;
    this.user_id = user_id;
    this.invited_by = invited_by;
    this.status = status;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  isPending() { return this.status === 'pending'; }
  isAccepted() { return this.status === 'accepted'; }
  isRejected() { return this.status === 'rejected'; }
}

export default ClubInvitation;
