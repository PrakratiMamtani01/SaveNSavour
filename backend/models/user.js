const mongoose = require('mongoose');

// Helper schemas
const addressSchema = new mongoose.Schema(
  {
    line1: String,
    city: String,
    state: String,
    zip: String,
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    cardNumberLast4: String,
    expiry: String,
    nameOnCard: String,
  },
  { _id: false },
);

// Order item schema
const orderItemSchema = new mongoose.Schema(
  {
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem" },
    name: { type: String, required: true },
    vendor: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String },
  },
  { _id: false },
);

// Order schema
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    serviceFee: { type: Number, default: 2.0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "ready for pickup", "completed", "cancelled"],
      default: "pending",
    },
    pickupAddress: { type: String, required: true },
    pickupTime: { type: String, required: true },
    paymentMethod: { type: String },
    impact: {
      foodSaved: { type: Number, default: 0 }, // in kg
      co2Saved: { type: Number, default: 0 }, // in kg
    },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    addresses: [addressSchema],
    paymentMethods: [paymentSchema],
    orders: {
      type: [orderSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);