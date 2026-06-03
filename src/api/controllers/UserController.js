import UserService from '../../application/services/UserService.js';

export class UserController {
  constructor() {
    this.userService = new UserService();
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.userId;
      const userRepo = this.userService.userRepository;
      const user = await userRepo.findNonDeletedById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      delete user.password;
      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      // TODO: Implement update profile controller
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async uploadProfilePicture(req, res, next) {
    try {
      // TODO: Implement profile picture upload controller
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req, res, next) {
    try {
      // TODO: Implement get user stats controller
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      // TODO: Implement get user by ID controller
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req, res, next) {
    try {
      // TODO: Implement search users controller
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async followUser(req, res, next) {
    try {
      // TODO: Implement follow user controller
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async unfollowUser(req, res, next) {
    try {
      // TODO: Implement unfollow user controller
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async getFollowers(req, res, next) {
    try {
      // TODO: Implement get followers controller
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async getFollowing(req, res, next) {
    try {
      // TODO: Implement get following controller
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
