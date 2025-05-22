const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
// Import models instead of defining them in server.js
const FoodItem = require('./models/foodItem');
const User = require('./models/user');
const Vendor = require('./models/vendor');


const emissionsRoutes = require('./routes/emissions');
const authRoutes = require('./routes/auth');



// Add this near the top of your server.js after importing models

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Add your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// These should come BEFORE app.use('/api/auth', authRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/emissions', emissionsRoutes);


// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});




// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/savensavor';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Add a debugging middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Routes
app.get("/check-vendors", async (req, res) => {
  const vendors = await Vendor.find({}).select("email");
  res.json({count: vendors.length, emails: vendors.map(v => v.email)});
});

// GET all food items
// GET all food items - with vendor filtering
app.get('/api/food-items', async (req, res) => {
  try {
    // Check if vendor ID is provided in query params
    const vendorId = req.query.vendorId;
    
    // Create filter object
    const filter = vendorId ? { 'vendor.id': vendorId } : {};
    
    // Find items with optional vendor filter
    const items = await FoodItem.find(filter).sort({ createdAt: -1 });
    
    console.log(`Returning ${items.length} food items${vendorId ? ` for vendor ${vendorId}` : ''}`);
    res.json(items);
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET a specific food item
app.get('/api/food-items/:id', async (req, res) => {
  try {
    const item = await FoodItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET image route
app.get('/api/food-items/:id/image', async (req, res) => {
  try {
    const item = await FoodItem.findById(req.params.id);
    if (!item || !item.image.data) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Send the base64 data
    res.setHeader('Content-Type', item.image.contentType);
    res.send(item.image.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new food item with image upload and enhanced emissions calculation
// In server.js - POST new food item route
// POST new food item with image upload and enhanced emissions calculation
// POST /api/food-items
app.post('/api/food-items', upload.single('image'), async (req, res) => {
  try {
    let itemData = {};

    // Check if we have form data or JSON
    if (req.file || req.body.name) {
      // Parse form data
      console.log("Received form data:", req.body); // Debug

      itemData = {
        name: req.body.name,
        category: req.body.category,
        originalPrice: parseFloat(req.body.originalPrice || "0"),
        discountedPrice: parseFloat(req.body.discountedPrice || "0"),
        quantity: parseInt(req.body.quantity || "0"),
        expiryDate: req.body.expiryDate,
        description: req.body.description || '',
        dietary: req.body.dietary ? JSON.parse(req.body.dietary) : [],
        vendor: req.body.vendor ? JSON.parse(req.body.vendor) : {},
        ingredients: req.body.ingredients ? JSON.parse(req.body.ingredients) : [],
        pickupTimeSlots: req.body.pickupTimeSlots ? JSON.parse(req.body.pickupTimeSlots) : [] // Add this line
      };

      // Handle image upload if present
      if (req.file) {
        itemData.image = {
          data: req.file.buffer.toString('base64'),
          contentType: req.file.mimetype
        };
      }
    } else {
      // JSON body
      itemData = req.body;
    }

    // Calculate emissions based on ingredients using the emissions API
    try {
      console.log('Calculating emissions for:', itemData.name);

      // Make a direct request to the emissions calculation module
      const emissionsRoutes = require('./routes/emissions');

      // Create the request data
      const emissionsData = await emissionsRoutes.calculateEmissions(
        itemData.name,
        itemData.ingredients,
        itemData.quantity || 1, // Use item quantity instead of hard-coded 1
        'detailed' // Use detailed calculation
      );

      // Use the result
      itemData.emissions = {
        total: emissionsData.total,
        saved: emissionsData.saved
      };

      console.log('Emissions calculation result:', itemData.emissions);
    } catch (emissionsError) {
      console.error('Error calculating emissions:', emissionsError);
      // Fallback to simple estimation
      itemData.emissions = {
        total: itemData.ingredients.length * 0.5, // Simple estimation
        saved: itemData.ingredients.length * 0.35, // 70% of total
      };
      console.log('Using fallback emissions:', itemData.emissions);
    }

    console.log('Final item data to save:', itemData);

    const foodItem = new FoodItem(itemData);
    const savedItem = await foodItem.save();
    console.log('Saved food item:', savedItem._id);
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error saving food item:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/food-items/:id
app.put('/api/food-items/:id', upload.single('image'), async (req, res) => {
  try {
    let updateData = {};

    // Check if we have form data or JSON
    if (req.file || req.body.name) {
      // Parse form data
      updateData = {
        name: req.body.name,
        category: req.body.category,
        originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : undefined,
        discountedPrice: req.body.discountedPrice ? parseFloat(req.body.discountedPrice) : undefined,
        quantity: req.body.quantity ? parseInt(req.body.quantity) : undefined,
        expiryDate: req.body.expiryDate,
        description: req.body.description,
        dietary: req.body.dietary ? JSON.parse(req.body.dietary) : undefined,
        vendor: req.body.vendor ? JSON.parse(req.body.vendor) : undefined,
        ingredients: req.body.ingredients ? JSON.parse(req.body.ingredients) : undefined,
        pickupTimeSlots: req.body.pickupTimeSlots ? JSON.parse(req.body.pickupTimeSlots) : undefined // Add this line
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Handle image upload if present
      if (req.file) {
        updateData.image = {
          data: req.file.buffer.toString('base64'),
          contentType: req.file.mimetype
        };
      }
    } else {
      // JSON body
      updateData = req.body;
    }

    // If ingredients changed, recalculate emissions
    if (updateData.ingredients) {
      try {
        const dishName = updateData.name || (await FoodItem.findById(req.params.id)).name || 'Food Item';
        console.log('Recalculating emissions for:', dishName);

        // Make a direct request to the emissions calculation module
        const emissionsRoutes = require('./routes/emissions');

        // Create the request data
        const emissionsData = await emissionsRoutes.calculateEmissions(
          dishName,
          updateData.ingredients,
          updateData.quantity || 1, // Use item quantity instead of hard-coded 1
          'detailed' // Use detailed calculation
        );

        // Use the result
        updateData.emissions = {
          total: emissionsData.total,
          saved: emissionsData.saved
        };

        console.log('Updated emissions calculation:', updateData.emissions);
      } catch (emissionsError) {
        console.error('Error recalculating emissions:', emissionsError);
        // Don't update emissions if calculation fails
      }
    }

    const item = await FoodItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE food item
app.delete('/api/food-items/:id', async (req, res) => {
  try {
    const item = await FoodItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.json({ message: 'Food item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ORDERS API ROUTES

// GET all orders for a vendor
app.get('/api/vendor/orders', async (req, res) => {
  try {
    // Extract vendor ID from token or query - use the ACTUAL vendor name from your database
    const vendorId = req.query.vendorId || "Spice Garden"; // Updated to match your DB
    const status = req.query.status;

    console.log(`Searching for orders with vendor: ${vendorId}`);

    // Find all users with orders that contain items from this vendor
    let usersQuery = { 'orders.items.vendor': vendorId };

    // Add status filter if provided
    if (status) {
      usersQuery['orders.status'] = status;
      console.log(`Filtering by status: ${status}`);
    }

    const users = await User.find(usersQuery);
    console.log(`Found ${users.length} users with matching orders`);

    // Extract and format orders with vendor items
    const vendorOrders = [];

    for (const user of users) {
      // Filter orders to include only those with items from this vendor
      const userOrders = user.orders.filter(order =>
        order.items.some(item => item.vendor === vendorId)
      );

      console.log(`User ${user.name} has ${userOrders.length} matching orders`);

      // Add user details to orders
      for (const order of userOrders) {
        // Filter by status if requested
        if (status && order.status !== status) continue;

        // Convert MongoDB document to plain object
        const orderObj = order.toObject ? order.toObject() : JSON.parse(JSON.stringify(order));

        vendorOrders.push({
          ...orderObj,
          _id: order._id.toString(),
          customerName: user.name,
          customerEmail: user.email,
          userId: user._id.toString()
        });
      }
    }

    // Sort by date, newest first
    vendorOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(`Returning ${vendorOrders.length} vendor orders`);
    res.json(vendorOrders);
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET order counts by status
app.get('/api/vendor/orders/counts', async (req, res) => {
  try {
    // Extract vendor ID from token or query - use the ACTUAL vendor name from your database
    const vendorId = req.query.vendorId || "Spice Garden"; // Updated to match your DB
    console.log(`Fetching order counts for vendor: ${vendorId}`);

    // Find all users with orders that contain items from this vendor
    const users = await User.find({ 'orders.items.vendor': vendorId });
    console.log(`Found ${users.length} users with orders from vendor ${vendorId}`);

    // Initialize counts
    const counts = {
      total: 0,
      pending: 0,
      confirmed: 0,
      ready: 0,
      completed: 0,
      cancelled: 0
    };

    // Count orders by status
    for (const user of users) {
      const vendorOrders = user.orders.filter(order =>
        order.items.some(item => item.vendor === vendorId)
      );

      counts.total += vendorOrders.length;

      for (const order of vendorOrders) {
        switch (order.status) {
          case 'pending':
            counts.pending++;
            break;
          case 'confirmed':
            counts.confirmed++;
            break;
          case 'ready for pickup':
            counts.ready++;
            break;
          case 'completed':
            counts.completed++;
            break;
          case 'cancelled':
            counts.cancelled++;
            break;
        }
      }
    }

    console.log('Order counts:', counts);
    res.json(counts);
  } catch (error) {
    console.error('Error fetching order counts:', error);
    res.status(500).json({ message: error.message });
  }
});

// UPDATE order status
app.put('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`Updating order ${orderId} status to ${status}`);

    if (!orderId || !status) {
      return res.status(400).json({ message: 'Order ID and status are required' });
    }

    // Find user with the specified order
    const user = await User.findOne({ 'orders._id': orderId });

    if (!user) {
      console.log(`Order ${orderId} not found in any user document`);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update the order status
    const orderIndex = user.orders.findIndex(order => order._id.toString() === orderId);

    if (orderIndex === -1) {
      console.log(`Order ${orderId} found in user ${user._id} but index couldn't be determined`);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`Found order at index ${orderIndex} for user ${user._id}`);
    user.orders[orderIndex].status = status;
    await user.save();
    console.log(`Updated order ${orderId} status to ${status}`);

    // Return the updated order with user info
    const updatedOrder = {
      ...user.orders[orderIndex].toObject(),
      _id: user.orders[orderIndex]._id.toString(),
      customerName: user.name,
      customerEmail: user.email,
      userId: user._id.toString()
    };

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: error.message });
  }
});

// UPDATE inventory when order is completed
app.put('/api/orders/:orderId/complete', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`Completing order ${orderId} and updating inventory`);

    // Find the order
    const user = await User.findOne({ 'orders._id': orderId });

    if (!user) {
      console.log(`Order ${orderId} not found in any user document`);
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderIndex = user.orders.findIndex(order => order._id.toString() === orderId);

    if (orderIndex === -1) {
      console.log(`Order ${orderId} found in user ${user._id} but index couldn't be determined`);
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = user.orders[orderIndex];
    console.log(`Found order with ${order.items.length} items`);

    // Update the order status to completed
    order.status = 'completed';
    await user.save();
    console.log(`Updated order ${orderId} status to completed`);

    // Update inventory for each item in the order
    for (const item of order.items) {
      try {
        console.log(`Updating inventory for item ${item.foodItemId}`);
        const foodItem = await FoodItem.findById(item.foodItemId);

        if (foodItem) {
          console.log(`Found food item ${foodItem._id}, current quantity: ${foodItem.quantity}`);
          foodItem.quantity = Math.max(0, foodItem.quantity - item.quantity);
          await foodItem.save();
          console.log(`Updated food item ${foodItem._id}, new quantity: ${foodItem.quantity}`);
        } else {
          console.log(`Food item ${item.foodItemId} not found in inventory`);
        }
      } catch (itemError) {
        console.error(`Error updating inventory for item ${item.foodItemId}:`, itemError);
        // Continue with other items even if one fails
      }
    }

    res.json({
      message: 'Order completed and inventory updated',
      updatedItems: order.items.length
    });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ message: error.message });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const calculateEmissions = async (dishName, ingredients, quantity = 1, detail_level = 'standard') => {
  try {
    // Use the function exported by the emissions module
    return await emissionsRoutes.calculateEmissions(dishName, ingredients, quantity, detail_level);
  } catch (error) {
    console.error('Error in emissions calculation:', error);
    // Return fallback values
    return {
      total: ingredients.length * 0.5,
      saved: ingredients.length * 0.35
    };
  }
};

// Export the calculation function for internal use
module.exports.calculateEmissions = calculateEmissions;

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for frontend at port 3000`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
