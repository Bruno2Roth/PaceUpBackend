export class SponsoredChallenge {
  constructor({ id, sponsorId, title, description, challengeType, goalValue, goalUnit, rewardType, rewardValue, startsAt, endsAt, isActive, createdAt, updatedAt }) {
    this.id = id;
    this.sponsorId = sponsorId;
    this.title = title;
    this.description = description;
    this.challengeType = challengeType;
    this.goalValue = goalValue;
    this.goalUnit = goalUnit;
    this.rewardType = rewardType;
    this.rewardValue = rewardValue;
    this.startsAt = startsAt;
    this.endsAt = endsAt;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
export default SponsoredChallenge;
