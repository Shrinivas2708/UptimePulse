import NotificationConfig from '../models/NotificationConfig';
import { IIntegration } from '../models/Integration';
import { IMonitor } from '../models/Monitor';
import logger from '../utils/logger';
import axios from 'axios';
import nodemailer from 'nodemailer';
import Twilio from 'twilio';

// --- TRANSPORTS SETUP ---

// Nodemailer (Email)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Twilio (SMS) - initialized if credentials are provided
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;


// --- NOTIFICATION SENDER FUNCTIONS ---

async function sendEmailNotification(integration: IIntegration, monitor: IMonitor, eventType: string) {
  const { email } = integration.details;
  if (!email) return;

  const isUp = eventType === 'up';
  const subject = isUp ? `✅ Resolved: ${monitor.name} is back online!` : `🚨 Alert: ${monitor.name} is down!`;
  const body = `Monitor <strong>${monitor.name}</strong> (${monitor.url}) is currently <strong>${eventType.toUpperCase()}</strong>. This status change was detected at ${new Date().toUTCString()}.`;

  try {
    await transporter.sendMail({
      from: `"UptimePulse" <${process.env.EMAIL_FROM || 'noreply@uptimepulse.com'}>`,
      to: email, subject, html: body,
    });
    logger.info(`Email notification sent to ${email} for monitor ${monitor.name}`);
  } catch (error) {
    logger.error(`Failed to send email to ${email}:`, error);
  }
}

async function sendWebhookNotification(integration: IIntegration, monitor: IMonitor, eventType: string) {
  const { webhookUrl } = integration.details;
  if (!webhookUrl) return;

  const isUp = eventType === 'up';
  const color = isUp ? 3066993 : 15158332; // Green / Red
  const title = isUp ? `✅ Resolved: ${monitor.name} is back online!` : `🚨 Alert: ${monitor.name} is down!`;
  
  // Generic embed payload (works for Discord, Slack, Teams)
  const payload = {
    embeds: [{
      title,
      description: `The monitor **${monitor.name}** (${monitor.url}) reported a status of **${eventType.toUpperCase()}**.`,
      color,
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    await axios.post(webhookUrl, payload);
    logger.info(`Webhook sent for ${integration.name} for monitor ${monitor.name}`);
  } catch (error) {
    logger.error(`Failed to send webhook for ${integration.name}:`, error);
  }
}

async function sendGoogleChatNotification(integration: IIntegration, monitor: IMonitor, eventType: string) {
    const { webhookUrl } = integration.details;
    if (!webhookUrl) return;

    const isUp = eventType === 'up';
    const statusText = isUp ? "✅ RESOLVED" : "🚨 FIRING";
    const title = `${statusText}: ${monitor.name} is ${eventType.toUpperCase()}`;

    // Google Chat uses a "Card" format
    const payload = {
        "cardsV2": [{
            "cardId": `incident-${monitor._id}-${Date.now()}`,
            "card": {
                "header": {
                    "title": "UptimePulse Alert",
                    "subtitle": monitor.name,
                    "imageUrl": "https://raw.githubusercontent.com/Shekhar-here/Uptime-Pulse/main/client/public/logo.svg", // Replace with your actual logo URL
                    "imageType": "CIRCLE"
                },
                "sections": [{
                    "widgets": [
                        { "textParagraph": { "text": `<b>Status:</b> <font color=\"${isUp ? '#008000' : '#d93025'}\">${monitor.status.toUpperCase()}</font>` } },
                        { "textParagraph": { "text": `<b>URL:</b> ${monitor.url}` } },
                        { "textParagraph": { "text": `<b>Time:</b> ${new Date().toUTCString()}` } }
                    ]
                }]
            }
        }]
    };
    try {
        await axios.post(webhookUrl, payload);
        logger.info(`Google Chat notification sent for ${integration.name}`);
    } catch (error) {
        logger.error(`Failed to send Google Chat notification for ${integration.name}:`, error);
    }
}

async function sendTelegramNotification(integration: IIntegration, monitor: IMonitor, eventType: string) {
    const { botToken, chatId } = integration.details;
    if (!botToken || !chatId) return;

    const isUp = eventType === 'up';
    const icon = isUp ? '✅' : '🚨';
    const text = `*UptimePulse Alert*\n${icon} Monitor *${monitor.name}* is now *${eventType.toUpperCase()}*.\nURL: ${monitor.url}`;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: chatId,
            text,
            parse_mode: 'Markdown'
        });
        logger.info(`Telegram notification sent to chat ${chatId}`);
    } catch (error) {
        logger.error(`Failed to send Telegram notification to chat ${chatId}:`, error);
    }
}

async function sendSmsNotification(integration: IIntegration, monitor: IMonitor, eventType: string) {
    if (!twilioClient) {
        logger.warn('Twilio client not initialized. Skipping SMS notification.');
        return;
    }
    const { fromNumber, toNumber } = integration.details;
    if (!fromNumber || !toNumber) return;

    const isUp = eventType === 'up';
    const icon = isUp ? '✅' : '🚨';
    const body = `UptimePulse Alert: ${icon} Monitor ${monitor.name} is now ${eventType.toUpperCase()}.`;

    try {
        await twilioClient.messages.create({ body, from: fromNumber, to: toNumber });
        logger.info(`SMS notification sent to ${toNumber}`);
    } catch (error) {
        logger.error(`Failed to send SMS to ${toNumber}:`, error);
    }
}

async function sendPagerDutyNotification(integration: IIntegration, monitor: IMonitor, eventType: string) {
    const { integrationKey } = integration.details;
    if (!integrationKey) return;

    const isDown = eventType === 'down';
    const event_action = isDown ? 'trigger' : 'resolve';
    const severity = 'critical'; // Or map from monitor settings
    const dedup_key = `monitor-${monitor._id}`; // Unique key to trigger/resolve the same incident

    const payload = {
        routing_key: integrationKey,
        event_action,
        dedup_key,
        payload: {
            summary: `${monitor.name} is ${eventType.toUpperCase()}: ${monitor.url}`,
            source: monitor.url,
            severity,
            component: 'website',
            group: 'production',
            class: 'availability',
            custom_details: {
                monitor_id: monitor._id!.toString(),
                name: monitor.name,
                checked_at: new Date().toISOString(),
            }
        }
    };
    try {
        await axios.post('https://events.pagerduty.com/v2/enqueue', payload);
        logger.info(`PagerDuty event sent for monitor ${monitor.name}`);
    } catch (error) {
        logger.error(`Failed to send PagerDuty event for monitor ${monitor.name}:`, error);
    }
}


// --- MAIN DISPATCHER ---

export const sendNotification = async (monitor: IMonitor, eventType: string): Promise<void> => {
  logger.info(`Dispatching notifications for monitor ${monitor._id} (event: ${eventType})`);
  const configs = await NotificationConfig.find({ monitorId: monitor._id }).populate('integrationId');

  if (configs.length === 0) {
    logger.info(`No notification configs found for monitor ${monitor._id}.`);
    return;
  }
  
  // Add user's primary email as a default notification channel if they have no other email integrations for this monitor
  const userHasEmailIntegration = configs.some(c => (c.integrationId as any)?.type === 'email');
  if (!userHasEmailIntegration) {
      const user = await monitor.populate('userId');
      if (user.userId && (user.userId as any).email) {
          const primaryEmailIntegration: IIntegration = {
              details: { email: (user.userId as any).email },
              type: 'email', name: 'Primary Email'
          } as IIntegration;
          await sendEmailNotification(primaryEmailIntegration, monitor, eventType);
      }
  }


  for (const config of configs) {
    const integration = config.integrationId as unknown as IIntegration;
    if (!integration) continue;

    switch (integration.type) {
      case 'email': await sendEmailNotification(integration, monitor, eventType); break;
      case 'discord':
      case 'slack':
      case 'teams':
      case 'webhook': await sendWebhookNotification(integration, monitor, eventType); break;
      case 'googlechat': await sendGoogleChatNotification(integration, monitor, eventType); break;
      case 'telegram': await sendTelegramNotification(integration, monitor, eventType); break;
      case 'twiliosms': await sendSmsNotification(integration, monitor, eventType); break;
      case 'pagerduty': await sendPagerDutyNotification(integration, monitor, eventType); break;
      default:
        logger.warn(`Unknown integration type "${integration.type}" for config ID: ${config._id}.`);
        break;
    }
  }
};