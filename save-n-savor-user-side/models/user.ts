import { Schema, model, models } from "mongoose"

const addressSchema = new Schema(
  {
    line1: String,
    city: String,
    state: String,
    zip: String,
  },
  { _id: false },
)

const paymentSchema = new Schema(
  {
    cardNumberLast4: String,
    expiry: String,
    nameOnCard: String,
  },
  { _id: false },
)

// order item schema to track individual items in an order
const orderItemSchema = new Schema(
  {
    foodItemId: { type: Schema.Types.ObjectId, ref: "FoodItem" },
    name: { type: String, required: true },
    vendor: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String },
  },
  { _id: false },
)

// order schema to track user orders
const orderSchema = new Schema(
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
)

// Add a console.log to check the schema
console.log("User schema initialized with orders array")

// Make sure the orders array is properly initialized
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    addresses: [addressSchema],
    paymentMethods: [paymentSchema],
    orders: {
      type: [orderSchema],
      default: [], // Explicitly set default to empty array
    },
  },
  { timestamps: true },
)

export default models.User || model("User", userSchema)
