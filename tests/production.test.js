import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../src/data/repositories/AuditLogRepository.js', () => ({
  default: jest.fn(() => ({
    create: jest.fn(),
    findRecent: jest.fn(),
    findByUser: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  })),
}));

jest.unstable_mockModule('../src/data/repositories/UserRepository.js', () => ({
  default: jest.fn(() => ({
    findByEmail: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByEmailOrUsername: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateLastLogin: jest.fn(),
    softDelete: jest.fn(),
    findNonDeletedById: jest.fn(),
  })),
}));

jest.unstable_mockModule('../src/data/repositories/VerificationTokenRepository.js', () => ({
  default: jest.fn(() => ({
    createToken: jest.fn(),
    findByToken: jest.fn(),
    markAsUsed: jest.fn(),
    invalidateUserTokens: jest.fn(),
  })),
}));

jest.unstable_mockModule('../src/data/repositories/ModerationRepository.js', () => ({
  ReportRepository: jest.fn(() => ({
    create: jest.fn(),
    findPending: jest.fn(),
    review: jest.fn(),
  })),
  ModerationActionRepository: jest.fn(() => ({
    create: jest.fn(),
    findActiveByUser: jest.fn(),
  })),
}));

jest.unstable_mockModule('../src/configs/queue.js', () => ({
  addJob: jest.fn(() => Promise.resolve({ id: 'mock-job' })),
  queueNames: {
    NOTIFICATIONS: 'notifications',
    EMAILS: 'emails',
    INTEGRATIONS: 'integrations',
    RANKINGS: 'rankings',
    ACHIEVEMENTS: 'achievements',
    METRICS: 'metrics',
    AI_REPORTS: 'ai-reports',
  },
  default: {},
}));

jest.unstable_mockModule('../src/configs/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockUser = {
  id: 1, email: 'test@test.com', username: 'testuser', name: 'Test',
  password: '$2a$10$hashed', role: 'USER', is_active: true,
  is_banned: false, is_suspended: false, email_verified_at: null,
};

describe('AuthService', () => {
  let AuthServiceModule;

  beforeAll(async () => {
    AuthServiceModule = await import('../src/application/services/AuthService.js');
  });

  describe('Email Verification', () => {
    let service;
    beforeEach(() => {
      service = new AuthServiceModule.default();
      service.userRepository.findByEmail.mockResolvedValue(null);
      service.userRepository.findOne.mockResolvedValue(null);
      service.userRepository.create.mockResolvedValue(mockUser);
      service.userRepository.findById.mockResolvedValue(mockUser);
      service.userRepository.update.mockResolvedValue({});
      service.userRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
      service.userRepository.updateLastLogin.mockResolvedValue({});
      service.verificationTokenRepo.createToken.mockResolvedValue({ token: 'abc123', user_id: 1 });
      service.verificationTokenRepo.findByToken.mockResolvedValue({ user_id: 1, type: 'email_verification' });
      service.verificationTokenRepo.markAsUsed.mockResolvedValue({});
      service.verificationTokenRepo.invalidateUserTokens.mockResolvedValue({});
    });

    it('register creates user and returns tokens', async () => {
      const result = await service.register({ email: 'new@test.com', password: 'password123', name: 'New', username: 'newuser' });
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('verifyEmail marks email as verified', async () => {
      const result = await service.verifyEmail('valid-token');
      expect(result.verified).toBe(true);
    });

    it('sendEmailVerification creates token and queues email', async () => {
      const result = await service.sendEmailVerification(1);
      expect(result.sent).toBe(true);
    });
  });

  describe('Password Reset', () => {
    let service;
    beforeEach(() => {
      service = new AuthServiceModule.default();
      service.userRepository.findByEmail.mockResolvedValue(mockUser);
      service.userRepository.findById.mockResolvedValue(mockUser);
      service.userRepository.update.mockResolvedValue({});
      service.verificationTokenRepo.createToken.mockResolvedValue({ token: 'reset-token', user_id: 1 });
      service.verificationTokenRepo.findByToken.mockResolvedValue({ user_id: 1, type: 'password_reset' });
      service.verificationTokenRepo.markAsUsed.mockResolvedValue({});
      service.verificationTokenRepo.invalidateUserTokens.mockResolvedValue({});
    });

    it('forgotPassword sends reset email', async () => {
      const result = await service.forgotPassword('test@test.com');
      expect(result.sent).toBe(true);
    });

    it('resetPassword updates password', async () => {
      const result = await service.resetPassword('valid-token', 'newpassword123');
      expect(result.reset).toBe(true);
    });
  });
});

describe('AuditService', () => {
  let AuditServiceModule, service;

  beforeAll(async () => {
    AuditServiceModule = await import('../src/application/services/AuditService.js');
  });

  beforeEach(() => {
    service = new AuditServiceModule.default();
    service.auditRepo.create.mockResolvedValue({ id: 1 });
    service.auditRepo.findRecent.mockResolvedValue([]);
    service.auditRepo.findAll.mockResolvedValue([]);
    service.auditRepo.findById.mockResolvedValue({ id: 1 });
  });

  it('logLogin records login event', async () => {
    const result = await service.logLogin(1, '127.0.0.1', 'test-agent');
    expect(result).toBeDefined();
  });

  it('logPasswordChange records password change', async () => {
    const result = await service.logPasswordChange(1, '127.0.0.1', 'test-agent');
    expect(result).toBeDefined();
  });

  it('logActivityDelete records activity deletion', async () => {
    const result = await service.logActivityDelete(1, 42, '127.0.0.1', 'test-agent');
    expect(result).toBeDefined();
  });
});

describe('ModerationService', () => {
  let ModerationServiceModule, service;

  beforeAll(async () => {
    ModerationServiceModule = await import('../src/application/services/ModerationService.js');
  });

  beforeEach(() => {
    service = new ModerationServiceModule.default();
    service.userRepo.findById.mockResolvedValue(mockUser);
    service.userRepo.update.mockResolvedValue({});
    service.reportRepo.create.mockResolvedValue({ id: 1 });
    service.reportRepo.findPending.mockResolvedValue([]);
    service.moderationActionRepo.create.mockResolvedValue({ id: 1 });
  });

  it('createReport creates a report', async () => {
    const result = await service.createReport({
      reporterId: 1, reportedUserId: 2, entityType: 'activity', entityId: 42, reason: 'spam',
    });
    expect(result).toBeDefined();
  });

  it('banUser bans user and logs action', async () => {
    const result = await service.banUser(1, 2, 'Policy violation');
    expect(result).toBeDefined();
    expect(service.userRepo.update).toHaveBeenCalledWith(2, { is_banned: true });
  });
});

describe('RateLimiterService', () => {
  let RateLimiterServiceModule;

  beforeAll(async () => {
    RateLimiterServiceModule = await import('../src/application/services/RateLimiterService.js');
  });

  it('consume allows requests under limit', async () => {
    const service = new RateLimiterServiceModule.default();
    service.useRedis = false;
    const result = await service.checkRateLimit('test-key', 'auth');
    expect(result.allowed).toBe(true);
  });

  it('consume returns rate limit info', async () => {
    const service = new RateLimiterServiceModule.default();
    service.useRedis = false;
    const result = await service.checkRateLimit('test-key', 'global');
    expect(result).toHaveProperty('allowed');
    expect(result).toHaveProperty('remaining');
    expect(result).toHaveProperty('reset');
    expect(result).toHaveProperty('total');
  });
});

describe('CacheService', () => {
  let CacheServiceModule;

  beforeAll(async () => {
    CacheServiceModule = await import('../src/application/services/CacheService.js');
  });

  it('getStats returns zero initially', () => {
    const service = new CacheServiceModule.default();
    const stats = service.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });
});
