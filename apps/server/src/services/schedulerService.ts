import cron from 'node-cron';
import Monitor, { IMonitor } from '../models/Monitor';
import { queueCheck } from './queueService';
import logger from '../utils/logger';

interface Schedule {
  [key: string]: cron.ScheduledTask;
}

const schedules: Schedule = {};

export const scheduleMonitor = (monitor: IMonitor): void => {
  logger.info(`Scheduling monitor: ${monitor.name} with interval ${monitor.interval}s`);
  if (schedules[monitor._id!.toString()]) schedules[monitor._id!.toString()]!.stop();

  const cronPattern = `*/${monitor.interval / 60} * * * *`;

  const job = cron.schedule(cronPattern, () => {
    if (!monitor.active || isInMaintenance(monitor)) {
      logger.info(`Skipping check for monitor ${monitor._id}: not active or in maintenance.`);
      return;
    }
    logger.info(`Cron job triggered for monitor ID: ${monitor._id}`);
    queueCheck(monitor._id!.toString());
  });

  schedules[monitor._id!.toString()] = job;
};

const isInMaintenance = (monitor: IMonitor): boolean => {
  const now = new Date();
  const isMaintenance = monitor.maintenanceWindows.some(window => now >= window.start && now <= window.end);
  if (isMaintenance) {
    logger.info(`Monitor ${monitor._id} is in a maintenance window.`);
  }
  return isMaintenance;
};

export const loadAllSchedules = async (): Promise<void> => {
  logger.info('Loading all active monitor schedules...');
  const monitors = await Monitor.find({ active: true });
  monitors.forEach(scheduleMonitor);
  logger.info(`Loaded ${monitors.length} active monitor schedules.`);
};