import { Request, Response } from 'express';
import Integration from '../models/Integration';
import User from '../models/User';
import logger from '../utils/logger';
import Twilio from 'twilio';
import NotificationConfig from '../models/NotificationConfig'; // ✨ IMPORT: For cleanup
import Monitor from '../models/Monitor';

// --- Standard Integration Handlers ---

export const getIntegrations = async (req: Request, res: Response): Promise<void> => {
  // ✨ FIX: Using your preferred user authentication check
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;
  
  try {
    const integrations = await Integration.find({ userId });
    res.json(integrations);
  } catch (err: any) {
    logger.error(`Failed to get integrations for user ${userId}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
};

export const createIntegration = async (req: Request, res: Response): Promise<void> => {
  // ✨ FIX: Using your preferred user authentication check
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;

  try {
    const integration = new Integration({ ...req.body, userId });
    await integration.save();
    const userMonitors = await Monitor.find({ userId });
    if (userMonitors.length > 0) {
      const notificationConfigs = userMonitors.map(monitor => ({
        userId,
        monitorId: monitor._id,
        integrationId: integration._id,
      }));
      await NotificationConfig.insertMany(notificationConfigs);
      logger.info(`Enabled new integration ${integration._id} for ${userMonitors.length} existing monitors.`);
    }
    res.status(201).json(integration);
  } catch (err: any) {
    logger.error(`Failed to create integration for user ${userId}:`, err.message);
    res.status(500).json({ error: 'Failed to create integration' });
  }
};

export const deleteIntegration = async (req: Request, res: Response): Promise<void> => {
  // ✨ FIX: Using your preferred user authentication check
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = userPayload;
  const { id } = req.params;

  try {
    const integration = await Integration.findOneAndDelete({ _id: id, userId });
    if (!integration) {
      res.status(404).json({ error: 'Integration not found or unauthorized' });
      return;
    }

    await NotificationConfig.deleteMany({ integrationId: id, userId });
    logger.info(`Cleaned up notification configs for deleted integration ${id}`);

    res.status(204).send();
  } catch (err: any) {
    logger.error(`Failed to delete integration ${id} for user ${userId}:`, err.message);
    res.status(500).json({ error: 'Failed to delete integration' });
  }
};


// --- Twilio OAuth Handlers ---

const TWILIO_CONNECT_APP_SID = process.env.TWILIO_CONNECT_APP_SID!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const initiateTwilioConnection = (req: Request, res: Response) => {
    // ✨ FIX: Using your preferred user authentication check
    const userPayload = req.user as { userId: string };
    if (!userPayload) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { userId } = userPayload;
    const authorizeUrl = `https://www.twilio.com/authorize/${TWILIO_CONNECT_APP_SID}`;
    logger.info(`Redirecting user ${userId} to Twilio for authorization.`);
    res.redirect(authorizeUrl);
};

export const handleTwilioCallback = async (req: Request, res: Response) => {
    // ✨ FIX: Using your preferred user authentication check
    const userPayload = req.user as { userId: string };
    if (!userPayload) {
        return res.redirect(`${FRONTEND_URL}/login?error=unauthorized`);
    }
    const { userId } = userPayload;
    const { AccountSid } = req.query;

    if (!AccountSid) {
        logger.error(`Twilio callback for user ${userId} missing AccountSid.`);
        return res.redirect(`${FRONTEND_URL}/dashboard/integrations/twiliosms?error=true`);
    }

    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const twilioClient = Twilio(AccountSid as string, process.env.TWILIO_AUTH_TOKEN!);

        const availableNumbers = await twilioClient.availablePhoneNumbers('US').local.list({ limit: 1 });
        if (availableNumbers.length === 0) {
             throw new Error('No available phone numbers to purchase.');
        }
        const numberToPurchase = availableNumbers[0]!.phoneNumber;
        const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({ phoneNumber: numberToPurchase });

        const newIntegration = new Integration({
            userId,
            name: "Twilio SMS",
            type: "twiliosms",
            details: {
                accountSid: AccountSid,
                fromNumber: purchasedNumber.phoneNumber,
            }
        });
        await newIntegration.save();
        
        logger.info(`Successfully connected Twilio for user ${userId} and purchased ${purchasedNumber.phoneNumber}`);
        res.redirect(`${FRONTEND_URL}/dashboard/integrations/twiliosms`);

    } catch (error: any) {
        logger.error(`Error handling Twilio callback for user ${userId}:`, error.message);
        res.redirect(`${FRONTEND_URL}/dashboard/integrations/twiliosms?error=true`);
    }
};

export const disconnectTwilio = async (req: Request, res: Response) => {
    // ✨ FIX: Using your preferred user authentication check
    const userPayload = req.user as { userId: string };
    if (!userPayload) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { userId } = userPayload;
    try {
        const twilioIntegration = await Integration.findOne({ userId, type: 'twiliosms' });
        if (!twilioIntegration) {
            return res.status(404).json({ error: 'Twilio integration not found.' });
        }
        
        await Integration.findByIdAndDelete(twilioIntegration._id);
        
        logger.info(`Disconnected Twilio for user ${userId}. The phone number should be released manually in Twilio console.`);
        res.status(200).json({ message: 'Twilio disconnected successfully.' });

    } catch (error: any) {
        logger.error(`Error disconnecting Twilio for user ${userId}:`, error.message);
        res.status(500).json({ error: "Failed to disconnect Twilio." });
    }
};

export const sendTwilioTestSms = async (req: Request, res: Response) => {
    // ✨ FIX: Using your preferred user authentication check
    const userPayload = req.user as { userId: string };
    if (!userPayload) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { userId } = userPayload;
    const { toNumber, message } = req.body;
    try {
        const twilioIntegration = await Integration.findOne({ userId, type: 'twiliosms' });
        if (!twilioIntegration || !twilioIntegration.details.accountSid || !twilioIntegration.details.fromNumber) {
            return res.status(400).json({ error: 'Twilio is not configured.' });
        }
        
        const testClient = Twilio(twilioIntegration.details.accountSid, process.env.TWILIO_AUTH_TOKEN!);
        await testClient.messages.create({
            body: message,
            from: twilioIntegration.details.fromNumber,
            to: toNumber
        });

        res.status(200).json({ message: `Test SMS sent to ${toNumber}` });
    } catch (error: any) {
        logger.error(`Failed to send test SMS for user ${userId}:`, error.message);
        res.status(500).json({ error: "Failed to send test SMS." });
    }
};
