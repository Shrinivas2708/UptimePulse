import { Request, RequestHandler, Response } from "express";
import Monitor from "../models/Monitor";
import CheckResult from "../models/CheckResult";
import { queueCheck } from "../services/queueService";
import { scheduleMonitor } from "../services/schedulerService";
import logger from "../utils/logger";
import User from "../models/User";
import Incident from "../models/Incident";
import mongoose from "mongoose";
import Integration from "../models/Integration";
import NotificationConfig from "../models/NotificationConfig";
import StatusPage from "../models/StatusPage";
import { updateStatusPageCache } from "../services/statusPageCacheService";

export const getMonitors: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;

  try {
    logger.info(`Fetching all monitors for user: ${userId}`);
    const monitors = await Monitor.find({ userId });
    logger.info(`Found ${monitors.length} monitors for user: ${userId}`);
    res.json(monitors);
  } catch (err: any) {
    logger.error(`Failed to get monitors for user ${userId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getMonitor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;

  try {
    const { id } = req.params;
    logger.info(`Fetching monitor with ID: ${id}`);
    const monitor = await Monitor.findOne({ _id: id, userId });
    if (!monitor) {
      logger.info(
        `Monitor ${id} not found or unauthorized access by user ${userId}`
      );
      res.status(404).json({ error: "Monitor not found" });
      return;
    }
    logger.info(`Successfully fetched monitor with ID: ${id}`);
    res.json(monitor);
  } catch (err: any) {
    logger.error(`Failed to get monitor ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

export const createMonitor: RequestHandler = async (req, res) => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentMonitorCount = await Monitor.countDocuments({ userId });

    if (currentMonitorCount >= user.limits.monitors) {
      return res.status(403).json({
        error: `You have reached your limit of ${user.limits.monitors} monitors. Please upgrade your plan.`,
      });
    }

    const requestedInterval = req.body.interval;
    if (requestedInterval < user.limits.checkInterval) {
      return res.status(403).json({
        error: `Your plan does not allow a check interval less than ${
          user.limits.checkInterval / 60
        } min.`,
      });
    }

    logger.info(`User ${userId} attempting to create a new monitor.`);
    const monitor = new Monitor({ ...req.body, userId });
    await monitor.save();

    // ✨ FIX: Find ALL user integrations and enable them for the new monitor by default.
    const userIntegrations = await Integration.find({ userId });
    if (userIntegrations.length > 0) {
      const notificationConfigs = userIntegrations.map((integration) => ({
        userId,
        monitorId: monitor._id,
        integrationId: integration._id,
      }));
      await NotificationConfig.insertMany(notificationConfigs);
      logger.info(
        `Enabled ${userIntegrations.length} default notifications for new monitor ${monitor._id}`
      );
    }
    // ✨ END FIX

    scheduleMonitor(monitor);
    queueCheck(monitor._id!.toString());
    res.status(201).json(monitor);
  } catch (err: any) {
    logger.error(`Failed to create monitor for user ${userId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

export const updateMonitor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;

  try {
    const { id } = req.params;
    logger.info(`User ${userId} attempting to update monitor ID: ${id}`);
    const monitor = await Monitor.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!monitor) {
      logger.info(
        `Monitor ${id} not found or unauthorized access by user ${userId}`
      );
      res.status(404).json({ error: "Monitor not found" });
      return;
    }
    scheduleMonitor(monitor);
    logger.info(`Successfully updated and rescheduled monitor with ID: ${id}`);
    res.json(monitor);
  } catch (err: any) {
    logger.error(`Failed to update monitor ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

export const deleteMonitor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;

  try {
    const { id } = req.params;
    logger.info(`User ${userId} attempting to delete monitor ID: ${id}`);
    const monitor = await Monitor.findOneAndDelete({ _id: id, userId });
    if (!monitor) {
      logger.info(
        `Monitor ${id} not found or unauthorized access by user ${userId}`
      );
      res.status(404).json({ error: "Monitor not found" });
      return;
    }
    await CheckResult.deleteMany({ monitorId: id });
    await NotificationConfig.deleteMany({ monitorId: id }); // Also delete notification links
    await Incident.deleteMany({monitorId:id})
     const affectedPages = await StatusPage.find({
      "monitorSections.monitors._id": id,
      userId,
    }).select('_id');

    await StatusPage.updateMany(
      { 'userId': userId },
      { $pull: { 'monitorSections.$[].monitors': { _id: id } } }
    );
    logger.info(`Cleaned monitor reference ${id} from status page documents.`);
    for (const page of affectedPages) {
      updateStatusPageCache((page._id as string | { toString(): string }).toString());
    }
    logger.info(`Triggered cache updates for ${affectedPages.length} status pages.`);

    logger.info(`Successfully deleted monitor ${id} and associated data.`);
    
    res.status(204).send();
  } catch (err: any) {
    logger.error(`Failed to delete monitor ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getMonitorStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { period = "24h" } = req.query;

    let startDate: Date;
    switch (period) {
      case "7d":
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // 24h
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
    }

    logger.info(`Fetching stats for monitor ID: ${id} for period: ${period}`);

    const monitorObjectId = new mongoose.Types.ObjectId(id);

    const [
      regionalAverages,
      recentResults,
      latestCheckWithSsl,
      recentIncidents,
    ] = await Promise.all([
      CheckResult.aggregate([
        {
          $match: {
            monitorId: monitorObjectId,
            status: "up",
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$region",
            averageResponseTime: { $avg: "$responseTime" },
          },
        },
        { $project: { _id: 0, region: "$_id", averageResponseTime: 1 } },
      ]),
      CheckResult.find({ monitorId: id, timestamp: { $gte: startDate } }).sort({
        timestamp: -1,
      }),
      CheckResult.findOne({ monitorId: id, sslInfo: { $exists: true } }).sort({
        timestamp: -1,
      }),
      Incident.find({ monitorId: id }).sort({ createdAt: -1 }).limit(5),
    ]);

    const overallAverage =
      recentResults.length > 0
        ? recentResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) /
          recentResults.length
        : 0;
    // console.log(overallAverage);

    const totalChecks = recentResults.length;
    // console.log(totalChecks);

    // ✨ THIS IS THE FIX ✨
    // Only filter by the status field for an accurate count of down checks.
    const downChecks = recentResults.filter((r) => r.status === "down").length;
    // console.log(downChecks);
    const uptimePercentage =
      totalChecks > 0 ? ((totalChecks - downChecks) / totalChecks) * 100 : 100;
    // console.log(uptimePercentage);
    const stats = {
      recentResults,
      averageResponseTime: overallAverage,
      regionalAverages,
      sslInfo: latestCheckWithSsl?.sslInfo,
      recentIncidents,
      uptimePercentage: parseFloat(uptimePercentage.toFixed(2)),
    };

    res.json(stats);
  } catch (err: any) {
    logger.error(
      `Failed to get stats for monitor ID ${req.params.id}:`,
      err.message
    );
    res.status(500).json({ error: err.message });
  }
};

export const createMaintenance = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;

  try {
    const { id } = req.params;
    logger.info(
      `User ${userId} attempting to create maintenance window for monitor ID: ${id}`
    );
    const monitor = await Monitor.findById(id);
    if (!monitor || monitor.userId.toString() !== userId) {
      logger.info(
        `Maintenance creation failed: Monitor ${id} not found or unauthorized access by user ${userId}`
      );
      res.status(404).json({ error: "Monitor not found" });
      return;
    }
    monitor.maintenanceWindows.push(req.body);
    await monitor.save();
    logger.info(`Maintenance window created for monitor ID: ${id}`);
    res.json(monitor);
  } catch (err: any) {
    logger.error(
      `Failed to create maintenance window for monitor ID ${req.params.id}:`,
      err.message
    );
    res.status(500).json({ error: err.message });
  }
};
export const getMonitorSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;

  try {
    logger.info(`Fetching monitor summary for user: ${userId}`);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const statusCounts = await Monitor.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const summary = {
      up: statusCounts.find((s) => s._id === "up")?.count || 0,
      down: statusCounts.find((s) => s._id === "down")?.count || 0,
      paused: statusCounts.find((s) => s._id === "paused")?.count || 0,
    };

    const userMonitors = await Monitor.find({ userId }).select("_id");
    const monitorIds = userMonitors.map((m) => m._id);

    const recentIncidentsCount = await Incident.countDocuments({
      affectedServices: { $in: monitorIds },
      startedAt: { $gte: twentyFourHoursAgo },
    });

    const totalChecks = await CheckResult.countDocuments({
      monitorId: { $in: monitorIds },
      timestamp: { $gte: twentyFourHoursAgo },
    });
    const downChecks = await CheckResult.countDocuments({
      monitorId: { $in: monitorIds },
      timestamp: { $gte: twentyFourHoursAgo },
      status: { $in: ["down", "error"] },
    });
    const overallUptime =
      totalChecks > 0 ? ((totalChecks - downChecks) / totalChecks) * 100 : 100;

    res.json({
      statusCounts: summary,
      last24Hours: {
        overallUptime: parseFloat(overallUptime.toFixed(4)),
        incidentsCount: recentIncidentsCount,
      },
    });
  } catch (err: any) {
    logger.error(
      `Failed to get monitor summary for user ${userId}:`,
      err.message
    );
    res.status(500).json({ error: "Internal server error" });
  }
};
export const toggleMonitorStatus = async (req: Request, res: Response): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;
  const { id } = req.params;

  try {
      logger.info(`User ${userId} attempting to toggle status for monitor ID: ${id}`);
      const monitor = await Monitor.findOne({ _id: id, userId });

      if (!monitor) {
          res.status(404).json({ error: 'Monitor not found' });
          return;
      }

      // ✨ --- REVISED LOGIC --- ✨

      monitor.active = !monitor.active;

      // If we are PAUSING the monitor
      if (!monitor.active) {
        monitor.status = 'paused';
      } 
      // If we are RESUMING the monitor
      else {
        // We can't know the true status until a check runs.
        // Let's set it to 'up' for a moment but immediately trigger a check.
        // The check will correct the status to 'down' within seconds if the site is still down.
        // Crucially, we are NO LONGER resetting consecutiveFails here.
        monitor.status = 'up';
      }

      await monitor.save();
      
      logger.info(`Successfully toggled monitor ${id} to ${monitor.active ? 'active' : 'paused'}`);
      
      // Reschedule the monitor's regular cron job
      scheduleMonitor(monitor);
      
      // 2. If the monitor was just resumed, queue an immediate check
      if (monitor.active) {
        queueCheck(monitor._id!.toString());
      }
      
      res.json(monitor);

  } catch (err: any) {
      logger.error(`Failed to toggle monitor status for ${id}:`, err.message);
      res.status(500).json({ error: 'Internal server error' });
  }
};
export const updateMonitorSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;
  const { id } = req.params;
  const { name, url, expectedStatusCodes, interval } = req.body;

  try {
    const user = await User.findById(userId);
      if (!user) {
          res.status(404).json({ error: 'User not found' });
          return;
      }
      if (interval && interval < user.limits.checkInterval) {
         res.status(403).json({
            error: `Your plan does not allow a check interval less than ${user.limits.checkInterval / 60} min.`
        });
        return
    }
    const monitor = await Monitor.findOneAndUpdate(
      { _id: id, userId },
      { name, url, expectedStatusCodes ,interval},
      { new: true, runValidators: true }
    );

    if (!monitor) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }
    scheduleMonitor(monitor);
    logger.info(`Successfully updated settings for monitor ${id}`);
    res.json(monitor);
  } catch (err: any) {
    logger.error(`Failed to update settings for monitor ${id}:`, err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
