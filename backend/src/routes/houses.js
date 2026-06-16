import { Router } from 'express';
import { getHouses, createHouse, updateHouse, deleteHouse, getPriceForMonth } from '../controllers/houses.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getHouses);
router.post('/', createHouse);
router.put('/:id', updateHouse);
router.delete('/:id', deleteHouse);

// Returns effective price for a given month (1–12)
router.get('/:id/price', async (req, res) => {
  const month = parseInt(req.query.month);
  if (!month || month < 1 || month > 12) return res.status(400).json({ error: 'Invalid month' });
  const price = await getPriceForMonth(req.params.id, month);
  res.json({ price });
});

export default router;
