import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import config from '../../configs/environment.js';
import logger from '../../configs/logger.js';
import BackupLogRepository from '../../data/repositories/BackupLogRepository.js';

const execAsync = promisify(exec);

export class BackupService {
  constructor() {
    this.backupLogRepo = new BackupLogRepository();
    this.backupDir = path.resolve('backups');
  }

  async ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async runPostgresBackup(type = 'daily') {
    await this.ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `paceup_${type}_${timestamp}.sql.gz`;
    const filepath = path.join(this.backupDir, filename);

    const log = await this.backupLogRepo.create({
      type,
      status: 'running',
      filePath: filepath,
      databaseName: config.db.database,
    });

    try {
      const dumpCmd = [
        `pg_dump`,
        `-h ${config.db.host}`,
        `-p ${config.db.port}`,
        `-U ${config.db.user}`,
        `-d ${config.db.database}`,
        `--no-owner`,
        `--no-acl`,
        `--format=custom`,
        `--compress=9`,
        `--file=${filepath}`,
      ].join(' ');

      const env = { ...process.env, PGPASSWORD: config.db.password };
      await execAsync(dumpCmd, { env, timeout: 300000 });

      const stats = fs.statSync(filepath);
      await this.backupLogRepo.update(log.id, {
        status: 'completed',
        file_size: stats.size,
        completed_at: new Date(),
      });

      logger.info(`PostgreSQL ${type} backup completed: ${filepath} (${stats.size} bytes)`);
      return { id: log.id, filepath, size: stats.size };
    } catch (error) {
      await this.backupLogRepo.update(log.id, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date(),
      });
      logger.error(`PostgreSQL ${type} backup failed:`, error.message);
      throw error;
    }
  }

  async runRedisBackup() {
    try {
      const { exec: redisExec } = await import('redis');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `paceup_redis_${timestamp}.rdb`;
      const filepath = path.join(this.backupDir, filename);

      const client = redisExec.createClient({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
      });
      await client.connect();

      await client.bgSave();
      logger.info(`Redis backup triggered: ${filepath}`);
      await client.quit();

      return { filepath, status: 'triggered' };
    } catch (error) {
      logger.error('Redis backup failed:', error.message);
      throw error;
    }
  }

  async runScheduledBackups() {
    const hour = new Date().getHours();
    const day = new Date().getDay();

    await this.runPostgresBackup('daily');

    if (day === 0) {
      await this.runPostgresBackup('weekly');
    }

    if (day === 1 && hour < 3) {
      await this.runPostgresBackup('monthly');
    }

    try {
      await this.runRedisBackup();
    } catch (err) {
      logger.warn('Redis snapshot failed (non-fatal):', err.message);
    }
  }

  async getBackupHistory(limit = 20) {
    return this.backupLogRepo.findRecent(limit);
  }

  async cleanOldBackups() {
    const maxAge = {
      daily: 7,
      weekly: 30,
      monthly: 365,
    };

    try {
      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);
        const ageDays = (now - stats.mtimeMs) / 86400000;

        let retention = 7;
        if (file.includes('_weekly_')) retention = maxAge.weekly;
        if (file.includes('_monthly_')) retention = maxAge.monthly;

        if (ageDays > retention) {
          fs.unlinkSync(filepath);
          logger.info(`Cleaned old backup: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Backup cleanup failed:', error.message);
    }
  }
}

export default BackupService;
