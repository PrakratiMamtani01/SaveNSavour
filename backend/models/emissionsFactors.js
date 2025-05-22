const mongoose = require('mongoose');

// Emission Factor Schema
const EmissionFactorSchema = new mongoose.Schema({
  category: { type: String, required: true },
  item: { type: String, required: true },
  country: { type: String, default: 'global' },
  value: { type: Number, required: true },
  source: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
  metadata: { type: Object }
}, { timestamps: true });

// Create unique compound index
EmissionFactorSchema.index({ category: 1, item: 1, country: 1 }, { unique: true });

// Food Item Schema (for categorizing food items)
const FoodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  aliases: [String],
  category: { type: String, required: true },
  subcategory: { type: String },
  specificItem: { type: String }
});

// Create unique index on name
FoodItemSchema.index({ name: 1 }, { unique: true });
// Create text index for search
FoodItemSchema.index({ name: 'text', aliases: 'text' });

// Seasonal Info Schema
const SeasonalInfoSchema = new mongoose.Schema({
  country: { type: String, required: true },
  item: { type: String, required: true },
  inSeason: [Number],     // Array of months (1-12)
  nearSeason: [Number]    // Array of months (1-12)
});

// Create unique compound index
SeasonalInfoSchema.index({ country: 1, item: 1 }, { unique: true });

// Processing Factors Schema
const ProcessingFactorSchema = new mongoose.Schema({
  processingMethod: { type: String, required: true },
  category: { type: String, required: true },
  value: { type: Number, required: true }
});

// Create unique compound index
ProcessingFactorSchema.index({ processingMethod: 1, category: 1 }, { unique: true });

// Waste Factors Schema
const WasteFactorSchema = new mongoose.Schema({
  category: { type: String, required: true },
  stage: { type: String, required: true },
  value: { type: Number, required: true }
});

// Create unique compound index
WasteFactorSchema.index({ category: 1, stage: 1 }, { unique: true });

// Create models
const models = {
  EmissionFactor: mongoose.models.EmissionFactor || 
                    mongoose.model('EmissionFactor', EmissionFactorSchema),
  FoodCategoryItem: mongoose.models.FoodCategoryItem || 
                    mongoose.model('FoodCategoryItem', FoodItemSchema),
  SeasonalInfo: mongoose.models.SeasonalInfo || 
                mongoose.model('SeasonalInfo', SeasonalInfoSchema),
  ProcessingFactor: mongoose.models.ProcessingFactor || 
                    mongoose.model('ProcessingFactor', ProcessingFactorSchema),
  WasteFactor: mongoose.models.WasteFactor || 
                mongoose.model('WasteFactor', WasteFactorSchema)
};

module.exports = models;