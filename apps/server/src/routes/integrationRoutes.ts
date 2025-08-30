import { Router } from 'express';
import { 
    getIntegrations, 
    createIntegration, 
    deleteIntegration,
    // ✨ NEW: Import Twilio handlers
    initiateTwilioConnection,
    handleTwilioCallback,
    disconnectTwilio,
    sendTwilioTestSms
} from '../controllers/integrationController';
import authMiddleware from '../utils/authMiddleware';

const router = Router();
router.use(authMiddleware);

// Standard Integrations
router.get('/', getIntegrations);
router.post('/', createIntegration);
router.delete('/:id', deleteIntegration);

// ✨ NEW: Twilio OAuth and Test Routes
router.get('/twilio/connect', initiateTwilioConnection);
router.get('/twilio/callback', handleTwilioCallback);
router.post('/twilio/disconnect', disconnectTwilio);
router.post('/twilio/test-sms', sendTwilioTestSms);

export default router;