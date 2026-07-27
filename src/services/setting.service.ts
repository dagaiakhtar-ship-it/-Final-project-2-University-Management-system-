import { prisma } from './db.service';
import { auditService } from './audit.service';

export class SettingService {
  async getSettings() {
    const settings = await prisma.systemSetting.findMany({
      where: { deletedAt: null },
      orderBy: { key: 'asc' },
    });

    if (settings.length === 0) {
      // Seed default system settings if empty
      const defaultSettings = [
        { key: 'UNIVERSITY_NAME', value: 'National Apex Technological University', description: 'Primary academic institution name' },
        { key: 'ACADEMIC_YEAR', value: '2026-2027', description: 'Active academic session calendar' },
        { key: 'ATTENDANCE_THRESHOLD', value: '75', description: 'Minimum mandatory attendance percentage for exam eligibility' },
        { key: 'SYSTEM_EMAIL_NOTIFICATIONS', value: 'enabled', description: 'Toggle automated system transactional emails' },
        { key: 'PASSING_GRADE_PERCENTAGE', value: '40', description: 'Minimum mark required to pass a subject' },
        { key: 'TWO_FACTOR_AUTHENTICATION', value: 'optional', description: 'Enforce multi-factor auth for administrative accounts' },
        { key: 'MAINTENANCE_MODE', value: 'false', description: 'Place platform into restricted maintenance mode' },
      ];

      const created = [];
      for (const item of defaultSettings) {
        const s = await prisma.systemSetting.create({
          data: item,
        });
        created.push(s);
      }
      return created;
    }

    return settings;
  }

  async updateSetting(key: string, value: string, userId: number) {
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        updatedBy: String(userId),
      },
      create: {
        key,
        value,
        updatedBy: String(userId),
      },
    });

    await auditService.log({
      action: 'SETTING_UPDATE',
      tableName: 'SystemSetting',
      recordId: String(setting.id),
      userId,
      details: `Updated setting ${key} = ${value}`,
    } as any);

    return setting;
  }

  async bulkUpdateSettings(settingsMap: Record<string, string>, userId: number) {
    const results = [];
    for (const [key, value] of Object.entries(settingsMap)) {
      const res = await this.updateSetting(key, String(value), userId);
      results.push(res);
    }
    return results;
  }
}

export const settingService = new SettingService();
