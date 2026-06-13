import ReferralRepository from '../../data/repositories/ReferralRepository.js';
import UserRepository from '../../data/repositories/UserRepository.js';
import AchievementRepository from '../../data/repositories/AchievementRepository.js';
import XpService from './XpService.js';
import NotificationService from './NotificationService.js';
import crypto from 'crypto';

export class ReferralService {
  constructor() {
    this.referralRepository = new ReferralRepository();
    this.userRepository = new UserRepository();
    this.achievementRepository = new AchievementRepository();
    this.xpService = new XpService();
    this.notificationService = new NotificationService();
  }

  async getReferralInfo(userId) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user.referral_code) {
      const code = this._generateCode(user.name || userId);
      await this.userRepository.update(userId, { referral_code: code });
      user.referral_code = code;
    }

    const count = await this.referralRepository.countByReferrer(userId);
    const referrals = await this.referralRepository.findByReferrer(userId);

    return {
      referral_code: user.referral_code,
      referral_url: `${process.env.APP_URL || 'https://paceup.app'}/signup?ref=${user.referral_code}`,
      total_referrals: count,
      rewards: { xp_per_referral: 500, premium_days_per_referral: 7 },
      referrals,
    };
  }

  async invite(userId, email) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user.referral_code) {
      const code = this._generateCode(user.name || userId);
      await this.userRepository.update(userId, { referral_code: code });
      user.referral_code = code;
    }

    const referral = await this.referralRepository.create({
      referrer_id: userId,
      referral_code: user.referral_code,
      status: 'pending',
      metadata: JSON.stringify({ invited_email: email }),
    });

    try {
      await this.notificationService.createNotification({
        userId,
        type: 'referral_invite',
        title: 'Invitación enviada',
        message: `Has invitado a ${email} a unirse a PaceUp`,
        metadata: { email, referral_id: referral.id },
      });
    } catch {}

    return referral;
  }

  async completeReferral(referralCode, newUserId) {
    const ref = await this.referralRepository.findByCode(referralCode);
    if (!ref) return;

    const existing = await this.userRepository.findNonDeletedById(newUserId);
    if (!existing.referred_by) {
      await this.userRepository.update(newUserId, { referred_by: ref.referrer_id });
    }

    await this.referralRepository.update(ref.id, {
      referred_id: newUserId,
      status: 'completed',
      reward_xp: 500,
      reward_premium_days: 7,
      reward_achievement: 'referral_friend',
      completed_at: new Date(),
    });

    try {
      await this.xpService.awardXp(ref.referrer_id, 'referral_completed', { referredUserId: newUserId });
    } catch {}

    try {
      const def = { achievement_type: 'referral_friend', title: 'Embajador PaceUp', description: 'Invita a un amigo a unirse a PaceUp', icon_url: '/achievements/referral.png' };
      const has = await this.achievementRepository.hasAchievement(ref.referrer_id, 'referral_friend');
      if (!has) {
        const ach = await this.achievementRepository.create({
          user_id: ref.referrer_id,
          achievement_type: 'referral_friend',
          title: def.title,
          description: def.description,
          icon_url: def.icon_url,
          metadata: { referred_user_id: newUserId },
        });
        try { await this.notificationService.notifyAchievement(ref.referrer_id, ach); } catch {}
      }
    } catch {}

    try {
      await this.notificationService.createNotification({
        userId: ref.referrer_id,
        type: 'referral_bonus',
        title: 'Recompensa por referido',
        message: 'Tu amigo se ha unido a PaceUp. Has recibido 500 XP y 7 días de Premium.',
        metadata: { referred_user_id: newUserId, xp: 500, premium_days: 7 },
      });
    } catch {}
  }

  async getHistory(userId) {
    return this.referralRepository.findByReferrer(userId);
  }

  _generateCode(name) {
    const clean = (name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8);
    const suffix = crypto.randomBytes(3).toString('hex');
    return `${clean || 'pace'}-${suffix}`;
  }
}
export default ReferralService;
