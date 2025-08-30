import { Request, Response } from "express";
import NotificationConfig from "../models/NotificationConfig";
import Monitor from "../models/Monitor";
import logger from "../utils/logger";

// GET /:monitorId - Get all active notification links for a monitor
export const getNotificationConfigs = async (
  req: Request,
  res: Response
): Promise<void> => {
  // ✨ FIX: Add a check to ensure req.user exists before proceeding.
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
  }
  const { userId } = userPayload;
  const { monitorId } = req.params;
  try {
    const configs = await NotificationConfig.find({
      monitorId,
      userId,
    }).populate("integrationId");
    res.json(configs);
  } catch (err: any) {
    logger.error(
      `Failed to get notification configs for monitor ${monitorId}:`,
      err.message
    );
    res.status(500).json({ error: err.message });
  }
};

export const createNotificationConfig = async (
  req: Request,
  res: Response
): Promise<void> => {
  // ✨ FIX: Add a check to ensure req.user exists before proceeding.
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
  }
  const { userId } = userPayload;
  const { monitorId } = req.params;
  const { integrationId } = req.body;
  try {
    const monitor = await Monitor.findOne({ _id: monitorId, userId });
    if (!monitor) {
      res.status(404).json({ error: "Monitor not found or unauthorized" });
      return;
    }

    const config = new NotificationConfig({ monitorId, userId, integrationId });
    await config.save();
    const populatedConfig = await config.populate("integrationId");

    res.status(201).json(populatedConfig);
  } catch (err: any) {
    if (err.code === 11000) {
      res
        .status(409)
        .json({
          error: "This notification is already configured for this monitor.",
        });
    } else {
      logger.error(
        `Failed to create notification config for monitor ${monitorId}:`,
        err.message
      );
      res.status(500).json({ error: err.message });
    }
  }
};

// DELETE /:monitorId/:configId - Delete a notification link (deactivate an integration)
export const deleteNotificationConfig = async (
  req: Request,
  res: Response
): Promise<void> => {
  // ✨ FIX: Add a check to ensure req.user exists before proceeding.
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;
  const { monitorId, configId } = req.params;
  try {
    const config = await NotificationConfig.findOneAndDelete({
      _id: configId,
      monitorId,
      userId,
    });
    if (!config) {
      res
        .status(404)
        .json({ error: "Notification config not found or unauthorized" });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    logger.error(
      `Failed to delete notification config ${configId}:`,
      err.message
    );
    res.status(500).json({ error: err.message });
  }
};
