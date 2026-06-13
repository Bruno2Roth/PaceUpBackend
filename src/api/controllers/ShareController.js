import ShareService from '../../application/services/ShareService.js';

export class ShareController {
  constructor() {
    this.shareService = new ShareService();
  }

  async getShare(req, res, next) {
    try {
      const { token } = req.params;
      const data = await this.shareService.getSharedActivity(token);
      return res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async generateImage(req, res, next) {
    try {
      const { id } = req.params;
      const data = await this.shareService.generateActivityImage(id);
      return res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }
}

export default ShareController;
