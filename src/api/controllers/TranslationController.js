import TranslationService from '../../application/services/TranslationService.js';

export class TranslationController {
  constructor() {
    this.translationService = new TranslationService();
  }

  async getTranslations(req, res, next) {
    try {
      const locale = req.params.locale;
      const namespace = req.query.namespace || null;
      const translations = await this.translationService.getTranslations(locale, namespace);
      return res.status(200).json({ data: translations });
    } catch (error) {
      next(error);
    }
  }

  async setTranslation(req, res, next) {
    try {
      const { locale, key } = req.params;
      const { value, namespace } = req.body;

      if (!value) {
        return res.status(400).json({ error: 'value is required' });
      }

      const translation = await this.translationService.setTranslation(
        locale, namespace || 'default', key, value,
      );
      return res.status(200).json({ data: translation });
    } catch (error) {
      next(error);
    }
  }
}

export default TranslationController;
