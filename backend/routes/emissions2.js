const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const axios = require('axios');
const NodeCache = require('node-cache');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize memory cache for API responses to reduce external calls
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// Initialize Gemini with service account
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

// MongoDB database connection
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit if can't connect to database
  }
}

// Call database connection
connectToDatabase();

// MongoDB Schemas
// -----------------------------

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

// Food Item Schema
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

// Regional Factors Schema
const RegionalFactorSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  value: { type: Number, required: true }
});

// Create unique index
RegionalFactorSchema.index({ origin: 1 }, { unique: true });

// Seasonal Factors Schema
const SeasonalFactorSchema = new mongoose.Schema({
  seasonType: { type: String, required: true },
  value: { type: Number, required: true }
});

// Create unique index
SeasonalFactorSchema.index({ seasonType: 1 }, { unique: true });

// Transport Factors Schema
const TransportFactorSchema = new mongoose.Schema({
  transportMode: { type: String, required: true },
  value: { type: Number, required: true } // kg CO2e per ton-km
});

// Create unique index
TransportFactorSchema.index({ transportMode: 1 }, { unique: true });

// Distance Data Schema
const DistanceDataSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  distance: { type: Number, required: true } // in km
});

// Create unique compound index
DistanceDataSchema.index({ origin: 1, destination: 1 }, { unique: true });

// Special Cases Schema
const SpecialCaseSchema = new mongoose.Schema({
  item: { type: String, required: true },
  origin: { type: String, required: true },
  season: { type: String, required: true },
  factor: { type: Number, required: true }
});

// Create unique compound index
SpecialCaseSchema.index({ item: 1, origin: 1, season: 1 }, { unique: true });

// Waste Factors Schema
const WasteFactorSchema = new mongoose.Schema({
  category: { type: String, required: true },
  stage: { type: String, required: true },
  value: { type: Number, required: true }
});

// Create unique compound index
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
const RegionalFactor = mongoose.models.RegionalFactor || 
                      mongoose.model('RegionalFactor', RegionalFactorSchema);
const SeasonalFactor = mongoose.models.SeasonalFactor || 
                      mongoose.model('SeasonalFactor', SeasonalFactorSchema);
const TransportFactor = mongoose.models.TransportFactor || 
                       mongoose.model('TransportFactor', TransportFactorSchema);
const DistanceData = mongoose.models.DistanceData || 
                    mongoose.model('DistanceData', DistanceDataSchema);
const SpecialCase = mongoose.models.SpecialCase || 
                   mongoose.model('SpecialCase', SpecialCaseSchema);
const WasteFactor = mongoose.models.WasteFactor || 
                   mongoose.model('WasteFactor', WasteFactorSchema);

// API Client classes for different data sources
// ---------------------------------------------

// Base API Client with common methods
class BaseApiClient {
  constructor(name, baseUrl, apiKey) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async makeRequest(endpoint, params = {}, headers = {}) {
    try {
      if (!this.apiKey) {
        throw new Error(`${this.name} API key not configured`);
      }

      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        params,
        headers: {
          ...headers,
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000 // 10 second timeout
      });

      return response.data;
    } catch (error) {
      console.error(`${this.name} API error:`, error.message);
      return null;
    }
  }

  async getEmissionFactor(category, item, country) {
    throw new Error('Method getEmissionFactor must be implemented by subclass');
  }

  async getInitialData() {
    throw new Error('Method getInitialData must be implemented by subclass');
  }

  async getUpdates() {
    throw new Error('Method getUpdates must be implemented by subclass');
  }
}

// Klimato API Client
class KlimatoApiClient extends BaseApiClient {
  constructor() {
    super(
      'Klimato',
      process.env.KLIMATO_API_URL || 'https://api.klimato.com/v1',
      process.env.KLIMATO_API_KEY
    );
  }

  async getEmissionFactor(category, item, country) {
    try {
      const data = await this.makeRequest('emissions', {
        category,
        item,
        country
      });

      if (data && data.factor) {
        return data.factor;
      }
      return null;
    } catch (error) {
      console.error('Klimato getEmissionFactor error:', error);
      return null;
    }
  }

  async getInitialData() {
    try {
      const data = await this.makeRequest('emissions/bulk');

      // Process and save data to database
      if (data && Array.isArray(data.factors)) {
        const bulkOps = data.factors.map(factor => ({
          updateOne: {
            filter: { 
              category: factor.category, 
              item: factor.item, 
              country: factor.country || 'global' 
            },
            update: {
              value: factor.value,
              source: 'klimato',
              lastUpdated: new Date(),
              metadata: factor.metadata || {}
            },
            upsert: true
          }
        }));

        if (bulkOps.length > 0) {
          await EmissionFactor.bulkWrite(bulkOps);
          console.log(`Imported ${bulkOps.length} factors from Klimato`);
          return bulkOps;
        }
      }
      return [];
    } catch (error) {
      console.error('Error importing data from Klimato:', error);
      return [];
    }
  }

  async getUpdates() {
    try {
      // Find the most recent update date for Klimato data
      const latestRecord = await EmissionFactor.findOne(
        { source: 'klimato' },
        { lastUpdated: 1 },
        { sort: { lastUpdated: -1 } }
      );

      const since = latestRecord ? latestRecord.lastUpdated.toISOString() : null;

      // Get updates since last update
      const data = await this.makeRequest('emissions/updates', { since });

      // Process and save updates
      if (data && Array.isArray(data.updates)) {
        const bulkOps = data.updates.map(factor => ({
          updateOne: {
            filter: { 
              category: factor.category, 
              item: factor.item, 
              country: factor.country || 'global' 
            },
            update: {
              value: factor.value,
              source: 'klimato',
              lastUpdated: new Date(),
              metadata: factor.metadata || {}
            },
            upsert: true
          }
        }));

        if (bulkOps.length > 0) {
          await EmissionFactor.bulkWrite(bulkOps);
          console.log(`Updated ${bulkOps.length} factors from Klimato`);
          return bulkOps;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting updates from Klimato:', error);
      return [];
    }
  }
}

// SU-EATABLE API Client
class SUEatableApiClient extends BaseApiClient {
  constructor() {
    super(
      'SU-EATABLE',
      process.env.SUEATABLE_API_URL || 'https://api.sueatable.org/v1',
      process.env.SUEATABLE_API_KEY
    );
  }

  async makeRequest(endpoint, params = {}) {
    // Override parent method to use X-API-Key header instead of Authorization
    try {
      if (!this.apiKey) {
        throw new Error(`${this.name} API key not configured`);
      }

      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        params,
        headers: {
          'X-API-Key': this.apiKey
        },
        timeout: 10000 // 10 second timeout
      });

      return response.data;
    } catch (error) {
      console.error(`${this.name} API error:`, error.message);
      return null;
    }
  }

  async getEmissionFactor(category, item, country) {
    try {
      const data = await this.makeRequest('emission-factors', {
        category,
        item,
        country
      });

      if (data && data.emissionFactor) {
        return data.emissionFactor;
      }
      return null;
    } catch (error) {
      console.error('SU-EATABLE getEmissionFactor error:', error);
      return null;
    }
  }

  async getInitialData() {
    try {
      const data = await this.makeRequest('emission-factors/all');

      if (data && Array.isArray(data.factors)) {
        const bulkOps = data.factors.map(factor => ({
          updateOne: {
            filter: { 
              category: factor.category, 
              item: factor.item, 
              country: factor.country || 'global' 
            },
            update: {
              value: factor.value,
              source: 'sueatable',
              lastUpdated: new Date(),
              metadata: {
                uncertainty: factor.uncertainty,
                reference: factor.reference
              }
            },
            upsert: true
          }
        }));

        if (bulkOps.length > 0) {
          await EmissionFactor.bulkWrite(bulkOps);
          console.log(`Imported ${bulkOps.length} factors from SU-EATABLE`);
          return bulkOps;
        }
      }
      return [];
    } catch (error) {
      console.error('Error importing data from SU-EATABLE:', error);
      return [];
    }
  }

  async getUpdates() {
    try {
      const latestRecord = await EmissionFactor.findOne(
        { source: 'sueatable' },
        { lastUpdated: 1 },
        { sort: { lastUpdated: -1 } }
      );

      const since = latestRecord ? latestRecord.lastUpdated.toISOString() : null;
      
      const data = await this.makeRequest('emission-factors/updates', { since });

      if (data && Array.isArray(data.updates)) {
        const bulkOps = data.updates.map(factor => ({
          updateOne: {
            filter: { 
              category: factor.category, 
              item: factor.item, 
              country: factor.country || 'global' 
            },
            update: {
              value: factor.value,
              source: 'sueatable',
              lastUpdated: new Date(),
              metadata: {
                uncertainty: factor.uncertainty,
                reference: factor.reference
              }
            },
            upsert: true
          }
        }));

        if (bulkOps.length > 0) {
          await EmissionFactor.bulkWrite(bulkOps);
          console.log(`Updated ${bulkOps.length} factors from SU-EATABLE`);
          return bulkOps;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting updates from SU-EATABLE:', error);
      return [];
    }
  }
}

// Eaternity API Client
class EaternityApiClient extends BaseApiClient {
  constructor() {
    super(
      'Eaternity',
      process.env.EATERNITY_API_URL || 'https://eaternity.ch/api/v1',
      process.env.EATERNITY_API_KEY
    );
  }

  async getEmissionFactor(category, item, country) {
    try {
      const data = await this.makeRequest('co2values', {
        category,
        item,
        country
      });

      if (data && data.co2value) {
        return data.co2value;
      }
      return null;
    } catch (error) {
      console.error('Eaternity getEmissionFactor error:', error);
      return null;
    }
  }

  async getInitialData() {
    try {
      const data = await this.makeRequest('co2values/database');

      if (data && Array.isArray(data.values)) {
        const bulkOps = data.values.map(factor => ({
          updateOne: {
            filter: { 
              category: factor.category, 
              item: factor.item, 
              country: factor.country || 'global' 
            },
            update: {
              value: factor.co2value,
              source: 'eaternity',
              lastUpdated: new Date(),
              metadata: {
                unit: factor.unit,
                origin: factor.origin
              }
            },
            upsert: true
          }
        }));

        if (bulkOps.length > 0) {
          await EmissionFactor.bulkWrite(bulkOps);
          console.log(`Imported ${bulkOps.length} factors from Eaternity`);
          return bulkOps;
        }
      }
      return [];
    } catch (error) {
      console.error('Error importing data from Eaternity:', error);
      return [];
    }
  }

  async getUpdates() {
    try {
      const latestRecord = await EmissionFactor.findOne(
        { source: 'eaternity' },
        { lastUpdated: 1 },
        { sort: { lastUpdated: -1 } }
      );

      const since = latestRecord ? latestRecord.lastUpdated.toISOString() : null;
      
      const data = await this.makeRequest('co2values/updates', { since });

      if (data && Array.isArray(data.values)) {
        const bulkOps = data.values.map(factor => ({
          updateOne: {
            filter: { 
              category: factor.category, 
              item: factor.item, 
              country: factor.country || 'global' 
            },
            update: {
              value: factor.co2value,
              source: 'eaternity',
              lastUpdated: new Date(),
              metadata: {
                unit: factor.unit,
                origin: factor.origin
              }
            },
            upsert: true
          }
        }));

        if (bulkOps.length > 0) {
          await EmissionFactor.bulkWrite(bulkOps);
          console.log(`Updated ${bulkOps.length} factors from Eaternity`);
          return bulkOps;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting updates from Eaternity:', error);
      return [];
    }
  }
}

// My Emissions API Client
class MyEmissionsApiClient extends BaseApiClient {
  constructor() {
    super(
      'MyEmissions',
      process.env.MYEMISSIONS_API_URL || 'https://api.myemissions.co/v1',
      process.env.MYEMISSIONS_API_KEY
    );
  }

  async getEmissionFactor(category, item, country) {
    try {
      const data = await this.makeRequest('carbon-factors', {
        category,
        food: item,
        region: country
      });

      if (data && data.carbonFactor) {
        return data.carbonFactor;
      }
      return null;
    } catch (error) {
      console.error('MyEmissions getEmissionFactor error:', error);
      return null;
    }
  }

  async getInitialData() {
    try {
      const data = await this.makeRequest('carbon-factors/all');

      if (data && Array.isArray(data.factors)) {
        const bulkOps = data.factors.map(factor => ({
          updateOne: {
            filter: { 
              category: factor.category, 
              item: factor.food, 
              country: factor.region || 'global' 
            },
            update: {
              value: factor.carbonFactor,
              source: 'myemissions',
              lastUpdated: new Date(),
              metadata: {
                rating: factor.rating,
                boundaries: factor.systemBoundaries
              }
            },
            upsert: true
          }
        }));

        if (bulkOps.length > 0) {
          await EmissionFactor.bulkWrite(bulkOps);
          console.log(`Imported ${bulkOps.length} factors from MyEmissions`);
          return bulkOps;
        }
      }
      return [];
    } catch (error) {
      console.error('Error importing data from MyEmissions:', error);
      return [];
    }
  }

  async getUpdates() {
    try {
      const latestRecord = await EmissionFactor.findOne(
        { source: 'myemissions' },
        { lastUpdated: 1 },
        { sort: { lastUpdated: -1 } }
      );

      const since = latestRecord ? latestRecord.lastUpdated.toISOString() : null;
      
      const data = await this.makeRequest('carbon-factors/updates', { since });

      if (data && Array.isArray(data.factors)) {
        const bulkOps = data.factors.map(factor => ({
          updateOne: {
            filter: { 
              category: factor.category, 
              item: factor.food, 
              country: factor.region || 'global' 
            },
            update: {
              value: factor.carbonFactor,
              source: 'myemissions',
              lastUpdated: new Date(),
              metadata: {
                rating: factor.rating,
                boundaries: factor.systemBoundaries
              }
            },
            upsert: true
          }
        }));

        if (bulkOps.length > 0) {
          await EmissionFactor.bulkWrite(bulkOps);
          console.log(`Updated ${bulkOps.length} factors from MyEmissions`);
          return bulkOps;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting updates from MyEmissions:', error);
      return [];
    }
  }
}

// IPCC API Client
class IPCCApiClient extends BaseApiClient {
  constructor() {
    super(
      'IPCC',
      process.env.IPCC_API_URL || 'https://ipcc-emissions-factors.org/api',
      process.env.IPCC_API_KEY
    );
  }

  async getEmissionFactor(category, item, country) {
    try {
      const data = await this.makeRequest('emissions-factors', {
        category: category,
        item: item,
        region: country
      });

      if (data && data.factor) {
        return data.factor;
      }
      return null;
    } catch (error) {
      console.error('IPCC getEmissionFactor error:', error);
      return null;
    }
  }

  async getInitialData() {
    try {
      const data = await this.makeRequest('emissions-factors/database');

      if (data && Array.isArray(data.factors)) {
        const bulkOps = data.factors.map(factor => ({
          updateOne: {
            filter: { 
              category: factor.category, 
              item: factor.item, 
              country: factor.region || 'global' 
            },
            update: {
              value: factor.factor,
              source: 'ipcc',
              lastUpdated: new Date(),
              metadata: {
                year: factor.year,
                uncertainty: factor.uncertainty
              }
            },
            upsert: true
          }
        }));

        if (bulkOps.length > 0) {
          await EmissionFactor.bulkWrite(bulkOps);
          console.log(`Imported ${bulkOps.length} factors from IPCC`);
          return bulkOps;
        }
      }
      return [];
    } catch (error) {
      console.error('Error importing data from IPCC:', error);
      return [];
    }
  }

  async getUpdates() {
    try {
      const latestRecord = await EmissionFactor.findOne(
        { source: 'ipcc' },
        { lastUpdated: 1 },
        { sort: { lastUpdated: -1 } }
      );

      const since = latestRecord ? latestRecord.lastUpdated.toISOString() : null;
      
      const data = await this.makeRequest('emissions-factors/updates', { since });

      if (data && Array.isArray(data.factors)) {
        const bulkOps = data.factors.map(factor => ({
          updateOne: {
            filter: { 
              category: factor.category, 
              item: factor.item, 
              country: factor.region || 'global' 
            },
            update: {
              value: factor.factor,
              source: 'ipcc',
              lastUpdated: new Date(),
              metadata: {
                year: factor.year,
                uncertainty: factor.uncertainty
              }
            },
            upsert: true
          }
        }));

        if (bulkOps.length > 0) {
          await EmissionFactor.bulkWrite(bulkOps);
          console.log(`Updated ${bulkOps.length} factors from IPCC`);
          return bulkOps;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting updates from IPCC:', error);
      return [];
    }
  }
}

// Fallback Data Client for when external sources fail
class FallbackDataClient extends BaseApiClient {
  constructor() {
    super('Fallback', '', '');
    
    // Minimal set of fallback data
    this.fallbackData = {
      'meat': {
        'beef': 60.0,
        'lamb': 39.2,
        'pork': 7.2,
        'chicken': 6.1
      },
      'dairy': {
        'milk': 2.8,
        'cheese': 21.0,
        'yogurt': 2.5,
        'butter': 9.0
      },
      'vegetables': {
        'tomatoes': 1.5,
        'potatoes': 0.3,
        'onions': 0.3,
        'lettuce': 0.5
      },
      'fruits': {
        'apples': 0.4,
        'bananas': 0.7,
        'oranges': 0.4,
        'strawberries': 1.1
      },
      'grains': {
        'rice': 4.3,
        'wheat': 1.4,
        'pasta': 1.3,
        'bread': 1.5
      },
      'legumes': {
        'lentils': 0.9,
        'chickpeas': 0.8,
        'beans': 0.8,
        'tofu': 2.0
      },
      'seafood': {
        'fish': 5.4,
        'salmon': 11.9,
        'tuna': 6.1,
        'shrimp': 18.2
      }
    };
  }

  async getEmissionFactor(category, item, country) {
    if (this.fallbackData[category] && this.fallbackData[category][item]) {
      return this.fallbackData[category][item];
    }
    
    if (this.fallbackData[category]) {
      // Return average for category
      const values = Object.values(this.fallbackData[category]);
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    return 3.0; // Ultimate fallback
  }

  async getInitialData() {
    try {
      console.log('Populating database with fallback data');
      const bulkOps = [];
      
      // Convert fallback data to database records
      for (const [category, items] of Object.entries(this.fallbackData)) {
        for (const [item, value] of Object.entries(items)) {
          bulkOps.push({
            updateOne: {
              filter: { category, item, country: 'global' },
              update: {
                value,
                source: 'fallback',
                lastUpdated: new Date(),
                metadata: { reliability: 'low' }
              },
              upsert: true
            }
          });
        }
      }
      
      if (bulkOps.length > 0) {
        await EmissionFactor.bulkWrite(bulkOps);
        console.log(`Populated database with ${bulkOps.length} fallback factors`);
        return bulkOps;
      }
      
      return [];
    } catch (error) {
      console.error('Error populating fallback data:', error);
      return [];
    }
  }

  async getUpdates() {
    // Fallback data doesn't get updates
    return [];
  }
}

// Emissions database connector that coordinates all API clients
class EmissionsDatabaseManager {
  constructor() {
    this.apiClients = {
      klimato: new KlimatoApiClient(),
      sueatable: new SUEatableApiClient(),
      eaternity: new EaternityApiClient(),
      myemissions: new MyEmissionsApiClient(),
      ipcc: new IPCCApiClient(),
      fallback: new FallbackDataClient()
    };

    this.initializeDatabase();
    
    // Set up database check and update interval
    setInterval(() => this.updateLocalDatabase(), 24 * 60 * 60 * 1000); // Daily updates
  }

  async initializeDatabase() {
    try {
      // Check if database needs initial population
      const count = await EmissionFactor.countDocuments();
      if (count === 0) {
        console.log('Emissions database is empty. Initiating first-time population.');
        await this.populateInitialData();
      } else {
        console.log(`Emissions database contains ${count} records.`);
      }
      
      // Populate other reference tables if empty
      await this.initializeReferenceData();
    } catch (error) {
      console.error('Error initializing emissions database:', error);
    }
  }

  async populateInitialData() {
    try {
      // Fetch from multiple sources in parallel
      console.log('Fetching initial data from external sources...');
      const results = await Promise.allSettled([
        this.apiClients.klimato.getInitialData(),
        this.apiClients.sueatable.getInitialData(),
        this.apiClients.eaternity.getInitialData(),
        this.apiClients.myemissions.getInitialData(),
        this.apiClients.ipcc.getInitialData()
      ]);
      
      // Log success/failure for each source
      results.forEach((result, index) => {
        const sourceName = Object.keys(this.apiClients)[index];
        if (result.status === 'fulfilled') {
          console.log(`Successfully imported data from ${sourceName}`);
        } else {
          console.error(`Failed to import data from ${sourceName}:`, result.reason);
        }
      });
      
      // If all external sources fail, use fallback data
      const count = await EmissionFactor.countDocuments();
      if (count === 0) {
        console.log('Failed to get data from external sources. Using fallback data.');
        await this.apiClients.fallback.getInitialData();
      }
      
      console.log('Initial database population complete.');
    } catch (error) {
      console.error('Error during initial database population:', error);
      // Always ensure we have at least fallback data
      await this.apiClients.fallback.getInitialData();
    }
  }

  async initializeReferenceData() {
    try {
      // Initialize regional factors if empty
      const regionalFactorCount = await RegionalFactor.countDocuments();
      if (regionalFactorCount === 0) {
        const regionalFactors = [
          { origin: 'local', value: 0.85 },
          { origin: 'regional', value: 0.92 },
          { origin: 'national', value: 1.0 },
          { origin: 'imported_ground', value: 1.15 },
          { origin: 'imported_sea', value: 1.05 },
          { origin: 'airFreighted', value: 2.5 },
          { origin: 'default', value: 1.0 }
        ];
        await RegionalFactor.insertMany(regionalFactors);
        console.log('Initialized regional factors');
      }
      
      // Initialize seasonal factors if empty
      const seasonalFactorCount = await SeasonalFactor.countDocuments();
      if (seasonalFactorCount === 0) {
        const seasonalFactors = [
          { seasonType: 'inSeason', value: 0.85 },
          { seasonType: 'nearSeason', value: 0.95 },
          { seasonType: 'outOfSeason', value: 1.2 },
          { seasonType: 'outOfSeason_heated', value: 1.5 },
          { seasonType: 'default', value: 1.0 }
        ];
        await SeasonalFactor.insertMany(seasonalFactors);
        console.log('Initialized seasonal factors');
      }
      
      // Initialize processing factors if empty
      const processingFactorCount = await ProcessingFactor.countDocuments();
      if (processingFactorCount === 0) {
        const processingFactors = [
          { processingMethod: 'fresh', category: 'default', value: 0.9 },
          { processingMethod: 'frozen', category: 'vegetables', value: 1.1 },
          { processingMethod: 'frozen', category: 'fruits', value: 1.15 },
          { processingMethod: 'frozen', category: 'meat', value: 1.05 },
          { processingMethod: 'frozen', category: 'seafood', value: 1.08 },
          { processingMethod: 'frozen', category: 'default', value: 1.1 },
          { processingMethod: 'canned', category: 'vegetables', value: 1.2 },
          { processingMethod: 'canned', category: 'fruits', value: 1.25 },
          { processingMethod: 'canned', category: 'meat', value: 1.3 },
          { processingMethod: 'canned', category: 'seafood', value: 1.2 },
          { processingMethod: 'canned', category: 'default', value: 1.25 },
          { processingMethod: 'dried', category: 'default', value: 0.95 },
          { processingMethod: 'processed_minimal', category: 'default', value: 1.1 },
          { processingMethod: 'processed_moderate', category: 'default', value: 1.3 },
          { processingMethod: 'processed_heavy', category: 'default', value: 1.5 },
          { processingMethod: 'processed', category: 'default', value: 1.3 },
          { processingMethod: 'fermented', category: 'default', value: 1.05 },
          { processingMethod: 'smoked', category: 'default', value: 1.15 },
          { processingMethod: 'raw', category: 'default', value: 0.85 },
          { processingMethod: 'default', category: 'default', value: 1.0 }
        ];
        await ProcessingFactor.insertMany(processingFactors);
        console.log('Initialized processing factors');
      }
      
      // Initialize transport factors if empty
      const transportFactorCount = await TransportFactor.countDocuments();
      if (transportFactorCount === 0) {
        const transportFactors = [
          { transportMode: 'ship', value: 0.015 },
          { transportMode: 'rail', value: 0.028 },
          { transportMode: 'truck', value: 0.062 },
          { transportMode: 'plane', value: 0.602 },
          { transportMode: 'default', value: 0.100 }
        ];
        await TransportFactor.insertMany(transportFactors);
        console.log('Initialized transport factors');
      }
      
      // Initialize waste factors if empty
      const wasteFactorCount = await WasteFactor.countDocuments();
      if (wasteFactorCount === 0) {
        const wasteFactors = [
          { category: 'fruits', stage: 'farming', value: 0.1 },
          { category: 'fruits', stage: 'processing', value: 0.05 },
          { category: 'fruits', stage: 'retail', value: 0.1 },
          { category: 'fruits', stage: 'consumer', value: 0.15 },
          { category: 'vegetables', stage: 'farming', value: 0.2 },
          { category: 'vegetables', stage: 'processing', value: 0.05 },
          { category: 'vegetables', stage: 'retail', value: 0.1 },
          { category: 'vegetables', stage: 'consumer', value: 0.15 },
          { category: 'meat', stage: 'farming', value: 0.05 },
          { category: 'meat', stage: 'processing', value: 0.05 },
          { category: 'meat', stage: 'retail', value: 0.05 },
          { category: 'meat', stage: 'consumer', value: 0.1 },
          { category: 'dairy', stage: 'farming', value: 0.03 },
          { category: 'dairy', stage: 'processing', value: 0.02 },
          { category: 'dairy', stage: 'retail', value: 0.08 },
          { category: 'dairy', stage: 'consumer', value: 0.12 },
          { category: 'grains', stage: 'farming', value: 0.02 },
          { category: 'grains', stage: 'processing', value: 0.05 },
          { category: 'grains', stage: 'retail', value: 0.02 },
          { category: 'grains', stage: 'consumer', value: 0.15 },
          { category: 'default', stage: 'farming', value: 0.05 },
          { category: 'default', stage: 'processing', value: 0.05 },
          { category: 'default', stage: 'retail', value: 0.07 },
          { category: 'default', stage: 'consumer', value: 0.12 }
        ];
        await WasteFactor.insertMany(wasteFactors);
        console.log('Initialized waste factors');
      }
      
      // Initialize seasonal info if empty
      const seasonalInfoCount = await SeasonalInfo.countDocuments();
      if (seasonalInfoCount === 0) {
        // Simple initial data - would be much more comprehensive in a real system
        const seasonalInfo = [
          { country: 'us', item: 'apple', inSeason: [9, 10, 11], nearSeason: [7, 8, 12, 1] },
          { country: 'us', item: 'tomato', inSeason: [6, 7, 8, 9], nearSeason: [5, 10] },
          { country: 'us', item: 'strawberry', inSeason: [5, 6, 7], nearSeason: [4, 8] },
          { country: 'uk', item: 'apple', inSeason: [9, 10, 11], nearSeason: [8, 12] },
          { country: 'uk', item: 'tomato', inSeason: [7, 8, 9], nearSeason: [6, 10] }
        ];
        await SeasonalInfo.insertMany(seasonalInfo);
        console.log('Initialized seasonal info');
      }
      
      // Initialize food items if empty
      const foodItemCount = await FoodItem.countDocuments();
      if (foodItemCount === 0) {
        // Just a few examples - would be thousands in a real system
        const foodItems = [
          { 
            name: 'ground beef', 
            aliases: ['minced beef', 'hamburger meat', 'beef mince'], 
            category: 'meat', 
            subcategory: 'ruminant', 
            specificItem: 'beef' 
          },
          { 
            name: 'chicken breast', 
            aliases: ['chicken fillets', 'chicken cutlets', 'boneless chicken'], 
            category: 'meat', 
            subcategory: 'non_ruminant', 
            specificItem: 'chicken' 
          },
          { 
            name: 'tomato', 
            aliases: ['tomatoes', 'cherry tomato', 'plum tomato'], 
            category: 'vegetables', 
            subcategory: 'fruit_vegetables', 
            specificItem: 'tomatoes' 
          },
          { 
            name: 'apple', 
            aliases: ['apples', 'green apple', 'red apple'], 
            category: 'fruits', 
            subcategory: 'tree_fruits', 
            specificItem: 'apples' 
          }
        ];
        await FoodItem.insertMany(foodItems);
        console.log('Initialized food items');
      }
      
    } catch (error) {
      console.error('Error initializing reference data:', error);
    }
  }

  async updateLocalDatabase() {
    try {
      console.log('Starting daily update of emissions database...');
      
      // Get latest updates from all sources
      const updatePromises = Object.entries(this.apiClients).map(([name, client]) => 
        client.getUpdates().catch(err => {
          console.error(`Error updating from ${name}:`, err);
          return []; // Return empty array on error to continue with other sources
        })
      );
      
      // Wait for all update attempts
      const results = await Promise.allSettled(updatePromises);
      let updateCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          updateCount += result.value.length || 0;
        }
      });
      
      console.log(`Database update complete. Updated ${updateCount} records.`);
    } catch (error) {
      console.error('Error during database update:', error);
    }
  }

  async getEmissionFactor(category, item, country = 'global', options = {}) {
    const cacheKey = `ef:${country}:${category}:${item}`;
    
    // Try memory cache first for very fast lookups
    const cachedValue = cache.get(cacheKey);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    try {
      // Check MongoDB cache
      const result = await EmissionFactor.findOne({
        category: category,
        item: item,
        country: country
      });

      if (result) {
        // Store in memory cache and return
        cache.set(cacheKey, result.value);
        return result.value;
      }

      // If not found with specific country, try global
      if (country !== 'global') {
        const globalResult = await EmissionFactor.findOne({
          category: category,
          item: item,
          country: 'global'
        });

        if (globalResult) {
          cache.set(cacheKey, globalResult.value);
          return globalResult.value;
        }
      }

      // Still not found - try to fetch from external APIs directly
      console.log(`No cached data for ${category}:${item}:${country}, trying APIs`);
      
      // Try each API in sequence until we get a result
      for (const [clientName, client] of Object.entries(this.apiClients)) {
        try {
          const value = await client.getEmissionFactor(category, item, country);
          
          if (value) {
            // Store in database for future
            await EmissionFactor.findOneAndUpdate(
              { category, item, country },
              { 
                value, 
                source: clientName,
                lastUpdated: new Date()
              },
              { upsert: true, new: true }
            );
            
            // Store in memory cache
            cache.set(cacheKey, value);
            return value;
          }
        } catch (error) {
          console.error(`Error fetching from ${clientName}:`, error);
          // Continue to next API
        }
      }

      // Last resort: calculate category average
      const avgFactor = await this.getCategoryAverage(category);
      cache.set(cacheKey, avgFactor);
      return avgFactor;
      
    } catch (dbError) {
      console.error('Database error when fetching emission factor:', dbError);
      
      // Fallback: try to get directly from an API without caching
      for (const [name, client] of Object.entries(this.apiClients)) {
        try {
          const value = await client.getEmissionFactor(category, item, country);
          if (value) return value;
        } catch (apiError) {
          // Ignore and try next
        }
      }
      
      // Ultimate fallback - hardcoded values
      return this.getFallbackEmissionFactor(category, item);
    }
  }

  async getCategoryAverage(category) {
    try {
      // Calculate average from database
      const result = await EmissionFactor.aggregate([
        { $match: { category: category } },
        { $group: { _id: null, average: { $avg: "$value" } } }
      ]);
      
      if (result.length > 0 && result[0].average) {
        return result[0].average;
      }
      
      // If no results in this category, return default
      return 3.0;
    } catch (error) {
      console.error('Error calculating category average:', error);
      return 3.0; // Default fallback
    }
  }

  getFallbackEmissionFactor(category, item) {
    // Emergency fallback values for common categories
    const fallbackValues = {
      'meat': 30.0,
      'dairy': 6.0,
      'vegetables': 0.5,
      'fruits': 0.8,
      'grains': 1.5,
      'legumes': 1.0,
      'seafood': 7.0,
      'default': 3.0
    };
    
    return fallbackValues[category] || fallbackValues.default;
  }
}

// Initialize database manager
const emissionsDB = new EmissionsDatabaseManager();

// Food database class for ingredient lookups and categorization
class FoodDatabase {
  constructor() {
    // Nothing needed in constructor - all methods use MongoDB
  }

  async findBestMatch(ingredientName) {
    try {
      const normalizedName = ingredientName.toLowerCase().trim();
      
      // Try exact match
      let match = await FoodItem.findOne({ name: normalizedName });
      if (match) {
        return {
          name: match.name,
          category: match.category,
          subcategory: match.subcategory,
          specificItem: match.specificItem,
          confidence: 1.0
        };
      }
      
      // Try alias match
      match = await FoodItem.findOne({ aliases: normalizedName });
      if (match) {
        return {
          name: match.name,
          category: match.category,
          subcategory: match.subcategory,
          specificItem: match.specificItem,
          confidence: 0.95
        };
      }
      
      // Try partial match (text search)
      const textMatchResults = await FoodItem.find(
        { $text: { $search: normalizedName } },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } }).limit(1);
      
      if (textMatchResults.length > 0 && textMatchResults[0].score > 1.0) {
        const textMatch = textMatchResults[0];
        return {
          name: textMatch.name,
          category: textMatch.category,
          subcategory: textMatch.subcategory,
          specificItem: textMatch.specificItem,
          confidence: 0.8 // Lower confidence for text search
        };
      }
      
      // If no matches found, try pattern recognition
      const patternMatch = await this.patternRecognition(normalizedName);
      if (patternMatch) {
        return patternMatch;
      }
      
      // No match found
      return {
        name: ingredientName,
        category: 'unknown',
        subcategory: 'unknown',
        specificItem: 'default',
        confidence: 0.3
      };
      
    } catch (error) {
      console.error('Error finding food match:', error);
      // Fallback to pattern recognition if database fails
      return this.patternRecognition(ingredientName);
    }
  }
  
  async patternRecognition(ingredientName) {
    const normalizedName = ingredientName.toLowerCase();
    
    // Basic pattern matching for categories
    // Check for meat
    if (/beef|steak|ground meat|burger|lamb|mutton|pork|ham|bacon|chicken|turkey|duck|goat|venison|rabbit/i.test(normalizedName)) {
      // Determine subcategory
      let subcategory = 'non_ruminant';
      if (/beef|steak|lamb|mutton|goat|venison/i.test(normalizedName)) {
        subcategory = 'ruminant';
      } else if (/bacon|ham|sausage|salami|jerky/i.test(normalizedName)) {
        subcategory = 'processed';
      }
      
      // Try to identify specific item
      let specificItem = 'default';
      if (/beef/i.test(normalizedName)) specificItem = 'beef';
      else if (/lamb|mutton/i.test(normalizedName)) specificItem = 'lamb';
      else if (/pork|ham|bacon/i.test(normalizedName)) specificItem = 'pork';
      else if (/chicken/i.test(normalizedName)) specificItem = 'chicken';
      else if (/turkey/i.test(normalizedName)) specificItem = 'turkey';
      else if (/duck/i.test(normalizedName)) specificItem = 'duck';
      else if (/goat/i.test(normalizedName)) specificItem = 'goat';
      else if (/venison/i.test(normalizedName)) specificItem = 'venison';
      else if (/rabbit/i.test(normalizedName)) specificItem = 'rabbit';
      
      return {
        name: ingredientName,
        category: 'meat',
        subcategory: subcategory,
        specificItem: specificItem,
        confidence: 0.8
      };
    }
    
    // Check for seafood
    if (/fish|salmon|tuna|cod|tilapia|shrimp|prawn|crab|lobster|oyster|clam|mussel|seafood/i.test(normalizedName)) {
      // Determine subcategory
      let subcategory = 'fish_wild'; // Default to wild fish
      if (/farmed|farm-raised/i.test(normalizedName)) {
        subcategory = 'fish_farmed';
      } else if (/shrimp|prawn|crab|lobster|oyster|clam|mussel|scallop/i.test(normalizedName)) {
        subcategory = 'shellfish';
      } else if (/canned|smoked|processed/i.test(normalizedName)) {
        subcategory = 'processed';
      }
      
      // Try to identify specific item
      let specificItem = 'default';
      if (/salmon/i.test(normalizedName)) specificItem = 'salmon';
      else if (/tuna/i.test(normalizedName)) specificItem = 'tuna';
      else if (/shrimp|prawn/i.test(normalizedName)) specificItem = 'shrimp';
      else if (/cod/i.test(normalizedName)) specificItem = 'cod';
      else if (/tilapia/i.test(normalizedName)) specificItem = 'tilapia';
      else if (/fish/i.test(normalizedName)) specificItem = 'fish';
      
      return {
        name: ingredientName,
        category: 'seafood',
        subcategory: subcategory,
        specificItem: specificItem,
        confidence: 0.8
      };
    }
    
    // Check for dairy
    if (/milk|cheese|yogurt|butter|cream|dairy|egg|ice cream|plant milk|almond milk|soy milk|oat milk/i.test(normalizedName)) {
      // Determine subcategory and specific item
      let subcategory = 'milk_products'; // Default
      let specificItem = 'default';
      
      if (/cheese/i.test(normalizedName)) {
        subcategory = 'cheese';
        specificItem = 'cheese';
      } else if (/butter/i.test(normalizedName)) {
        subcategory = 'high_fat';
        specificItem = 'butter';
      } else if (/cream/i.test(normalizedName)) {
        subcategory = 'high_fat';
        specificItem = 'cream';
      } else if (/ice cream/i.test(normalizedName)) {
        subcategory = 'high_fat';
        specificItem = 'ice_cream';
      } else if (/egg/i.test(normalizedName)) {
        subcategory = 'egg_products';
        specificItem = 'eggs';
      } else if (/almond milk/i.test(normalizedName)) {
        subcategory = 'plant_based';
        specificItem = 'plant_milk_almond';
      } else if (/soy milk/i.test(normalizedName)) {
        subcategory = 'plant_based';
        specificItem = 'plant_milk_soy';
      } else if (/oat milk/i.test(normalizedName)) {
        subcategory = 'plant_based';
        specificItem = 'plant_milk_oat';
      } else if (/milk/i.test(normalizedName)) {
        specificItem = 'milk';
      } else if (/yogurt/i.test(normalizedName)) {
        specificItem = 'yogurt';
      }
      
      return {
        name: ingredientName,
        category: 'dairy',
        subcategory: subcategory,
        specificItem: specificItem,
        confidence: 0.8
      };
    }
    
    // Check for vegetables
    if (/tomato|potato|onion|carrot|lettuce|spinach|broccoli|cauliflower|pepper|eggplant|cucumber|zucchini|garlic|mushroom|cabbage|kale|vegetable/i.test(normalizedName)) {
      // Determine subcategory
      let subcategory = 'other';
      if (/lettuce|spinach|kale|cabbage/i.test(normalizedName)) {
        subcategory = 'leafy';
      } else if (/potato|carrot|turnip|radish|beet|root/i.test(normalizedName)) {
        subcategory = 'root';
      } else if (/tomato|pepper|eggplant|cucumber|zucchini|squash/i.test(normalizedName)) {
        subcategory = 'fruit_vegetables';
      } else if (/onion|garlic|leek|shallot/i.test(normalizedName)) {
        subcategory = 'allium';
      }
      
      // Try to identify specific item
      let specificItem = 'default';
      if (/tomato/i.test(normalizedName)) specificItem = 'tomatoes';
      else if (/potato/i.test(normalizedName)) specificItem = 'potatoes';
      else if (/onion/i.test(normalizedName)) specificItem = 'onions';
      else if (/carrot/i.test(normalizedName)) specificItem = 'carrots';
      else if (/lettuce/i.test(normalizedName)) specificItem = 'lettuce';
      else if (/spinach/i.test(normalizedName)) specificItem = 'spinach';
      
      return {
        name: ingredientName,
        category: 'vegetables',
        subcategory: subcategory,
        specificItem: specificItem,
        confidence: 0.8
      };
    }
    
    // Check for fruits
    if (/apple|banana|orange|mango|strawberry|grape|peach|pear|pineapple|berry|melon|lemon|lime|fruit/i.test(normalizedName)) {
      // Determine specific item
      let specificItem = 'default';
      if (/apple/i.test(normalizedName)) specificItem = 'apples';
      else if (/banana/i.test(normalizedName)) specificItem = 'bananas';
      else if (/orange/i.test(normalizedName)) specificItem = 'oranges';
      else if (/strawberry/i.test(normalizedName)) specificItem = 'strawberries';
      else if (/grape/i.test(normalizedName)) specificItem = 'grapes';
      
      return {
        name: ingredientName,
        category: 'fruits',
        subcategory: 'fruits',
        specificItem: specificItem,
        confidence: 0.8
      };
    }
    
    // Check for grains
    if (/rice|wheat|flour|bread|pasta|noodle|oat|barley|quinoa|millet|cereal|grain/i.test(normalizedName)) {
      // Determine specific item
      let specificItem = 'default';
      if (/rice/i.test(normalizedName)) specificItem = 'rice';
      else if (/wheat|flour/i.test(normalizedName)) specificItem = 'wheat';
      else if (/bread/i.test(normalizedName)) specificItem = 'bread';
      else if (/pasta|noodle/i.test(normalizedName)) specificItem = 'pasta';
      else if (/oat/i.test(normalizedName)) specificItem = 'oats';
      else if (/barley/i.test(normalizedName)) specificItem = 'barley';
      else if (/quinoa/i.test(normalizedName)) specificItem = 'quinoa';
      else if (/millet/i.test(normalizedName)) specificItem = 'millet';
      
      return {
        name: ingredientName,
        category: 'grains',
        subcategory: 'grains',
        specificItem: specificItem,
        confidence: 0.7
      };
    }
    
    // Check for legumes
    if (/bean|lentil|chickpea|pea|tofu|tempeh|soy|legume/i.test(normalizedName)) {
      // Determine specific item
      let specificItem = 'default';
      if (/lentil/i.test(normalizedName)) specificItem = 'lentils';
      else if (/chickpea/i.test(normalizedName)) specificItem = 'chickpeas';
      else if (/bean/i.test(normalizedName)) specificItem = 'beans';
      else if (/pea/i.test(normalizedName)) specificItem = 'peas';
      else if (/tofu/i.test(normalizedName)) specificItem = 'tofu';
      else if (/tempeh/i.test(normalizedName)) specificItem = 'tempeh';
      else if (/soy/i.test(normalizedName)) specificItem = 'soybeans';
      
      return {
        name: ingredientName,
        category: 'legumes',
        subcategory: 'legumes',
        specificItem: specificItem,
        confidence: 0.8
      };
    }
    
    // Check for nuts and seeds
    if (/almond|walnut|cashew|pistachio|peanut|seed|nut/i.test(normalizedName)) {
      return {
        name: ingredientName,
        category: 'nuts_and_seeds',
        subcategory: 'nuts_and_seeds',
        specificItem: 'default',
        confidence: 0.7
      };
    }
    
    // Check for oils
    if (/oil|fat|butter/i.test(normalizedName)) {
      return {
        name: ingredientName,
        category: 'oils',
        subcategory: 'oils',
        specificItem: 'default',
        confidence: 0.7
      };
    }
    
    // No match found
    return null;
  }
}

// Initialize food database
const foodDB = new FoodDatabase();

// Season database class for seasonal information
class SeasonDatabase {
  constructor() {
    // Nothing needed in constructor - all methods use MongoDB
  }
  
  async determineSeasonality(ingredient, country = 'us', date = new Date()) {
    try {
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const normalizedIngredient = ingredient.toLowerCase();
      
      // Find the closest ingredient match in seasonal database
      const seasonalItems = await SeasonalInfo.find({ country: country });
      
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
      
      if (categoryInfo.category === 'vegetables' || categoryInfo.category === 'fruits') {
        // For produce, make an educated guess - default to out of season for safety
        return 'outOfSeason';
      }
      
      // For non-seasonal foods
      return 'default';
    } catch (error) {
      console.error('Error determining seasonality:', error);
      return 'default';
    }
  }
}

// Initialize season database
const seasonDB = new SeasonDatabase();

// Adjustment factors database classes
class AdjustmentFactorsDatabase {
  constructor() {
    // Nothing needed in constructor - all methods use MongoDB
  }
  
  async getRegionalFactor(ingredient, origin, season) {
    try {
      // First check for special cases
      const specialCase = await SpecialCase.findOne({
        item: ingredient.toLowerCase(),
        origin: origin,
        season: season
      });
      
      if (specialCase) {
        return specialCase.factor;
      }
      
      // Check production method
      const productionMethod = await this.getProductionMethod(ingredient, origin, season);
      if (productionMethod === 'greenhouse_heated') {
        return 1.8;
      } else if (productionMethod === 'greenhouse_unheated') {
        return 1.2;
      }
      
      // Get standard regional factor
      const factor = await RegionalFactor.findOne({ origin: origin });
      if (factor) {
        return factor.value;
      }
      
      // Default value
      const defaultFactor = await RegionalFactor.findOne({ origin: 'default' });
      return defaultFactor ? defaultFactor.value : 1.0;
    } catch (error) {
      console.error('Error getting regional factor:', error);
      return 1.0; // Default fallback
    }
  }
  
  async getSeasonalFactor(ingredient, season) {
    try {
      // Special case for heated greenhouse
      if (await this.needsHeatedGreenhouse(ingredient, season)) {
        const heatedFactor = await SeasonalFactor.findOne({ seasonType: 'outOfSeason_heated' });
        if (heatedFactor) {
          return heatedFactor.value;
        }
      }
      
      // Standard seasonal factor
      const factor = await SeasonalFactor.findOne({ seasonType: season });
      if (factor) {
        return factor.value;
      }
      
      // Default value
      const defaultFactor = await SeasonalFactor.findOne({ seasonType: 'default' });
      return defaultFactor ? defaultFactor.value : 1.0;
    } catch (error) {
      console.error('Error getting seasonal factor:', error);
      return 1.0; // Default fallback
    }
  }
  
  async getProcessingFactor(ingredient, processingMethod) {
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
      const defaultFactor = await ProcessingFactor.findOne({ 
        processingMethod: 'default',
        category: 'default'
      });
      
      return defaultFactor ? defaultFactor.value : 1.0;
    } catch (error) {
      console.error('Error getting processing factor:', error);
      return 1.0; // Default fallback
    }
  }
  
  async getProductionMethod(ingredient, origin, season) {
    try {
      const normalizedIngredient = ingredient.toLowerCase();
      
      // Check if this is a leafy vegetable or fruit vegetable out of season
      if ((/lettuce|spinach|kale|tomato|cucumber|pepper/i.test(normalizedIngredient)) && 
          season === 'outOfSeason') {
        
        // If it's local but out of season, likely greenhouse
        if (origin === 'local' || origin === 'regional') {
          return 'greenhouse_heated';
        }
        
        // If it's imported and out of season, might be from different hemisphere
        if (origin === 'imported_ground' || origin === 'imported_sea') {
          return 'regular';
        }
      }
      
      // Default production method
      return 'regular';
    } catch (error) {
      console.error('Error determining production method:', error);
      return 'regular';
    }
  }
  
  async needsHeatedGreenhouse(ingredient, season) {
    try {
      if (season !== 'outOfSeason') return false;
      
      const categoryInfo = await foodDB.findBestMatch(ingredient);
      
      // Mostly applies to certain vegetables when out of season
      if (categoryInfo.category === 'vegetables') {
        const normalizedIngredient = ingredient.toLowerCase();
        
        // These typically need heated greenhouses when out of season in cold climates
        if (/tomato|cucumber|pepper|lettuce|eggplant|zucchini/i.test(normalizedIngredient)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error determining if heated greenhouse needed:', error);
      return false;
    }
  }
  
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
  
  async getTransportEmissions(ingredient, origin, destination, transportMode = 'default') {
    try {
      // Get distance
      let distance;
      const distanceRecord = await DistanceData.findOne({
        origin: origin,
        destination: destination
      });
      
      if (distanceRecord) {
        distance = distanceRecord.distance;
      } else {
        // Try default for origin
        const defaultDistance = await DistanceData.findOne({
          origin: origin,
          destination: 'default'
        });
        
        if (defaultDistance) {
          distance = defaultDistance.distance;
        } else {
          // Last resort: global default
          const globalDefault = await DistanceData.findOne({
            origin: 'default',
            destination: 'default'
          });
          
          distance = globalDefault ? globalDefault.distance : 3000; // Default 3000km
        }
      }
      
      // Get emission factor for transport mode
      const transportFactor = await TransportFactor.findOne({
        transportMode: transportMode
      });
      
      const emissionFactor = transportFactor ? transportFactor.value : 0.1; // Default
      
      // Calculate emissions per kg
      // Distance in km * emission factor in kg CO2e per ton-km / 1000 to convert to per kg
      return (distance * emissionFactor) / 1000;
    } catch (error) {
      console.error('Error calculating transport emissions:', error);
      return 0.05; // Default transport emissions in kg CO2e per kg
    }
  }
}

// Initialize adjustment factors database
const adjustmentDB = new AdjustmentFactorsDatabase();

// Portion size estimator class
class PortionSizeEstimator {
  async estimatePortionSize(ingredient, dishName = '') {
    try {
      const categoryInfo = await foodDB.findBestMatch(ingredient);
      const normalizedIngredient = ingredient.toLowerCase();
      const normalizedDish = dishName.toLowerCase();
      
      // Check if this is a main ingredient in the dish
      const isMainIngredient = normalizedDish.includes(normalizedIngredient) ||
                              await this.isLikelyMainIngredient(normalizedIngredient, normalizedDish);
      
      // Base estimations on food category
      switch (categoryInfo.category) {
        case 'meat':
          // Meat proteins (typically 100-250g per serving)
          if (categoryInfo.subcategory === 'ruminant') {
            return isMainIngredient ? 180 : 120; // Red meat
          } else {
            return isMainIngredient ? 150 : 100; // Poultry and other meats
          }
          
        case 'seafood':
          // Seafood (typically 100-200g per serving)
          if (categoryInfo.subcategory === 'shellfish') {
            return isMainIngredient ? 120 : 80; // Shellfish
          } else {
            return isMainIngredient ? 150 : 100; // Fish
          }
          
        case 'dairy':
          // Dairy varies widely
          if (/milk|yogurt/i.test(normalizedIngredient)) {
            return 200; // 200g for liquid dairy
          } else if (/cheese/i.test(normalizedIngredient)) {
            return isMainIngredient ? 50 : 30; // 30-50g for cheese
          } else if (/butter|cream/i.test(normalizedIngredient)) {
            return 15; // 15g for high-fat dairy
          } else if (/egg/i.test(normalizedIngredient)) {
            const count = this.extractNumberPrefix(normalizedIngredient) || 1;
            return count * 50; // 50g per egg
          } else {
            return 50; // Default dairy
          }
          
        case 'grains':
          // Grains and starches (typically 75-150g per serving)
          if (/rice|pasta|potato/i.test(normalizedIngredient)) {
            return isMainIngredient ? 150 : 100; // 100-150g cooked
          } else if (/bread|toast/i.test(normalizedIngredient)) {
            // Estimate number of slices
            const count = this.extractNumberPrefix(normalizedIngredient) || 2;
            return count * 30; // 30g per slice
          } else {
            return isMainIngredient ? 100 : 75; // Other grains
          }
          
        case 'vegetables':
          // Vegetables (typically 80-150g per serving)
          if (categoryInfo.subcategory === 'leafy') {
            return 60; // Leafy greens are lighter
          } else if (categoryInfo.subcategory === 'root') {
            return 100; // Root vegetables
          } else {
            return 80; // Other vegetables
          }
          
        case 'fruits':
          // Fruits (typically 80-150g per serving)
          if (/berry|berries/i.test(normalizedIngredient)) {
            return 80; // Berries
          } else if (/melon|watermelon/i.test(normalizedIngredient)) {
            return 150; // Melons are heavier
          } else {
            const count = this.extractNumberPrefix(normalizedIngredient) || 1;
            return count * 120; // ~120g per fruit
          }
          
        case 'legumes':
          // Legumes
          return isMainIngredient ? 150 : 80; // 80-150g for cooked legumes
          
        case 'nuts_and_seeds':
          // Nuts and seeds
          return 30; // 30g for nuts and seeds
          
        case 'oils':
          // Oils, sauces, and condiments
          return 15; // 15g for oils and sauces
          
        case 'spices':
          // Spices and herbs
          if (/salt|pepper/i.test(normalizedIngredient)) {
            return 1; // 1g for salt and pepper
          } else {
            return 3; // 3g for other spices
          }
          
        default:
          // Unknown category
          return 50; // 50g as default
      }
    } catch (error) {
      console.error('Error estimating portion size:', error);
      return 50; // Default 50g if error
    }
  }
  
  extractNumberPrefix(text) {
    const match = text.match(/^(\d+)\s/);
    return match ? parseInt(match[1]) : null;
  }
  
  async isLikelyMainIngredient(ingredient, dishName) {
    try {
      // This could be more sophisticated with NLP
      // Simple implementation for example
      const mainIngredientPatterns = [
        /chicken\s+\w+/i, // "Chicken something"
        /beef\s+\w+/i,    // "Beef something"
        /\w+\s+soup/i,    // "Something soup"
        /\w+\s+salad/i,   // "Something salad"
        /\w+\s+curry/i,   // "Something curry"
        /\w+\s+pasta/i,   // "Something pasta"
        /\w+\s+rice/i     // "Something rice"
      ];
      
      for (const pattern of mainIngredientPatterns) {
        if (pattern.test(dishName)) {
          const match = dishName.match(pattern);
          if (match && match[0].includes(ingredient)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error determining if main ingredient:', error);
      return false;
    }
  }
}

// Initialize portion size estimator
const portionEstimator = new PortionSizeEstimator();

// AI integration manager
class AIManager {
  constructor() {
    // Nothing needed in constructor
  }
  
  async getAIEstimates(dishName, ingredients, quantity, country = 'global') {
    if (!model) {
      return null;
    }
    
    const prompt = `
      As an expert food scientist specializing in environmental impact assessment:
      
      TASK: Perform a detailed life-cycle assessment of ingredients in this dish.
      
      Dish: ${dishName}
      Ingredients: ${ingredients.join(', ')}
      
      For EACH ingredient, provide:
      1. Typical weight in grams (be specific about portion sizes)
      2. Classification:
         - Primary category: meat/dairy/seafood/grain/legume/vegetable/fruit/nut/oil/sweetener/spice
         - Sub-category: Be specific (e.g., ruminant meat, leafy green, root vegetable)
         - Processing level: fresh/frozen/canned/dried/minimally processed/highly processed
      3. Origin assessment: 
         - Most likely origin: local/regional/imported/air-freighted
         - Seasonality status: in-season/out-of-season (currently ${new Date().toLocaleDateString()})
         - Production method: conventional/organic/greenhouse/regenerative
      
      FORMAT: Return as valid JSON with this exact structure:
      {
        "ingredients": [
          {
            "name": "string",
            "weight": number,
            "category": "string",
            "subcategory": "string",
            "processing": "string",
            "origin": "string",
            "seasonality": "string",
            "production": "string"
          }
        ]
      }
      
      CRITICAL: Must be valid JSON with no additional text.
    `;
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      
      try {
        // Try to parse the JSON
        const parsedResponse = JSON.parse(jsonStr);
        
        // Convert AI response to our internal format
        return Promise.all(parsedResponse.ingredients.map(async (ing) => {
          try {
            // Get emissions factor from database
            const emissionsFactor = await emissionsDB.getEmissionFactor(ing.category, ing.name, country);
            
            // Get adjustment factors
            const regionalFactor = await adjustmentDB.getRegionalFactor(ing.name, ing.origin, ing.seasonality);
            const seasonalFactor = await adjustmentDB.getSeasonalFactor(ing.name, ing.seasonality);
            const processingFactor = await adjustmentDB.getProcessingFactor(ing.name, ing.processing);
            
            return {
              name: ing.name,
              weight: ing.weight,
              category: ing.category,
              subcategory: ing.subcategory,
              specificItem: ing.name,
              emissionsFactor: emissionsFactor,
              regionalFactor: regionalFactor,
              seasonalFactor: seasonalFactor,
              processingFactor: processingFactor,
              dataQuality: 'ai_estimated',
              dataSource: 'gemini_model'
            };
          } catch (error) {
            console.error('Error processing AI ingredient estimate:', error);
            // Return with default values if there's an error
            return {
              name: ing.name,
              weight: ing.weight,
              category: ing.category,
              subcategory: ing.subcategory,
              specificItem: ing.name,
              emissionsFactor: 3.0, // Default
              regionalFactor: 1.0,
              seasonalFactor: 1.0,
              processingFactor: 1.0,
              dataQuality: 'ai_estimated_error',
              dataSource: 'gemini_model'
            };
          }
        }));
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      console.error('Error using AI estimation:', error);
      return null;
    }
  }
}

// Initialize AI manager
const aiManager = new AIManager();

// Manual estimation helper
async function getManualEstimates(ingredients, dishName, country = 'global') {
  try {
    return Promise.all(ingredients.map(async (ingredient) => {
      try {
        // Get basic categorization
        const categoryInfo = await foodDB.findBestMatch(ingredient);
        
        // Estimate portion size
        const weight = await portionEstimator.estimatePortionSize(ingredient, dishName);
        
        // Determine seasonality
        const season = await seasonDB.determineSeasonality(ingredient, country);
        
        // Default origin and processing
        const origin = 'regional'; // Default assumption
        const processing = 'fresh'; // Default assumption
        
        // Get emissions factor
        const emissionsFactor = await emissionsDB.getEmissionFactor(
          categoryInfo.category, 
          categoryInfo.specificItem, 
          country
        );
        
        // Get adjustment factors
        const regionalFactor = await adjustmentDB.getRegionalFactor(ingredient, origin, season);
        const seasonalFactor = await adjustmentDB.getSeasonalFactor(ingredient, season);
        const processingFactor = await adjustmentDB.getProcessingFactor(ingredient, processing);
        
        return {
          name: ingredient,
          weight: weight,
          category: categoryInfo.category,
          subcategory: categoryInfo.subcategory,
          specificItem: categoryInfo.specificItem,
          emissionsFactor: emissionsFactor,
          regionalFactor: regionalFactor,
          seasonalFactor: seasonalFactor,
          processingFactor: processingFactor,
          dataQuality: 'estimated',
          dataSource: 'manual_estimation'
        };
      } catch (error) {
        console.error(`Error estimating for ingredient "${ingredient}":`, error);
        // Return with default values if there's an error
        return {
          name: ingredient,
          weight: 50, // Default 50g
          category: 'unknown',
          subcategory: 'unknown',
          specificItem: 'default',
          emissionsFactor: 3.0, // Default
          regionalFactor: 1.0,
          seasonalFactor: 1.0,
          processingFactor: 1.0,
          dataQuality: 'error',
          dataSource: 'error_fallback'
        };
      }
    }));
  } catch (error) {
    console.error('Error in manual estimates:', error);
    // Return basic fallback if everything fails
    return ingredients.map(ingredient => ({
      name: ingredient,
      weight: 50,
      category: 'unknown',
      subcategory: 'unknown',
      specificItem: 'default',
      emissionsFactor: 3.0,
      regionalFactor: 1.0,
      seasonalFactor: 1.0,
      processingFactor: 1.0,
      dataQuality: 'error',
      dataSource: 'error_fallback'
    }));
  }
}

// Uncertainty factor calculator
async function getUncertaintyFactor(category, dataSource = 'default') {
  // This would normally check the data source's quality
  // For example, primary research data might have less uncertainty
  
  switch (dataSource) {
    case 'primary_research':
      return 0.1; // ±10%
    case 'secondary_research':
      return 0.2; // ±20%
    case 'ai_estimated':
      return 0.25; // ±25%
    case 'extrapolated':
      return 0.3; // ±30%
    case 'error':
    case 'error_fallback':
      return 0.5; // ±50% for error cases
    default:
      return 0.25; // ±25% default
  }
}

// Convert uncertainty factor to confidence level
function getConfidenceLevel(uncertaintyFactor) {
  if (uncertaintyFactor <= 0.1) return 'very high';
  if (uncertaintyFactor <= 0.2) return 'high';
  if (uncertaintyFactor <= 0.3) return 'medium';
  if (uncertaintyFactor <= 0.4) return 'low';
  return 'very low';
}

// Enhanced emissions calculation with uncertainty
async function calculateEmissionsWithUncertainty(ingredients) {
  try {
    const results = [];
    
    for (const ingredient of ingredients) {
      // Base calculation
      const baseEmissions = (ingredient.weight / 1000) * ingredient.emissionsFactor;
      
      // Apply adjustment factors
      const adjustedEmissions = baseEmissions * 
        ingredient.regionalFactor * 
        ingredient.seasonalFactor * 
        ingredient.processingFactor;
      
      // Calculate uncertainty range
      const uncertaintyFactor = await getUncertaintyFactor(ingredient.category, ingredient.dataSource);
      const lowerBound = adjustedEmissions * (1 - uncertaintyFactor);
      const upperBound = adjustedEmissions * (1 + uncertaintyFactor);
      
      results.push({
        ingredient: ingredient.name,
        weight: ingredient.weight,
        category: ingredient.category,
        specificItem: ingredient.specificItem,
        baseEmissions: baseEmissions,
        adjustedEmissions: adjustedEmissions,
        emissions: adjustedEmissions, // Final emissions
        range: {
          lower: lowerBound,
          upper: upperBound
        },
        factors: {
          regional: ingredient.regionalFactor,
          seasonal: ingredient.seasonalFactor,
          processing: ingredient.processingFactor
        },
        confidence: getConfidenceLevel(uncertaintyFactor)
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error calculating emissions with uncertainty:', error);
    // Return basic results if error
    return ingredients.map(ingredient => ({
      ingredient: ingredient.name,
      weight: ingredient.weight,
      category: ingredient.category,
      specificItem: ingredient.specificItem,
      baseEmissions: (ingredient.weight / 1000) * ingredient.emissionsFactor,
      adjustedEmissions: (ingredient.weight / 1000) * ingredient.emissionsFactor,
      emissions: (ingredient.weight / 1000) * ingredient.emissionsFactor,
      range: {
        lower: (ingredient.weight / 1000) * ingredient.emissionsFactor * 0.75,
        upper: (ingredient.weight / 1000) * ingredient.emissionsFactor * 1.25
      },
      factors: {
        regional: 1.0,
        seasonal: 1.0,
        processing: 1.0
      },
      confidence: 'low'
    }));
  }
}

// Calculate total emissions with uncertainty
function calculateTotalEmissions(emissionsResults, quantity) {
  try {
    // Sum up all emissions
    const totalValue = emissionsResults.reduce((sum, result) => sum + result.emissions, 0) * quantity;
    
    // Calculate weighted average uncertainty range
    let lowerSum = 0;
    let upperSum = 0;
    
    for (const result of emissionsResults) {
      lowerSum += result.range.lower;
      upperSum += result.range.upper;
    }
    
    lowerSum *= quantity;
    upperSum *= quantity;
    
    // Determine overall confidence level
    const avgConfidence = emissionsResults.reduce((sum, result) => {
      // Convert confidence levels to numeric values
      let value;
      switch(result.confidence) {
        case 'very high': value = 0.9; break;
        case 'high': value = 0.75; break;
        case 'medium': value = 0.5; break;
        case 'low': value = 0.25; break;
        case 'very low': value = 0.1; break;
        default: value = 0.5;
      }
      return sum + value;
    }, 0) / emissionsResults.length;
    
    let confidenceLevel;
    if (avgConfidence >= 0.8) confidenceLevel = 'very high';
    else if (avgConfidence >= 0.6) confidenceLevel = 'high';
    else if (avgConfidence >= 0.4) confidenceLevel = 'medium';
    else if (avgConfidence >= 0.2) confidenceLevel = 'low';
    else confidenceLevel = 'very low';
    
    return {
      value: totalValue,
      lower: lowerSum,
      upper: upperSum,
      confidence: confidenceLevel
    };
  } catch (error) {
    console.error('Error calculating total emissions:', error);
    // Return basic total if error
    const totalValue = emissionsResults.reduce((sum, result) => sum + result.emissions, 0) * quantity;
    return {
      value: totalValue,
      lower: totalValue * 0.75,
      upper: totalValue * 1.25,
      confidence: 'low'
    };
  }
}

// Calculate saved emissions
function calculateSavedEmissions(totalEmissions, dishName, ingredients) {
  try {
    // Enhanced model for calculating saved emissions
    // Basic assumption: 70% would have been wasted without intervention
    const baseWastePrevention = 0.7;
    
    // Adjust based on food type and shelf life
    let adjustmentFactor = 1.0;
    
    // Check if these are particularly perishable items
    const hasPerishableItems = ingredients.some(ing => {
      const normalizedIng = typeof ing === 'string' ? ing.toLowerCase() : ing.name.toLowerCase();
      return /bread|banana|strawberry|fish|salad|milk|cream|mushroom/i.test(normalizedIng);
    });
    
    if (hasPerishableItems) {
      adjustmentFactor = 1.2; // Perishable items have higher prevention value
    }
    
    // Calculate saved emissions
    const savedValue = totalEmissions.value * baseWastePrevention * adjustmentFactor;
    const savedLower = totalEmissions.lower * baseWastePrevention * adjustmentFactor;
    const savedUpper = totalEmissions.upper * baseWastePrevention * adjustmentFactor;
    
    return {
      value: savedValue,
      lower: savedLower,
      upper: savedUpper,
      confidence: totalEmissions.confidence
    };
  } catch (error) {
    console.error('Error calculating saved emissions:', error);
    // Return basic calculation if error
    return {
      value: totalEmissions.value * 0.7,
      lower: totalEmissions.lower * 0.7,
      upper: totalEmissions.upper * 0.7,
      confidence: 'low'
    };
  }
}

// Helper function to round numbers to desired precision
function round(number, decimals = 2) {
  try {
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
  } catch (error) {
    console.error('Error rounding number:', error);
    return number.toFixed(decimals); // Fallback
  }
}

// Main calculation endpoint
router.post('/calculate', async (req, res) => {
  try {
    const { 
      dishName, 
      ingredients, 
      quantity = 1, 
      country = 'global', 
      detail_level = 'standard' // Can be 'basic', 'standard', or 'detailed'
    } = req.body;
    
    if (!dishName || !ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ 
        error: 'Invalid request data. Required fields: dishName (string) and ingredients (array)'
      });
    }
    
    console.log(`Processing emissions calculation for: ${dishName} (${quantity} servings)`);
    
    // Try AI estimation first if enabled and detail level is sufficient
    let ingredientEstimates = null;
    if (detail_level !== 'basic' && genAI) {
      try {
        ingredientEstimates = await aiManager.getAIEstimates(dishName, ingredients, quantity, country);
        console.log('AI estimates generated successfully');
      } catch (aiError) {
        console.error('Error using AI for estimates:', aiError);
        // Continue with manual estimation
      }
    }
    
    // Fall back to manual estimation if AI fails or is disabled
    if (!ingredientEstimates) {
      console.log('Using manual estimation for ingredients');
      ingredientEstimates = await getManualEstimates(ingredients, dishName, country);
    }
    
    // Calculate emissions with uncertainty for each ingredient
    const emissionsResults = await calculateEmissionsWithUncertainty(ingredientEstimates);
    
    // Calculate total emissions
    const totalEmissions = calculateTotalEmissions(emissionsResults, quantity);
    
    // Calculate saved emissions
    const savedEmissions = calculateSavedEmissions(totalEmissions, dishName, ingredients);
    
    // Format results based on detail level
    let response;
    
    if (detail_level === 'basic') {
      // Basic response - just the key numbers
      response = {
        emissions: {
          total: round(totalEmissions.value, 2),
          saved: round(savedEmissions.value, 2)
        }
      };
    } else if (detail_level === 'standard') {
      // Standard response - key numbers plus ranges
      response = {
        dish: {
          name: dishName,
          quantity: quantity,
          ingredientCount: ingredients.length
        },
        emissions: {
          total: round(totalEmissions.value, 2),
          range: {
            lower: round(totalEmissions.lower, 2),
            upper: round(totalEmissions.upper, 2)
          },
          confidence: totalEmissions.confidence,
          saved: round(savedEmissions.value, 2),
          savedRange: {
            lower: round(savedEmissions.lower, 2),
            upper: round(savedEmissions.upper, 2)
          }
        }
      };
    } else {
      // Detailed response - everything
      response = {
        dish: {
          name: dishName,
          quantity: quantity,
          ingredientCount: ingredients.length
        },
        emissions: {
          total: round(totalEmissions.value, 2),
          range: {
            lower: round(totalEmissions.lower, 2),
            upper: round(totalEmissions.upper, 2)
          },
          confidence: totalEmissions.confidence,
          saved: round(savedEmissions.value, 2),
          savedRange: {
            lower: round(savedEmissions.lower, 2),
            upper: round(savedEmissions.upper, 2)
          }
        },
        ingredients: emissionsResults.map(result => ({
          name: result.ingredient,
          weight: result.weight,
          category: result.category,
          emissions: round(result.emissions, 3),
          range: {
            lower: round(result.range.lower, 3),
            upper: round(result.range.upper, 3)
          },
          confidence: result.confidence,
          factors: {
            regional: round(result.factors.regional, 2),
            seasonal: round(result.factors.seasonal, 2),
            processing: round(result.factors.processing, 2)
          }
        }))
      };
    }
    
    // Cache results for quicker retrieval
    const cacheKey = `result:${dishName}:${ingredients.join(',').substring(0, 50)}:${quantity}:${country}`;
    cache.set(cacheKey, response);
    
    return res.json(response);
    
  } catch (error) {
    console.error('Error calculating emissions:', error);
    return res.status(500).json({ error: 'Failed to calculate emissions' });
  }
});

// Endpoint to get emission factor for a specific food item
router.get('/emission-factor/:category/:item', async (req, res) => {
  try {
    const { category, item } = req.params;
    const { country = 'global' } = req.query;
    
    const factor = await emissionsDB.getEmissionFactor(category, item, country);
    
    return res.json({
      category,
      item,
      country,
      factor
    });
  } catch (error) {
    console.error('Error getting emission factor:', error);
    return res.status(500).json({ error: 'Failed to get emission factor' });
  }
});

// Endpoint to get category information for an ingredient
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

// Endpoint to estimate portion size
router.get('/portion-size/:ingredient', async (req, res) => {
  try {
    const { ingredient } = req.params;
    const { dishName = '' } = req.query;
    
    const portionSize = await portionEstimator.estimatePortionSize(ingredient, dishName);
    
    return res.json({
      ingredient,
      dishName: dishName || undefined,
      portionSize
    });
  } catch (error) {
    console.error('Error estimating portion size:', error);
    return res.status(500).json({ error: 'Failed to estimate portion size' });
  }
});

// Endpoint to get seasonality information
router.get('/seasonality/:ingredient', async (req, res) => {
  try {
    const { ingredient } = req.params;
    const { country = 'us', date = new Date().toISOString() } = req.query;
    
    const season = await seasonDB.determineSeasonality(
      ingredient, 
      country, 
      new Date(date)
    );
    
    return res.json({
      ingredient,
      country,
      date,
      season
    });
  } catch (error) {
    console.error('Error determining seasonality:', error);
    return res.status(500).json({ error: 'Failed to determine seasonality' });
  }
});

// Endpoint to update the database
router.post('/update-database', async (req, res) => {
  try {
    // Check for API key to authorize database updates
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log('Starting manual database update...');
    
    // Update emission factors database
    await emissionsDB.updateLocalDatabase();
    
    return res.json({ success: true, message: 'Database update initiated' });
  } catch (error) {
    console.error('Error updating database:', error);
    return res.status(500).json({ error: 'Failed to update database' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  return res.json({ 
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    databaseConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    aiStatus: genAI ? 'initialized' : 'not initialized'
  });
});

// Export the router
module.exports = router;
