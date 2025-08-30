// server/src/controllers/customDomainController.ts
import { Request, Response } from 'express';
import CustomDomain from '../models/CustomDomain';
import StatusPage from '../models/StatusPage';
import { nanoid } from 'nanoid';
import dns from 'dns';
import logger from '../utils/logger';
import { promisify } from 'util';
const resolveTxt = promisify(dns.resolveTxt);
export const addCustomDomain = async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: string };
  const { statusPageId, domain } = req.body;

  try {
    // Check if a domain is already associated with another user
    const existingDomain = await CustomDomain.findOne({ domain });
    if (existingDomain && existingDomain.userId.toString() !== userId) {
        return res.status(409).json({ error: "This domain is already in use by another account." });
    }

    const statusPage = await StatusPage.findOne({ _id: statusPageId, userId });
    if (!statusPage) {
      return res.status(404).json({ error: 'Status page not found' });
    }

    const verificationToken = nanoid(32);
    // Use findOneAndUpdate with upsert to avoid creating duplicates for the same user/page
    const customDomain = await CustomDomain.findOneAndUpdate(
        { statusPageId, userId },
        { domain, verificationToken, verified: false }, // Reset verification status on new domain
        { upsert: true, new: true }
    );

    res.status(201).json({
      message: 'Custom domain added. Please verify ownership.',
      // No need to send back the record, the frontend can construct it
    });
  } catch (error: any) {
    logger.error('Error adding custom domain:', error.message);
    res.status(500).json({ error: 'Failed to add custom domain' });
  }
};

export const verifyCustomDomain = async (req: Request, res: Response) => {
    const { domain } = req.params;
    const { userId } = req.user as { userId: string};

    try {
        const customDomain = await CustomDomain.findOne({ domain, userId });
        if (!customDomain) {
            return res.status(404).json({ error: 'Custom domain not found.' });
        }

        if (customDomain.verified) {
            return res.json({ message: 'Domain is already verified.' });
        }

        // ✨ This is the main fix: Using the promise-based version
        const records = await resolveTxt(`uptimepulse-verify.${domain}`);
        const verificationRecord = `uptimepulse-verify=${customDomain.verificationToken}`;

        // The TXT records are returned as an array of arrays of strings.
        // We need to flatten it and check if our record exists.
        if (records.flat().includes(verificationRecord)) {
            customDomain.verified = true;
            await customDomain.save();
            return res.json({ message: 'Domain verified successfully!' });
        } else {
            return res.status(400).json({ error: 'Verification failed. TXT record not found or does not match.' });
        }
    } catch (error: any) {
        // Handle specific DNS errors, like NXDOMAIN (domain not found)
        if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
             logger.warn(`DNS TXT record query failed for ${domain}: No records found.`);
             return res.status(400).json({ error: 'Verification TXT record not found. Please ensure it has been added correctly and has had time to propagate.' });
        }
        logger.error(`Error verifying domain ${domain}:`, error);
        res.status(500).json({ error: 'Internal server error during verification.' });
    }
};
export const getCustomDomainForStatusPage = async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: string };
  const { slug } = req.params;

  try {
    const statusPage = await StatusPage.findOne({ slug, userId });
    if (!statusPage) {
      return res.status(404).json({ error: 'Status page not found' });
    }

    const customDomain = await CustomDomain.findOne({ statusPageId: statusPage._id, userId });
    if (!customDomain) {
      // It's not an error if they don't have one, just return null
      return res.status(200).json(null);
    }

    res.status(200).json(customDomain);
  } catch (error: any) {
    logger.error('Error fetching custom domain:', error.message);
    res.status(500).json({ error: 'Failed to fetch custom domain details' });
  }
};
export const deleteCustomDomain = async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: string };
  const { domain } = req.params;

  try {
    const customDomain = await CustomDomain.findOneAndDelete({ domain, userId });

    if (!customDomain) {
      return res.status(404).json({ error: 'Custom domain not found or you do not have permission to remove it.' });
    }

    res.status(200).json({ message: 'Custom domain removed successfully.' });
  } catch (error: any) {
    logger.error(`Error removing custom domain ${domain}:`, error.message);
    res.status(500).json({ error: 'Failed to remove custom domain.' });
  }
};