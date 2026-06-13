export class AiAnalysis {
  constructor({
    id,
    userId,
    analysisType,
    content,
    periodStart,
    periodEnd,
    createdAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.analysisType = analysisType;
    this.content = content;
    this.periodStart = periodStart;
    this.periodEnd = periodEnd;
    this.createdAt = createdAt;
  }
}

export default AiAnalysis;
