import { Router } from 'express';
import { getBookings, createBooking, updateBooking, deleteBooking, getCalendar, checkAvailability } from '../controllers/bookings.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getBookings);
router.get('/calendar', getCalendar);
router.get('/availability', checkAvailability);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

export default router;
