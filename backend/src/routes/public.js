import { Router } from 'express';
import {
  getPublicOwner,
  getPublicHouse,
  checkPublicAvailability,
  createPublicBooking,
  getSiteHouses,
  getSiteHouse,
} from '../controllers/public.js';

const router = Router();

// Site-level routes (no ownerId in URL — uses OWNER_ID env or first user)
router.get('/site/houses', getSiteHouses);
router.get('/site/houses/:houseId', getSiteHouse);
router.get('/availability', checkPublicAvailability);
router.post('/bookings', createPublicBooking);

// Owner-specific routes (kept for the /c/:ownerId shareable links)
router.get('/:ownerId/houses', getPublicOwner);
router.get('/:ownerId/houses/:houseId', getPublicHouse);

export default router;
