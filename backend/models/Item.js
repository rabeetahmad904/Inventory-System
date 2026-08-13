const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  threshold: { type: Number, required: true, default: 10 },
  unitPrice: { type: Number, required: true },
  supplier: { type: String, default: 'General Vendor' },
  imageUrl: { type: String, default: '' },
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' }
}, { timestamps: true });

itemSchema.pre('save', async function () {
  if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= this.threshold) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
});

module.exports = mongoose.model('Item', itemSchema);