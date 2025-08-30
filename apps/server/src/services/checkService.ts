import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import Monitor, { IMonitor } from '../models/Monitor';
import CheckResult from '../models/CheckResult';
import Incident from '../models/Incident';
import { sendNotification } from './notificationService';
import { io } from '../server';
import logger from '../utils/logger';
import { updateStatusPageCache } from './statusPageCacheService';
import StatusPage from '../models/StatusPage';

const FAILURE_THRESHOLD = 3; // Mark as down after 3 consecutive failures

const manageIncident = async (monitor: IMonitor, isDown: boolean, error: any) => {
  const existingIncident = await Incident.findOne({
    monitorId: monitor._id,
    status: { $ne: 'resolved' },
  });

  if (isDown && !existingIncident) {
    logger.info(`Creating new incident for monitor ${monitor._id}`);
    const newIncident = new Incident({
      monitorId: monitor._id,
      title: `Monitor "${monitor.name}" is down.`,
      status: 'investigating',
      severity: 'critical',
      affectedServices: [monitor._id],
      rootCause: error?.message || 'Service unavailable',
    });
    await newIncident.save();
    io.emit('incident_new', newIncident);
  } else if (!isDown && existingIncident) {
    logger.info(`Resolving incident for monitor ${monitor._id}`);
    existingIncident.status = 'resolved';
    existingIncident.resolvedAt = new Date();
    await existingIncident.save();
    io.emit('incident_update', existingIncident);
  }
};

const performCheckForRegion = async (monitor: IMonitor, region: string) => {
  try {
      logger.info(`Performing check for ${monitor.name} from region: ${region}`);
      const start = Date.now();
      const headers: { [key: string]: string } = {};
      if (monitor.headers) {
          monitor.headers.forEach((value, key) => { headers[key] = value; });
      }

      const config: AxiosRequestConfig = {
          url: monitor.url,
          method: monitor.method,
          headers,
          timeout: monitor.timeout * 1000,
          validateStatus: (status) => status >= 200 && status < 400,
      };
      if (monitor.body) config.data = monitor.body;

      const response: AxiosResponse = await axios(config);
      
      const result = new CheckResult({
          monitorId: monitor._id,
          region,
          status: 'up',
          responseTime: Date.now() - start,
          statusCode: response.status,
      });
      await result.save();
      return true;

  } catch (err: any) {
      const result = new CheckResult({
          monitorId: monitor._id,
          region,
          status: 'down',
          error: { type: err.name, message: err.message },
          statusCode: err.response?.status,
      });
      await result.save();
      logger.error(`Check failed for ${monitor.name} from ${region}: ${err.message}`);
      return false;
  }
};
export const performCheck = async (monitor: IMonitor): Promise<void> => {
  const checkPromises = monitor.regions.map(region => performCheckForRegion(monitor, region));
  const results = await Promise.all(checkPromises);

  const isSuccess = results.every(res => res === true);
  const previousStatus = monitor.status;

  if (isSuccess) {
      monitor.consecutiveFails = 0;
      if (monitor.status !== 'up') {
          monitor.status = 'up';
          monitor.lastStatusChange = new Date();
          await manageIncident(monitor, false, null);
          // ✨ FINAL CHANGE: Pass full monitor object
          await sendNotification(monitor, 'up');
      }
  } else {
      monitor.consecutiveFails += 1;
      if (monitor.consecutiveFails >= FAILURE_THRESHOLD && monitor.status !== 'down') {
          monitor.status = 'down';
          monitor.lastStatusChange = new Date();
          await manageIncident(monitor, true, { message: "Monitor is down in one or more regions." });
           // ✨ FINAL CHANGE: Pass full monitor object
          await sendNotification(monitor, 'down');
      }
  }
  
  monitor.lastCheck = new Date();
  await monitor.save();
   if (previousStatus !== monitor.status) {
      const relatedStatusPages = await StatusPage.find({ "monitorSections.monitors._id": monitor._id });
      for (const page of relatedStatusPages) {
          updateStatusPageCache((page._id as string | { toString(): string }).toString()); // No need to await
      }
  }
  if (previousStatus !== monitor.status) {
      logger.info(`Monitor ${monitor.name} status changed from ${previousStatus} to ${monitor.status}.`);
      io.emit('monitor_status_change', {
          monitorId: monitor._id!.toString(),
          status: monitor.status,
          timestamp: new Date(),
      });
  }
};