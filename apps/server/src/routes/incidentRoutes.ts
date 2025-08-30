import { Router } from 'express';
import { getIncidents, getIncident, createIncident, updateIncident,addIncidentUpdate } from '../controllers/incidentController';
import authMiddleware from '../utils/authMiddleware';

const router: Router = Router();
router.use(authMiddleware);

router.get('/', getIncidents);
router.get('/:id', getIncident);
router.post('/', createIncident);
router.put('/:id', updateIncident);
router.post('/:id/updates', addIncidentUpdate);
export default router;