import UserService from '../../application/services/UserService.js';
import NotificationService from '../../application/services/NotificationService.js';

export class UserController {
  constructor() {
    this.userService = new UserService();
    this.notificationService = new NotificationService();
  }

  async getProfile(req, res, next) {
    try {
      const profile = await this.userService.getUserProfile(req.userId);
      return res.status(200).json({ user: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await this.userService.updateProfile(req.userId, req.body);
      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async uploadProfilePicture(req, res, next) {
    try {
      const user = await this.userService.uploadProfilePicture(req.userId, req.file);
      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req, res, next) {
    try {
      const stats = await this.userService.getUserStats(req.params.id);
      return res.status(200).json({ stats });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await this.userService.getUserById(req.params.id, req.userId);
      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async getUserActivities(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const activities = await this.userService.getUserActivities(req.params.id, limit, offset);
      return res.status(200).json({ activities });
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const query = req.query.q || req.query.query || req.query.name || req.query.search;
      const users = await this.userService.searchUsers(query, limit, offset);
      return res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  }

  async followUser(req, res, next) {
    try {
      const { follow, targetUser } = await this.userService.followUser(req.userId, req.params.id);
      await this.notificationService.notifyFollow(targetUser.id, req.userId);
      return res.status(201).json({ message: 'Now following user', follow });
    } catch (error) {
      next(error);
    }
  }

  async unfollowUser(req, res, next) {
    try {
      await this.userService.unfollowUser(req.userId, req.params.id);
      return res.status(200).json({ message: 'Unfollowed user' });
    } catch (error) {
      next(error);
    }
  }

  async getFollowers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const followers = await this.userService.getFollowers(req.params.id, limit, offset);
      return res.status(200).json({ followers });
    } catch (error) {
      next(error);
    }
  }

  async getFollowing(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const following = await this.userService.getFollowing(req.params.id, limit, offset);
      return res.status(200).json({ following });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
