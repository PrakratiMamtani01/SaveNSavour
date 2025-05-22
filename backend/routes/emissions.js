const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const mongoose = require('mongoose');
const NodeCache = require('node-cache');
const fs = require('fs');

// Initialize memory cache for API responses to reduce repeat calculations
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// Initialize Gemini with service account (keep existing code)
let genAI = null;
let model = null;

async function initializeGemini() {
  try {
    const credentialsPath = path.resolve(__dirname, '../credentials/save-n-savor-26ebdf8139b8.json');
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    
    const auth = new GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/generative-language']
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (accessToken.token) {
      genAI = new GoogleGenerativeAI(accessToken.token);
      model = genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log('Gemini initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Gemini:', error);
  }
}

// Call initialization when server starts
initializeGemini();

// MongoDB Schemas (keep existing schemas)
const EmissionFactorSchema = new mongoose.Schema({
  category: { type: String, required: true },
  item: { type: String, required: true },
  country: { type: String, default: 'global' },
  value: { type: Number, required: true },
  source: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
  metadata: { type: Object }
}, { timestamps: true });

EmissionFactorSchema.index({ category: 1, item: 1, country: 1 }, { unique: true });

const FoodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  aliases: [String],
  category: { type: String, required: true },
  subcategory: { type: String },
  specificItem: { type: String }
});

FoodItemSchema.index({ name: 1 }, { unique: true });
FoodItemSchema.index({ name: 'text', aliases: 'text' });

const SeasonalInfoSchema = new mongoose.Schema({
  country: { type: String, required: true },
  item: { type: String, required: true },
  inSeason: [Number],
  nearSeason: [Number]
});

SeasonalInfoSchema.index({ country: 1, item: 1 }, { unique: true });

const ProcessingFactorSchema = new mongoose.Schema({
  processingMethod: { type: String, required: true },
  category: { type: String, required: true },
  value: { type: Number, required: true }
});

ProcessingFactorSchema.index({ processingMethod: 1, category: 1 }, { unique: true });

const WasteFactorSchema = new mongoose.Schema({
  category: { type: String, required: true },
  stage: { type: String, required: true },
  value: { type: Number, required: true }
});

WasteFactorSchema.index({ category: 1, stage: 1 }, { unique: true });

// Create models only if they don't exist
const EmissionFactor = mongoose.models.EmissionFactor || 
                      mongoose.model('EmissionFactor', EmissionFactorSchema);
const FoodItem = mongoose.models.FoodItem || 
                mongoose.model('FoodItem', FoodItemSchema);
const SeasonalInfo = mongoose.models.SeasonalInfo || 
                    mongoose.model('SeasonalInfo', SeasonalInfoSchema);
const ProcessingFactor = mongoose.models.ProcessingFactor || 
                        mongoose.model('ProcessingFactor', ProcessingFactorSchema);
const WasteFactor = mongoose.models.WasteFactor || 
                   mongoose.model('WasteFactor', WasteFactorSchema);

// New code: SuEatableLife database implementation
// --------------------------------------------------

// SuEatable database structure
const suEatableDatabase = {
  // Structure: groups -> typologies -> sub-typologies -> items
  groups: ['Agricultural processed', 'Animal husbandry', 'Crops', 'Fish'],
  
  // Maps food item to its typology
  itemToTypology: {
    // Example mappings
    'beef': 'ruminant meat',
    'chicken': 'non-ruminant meat',
    'rice': 'grains',
    'tomato': 'vegetables outdoors',
    'apple': 'fruits outdoors',
    'milk': 'dairy',
    'cheese': 'dairy',
    'butter': 'butter*',
    'yogurt': 'dairy',
    'potato': 'root vegetables',
    'carrot': 'root vegetables',
    'onion': 'bulb vegetables',
    'lettuce': 'leafy vegetables',
    'spinach': 'leafy vegetables',
    'beans': 'legumes',
    'lentils': 'legumes',
    'chickpeas': 'legumes',
    'tofu': 'soy products',
    'olive oil': 'oils',
    'vegetable oil': 'oils',
    'salmon': 'fish',
    'tuna': 'fish',
    'shrimp': 'crustaceans',
    'mussels': 'molluscs bivalves*'
  },
  
  // Maps typology to its sub-typology (if applicable)
  typologyToSubTypology: {
    'vegetables outdoors': {
      'tomato': 'fruiting vegetables',
      'lettuce': 'leafy vegetables',
      'spinach': 'leafy vegetables',
      'potato': 'root vegetables',
      'carrot': 'root vegetables',
      'onion': 'bulb vegetables'
    },
    'fruits outdoors': {
      'apple': 'pome fruits',
      'banana': 'tropical fruits',
      'orange': 'citrus fruits',
      'mango': 'tropical fruits'
    },
    'shellfish': {
      'shrimp': 'crustaceans',
      'crab': 'crustaceans',
      'mussels': 'molluscs bivalves*'
    }
  },
  
  // Carbon footprint values for items (median values in kg CO2eq/kg)
  itemCF: {
    'beef': 25.3,
    'chicken': 3.7,
    'rice': 2.7,
    'tomato': 0.7,
    'apple': 0.3,
    'milk': 1.4,
    'cheese': 8.6,
    'butter': 9.0,
    'yogurt': 1.9,
    'potato': 0.3,
    'carrot': 0.3,
    'onion': 0.3,
    'lettuce': 0.4,
    'spinach': 0.5,
    'beans': 0.8,
    'lentils': 0.9,
    'chickpeas': 0.8,
    'tofu': 2.0,
    'olive oil': 5.4,
    'vegetable oil': 3.1,
    'salmon': 11.9,
    'tuna': 6.1,
    'shrimp': 18.2,
    'mussels': 9.5
  },
  
  // Carbon footprint values for typologies (median values in kg CO2eq/kg)
  typologyCF: {
    'ruminant meat': 22.0,
    'non-ruminant meat': 4.2,
    'grains': 1.4,
    'vegetables outdoors': 0.4,
    'fruits outdoors': 0.5,
    'dairy': 2.8,
    'butter*': 9.0,
    'root vegetables': 0.3,
    'bulb vegetables': 0.3,
    'leafy vegetables': 0.4,
    'fruiting vegetables': 0.7,
    'legumes': 0.8,
    'soy products': 2.0,
    'oils': 4.2,
    'fish': 8.0,
    'crustaceans': 18.2,
    'molluscs bivalves*': 9.5
  },
  
  // Carbon footprint values for sub-typologies (if applicable)
  subTypologyCF: {
    'vegetables outdoors': {
      'fruiting vegetables': 0.7,
      'leafy vegetables': 0.4,
      'root vegetables': 0.3,
      'bulb vegetables': 0.3
    },
    'fruits outdoors': {
      'pome fruits': 0.3,
      'citrus fruits': 0.4,
      'tropical fruits': 0.7
    },
    'shellfish': {
      'crustaceans': 18.2,
      'molluscs bivalves*': 9.5
    }
  },
  
  // Data uncertainty flags (L = Low, H = High)
  itemUncertainty: {
    'beef': 'L',
    'chicken': 'L',
    'rice': 'L',
    'tomato': 'L',
    'apple': 'L',
    'milk': 'L',
    'cheese': 'L',
    'butter': 'L',
    'yogurt': 'L',
    'potato': 'L',
    'carrot': 'L',
    'onion': 'L',
    'lettuce': 'L',
    'spinach': 'H',
    'beans': 'L',
    'lentils': 'L',
    'chickpeas': 'L',
    'tofu': 'H',
    'olive oil': 'L',
    'vegetable oil': 'H',
    'salmon': 'L',
    'tuna': 'L',
    'shrimp': 'H',
    'mussels': 'H'
  }
};

// Helper function to find the best match for an ingredient in the database
function findBestSuEatableMatch(ingredient) {
  const normalizedIngredient = ingredient.toLowerCase().trim();
  
  // Exact match in items
  if (suEatableDatabase.itemCF[normalizedIngredient]) {
    return {
      type: 'item',
      name: normalizedIngredient,
      value: suEatableDatabase.itemCF[normalizedIngredient],
      uncertainty: suEatableDatabase.itemUncertainty[normalizedIngredient] || 'H',
      typology: suEatableDatabase.itemToTypology[normalizedIngredient]
    };
  }
  
  // Check for partial matches
  for (const itemName in suEatableDatabase.itemCF) {
    if (itemName.includes(normalizedIngredient) || normalizedIngredient.includes(itemName)) {
      return {
        type: 'item',
        name: itemName,
        value: suEatableDatabase.itemCF[itemName],
        uncertainty: suEatableDatabase.itemUncertainty[itemName] || 'H',
        typology: suEatableDatabase.itemToTypology[itemName]
      };
    }
  }
  
  // Pattern matching for food groups
  const typeMapping = {
    // Meats
    ruminant: { typology: 'ruminant meat', pattern: /beef|steak|veal|lamb|mutton|goat/i },
    nonRuminant: { typology: 'non-ruminant meat', pattern: /chicken|pork|turkey|duck|ham|bacon/i },
    // Plant-based
    vegetable: { typology: 'vegetables outdoors', pattern: /vegetable|tomato|lettuce|spinach|carrot|potato|onion|garlic|cucumber|pepper|broccoli|cabbage/i },
    fruit: { typology: 'fruits outdoors', pattern: /fruit|apple|orange|banana|grape|pear|kiwi|mango|berry|melon/i },
    grain: { typology: 'grains', pattern: /grain|rice|wheat|oat|barley|corn|quinoa|bread|pasta|cereal/i },
    legume: { typology: 'legumes', pattern: /bean|lentil|chickpea|pea|legume/i },
    // Dairy
    dairy: { typology: 'dairy', pattern: /milk|cream|yogurt|cheese|dairy/i },
    // Other
    oil: { typology: 'oils', pattern: /oil|fat/i },
    seafood: { typology: 'fish', pattern: /fish|salmon|tuna|cod|tilapia|halibut|bass/i },
    shellfish: { typology: 'shellfish', pattern: /shrimp|prawn|crab|lobster|mussel|oyster|clam/i }
  };
  
  // Match to a typology based on pattern
  for (const [key, matcher] of Object.entries(typeMapping)) {
    if (matcher.pattern.test(normalizedIngredient)) {
      const typology = matcher.typology;
      
      // Check if this typology has sub-typologies
      let subTypology = null;
      let subTypologyValue = null;
      
      if (suEatableDatabase.subTypologyCF[typology]) {
        // Need to determine sub-typology
        for (const [subName, pattern] of Object.entries({
          'fruiting vegetables': /tomato|pepper|eggplant|zucchini|cucumber/i,
          'leafy vegetables': /lettuce|spinach|kale|cabbage|arugula/i,
          'root vegetables': /potato|carrot|beet|radish|turnip/i,
          'bulb vegetables': /onion|garlic|leek|shallot/i,
          'pome fruits': /apple|pear/i,
          'citrus fruits': /orange|lemon|lime|grapefruit/i,
          'tropical fruits': /banana|mango|pineapple|papaya/i,
          'crustaceans': /shrimp|prawn|crab|lobster/i,
          'molluscs bivalves*': /mussel|oyster|clam/i
        })) {
          if (pattern.test(normalizedIngredient)) {
            subTypology = subName;
            subTypologyValue = suEatableDatabase.subTypologyCF[typology][subName];
            break;
          }
        }
      }
      
      return {
        type: 'typology',
        name: normalizedIngredient,
        typology: typology,
        value: suEatableDatabase.typologyCF[typology],
        subTypology: subTypology,
        subTypologyValue: subTypologyValue
      };
    }
  }
  
  // Default to a generic typology with moderate emissions
  return {
    type: 'unknown',
    name: normalizedIngredient,
    typology: 'vegetables outdoors', // Conservative default
    value: 1.0, // Conservative default value
    uncertainty: 'H'
  };
}

// New class that replaces the old FoodDatabase but keeps the same interface
class SuEatableFoodDatabase {
  async findBestMatch(ingredientName) {
    const result = findBestSuEatableMatch(ingredientName);
    
    // Map to original FoodDatabase format for backwards compatibility
    return {
      name: result.name,
      category: result.typology || 'unknown',
      subcategory: result.subTypology || (result.typology || 'unknown'),
      specificItem: result.name,
      confidence: result.uncertainty === 'L' ? 0.9 : 0.7
    };
  }
  
  async getEmissionFactor(category, item) {
    const cacheKey = `suef:${category}:${item}`;
    
    // Try memory cache first
    const cachedValue = cache.get(cacheKey);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    // Exact match at item level
    const itemMatch = findBestSuEatableMatch(item);
    if (itemMatch.type === 'item' && itemMatch.uncertainty === 'L') {
      cache.set(cacheKey, itemMatch.value);
      return itemMatch.value;
    }
    
    // If item has high uncertainty, prefer typology
    if (itemMatch.typology && suEatableDatabase.typologyCF[itemMatch.typology]) {
      const typologyValue = suEatableDatabase.typologyCF[itemMatch.typology];
      cache.set(cacheKey, typologyValue);
      return typologyValue;
    }
    
    // If we have a sub-typology, use that value
    if (itemMatch.subTypology && itemMatch.subTypologyValue) {
      cache.set(cacheKey, itemMatch.subTypologyValue);
      return itemMatch.subTypologyValue;
    }
    
    // Use the best value we have
    const bestValue = itemMatch.value || 1.0;
    cache.set(cacheKey, bestValue);
    return bestValue;
  }

  async getCategoryAverage(category) {
    // Map category to SuEatable typology if needed
    const typologyMapping = {
      'meat': 'non-ruminant meat',
      'dairy': 'dairy',
      'vegetables': 'vegetables outdoors',
      'fruits': 'fruits outdoors',
      'grains': 'grains',
      'legumes': 'legumes',
      'seafood': 'fish',
      'oils': 'oils',
      'spices': 'spices'
    };
    
    const typology = typologyMapping[category] || category;
    
    // Return typology value if available
    if (suEatableDatabase.typologyCF[typology]) {
      return suEatableDatabase.typologyCF[typology];
    }
    
    // Fallback values for common categories
    const fallbackValues = {
      'meat': 4.2,
      'dairy': 2.8,
      'vegetables': 0.4,
      'fruits': 0.5,
      'grains': 1.4,
      'legumes': 0.8,
      'seafood': 8.0,
      'oils': 4.2,
      'spices': 0.1,
      'default': 1.0
    };
    
    return fallbackValues[category] || fallbackValues.default;
  }

  getFallbackEmissionFactor(category, item) {
    // Maintain interface compatibility with original DB
    // Maps to SuEatable database values
    const fallbackValues = {
      'meat': 4.2,
      'dairy': 2.8,
      'vegetables': 0.4,
      'fruits': 0.5,
      'grains': 1.4,
      'legumes': 0.8,
      'seafood': 8.0,
      'oils': 4.2,
      'spices': 0.1,
      'default': 1.0
    };
    
    return fallbackValues[category] || fallbackValues.default;
  }
}

// Initialize food database with new implementation
const foodDB = new SuEatableFoodDatabase();

// Keep the existing classes for compatibility but update their implementation
// to use the SuEatable database where appropriate

class SeasonManager {
  async determineSeasonality(ingredient, country = 'global', date = new Date()) {
    try {
      const month = date.getMonth() + 1;
      const normalizedIngredient = ingredient.toLowerCase();
      
      // Find the closest ingredient match in seasonal database
      const seasonalItems = await SeasonalInfo.find({ country: country });
      
      // If no items for country, try global
      if (seasonalItems.length === 0 && country !== 'global') {
        return this.determineSeasonality(ingredient, 'global', date);
      }
      
      // First try exact match
      for (const item of seasonalItems) {
        if (normalizedIngredient === item.item) {
          if (item.inSeason.includes(month)) {
            return 'inSeason';
          }
          if (item.nearSeason.includes(month)) {
            return 'nearSeason';
          }
          return 'outOfSeason';
        }
      }
      
      // Try partial match
      for (const item of seasonalItems) {
        if (normalizedIngredient.includes(item.item) || item.item.includes(normalizedIngredient)) {
          if (item.inSeason.includes(month)) {
            return 'inSeason';
          }
          if (item.nearSeason.includes(month)) {
            return 'nearSeason';
          }
          return 'outOfSeason';
        }
      }
      
      // If no match, guess based on category
      const categoryInfo = await foodDB.findBestMatch(ingredient);
      
      if (categoryInfo.category === 'vegetables outdoors' || categoryInfo.category === 'fruits outdoors') {
        // For produce, default to out of season for safety
        return 'outOfSeason';
      }
      
      // For non-seasonal foods
      return 'default';
    } catch (error) {
      console.error('Error determining seasonality:', error);
      return 'default';
    }
  }

  async getSeasonalFactor(season) {
    // Adjustment factors based on seasonality
    switch(season) {
      case 'inSeason':
        return 0.85; // Lower emissions when in season
      case 'nearSeason':
        return 0.95; // Slightly lower emissions when near season
      case 'outOfSeason':
        return 1.2; // Higher emissions when out of season
      case 'default':
      default:
        return 1.0; // No adjustment for non-seasonal items
    }
  }
}

// Initialize season manager
const seasonManager = new SeasonManager();

// Keep the ProcessingManager class
class ProcessingManager {
  async getProcessingFactor(ingredient, processingMethod = 'fresh') {
    try {
      const categoryInfo = await foodDB.findBestMatch(ingredient);
      
      // Try specific category + method combination
      let factor = await ProcessingFactor.findOne({ 
        processingMethod: processingMethod,
        category: categoryInfo.category
      });
      
      if (factor) {
        return factor.value;
      }
      
      // Try generic method
      factor = await ProcessingFactor.findOne({ 
        processingMethod: processingMethod,
        category: 'default'
      });
      
      if (factor) {
        return factor.value;
      }
      
      // Default processing factor
      return 1.0;
    } catch (error) {
      console.error('Error getting processing factor:', error);
      return 1.0; // Default
    }
  }
}

// Initialize processing manager
const processingManager = new ProcessingManager();

// Keep the WasteManager class
class WasteManager {
  async getWasteFactor(ingredient, stage = 'consumer') {
    try {
      const categoryInfo = await foodDB.findBestMatch(ingredient);
      
      // Try specific category + stage
      const factor = await WasteFactor.findOne({
        category: categoryInfo.category,
        stage: stage
      });
      
      if (factor) {
        return factor.value;
      }
      
      // Default waste factor
      const defaultFactor = await WasteFactor.findOne({
        category: 'default',
        stage: stage
      });
      
      return defaultFactor ? defaultFactor.value : 0.1; // Default 10% waste
    } catch (error) {
      console.error('Error getting waste factor:', error);
      return 0.1; // Default 10% waste
    }
  }
}

// Initialize waste manager
const wasteManager = new WasteManager();

// Keep the PortionSizeEstimator class
class PortionSizeEstimator {
  async estimatePortionSize(ingredient, dishName = '') {
    try {
      const categoryInfo = await foodDB.findBestMatch(ingredient);
      const normalizedIngredient = ingredient.toLowerCase();
      const normalizedDish = dishName.toLowerCase();
      
      // Check if this is a main ingredient in the dish
      const isMainIngredient = normalizedDish.includes(normalizedIngredient);
      
      // Base estimations on food category
      switch (categoryInfo.category) {
        case 'ruminant meat':
        case 'non-ruminant meat':
          return isMainIngredient ? 150 : 100; // 100-150g for meat

        case 'fish':
        case 'shellfish':
          return isMainIngredient ? 120 : 80; // 80-120g for seafood
          
        case 'dairy':
          if (/milk|yogurt/i.test(normalizedIngredient)) {
            return 200; // 200g for liquid dairy
          } else if (/cheese/i.test(normalizedIngredient)) {
            return isMainIngredient ? 50 : 30; // 30-50g for cheese
          } else if (/butter|cream/i.test(normalizedIngredient)) {
            return 15; // 15g for high-fat dairy
          } else if (/egg/i.test(normalizedIngredient)) {
            return 50; // 50g per egg
          } else {
            return 50; // Default dairy
          }
          
        case 'grains':
          if (/rice|pasta|potato/i.test(normalizedIngredient)) {
            return isMainIngredient ? 150 : 100; // 100-150g cooked
          } else if (/bread|toast/i.test(normalizedIngredient)) {
            return 30; // 30g per slice
          } else {
            return isMainIngredient ? 100 : 75; // Other grains
          }
          
        case 'vegetables outdoors':
          if (/lettuce|spinach|kale/i.test(normalizedIngredient)) {
            return 60; // Leafy greens are lighter
          } else if (/potato|carrot|root/i.test(normalizedIngredient)) {
            return 100; // Root vegetables
          } else {
            return 80; // Other vegetables
          }
          
        case 'fruits outdoors':
          if (/berry|berries/i.test(normalizedIngredient)) {
            return 80; // Berries
          } else if (/melon|watermelon/i.test(normalizedIngredient)) {
            return 150; // Melons are heavier
          } else {
            return 120; // ~120g per fruit
          }
          
        case 'legumes':
          return isMainIngredient ? 150 : 80; // 80-150g for cooked legumes
          
        case 'oils':
          return 15; // 15g for oils and sauces
          
        case 'spices':
          if (/salt|pepper/i.test(normalizedIngredient)) {
            return 1; // 1g for salt and pepper
          } else {
            return 3; // 3g for other spices
          }
          
        default:
          return 50; // 50g as default
      }
    } catch (error) {
      console.error('Error estimating portion size:', error);
      return 50; // Default 50g if error
    }
  }
}

// Initialize portion size estimator
const portionEstimator = new PortionSizeEstimator();

// Keep the AIManager class
class AIManager {
  async getIngredientEstimates(dishName, ingredients) {
    if (!model) {
      return null;
    }
    
    const prompt = `
      As a food scientist specializing in environmental impact assessment:
      
      Analyze the CO2 emissions impact of this dish and its ingredients:
      
      Dish: ${dishName}
      Ingredients: ${ingredients.join(', ')}
      
      For EACH ingredient, provide:
      1. Typical weight in grams in this dish
      2. Classification: category (meat/dairy/seafood/grain/vegetable/fruit/oil/spice etc.)
      3. Processing level: fresh/frozen/canned/dried/processed
      4. Most likely origin: local/regional/imported
      5. Seasonality status: in-season/out-of-season (currently ${new Date().toLocaleDateString()})
      
      JSON FORMAT ONLY:
      {
        "ingredients": [
          {
            "name": "string",
            "weight": number,
            "category": "string",
            "processing": "string",
            "origin": "string",
            "seasonality": "string"
          }
        ]
      }
    `;
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      
      try {
        // Parse the JSON
        const parsedResponse = JSON.parse(jsonStr);
        return parsedResponse.ingredients;
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return null;
      }
    } catch (error) {
      console.error('Error using AI estimation:', error);
      return null;
    }
  }
}

// Initialize AI manager
const aiManager = new AIManager();

// Updated emissions calculation using SuEatable database
async function calculateEmissionsDetailed(dishName, ingredients, quantity = 1) {
  try {
    // Get ingredient estimates from AI if available
    let ingredientDetails = null;
    
    if (model) {
      ingredientDetails = await aiManager.getIngredientEstimates(dishName, ingredients);
    }
    
    // If AI estimation failed, do manual estimation
    if (!ingredientDetails) {
      ingredientDetails = await Promise.all(ingredients.map(async (ingredient) => {
        const categoryInfo = await foodDB.findBestMatch(ingredient);
        const weight = await portionEstimator.estimatePortionSize(ingredient, dishName);
        const season = await seasonManager.determineSeasonality(ingredient);
        
        return {
          name: ingredient,
          weight: weight,
          category: categoryInfo.category,
          processing: 'fresh',
          origin: 'regional',
          seasonality: season
        };
      }));
    }
    
    // Calculate emissions for each ingredient using SuEatable database
    const emissionsResults = await Promise.all(ingredientDetails.map(async (ingredient) => {
      try {
        // Get the best match from the SuEatable database
        const match = findBestSuEatableMatch(ingredient.name);
        
        // Get the best emissions value
        let emissionFactor;
        if (match.type === 'item' && match.uncertainty === 'L') {
          emissionFactor = match.value;
        } else if (match.subTypologyValue) {
          emissionFactor = match.subTypologyValue;
        } else if (match.value) {
          emissionFactor = match.value;
        } else {
          // Fallback to original database lookup
          emissionFactor = await foodDB.getEmissionFactor(ingredient.category, ingredient.name);
        }
        
        // Get adjustment factors
        const seasonalFactor = await seasonManager.getSeasonalFactor(ingredient.seasonality);
        const processingFactor = await processingManager.getProcessingFactor(ingredient.name, ingredient.processing);
        
        // Calculate base emissions (kg of ingredient * emission factor per kg)
        const baseEmissions = (ingredient.weight / 1000) * emissionFactor;
        
        // Apply adjustment factors
        const adjustedEmissions = baseEmissions * seasonalFactor * processingFactor;
        
        return {
          ingredient: ingredient.name,
          weight: ingredient.weight,
          category: ingredient.category,
          emissions: adjustedEmissions,
          factors: {
            seasonal: seasonalFactor,
            processing: processingFactor,
            base: emissionFactor // Add base factor for transparency
          }
        };
      } catch (error) {
        console.error(`Error calculating emissions for ${ingredient.name}:`, error);
        // Return fallback calculation
        return {
          ingredient: ingredient.name,
          weight: ingredient.weight,
          category: ingredient.category || 'unknown',
          emissions: (ingredient.weight / 1000) * 1.0, // Default factor
          factors: {
            seasonal: 1.0,
            processing: 1.0,
            base: 1.0
          }
        };
      }
    }));
    
    // Calculate total emissions
    const totalEmissions = emissionsResults.reduce(
      (sum, result) => sum + result.emissions, 
      0
    ) * quantity;
    
    // Calculate saved emissions (assuming 70% would be wasted)
    const savedEmissions = totalEmissions * 0.7;
    
    return {
      total: totalEmissions,
      saved: savedEmissions,
      breakdown: emissionsResults
    };
  } catch (error) {
    console.error('Error in detailed emissions calculation:', error);
    // Provide very rough estimate as fallback
    return {
      total: ingredients.length * 0.5, // Very rough estimate
      saved: ingredients.length * 0.35, // 70% of total
      breakdown: []
    };
  }
}

// Simplified calculation for basic needs
async function calculateEmissionsSimple(dishName, ingredients, quantity = 1) {
  try {
    // Simple categorization and emission calculation
    let totalEmissions = 0;
    
    for (const ingredient of ingredients) {
      // Get the best match from the SuEatable database
      const match = findBestSuEatableMatch(ingredient);
      
      // Estimate weight
      const weight = await portionEstimator.estimatePortionSize(ingredient, dishName);
      
      // Get the best emissions value
      let emissionFactor;
      if (match.type === 'item' && match.uncertainty === 'L') {
        emissionFactor = match.value;
      } else if (match.subTypologyValue) {
        emissionFactor = match.subTypologyValue;
      } else if (match.value) {
        emissionFactor = match.value;
      } else {
        // Fallback to original database lookup
        const categoryInfo = await foodDB.findBestMatch(ingredient);
        emissionFactor = await foodDB.getEmissionFactor(categoryInfo.category, categoryInfo.specificItem);
      }
      
      // Calculate emissions
      const ingredientEmissions = (weight / 1000) * emissionFactor;
      totalEmissions += ingredientEmissions;
    }
    
    // Apply quantity
    totalEmissions *= quantity;
    
    // Calculate saved emissions (assuming 70% would be wasted)
    const savedEmissions = totalEmissions * 0.7;
    
    return {
      total: totalEmissions,
      saved: savedEmissions
    };
  } catch (error) {
    console.error('Error in simple emissions calculation:', error);
    // Provide very rough estimate as fallback
    return {
      total: ingredients.length * 0.5, // Very rough estimate
      saved: ingredients.length * 0.35, // 70% of total
    };
  }
}

// Keep original routes, but use the updated calculation functions
router.post('/calculate', async (req, res) => {
  try {
    const { 
      dishName, 
      ingredients, 
      quantity = 1,
      detail_level = 'standard' // Can be 'basic' or 'detailed'
    } = req.body;
    
    if (!dishName || !ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ 
        error: 'Invalid request data. Required fields: dishName (string) and ingredients (array)'
      });
    }
    
    console.log(`Processing emissions calculation for: ${dishName} (${quantity} servings)`);
    
    let result;
    if (detail_level === 'basic') {
      // Simple calculation for basic needs
      result = await calculateEmissionsSimple(dishName, ingredients, quantity);
    } else {
      // Detailed calculation with breakdown
      result = await calculateEmissionsDetailed(dishName, ingredients, quantity);
    }
    
    // Round values to 2 decimal places to improve readability
    result.total = Math.round(result.total * 100) / 100;
    result.saved = Math.round(result.saved * 100) / 100;
    
    if (result.breakdown) {
      result.breakdown = result.breakdown.map(item => ({
        ...item,
        emissions: Math.round(item.emissions * 1000) / 1000
      }));
    }
    
    return res.json(result);
    
  } catch (error) {
    console.error('Error calculating emissions:', error);
    return res.status(500).json({ error: 'Failed to calculate emissions' });
  }
});

// Keep remaining routes
router.get('/factor/:category/:item', async (req, res) => {
  try {
    const { category, item } = req.params;
    
    const factor = await foodDB.getEmissionFactor(category, item);
    
    return res.json({
      category,
      item,
      factor: Math.round(factor * 100) / 100
    });
  } catch (error) {
    console.error('Error getting emission factor:', error);
    return res.status(500).json({ error: 'Failed to get emission factor' });
  }
});

router.get('/categorize/:ingredient', async (req, res) => {
  try {
    const { ingredient } = req.params;
    
    const categoryInfo = await foodDB.findBestMatch(ingredient);
    
    return res.json(categoryInfo);
  } catch (error) {
    console.error('Error categorizing ingredient:', error);
    return res.status(500).json({ error: 'Failed to categorize ingredient' });
  }
});

router.get('/health', (req, res) => {
  return res.json({ 
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    databaseConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    aiStatus: model ? 'initialized' : 'not initialized',
    database: 'SuEatableLife Food Footprint'
  });
});

// Export the calculate function for internal use
const calculateEmissions = async (dishName, ingredients, quantity = 1, detail_level = 'standard') => {
  try {
    if (detail_level === 'basic') {
      return await calculateEmissionsSimple(dishName, ingredients, quantity);
    } else {
      return await calculateEmissionsDetailed(dishName, ingredients, quantity);
    }
  } catch (error) {
    console.error('Error in emissions calculation:', error);
    // Return fallback values
    return {
      total: ingredients.length * 0.5,
      saved: ingredients.length * 0.35
    };
  }
};

module.exports = router;
module.exports.calculateEmissions = calculateEmissions;