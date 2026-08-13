const express = require('express');
const router = express.Router();
const {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getDashboardStats
} = require('../controllers/itemController');
const { protect, authorize } = require('../middleware/authMiddleware');
console.log('CHECK EXPORTS:', { 
  protect: typeof protect, 
  getItems: typeof getItems, 
  createItem: typeof createItem 
});
router.get('/dashboard', protect, getDashboardStats);

router.get('/', protect, getItems);
router.post('/', protect, createItem);

router.put('/:id', protect, updateItem);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteItem);

module.exports = router;