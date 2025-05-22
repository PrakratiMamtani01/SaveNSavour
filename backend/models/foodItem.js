const mongoose = require('mongoose');

// Define the pickup time slot schema
const pickupTimeSlotSchema = new mongoose.Schema({
  day: { type: String, required: true }, // 'Monday', 'Tuesday', etc. or a specific date
  startTime: { type: String, required: true }, // '09:00', '13:30', etc.
  endTime: { type: String, required: true }, // '10:00', '14:30', etc.
  maxOrders: { type: Number, default: 10 }, // Maximum number of orders for this slot
  currentOrders: { type: Number, default: 0 }, // Current number of orders for this slot
  isActive: { type: Boolean, default: true } // Whether this slot is active or not
}, { _id: false });

// Food Item Schema with Base64 image storage
const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  discountedPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  expiryDate: { type: String, required: true },
  description: { type: String, default: '' },
  dietary: [{ type: String }],
  vendor: {
    name: { type: String, required: true },
    id: { type: String, required: true },
    location: { type: String, required: true }
  },
  ingredients: [{ type: String }],
  emissions: {
    saved: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  pickupTimeSlots: [pickupTimeSlotSchema], // Add this line for pickup time slots
  image: { 
    data: { type: String, default: '' }, // Base64 string
    contentType: { type: String, default: '' } // MIME type
  },
  createdAt: { type: Date, default: Date.now }
}, { 
  timestamps: true
});
foodItemSchema.index({ name: 1, 'vendor.id': 1 }, { unique: true });
module.exports = mongoose.models.FoodItem || mongoose.model('FoodItem', foodItemSchema);