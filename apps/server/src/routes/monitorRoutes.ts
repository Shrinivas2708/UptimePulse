import { Router } from 'express';
import { getMonitors, getMonitor, createMonitor, updateMonitor, deleteMonitor, getMonitorStats, createMaintenance, getMonitorSummary, toggleMonitorStatus, updateMonitorSettings } from '../controllers/monitorController';
import authMiddleware from '../utils/authMiddleware';

const router: Router = Router();

router.use(authMiddleware);
router.get('/stats/summary', getMonitorSummary);
router.get('/', getMonitors);
router.get('/:id', getMonitor);
router.post('/', createMonitor);
router.put('/:id', updateMonitor);
router.delete('/:id', deleteMonitor);
router.get('/:id/stats', getMonitorStats);
router.post('/:id/maintenance', createMaintenance);
router.patch('/:id/toggle', toggleMonitorStatus);
router.put('/:id/settings', updateMonitorSettings);
export default router;