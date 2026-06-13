export class Referral {
  constructor({ id, referrerId, referredId, referralCode, status, rewardXp, rewardPremiumDays, rewardAchievement, completedAt, createdAt, updatedAt }) {
    this.id = id;
    this.referrerId = referrerId;
    this.referredId = referredId;
    this.referralCode = referralCode;
    this.status = status;
    this.rewardXp = rewardXp;
    this.rewardPremiumDays = rewardPremiumDays;
    this.rewardAchievement = rewardAchievement;
    this.completedAt = completedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
export default Referral;
