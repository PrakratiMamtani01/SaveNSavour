const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        businessName: { type: String, required: true },   // vendorName maps to this
        location: { type: String, required: true },
        businessType: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
