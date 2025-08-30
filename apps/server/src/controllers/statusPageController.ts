import { Request, Response } from "express";
import StatusPage, { IStatusPage } from "../models/StatusPage";
import Monitor from "../models/Monitor";
import logger from "../utils/logger";
import CheckResult from "../models/CheckResult"; // Import CheckResult
import {
  endOfDay,
  endOfHour,
  startOfDay,
  startOfHour,
  sub,
  subDays,
  subHours,
} from "date-fns"; // Import date-fns helpers
import Incident from "../models/Incident";
import StatusPageCache from "../models/StatusPageCache";
import { updateStatusPageCache } from "../services/statusPageCacheService";
import { nanoid } from "nanoid";
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


// ✨ REWRITTEN Uptime Data Function ✨
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


// export const getPublicStatusPage = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { slug } = req.params;
//         const page = await StatusPage.findOne({ slug, active: true }).populate({
//             path: 'monitorSections.monitors._id',
//             model: 'Monitor',
//             select: 'name status'
//         });
//         if (!page) {
//             res.status(404).json({ error: 'Status page not found' });
//             return;
//         }

//         const monitorIds = page.monitorSections.flatMap(section => 
//             section.monitors.map(monitorWrapper => (monitorWrapper._id as any)._id)
//         );

//         const recentIncidents = await Incident.find({
//             monitorId: { $in: monitorIds },
//             startedAt: { $gte: subDays(new Date(), 90) }
//         }).sort({ startedAt: -1 });

//         const pageObject = page.toObject();

//         for (const section of pageObject.monitorSections) {
//             for (const monitorWrapper of section.monitors) {
//                 const monitor = monitorWrapper._id as any;
//                 if (monitor) {
//                     const duration = monitorWrapper.historyDuration || 90;
//                     monitor.uptimeData = await getUptimeData(monitor._id.toString(), duration);
//                     monitor.overallUptime = await getOverallUptime(monitor._id.toString(), duration);
//                 }
//             }
//         }
        
//         const response = {
//             ...pageObject,
//             recentIncidents: recentIncidents,
//             branding: pageObject.branding || {},
//         };

//         res.json(response);
//     } catch (err: any) {
//         logger.error(`Failed to get public status page:`, err.message);
//         res.status(500).json({ error: err.message });
//     }
// };

// GET /:slug? - Get all pages for a user OR a single page for management
export const getPublicStatusPage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        
        // Just one fast query to the pre-calculated collection!
        const cachedPage = await StatusPageCache.findOne({ slug });
         if (cachedPage) {
            // ✅ CACHE HIT: The page exists in our cache. Serve it instantly.
            logger.info(`Serving status page ${slug} from cache.`);
            res.json(cachedPage.pageData);
            return;
        }
        logger.warn(`Cache miss for status page ${slug}. Generating on-demand.`);
        
        const page = await StatusPage.findOne({ slug, active: true }).populate({
            path: 'monitorSections.monitors._id',
            model: 'Monitor',
            select: 'name status'
        });

        if (!page) {
            res.status(404).json({ error: 'Status page not found' });
            return;
        }
        const id = page._id 
        updateStatusPageCache((page._id as string | {toString() : string }).toString());

        // Perform the original heavy calculations just for this one request
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
                    monitor.uptimeData = await getUptimeData(monitor._id.toString(), duration);
                    monitor.overallUptime = await getOverallUptime(monitor._id.toString(), duration);
                }
            }
        }
        
        const responseData = {
            ...pageObject,
            recentIncidents: recentIncidents,
            branding: pageObject.branding || {},
        };

        // Return the freshly generated data to the current user
        res.json(responseData);

    } catch (err: any) {
        logger.error(`Failed to get public status page ${req.params.slug}:`, err.message);
        res.status(500).json({ error: err.message });
    }
};

export const getStatusPages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params as { slug?: string };

    const userPayload = req.user as { userId: string };
    if (!userPayload) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { userId } = userPayload;

    if (slug) {
      logger.info(`Fetching status page for management by slug: ${slug}`);
      const page = await StatusPage.findOne({ slug, userId }).populate(
        "monitorSections.monitors._id"
      );
      if (!page) {
        res.status(404).json({ error: "Status page not found" });
        return;
      }
      res.json(page);
    } else {
      logger.info(`Fetching all status pages for user: ${userId}`);
      const pages = await StatusPage.find({ userId });
      res.json(pages);
    }
  } catch (err: any) {
    logger.error(`Failed to get status pages:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

export const createStatusPage = async (
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
    const { branding = {}, features = {}, ...restOfBody } = req.body;
    const slug = nanoid(10)
    logger.info(`User ${userId} attempting to create a new status page.`);
    const page = new StatusPage({
      ...restOfBody,
      slug,
      branding,
      features,
      userId,
    } as IStatusPage);
    await page.save();

    // ---  ADD THIS LINE ---
    // Proactively build the cache in the background. No need to await.
    updateStatusPageCache((page._id as string | {toString() : string}).toString());
    // --- END ADDITION ---

    logger.info(`Successfully created status page with slug: ${page.slug}`);
    res.status(201).json(page);
  } catch (err: any) {
    if (err.code === 11000) {
      res
        .status(409)
        .json({ error: "This slug is already in use. Please choose another." });
      return;
    }
    logger.error(
      `Failed to create status page for user ${userId}:`,
      err.message
    );
    res.status(500).json({ error: err.message });
  }
};

export const updateStatusPage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;
  console.log(req.body);
  
  try {
    const { slug } = req.params;
    logger.info(
      `User ${userId} attempting to update status page with slug: ${slug}`
    );
    const page = await StatusPage.findOneAndUpdate({ slug, userId }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!page) {
      res.status(404).json({ error: "Status page not found" });
      return;
    }
    logger.info("Started Cache")
    updateStatusPageCache((page._id as string | {toString() : string}).toString());
   
    logger.info(`Successfully updated status page with slug: ${slug}`);
    res.json(page);
  } catch (err: any) {
    logger.error(
      `Failed to update status page ${req.params.slug}:`,
      err.message
    );
    res.status(500).json({ error: err.message });
  }
};

export const deleteStatusPage = async (
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
    const { slug } = req.params;
    logger.info(
      `User ${userId} attempting to delete status page with slug: ${slug}`
    );
    const page = await StatusPage.findOneAndDelete({ slug, userId });
    if (!page) {
      res.status(404).json({ error: "Status page not found" });
      return;
    }
    logger.info(`Successfully deleted status page with slug: ${slug}`);
    const StatusCache = await StatusPageCache.findOneAndDelete({slug})
    if(!StatusCache) logger.info("No Cache Found!")
    logger.info("Successfully deleteed cache for " + slug)
    res.status(204).send();
  } catch (err: any) {
    logger.error(
      `Failed to delete status page ${req.params.slug}:`,
      err.message
    );
    res.status(500).json({ error: err.message });
  }
};
