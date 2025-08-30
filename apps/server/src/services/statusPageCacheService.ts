// srcs/services/statusPageCacheService.ts

import StatusPage from '../models/StatusPage';
import StatusPageCache from '../models/StatusPageCache';
import Incident from '../models/Incident';
import CheckResult from '../models/CheckResult';
import logger from '../utils/logger';
import { subDays, startOfDay, sub } from 'date-fns';

// Your existing helper functions (getUptimeData, getOverallUptime) should be moved here
// --- Add getUptimeData and getOverallUptime from your controller here ---
 const getUptimeData = async (monitorId: string, duration: number) => {
  const now = new Date();
  const results = [];

  let intervals;
  let intervalDuration;

  if (duration <= 7) {
    intervals = duration * 6; // 6 intervals per day (every 4 hours)
    intervalDuration = { hours: 4 };
  } else if (duration <= 30) {
    intervals = duration * 2; // 2 intervals per day (every 12 hours)
    intervalDuration = { hours: 12 };
  } else { // 90 days or more
    intervals = duration; // 1 interval per day
    intervalDuration = { days: 1 };
  }

  let currentEndTime = now;

  for (let i = 0; i < intervals; i++) {
    const end = currentEndTime;
    const start = sub(end, intervalDuration);

    const totalChecks = await CheckResult.countDocuments({ monitorId, timestamp: { $gte: start, $lte: end } });
    const downChecks = await CheckResult.countDocuments({ monitorId, timestamp: { $gte: start, $lte: end }, status: "down" });

    let uptime = -1;
    if (totalChecks > 0) {
      uptime = ((totalChecks - downChecks) / totalChecks) * 100;
    }

    const incidents = await Incident.find({
      monitorId: monitorId,
      startedAt: { $gte: start, $lte: end }
    }).sort({ startedAt: -1 });

    results.push({
      date: start.toISOString(), // Start of the time window
      endDate: end.toISOString(), // End of the time window
      uptime: parseFloat(uptime.toFixed(2)),
      incidents: incidents
    });

    currentEndTime = start; // The start of this interval is the end of the next one
  }

  return results.reverse();
};
 const getOverallUptime = async (monitorId: string, days: number) => {
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const totalChecks = await CheckResult.countDocuments({ monitorId, timestamp: { $gte: startDate } });
    const downChecks = await CheckResult.countDocuments({ monitorId, timestamp: { $gte: startDate }, status: 'down' });
    if (totalChecks === 0) {
        return '100.000';
    }
    const percentage = ((totalChecks - downChecks) / totalChecks) * 100;
    return percentage.toFixed(3);
};
export const updateStatusPageCache = async (statusPageId: string): Promise<void> => {
  try {
    logger.info(`Starting cache update for status page: ${statusPageId}`);
    
    // 1. Fetch the original status page with all its deep relationships
    const page = await StatusPage.findById(statusPageId).populate({
        path: 'monitorSections.monitors._id',
        model: 'Monitor',
        select: 'name status'
    });

    if (!page) {
      logger.warn(`Status page ${statusPageId} not found for caching.`);
      return;
    }

    // 2. Perform all the heavy calculations
    const monitorIds = page.monitorSections.flatMap(section => 
        section.monitors.map(monitorWrapper => (monitorWrapper._id as any)._id)
    );

    const recentIncidents = await Incident.find({
        monitorId: { $in: monitorIds },
        startedAt: { $gte: subDays(new Date(), 90) }
    }).sort({ startedAt: -1 });

    const pageObject = page.toObject();

    for (const section of pageObject.monitorSections) {
        for (const monitorWrapper of section.monitors) {
            const monitor = monitorWrapper._id as any;
            if (monitor) {
                const duration = monitorWrapper.historyDuration || 90;
                // These are the slow functions
                monitor.uptimeData = await getUptimeData(monitor._id.toString(), duration);
                monitor.overallUptime = await getOverallUptime(monitor._id.toString(), duration);
            }
        }
    }

    const cachedData = {
      name: pageObject.name,
      branding: pageObject.branding || {},
      monitorSections: pageObject.monitorSections,
      recentIncidents: recentIncidents,
    };
    
    // 3. Save the calculated data to the cache collection
    await StatusPageCache.updateOne(
        { statusPageId: page._id },
        {
            slug: page.slug,
            pageData: cachedData,
            lastUpdatedAt: new Date(),
        },
        { upsert: true } // Creates the document if it doesn't exist
    );

    logger.info(`Successfully updated cache for status page: ${statusPageId}`);

  } catch (error: any) {
    logger.error(`Failed to update cache for status page ${statusPageId}:`, error.message);
  }
};