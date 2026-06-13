import config from '../../configs/environment.js';
import logger from '../../configs/logger.js';
import { sendEmail } from '../../configs/email.js';

const ALERT_CHANNELS = {
  email: async (alert) => {
    if (!config.alert?.email) return;
    try {
      await sendEmail({
        to: config.alert.email,
        subject: `[PaceUp Alerta] ${alert.severity.toUpperCase()} - ${alert.title}`,
        text: `${alert.message}\n\nTimestamp: ${alert.timestamp}\nDetails: ${JSON.stringify(alert.details)}`,
      });
    } catch (error) {
      logger.error('Alert email failed:', error.message);
    }
  },
  discord: async (alert) => {
    if (!config.alert?.discordWebhook) return;
    try {
      const { default: axios } = await import('axios');
      await axios.post(config.alert.discordWebhook, {
        embeds: [{
          title: alert.title,
          description: alert.message,
          color: alert.severity === 'critical' ? 0xff0000 : alert.severity === 'warning' ? 0xffa500 : 0x3498db,
          fields: alert.details ? Object.entries(alert.details).map(([k, v]) => ({ name: k, value: String(v), inline: true })) : [],
          timestamp: alert.timestamp,
        }],
      });
    } catch (error) {
      logger.error('Alert Discord failed:', error.message);
    }
  },
  slack: async (alert) => {
    if (!config.alert?.slackWebhook) return;
    try {
      const { default: axios } = await import('axios');
      await axios.post(config.alert.slackWebhook, {
        text: `*[${alert.severity.toUpperCase()}] ${alert.title}*\n${alert.message}`,
        attachments: alert.details ? [{ fields: Object.entries(alert.details).map(([k, v]) => ({ title: k, value: String(v), short: true })) }] : [],
      });
    } catch (error) {
      logger.error('Alert Slack failed:', error.message);
    }
  },
};

const alertsConfig = {
  highLatency: { threshold: 2000, windowMs: 60000, count: 0, lastAlert: 0 },
  highErrorRate: { threshold: 0.1, windowMs: 60000, count: 0, lastAlert: 0 },
  redisDown: { lastAlert: 0 },
  dbDown: { lastAlert: 0 },
  apiDown: { lastAlert: 0 },
};

const cooldownMs = 5 * 60 * 1000;

export class AlertService {
  async sendAlert({ title, message, severity = 'warning', details = {} }) {
    const alert = { title, message, severity, details, timestamp: new Date().toISOString() };
    logger[severity === 'critical' ? 'error' : 'warn'](`Alert: ${title} - ${message}`, details);

    const channels = ['email'];
    if (config.alert?.discordWebhook) channels.push('discord');
    if (config.alert?.slackWebhook) channels.push('slack');

    for (const channel of channels) {
      try {
        await ALERT_CHANNELS[channel](alert);
      } catch (error) {
        logger.error(`Alert channel ${channel} failed:`, error.message);
      }
    }
  }

  async checkLatency(duration) {
    const cfg = alertsConfig.highLatency;
    if (duration > cfg.threshold) {
      cfg.count++;
      if (cfg.count >= 5 && Date.now() - cfg.lastAlert > cooldownMs) {
        cfg.lastAlert = Date.now();
        cfg.count = 0;
        await this.sendAlert({
          title: 'Alta latencia detectada',
          message: `Múltiples requests con latencia > ${cfg.threshold}ms`,
          severity: 'warning',
          details: { duration_max_ms: duration, threshold_ms: cfg.threshold, count: cfg.count },
        });
      }
    }
  }

  async checkErrorRate(totalRequests, errors) {
    const cfg = alertsConfig.highErrorRate;
    if (totalRequests < 100) return;
    const rate = errors / totalRequests;
    if (rate > cfg.threshold && Date.now() - cfg.lastAlert > cooldownMs) {
      cfg.lastAlert = Date.now();
      await this.sendAlert({
        title: 'Error rate elevado',
        message: `El rate de errores supera el ${cfg.threshold * 100}%`,
        severity: 'critical',
        details: { error_rate: Math.round(rate * 10000) / 100, errors, total_requests: totalRequests },
      });
    }
  }

  async checkServiceDown(service, isDown) {
    if (!isDown) return;
    const cfgKey = `${service}Down`;
    const cfg = alertsConfig[cfgKey];
    if (!cfg || Date.now() - cfg.lastAlert < cooldownMs) return;
    cfg.lastAlert = Date.now();
    await this.sendAlert({
      title: `${service} caído`,
      message: `El servicio ${service} no responde`,
      severity: 'critical',
      details: { service, time: new Date().toISOString() },
    });
  }
}

export default AlertService;
