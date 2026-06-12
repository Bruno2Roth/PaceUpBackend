import UserService from '../src/application/services/UserService.js';
import ActivityService from '../src/application/services/ActivityService.js';
import NotificationService from '../src/application/services/NotificationService.js';

describe('UserService', () => {
  let userService;
  let mockUserRepo;
  let mockFollowerRepo;
  let mockActivityRepo;

  beforeEach(() => {
    mockUserRepo = {
      findNonDeletedById: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      searchUsers: jest.fn(),
      create: jest.fn(),
    };
    mockFollowerRepo = {
      getFollowerCount: jest.fn(),
      getFollowingCount: jest.fn(),
      isFollowing: jest.fn(),
      create: jest.fn(),
      deleteFollow: jest.fn(),
      getFollowers: jest.fn(),
      getFollowing: jest.fn(),
    };
    mockActivityRepo = {
      getActivityStats: jest.fn(),
      getActivityStatsByPeriod: jest.fn(),
      getRecentActivities: jest.fn(),
      getTopDistances: jest.fn(),
      getPersonalBests: jest.fn(),
      getStreakData: jest.fn(),
      findByUserId: jest.fn(),
    };

    userService = new UserService();
    userService.userRepository = mockUserRepo;
    userService.followerRepository = mockFollowerRepo;
    userService.activityRepository = mockActivityRepo;
  });

  describe('followUser', () => {
    it('should throw error when following yourself', async () => {
      await expect(userService.followUser(1, 1)).rejects.toThrow('Cannot follow yourself');
    });

    it('should throw error if target user not found', async () => {
      mockUserRepo.findNonDeletedById.mockResolvedValue(null);
      await expect(userService.followUser(1, 999)).rejects.toThrow('User not found');
    });

    it('should throw error if already following', async () => {
      mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 2, name: 'Test' });
      mockFollowerRepo.isFollowing.mockResolvedValue(true);
      await expect(userService.followUser(1, 2)).rejects.toThrow('Already following this user');
    });

    it('should create follow relationship', async () => {
      const targetUser = { id: 2, name: 'Test User' };
      mockUserRepo.findNonDeletedById.mockResolvedValue(targetUser);
      mockFollowerRepo.isFollowing.mockResolvedValue(false);
      mockFollowerRepo.create.mockResolvedValue({ follower_id: 1, following_id: 2 });

      const result = await userService.followUser(1, 2);
      expect(result.follow).toBeDefined();
      expect(result.targetUser).toEqual(targetUser);
      expect(mockFollowerRepo.create).toHaveBeenCalledWith({ follower_id: 1, following_id: 2 });
    });
  });

  describe('unfollowUser', () => {
    it('should throw error when unfollowing yourself', async () => {
      await expect(userService.unfollowUser(1, 1)).rejects.toThrow('Cannot unfollow yourself');
    });

    it('should throw error if not following', async () => {
      mockFollowerRepo.isFollowing.mockResolvedValue(false);
      await expect(userService.unfollowUser(1, 2)).rejects.toThrow('Not following this user');
    });

    it('should delete follow relationship', async () => {
      mockFollowerRepo.isFollowing.mockResolvedValue(true);
      mockFollowerRepo.deleteFollow.mockResolvedValue({ follower_id: 1, following_id: 2 });

      const result = await userService.unfollowUser(1, 2);
      expect(result).toBeDefined();
      expect(mockFollowerRepo.deleteFollow).toHaveBeenCalledWith(1, 2);
    });
  });

  describe('getUserById', () => {
    it('should throw error if user not found', async () => {
      mockUserRepo.findNonDeletedById.mockResolvedValue(null);
      await expect(userService.getUserById(999)).rejects.toThrow('User not found');
    });

    it('should return user with is_following false for same user', async () => {
      mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 1, name: 'Test', password: 'secret', email: 'a@b.com' });
      mockFollowerRepo.getFollowerCount.mockResolvedValue(5);
      mockFollowerRepo.getFollowingCount.mockResolvedValue(3);
      mockActivityRepo.getRecentActivities.mockResolvedValue([]);
      mockActivityRepo.getTopDistances.mockResolvedValue([]);
      mockActivityRepo.getPersonalBests.mockResolvedValue({});
      mockActivityRepo.getActivityStats.mockResolvedValue({});
      mockActivityRepo.getStreakData.mockResolvedValue([]);

      const result = await userService.getUserById(1, 1);
      expect(result.is_following).toBe(false);
      expect(result.password).toBeUndefined();
      expect(result.email).toBeUndefined();
    });

    it('should check is_following for different users', async () => {
      mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 2, name: 'Test', password: 'secret', email: 'a@b.com' });
      mockFollowerRepo.getFollowerCount.mockResolvedValue(5);
      mockFollowerRepo.getFollowingCount.mockResolvedValue(3);
      mockFollowerRepo.isFollowing.mockResolvedValue(true);
      mockActivityRepo.getRecentActivities.mockResolvedValue([]);
      mockActivityRepo.getTopDistances.mockResolvedValue([]);
      mockActivityRepo.getPersonalBests.mockResolvedValue({});
      mockActivityRepo.getActivityStats.mockResolvedValue({});
      mockActivityRepo.getStreakData.mockResolvedValue([]);

      const result = await userService.getUserById(2, 1);
      expect(result.is_following).toBe(true);
    });
  });

  describe('searchUsers', () => {
    it('should throw error on empty query', async () => {
      await expect(userService.searchUsers('')).rejects.toThrow('Search query is required');
    });

    it('should return matching users', async () => {
      const users = [{ id: 1, name: 'Runner', username: 'runner1' }];
      mockUserRepo.searchUsers.mockResolvedValue(users);
      const result = await userService.searchUsers('runner');
      expect(result).toEqual(users);
      expect(mockUserRepo.searchUsers).toHaveBeenCalledWith('runner', 20, 0);
    });
  });

  describe('getFollowers / getFollowing', () => {
    it('should throw if user not found for followers', async () => {
      mockUserRepo.findNonDeletedById.mockResolvedValue(null);
      await expect(userService.getFollowers(999)).rejects.toThrow('User not found');
    });

    it('should return followers list', async () => {
      mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 1 });
      mockFollowerRepo.getFollowers.mockResolvedValue([{ id: 2, name: 'Follower', password: 'p' }]);
      const result = await userService.getFollowers(1);
      expect(result[0].password).toBeUndefined();
    });

    it('should return following list', async () => {
      mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 1 });
      mockFollowerRepo.getFollowing.mockResolvedValue([{ id: 2, name: 'Followed', password: 'p' }]);
      const result = await userService.getFollowing(1);
      expect(result[0].password).toBeUndefined();
    });
  });

  describe('updateProfile', () => {
    it('should throw error on no valid fields', async () => {
      await expect(userService.updateProfile(1, {})).rejects.toThrow('No valid fields to update');
    });

    it('should reject duplicate username', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 2 });
      await expect(userService.updateProfile(1, { username: 'taken' })).rejects.toThrow('Username already taken');
    });

    it('should update valid fields', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.update.mockResolvedValue({ id: 1, name: 'New Name', password: 'secret' });
      const result = await userService.updateProfile(1, { name: 'New Name' });
      expect(result.name).toBe('New Name');
      expect(result.password).toBeUndefined();
    });
  });

  describe('calculateStreaks', () => {
    it('should return 0 for no dates', () => {
      const { currentStreak, maxStreak } = userService.calculateStreaks([]);
      expect(currentStreak).toBe(0);
      expect(maxStreak).toBe(0);
    });

    it('should detect current streak', () => {
      const today = new Date();
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { currentStreak, maxStreak } = userService.calculateStreaks([today, yesterday, twoDaysAgo]);
      expect(currentStreak).toBeGreaterThanOrEqual(1);
      expect(maxStreak).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('ActivityService', () => {
  let activityService;
  let mockActivityRepo;
  let mockCommentRepo;
  let mockLikeRepo;

  beforeEach(() => {
    mockActivityRepo = {
      findNonDeletedById: jest.fn(),
      findByUserId: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      getFeedWithCounts: jest.fn(),
      getActivityStats: jest.fn(),
      create: jest.fn(),
    };
    mockCommentRepo = {
      findByActivityId: jest.fn(),
      findNonDeletedById: jest.fn(),
      countByActivityId: jest.fn(),
      findById: jest.fn(),
      updateComment: jest.fn(),
      softDelete: jest.fn(),
      findReplies: jest.fn(),
      incrementReplyCount: jest.fn(),
      create: jest.fn(),
    };
    mockLikeRepo = {
      isLiked: jest.fn(),
      countByActivityId: jest.fn(),
      findByActivityId: jest.fn(),
      deleteLike: jest.fn(),
      create: jest.fn(),
    };

    activityService = new ActivityService();
    activityService.activityRepository = mockActivityRepo;
    activityService.commentRepository = mockCommentRepo;
    activityService.likeRepository = mockLikeRepo;
    activityService.notificationService = {
      notifyComment: jest.fn(),
      notifyLike: jest.fn(),
    };
  });

  describe('likes', () => {
    it('should throw if activity not found', async () => {
      mockActivityRepo.findNonDeletedById.mockResolvedValue(null);
      await expect(activityService.likeActivity(999, 1)).rejects.toThrow('Activity not found');
    });

    it('should throw if already liked', async () => {
      mockActivityRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 2 });
      mockLikeRepo.isLiked.mockResolvedValue(true);
      await expect(activityService.likeActivity(1, 1)).rejects.toThrow('Already liked this activity');
    });

    it('should create like and return count', async () => {
      mockActivityRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 2 });
      mockLikeRepo.isLiked.mockResolvedValue(false);
      mockLikeRepo.create.mockResolvedValue({ activity_id: 1, user_id: 1 });
      mockLikeRepo.countByActivityId.mockResolvedValue(3);

      const result = await activityService.likeActivity(1, 1);
      expect(result.like_count).toBe(3);
      expect(result.like).toBeDefined();
      expect(activityService.notificationService.notifyLike).toHaveBeenCalled();
    });

    it('should unlike activity', async () => {
      mockActivityRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 2 });
      mockLikeRepo.isLiked.mockResolvedValue(true);
      mockLikeRepo.deleteLike.mockResolvedValue({});
      mockLikeRepo.countByActivityId.mockResolvedValue(2);

      const result = await activityService.unlikeActivity(1, 1);
      expect(result.like_count).toBe(2);
    });

    it('should throw on unlike if not liked', async () => {
      mockActivityRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 2 });
      mockLikeRepo.isLiked.mockResolvedValue(false);
      await expect(activityService.unlikeActivity(1, 1)).rejects.toThrow('Not liked yet');
    });
  });

  describe('comments', () => {
    it('should throw on empty body', async () => {
      await expect(activityService.commentOnActivity(1, 1, '')).rejects.toThrow('Comment body is required');
    });

    it('should throw if activity not found', async () => {
      mockActivityRepo.findNonDeletedById.mockResolvedValue(null);
      await expect(activityService.commentOnActivity(999, 1, 'Nice run!')).rejects.toThrow('Activity not found');
    });

    it('should create comment with sanitization', async () => {
      mockActivityRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 2 });
      mockCommentRepo.create.mockResolvedValue({ id: 1, activity_id: 1, user_id: 1, body: 'Nice run!' });
      mockCommentRepo.countByActivityId.mockResolvedValue(1);

      const result = await activityService.commentOnActivity(1, 1, 'Nice run!');
      expect(result.comment.body).toBe('Nice run!');
      expect(result.comment_count).toBe(1);
      expect(activityService.notificationService.notifyComment).toHaveBeenCalled();
    });

    it('should reject parent comment not found', async () => {
      mockActivityRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 2 });
      mockCommentRepo.findNonDeletedById.mockResolvedValue(null);
      await expect(activityService.commentOnActivity(1, 1, 'Reply', 999)).rejects.toThrow('Parent comment not found');
    });

    it('should create reply with parent_id', async () => {
      mockActivityRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 2 });
      mockCommentRepo.findNonDeletedById.mockResolvedValue({ id: 5, activity_id: 1 });
      mockCommentRepo.create.mockResolvedValue({ id: 6, activity_id: 1, user_id: 1, body: 'Reply', parent_id: 5 });
      mockCommentRepo.countByActivityId.mockResolvedValue(1);

      const result = await activityService.commentOnActivity(1, 1, 'Reply', 5);
      expect(result.comment.parent_id).toBe(5);
      expect(mockCommentRepo.incrementReplyCount).toHaveBeenCalledWith(5);
    });
  });

  describe('comment management', () => {
    it('should get activity comments', async () => {
      const comments = [{ id: 1, body: 'Nice!' }];
      mockActivityRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 2 });
      mockCommentRepo.findByActivityId.mockResolvedValue(comments);
      const result = await activityService.getActivityComments(1);
      expect(result).toEqual(comments);
    });

    it('should throw on update if unauthorized', async () => {
      mockCommentRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 2 });
      await expect(activityService.updateComment(1, 3, 'new body')).rejects.toThrow('Unauthorized');
    });

    it('should update own comment', async () => {
      mockCommentRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 1, body: 'old' });
      mockCommentRepo.updateComment.mockResolvedValue({ id: 1, user_id: 1, body: 'new' });
      const result = await activityService.updateComment(1, 1, 'new');
      expect(result.body).toBe('new');
    });

    it('should soft-delete own comment', async () => {
      mockCommentRepo.findById.mockResolvedValue({ id: 1, user_id: 1 });
      mockCommentRepo.softDelete.mockResolvedValue({ id: 1, deleted_at: new Date() });
      const result = await activityService.deleteComment(1, 1);
      expect(result.deleted_at).toBeDefined();
    });
  });

  describe('feed', () => {
    it('should throw if not authenticated', async () => {
      await expect(activityService.getFollowingActivitiesFeed(null)).rejects.toThrow('Authentication required');
    });

    it('should return feed with pagination', async () => {
      const activities = [{ id: 1, title: 'Test', author_name: 'Runner' }];
      mockActivityRepo.getFeedWithCounts.mockResolvedValue(activities);
      const result = await activityService.getFollowingActivitiesFeed(1, null, 20);
      expect(result).toEqual(activities);
      expect(mockActivityRepo.getFeedWithCounts).toHaveBeenCalledWith(1, null, 20);
    });
  });
});

describe('NotificationService', () => {
  let notificationService;
  let mockNotificationRepo;
  let mockUserRepo;

  beforeEach(() => {
    mockNotificationRepo = {
      createNotification: jest.fn(),
      countUnread: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      hasSimilarNotification: jest.fn(),
    };
    mockUserRepo = {
      findNonDeletedById: jest.fn(),
    };

    notificationService = new NotificationService();
    notificationService.notificationRepository = mockNotificationRepo;
    notificationService.userRepository = mockUserRepo;
  });

  it('should send follow notification', async () => {
    mockNotificationRepo.hasSimilarNotification.mockResolvedValue(false);
    mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 2, name: 'Actor' });
    mockNotificationRepo.createNotification.mockResolvedValue({ id: 1, type: 'follow' });
    mockNotificationRepo.countUnread.mockResolvedValue(1);

    await notificationService.notifyFollow(1, 2);
    expect(mockNotificationRepo.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, type: 'follow' }),
    );
  });

  it('should skip notification for own action', async () => {
    await notificationService.notifyFollow(1, 1);
    expect(mockNotificationRepo.createNotification).not.toHaveBeenCalled();
  });

  it('should skip duplicate notifications', async () => {
    mockNotificationRepo.hasSimilarNotification.mockResolvedValue(true);
    await notificationService.notifyFollow(1, 2);
    expect(mockNotificationRepo.createNotification).not.toHaveBeenCalled();
  });

  it('should send like notification', async () => {
    mockNotificationRepo.hasSimilarNotification.mockResolvedValue(false);
    mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 2, name: 'Actor' });
    mockNotificationRepo.createNotification.mockResolvedValue({ id: 1, type: 'like' });
    mockNotificationRepo.countUnread.mockResolvedValue(1);

    await notificationService.notifyLike(1, 10, 2);
    expect(mockNotificationRepo.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, type: 'like', activityId: 10 }),
    );
  });

  it('should send comment notification', async () => {
    mockNotificationRepo.hasSimilarNotification.mockResolvedValue(false);
    mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 2, name: 'Actor' });
    mockNotificationRepo.createNotification.mockResolvedValue({ id: 1, type: 'comment' });
    mockNotificationRepo.countUnread.mockResolvedValue(1);

    await notificationService.notifyComment(1, 10, 2, 5);
    expect(mockNotificationRepo.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, type: 'comment', activityId: 10, commentId: 5 }),
    );
  });

  it('should return notifications list', async () => {
    const notifications = [{ id: 1, type: 'follow' }];
    mockNotificationRepo.findByUserId.mockResolvedValue(notifications);
    const result = await notificationService.getUserNotifications(1, 20, 0);
    expect(result).toEqual(notifications);
  });

  it('should mark notification as read', async () => {
    mockNotificationRepo.findById.mockResolvedValue({ id: 1, user_id: 1 });
    mockNotificationRepo.markAsRead.mockResolvedValue({ id: 1, is_read: true });
    const result = await notificationService.markAsRead(1, 1);
    expect(result.is_read).toBe(true);
  });

  it('should throw on marking other user notification', async () => {
    mockNotificationRepo.findById.mockResolvedValue({ id: 1, user_id: 2 });
    await expect(notificationService.markAsRead(1, 3)).rejects.toThrow('Notification not found');
  });

  it('should get unread count', async () => {
    mockNotificationRepo.countUnread.mockResolvedValue(5);
    const result = await notificationService.getUnreadCount(1);
    expect(result).toBe(5);
  });
});
