import BaseRepository from './BaseRepository.js';

export class EmailTemplateRepository extends BaseRepository {
  constructor() {
    super('email_templates');
  }

  async findByKey(key) {
    return this.findOne('template_key = $1', [key]);
  }
}
export default EmailTemplateRepository;
