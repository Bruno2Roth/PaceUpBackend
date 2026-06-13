import TranslationRepository from '../../data/repositories/TranslationRepository.js';

export class TranslationService {
  constructor() {
    this.translationRepository = new TranslationRepository();
  }

  async getTranslations(locale, namespace) {
    const rows = await this.translationRepository.findByLocale(locale, namespace);
    const result = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  async get(key, locale, namespace) {
    const translation = await this.translationRepository.findByKey(locale, namespace, key);
    return translation ? translation.value : null;
  }

  async setTranslation(locale, namespace, key, value) {
    return this.translationRepository.upsert(locale, namespace, key, value);
  }
}

export default TranslationService;
