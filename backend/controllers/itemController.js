const Item = require('../models/Item');

// @desc    Get all inventory items (With Search, Filter & Pagination)
// @route   GET /api/items
// @access  Private
const getItems = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { sku: { $regex: req.query.search, $options: 'i' } },
            { category: { $regex: req.query.search, $options: 'i' } }
          ]
        }
      : {};

    const count = await Item.countDocuments({ ...search });
    const items = await Item.find({ ...search })
      .limit(limit)
      .skip(limit * (page - 1))
      .sort({ createdAt: -1 });

    return res.json({
      items,
      page,
      pages: Math.ceil(count / limit),
      totalItems: count
    });
  } catch (error) {
    console.error('GET_ITEMS_ERROR:', error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Create new inventory item
// @route   POST /api/items
// @access  Private
const createItem = async (req, res) => {
  try {
    // Handle both JSON Object {} and single-element JSON Array [{}] safely
    const body = Array.isArray(req.body) ? req.body[0] : req.body;

    if (!body) {
      return res.status(400).json({ message: 'Request body is required' });
    }

    const { sku, name, category, quantity, threshold, unitPrice, supplier } = body;

    if (!sku || !name || !category) {
      return res.status(400).json({ message: 'Please provide sku, name, and category' });
    }

    const itemExists = await Item.findOne({ sku });
    if (itemExists) {
      return res.status(400).json({ message: 'Item with this SKU already exists' });
    }

    const item = new Item({
      user: req.user ? req.user._id : null,
      sku,
      name,
      category,
      quantity: quantity !== undefined ? quantity : 0,
      threshold: threshold !== undefined ? threshold : 0,
      unitPrice: unitPrice !== undefined ? unitPrice : 0,
      supplier: supplier || ''
    });

    const createdItem = await item.save();
    return res.status(201).json(createdItem);
  } catch (error) {
    console.error('CREATE_ITEM_ERROR:', error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update inventory item
// @route   PUT /api/items/:id
// @access  Private
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (item) {
      item.sku = req.body.sku || item.sku;
      item.name = req.body.name || item.name;
      item.category = req.body.category || item.category;
      item.quantity = req.body.quantity !== undefined ? req.body.quantity : item.quantity;
      item.threshold = req.body.threshold !== undefined ? req.body.threshold : item.threshold;
      item.unitPrice = req.body.unitPrice !== undefined ? req.body.unitPrice : item.unitPrice;
      item.supplier = req.body.supplier || item.supplier;

      const updatedItem = await item.save();
      return res.json(updatedItem);
    } else {
      return res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    console.error('UPDATE_ITEM_ERROR:', error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/items/:id
// @access  Private (Admin/Manager)
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (item) {
      await item.deleteOne();
      return res.json({ message: 'Item removed successfully' });
    } else {
      return res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    console.error('DELETE_ITEM_ERROR:', error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard metrics & analytics
// @route   GET /api/items/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const totalItems = await Item.countDocuments();
    const lowStockCount = await Item.countDocuments({ status: 'Low Stock' });
    const outOfStockCount = await Item.countDocuments({ status: 'Out of Stock' });

    const inventoryValue = await Item.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
        }
      }
    ]);

    const recentItems = await Item.find().sort({ createdAt: -1 }).limit(5);

    return res.json({
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue: inventoryValue[0]?.totalValue || 0,
      recentItems
    });
  } catch (error) {
    console.error('GET_DASHBOARD_STATS_ERROR:', error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getDashboardStats
};