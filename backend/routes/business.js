// routes/business.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const authenticate = require('../middleware/authenticate');

// Import Business model (or create it if it doesn't exist)
const BusinessProfile = mongoose.models.BusinessProfile || mongoose.model('BusinessProfile', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String },
  description: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  logo: { 
    data: { type: String }, // Base64 string
    contentType: { type: String } 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

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

// Get business profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    // Find business profile for the authenticated user
    const businessProfile = await BusinessProfile.findOne({ userId: req.user._id });
    
    if (!businessProfile) {
      // If no profile exists, return a default structure
      return res.json({
        name: req.user.businessName || "",
        type: "",
        description: "",
        email: req.user.email || "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: ""
      });
    }
    
    // Format the response
    const response = {
      name: businessProfile.name,
      type: businessProfile.type || "",
      description: businessProfile.description || "",
      email: businessProfile.email || "",
      phone: businessProfile.phone || "",
      address: businessProfile.address || "",
      city: businessProfile.city || "",
      state: businessProfile.state || "",
      zip: businessProfile.zip || ""
    };
    
    // Add logo if exists
    if (businessProfile.logo && businessProfile.logo.data) {
      response.logo = `data:${businessProfile.logo.contentType};base64,${businessProfile.logo.data}`;
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update business profile
router.put('/profile', authenticate, upload.single('logo'), async (req, res) => {
  try {
    // Prepare data for update
    const updateData = {
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      updatedAt: new Date()
    };
    
    // Handle logo upload if provided
    if (req.file) {
      updateData.logo = {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype
      };
    }
    
    // Find and update business profile, create if it doesn't exist
    const businessProfile = await BusinessProfile.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, upsert: true }
    );
    
    // Format and send response
    const response = {
      name: businessProfile.name,
      type: businessProfile.type || "",
      description: businessProfile.description || "",
      email: businessProfile.email || "",
      phone: businessProfile.phone || "",
      address: businessProfile.address || "",
      city: businessProfile.city || "",
      state: businessProfile.state || "",
      zip: businessProfile.zip || ""
    };
    
    // Add logo if exists
    if (businessProfile.logo && businessProfile.logo.data) {
      response.logo = `data:${businessProfile.logo.contentType};base64,${businessProfile.logo.data}`;
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error updating business profile:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;