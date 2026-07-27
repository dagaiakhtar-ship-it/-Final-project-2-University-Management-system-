import { Request, Response, NextFunction } from 'express';
import { settingService } from '../services/setting.service';
import { UnauthorizedError } from '../errors/auth.errors';

export class SettingController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingService.getSettings();
      res.status(200).json({
        status: 'success',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const { key, value } = req.body;
      if (!key) {
        res.status(400).json({ status: 'error', message: 'Setting key is required' });
        return;
      }

      const setting = await settingService.updateSetting(key, value, req.user.userId);
      res.status(200).json({
        status: 'success',
        message: 'Setting updated successfully',
        data: setting,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const settings = req.body.settings;
      if (!settings || typeof settings !== 'object') {
        res.status(400).json({ status: 'error', message: 'Invalid settings payload' });
        return;
      }

      const results = await settingService.bulkUpdateSettings(settings, req.user.userId);
      res.status(200).json({
        status: 'success',
        message: 'Settings updated successfully',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const settingController = new SettingController();
