import { Router } from 'express';
// ✨ IMPORT THE NEW CONTROLLER FUNCTION ✨
import { getStatusPages, createStatusPage, updateStatusPage, deleteStatusPage, getPublicStatusPage } from '../controllers/statusPageController';
import authMiddleware from '../utils/authMiddleware';
import { addCustomDomain, deleteCustomDomain, getCustomDomainForStatusPage, verifyCustomDomain } from '../controllers/customDomainController';

const router = Router();

// ✨ NEW: Public route for viewing status pages by slug. NO AUTH MIDDLEWARE. ✨
router.get('/public/:slug', getPublicStatusPage);

// --- Authenticated routes for managing status pages ---
router.use(authMiddleware);

router.get('/', getStatusPages);
router.get('/:slug', getStatusPages); // For fetching a single page for management
router.post('/', createStatusPage);
router.put('/:slug', updateStatusPage);
router.delete('/:slug', deleteStatusPage);

router.post('/custom-domain', addCustomDomain);
router.post('/custom-domain/verify/:domain', verifyCustomDomain);
router.get('/:slug/custom-domain', getCustomDomainForStatusPage)
router.delete('/custom-domain/:domain', deleteCustomDomain);
export default router;
