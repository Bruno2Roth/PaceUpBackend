export class Translation {
  constructor({
    id,
    locale,
    namespace,
    key,
    value,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.locale = locale;
    this.namespace = namespace;
    this.key = key;
    this.value = value;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default Translation;
