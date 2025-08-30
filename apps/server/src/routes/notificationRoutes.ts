import { Router } from 'express';
import { getNotificationConfigs, createNotificationConfig,  deleteNotificationConfig } from '../controllers/notificationController';
import authMiddleware from '../utils/authMiddleware';

const router : Router= Router();
router.use(authMiddleware);

router.get('/:monitorId', getNotificationConfigs);
router.post('/:monitorId', createNotificationConfig);
// router.put('/:monitorId/:configId', updateNotificationConfig);
router.delete('/:monitorId/:configId', deleteNotificationConfig);

export default router;