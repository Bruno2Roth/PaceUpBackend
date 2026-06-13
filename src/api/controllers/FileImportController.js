import FileImportService from '../../application/services/FileImportService.js';

export class FileImportController {
  constructor() {
    this.fileImportService = new FileImportService();
  }

  async importGpx(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'GPX file required' });
      }
      const result = await this.fileImportService.importGpx(req.userId, req.file.buffer, req.file.originalname);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async importFit(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'FIT file required' });
      }
      const result = await this.fileImportService.importFit(req.userId, req.file.buffer, req.file.originalname);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async importTcx(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'TCX file required' });
      }
      const result = await this.fileImportService.importTcx(req.userId, req.file.buffer, req.file.originalname);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default FileImportController;
