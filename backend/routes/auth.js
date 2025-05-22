const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Vendor = require("../models/vendor");

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        console.log("Received registration data:", req.body);  // Debug log
        const { name, email, password, vendorName, location, vendorType } = req.body;

        if (!name || !email || !password || !vendorName || !location || !vendorType) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const existing = await Vendor.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);


        const vendor = new Vendor({
            name,
            email,
            password: hashedPassword,
            businessName: vendorName,
            location,
            businessType: vendorType,
        });

        console.log("About to save vendor:", vendor);

        await vendor.save().catch(err => {
            console.error("Mongoose Save Validation Error:", err);
            throw err;
        });

        await vendor.save();

        res.json({
            user: {
                id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                businessName: vendor.businessName,
                location: vendor.location,
            },
        });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// In auth.js
router.post("/login", async (req, res) => {
    console.log("🔍 Login payload:", req.body);

    try {
      const { email, password } = req.body;
  
      const vendor = await Vendor.findOne({ email });
      if (!vendor) return res.status(400).json({ message: "Vendor not found" });
  
      const isMatch = await bcrypt.compare(password, vendor.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid password" });
  
      // Generate JWT token
      const token = jwt.sign(
        { userId: vendor._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
  
      // Return user data with token
      res.json({
        token,
        user: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          businessName: vendor.businessName,
          location: vendor.location,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

module.exports = router;
