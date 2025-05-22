// services/api.ts
import axios from 'axios';
// Define API URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Hardcoded vendor ID to match database
function getCurrentVendorId(): string {
  if (typeof window !== 'undefined') {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        return userData.id || userData._id || '';
      } catch (error) {
        console.error('Error parsing current user data:', error);
      }
    }
  }
  return '';
}

function getCurrentVendorName(): string {
  if (typeof window !== 'undefined') {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        // Return business name instead of ID
        return userData.businessName || userData.name || '';
      } catch (error) {
        console.error('Error parsing current user data:', error);
      }
    }
  }
  return '';
}

// Business profile types
export interface BusinessProfile {
  name: string;
  type: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  logo?: string;
}

// Food Item types
export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  currentOrders: number;
  isActive: boolean;
}

export interface FoodItem {
  _id: string;
  name: string;
  category: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  expiryDate: string;
  description: string;
  dietary: string[];
  vendor: {
    name: string;
    id: string;
    location: string;
  };
  ingredients: string[];
  pickupTimeSlots: TimeSlot[]; 
  emissions?: {
    total: number;
    saved: number;
  };
  image?: {
    data: string;
    contentType: string;
  };
}

// Order types
export interface OrderItem {
  foodItemId: string;
  name: string;
  vendor: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderImpact {
  foodSaved: number;
  co2Saved: number;
}

export interface Order {
  _id: string;
  orderId: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  serviceFee: number;
  total: number;
  status: "pending" | "confirmed" | "ready for pickup" | "completed" | "cancelled";
  pickupAddress: string;
  pickupTime: string;
  paymentMethod?: string;
  impact: OrderImpact;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
}

// Improved helper to get auth token from localStorage
function getAuthToken() {
  if (typeof window !== 'undefined') {
    // Look for tokens in multiple possible locations
    const token = localStorage.getItem('auth_token') || 
                 localStorage.getItem('token') || 
                 (localStorage.getItem('currentUser') ? 
                   JSON.parse(localStorage.getItem('currentUser') || '{}').token : 
                   null);
    
    console.log('Auth token retrieved:', token ? 'Token exists' : 'No token found');
    return token;
  }
  return null;
}

// Create API instance with auth headers
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add authorization header to every request if token exists
apiClient.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Adding auth header to request:', config.url);
  } else {
    console.warn('No auth token available for request to:', config.url);
    
    // For demonstration/development purposes, add a mock token header
    // You should remove this in production
    if (config.url?.includes('/business/profile')) {
      console.log('Adding mock token for business profile endpoint in development');
      config.headers.Authorization = 'Bearer mock-token-for-development';
    }
  }
  return config;
});

// Add response interceptor for debugging authentication issues
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('Authentication error (401):', error.config.url);
      console.log('Token used:', error.config.headers?.Authorization);
      
      // Optional: Clear invalid token
      if (typeof window !== 'undefined') {
        console.log('Clearing potentially invalid token');
        // localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Business Profile methods
  getBusinessProfile: async (): Promise<BusinessProfile> => {
    try {
      // For testing - fallback to mock data if we're in development and no token
      if (process.env.NODE_ENV === 'development' && !getAuthToken()) {
        console.log('Using mock business profile data for development');
        return {
          name: "Spice Garden",
          type: "restaurant",
          description: "Authentic Indian cuisine with a focus on sustainability",
          email: "info@spicegarden.com",
          phone: "+971 4 123 4567",
          address: "123 Al Wasl Road",
          city: "Dubai",
          state: "Dubai",
          zip: "12345"
        };
      }
      
      const response = await apiClient.get('/business/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching business profile:', error);
      
      // Fallback data when in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using fallback business profile after error');
        return {
          name: "Spice Garden",
          type: "restaurant",
          description: "Authentic Indian cuisine with a focus on sustainability",
          email: "info@spicegarden.com",
          phone: "+971 4 123 4567",
          address: "123 Al Wasl Road",
          city: "Dubai",
          state: "Dubai",
          zip: "12345"
        };
      }
      throw error;
    }
  },

  updateBusinessProfile: async (profileData: Partial<BusinessProfile>, logoFile?: File): Promise<BusinessProfile> => {
    try {
      // Create form data for multipart upload if logo is provided
      const formData = new FormData();
      
      // Add all profile data fields
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      // Add logo if provided
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      
      const response = await apiClient.put('/business/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating business profile:', error);
      throw error;
    }
  },
  
  // Food Items CRUD operations
  getFoodItems: async (): Promise<FoodItem[]> => {
    try {
      // Always use the hardcoded vendor ID for filtering
      const vendorId = getCurrentVendorId();
      console.log('Fetching food items for vendor:', vendorId);
      
      const response = await apiClient.get(`/food-items?vendorId=${vendorId}`);
      console.log(`API returned ${response.data.length} food items for vendor ${vendorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching food items:', error);
      throw error;
    }
  },

  getFoodItemById: async (id: string): Promise<FoodItem> => {
    try {
      const response = await apiClient.get(`/food-items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching food item ${id}:`, error);
      throw error;
    }
  },

  getImageUrl: (id: string): string => {
    return `${BASE_URL}/food-items/${id}/image`;
  },

  createFoodItem: async (
    foodItem: Omit<FoodItem, '_id' | 'emissions'>, 
    ingredients: string[],
    timeSlots: TimeSlot[] = [],
    imageFile?: File
  ): Promise<FoodItem> => {
    try {
      // Create form data for multipart upload (if image is provided)
      const formData = new FormData();
      
      // Make sure ALL required fields are added
      formData.append('name', foodItem.name);
      formData.append('category', foodItem.category);
      formData.append('originalPrice', foodItem.originalPrice.toString());
      formData.append('discountedPrice', foodItem.discountedPrice.toString());
      formData.append('quantity', foodItem.quantity.toString());
      formData.append('expiryDate', foodItem.expiryDate);
      formData.append('description', foodItem.description || '');
      formData.append('dietary', JSON.stringify(foodItem.dietary || []));
      formData.append('vendor', JSON.stringify(foodItem.vendor));
      formData.append('ingredients', JSON.stringify(ingredients));
      formData.append('pickupTimeSlots', JSON.stringify(timeSlots));
      
      // Add image if provided
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      console.log('Sending form data:', Object.fromEntries(formData.entries())); // Debug
      
      const response = await apiClient.post('/food-items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating food item:', error);
      throw error;
    }
  },
  
  // Also fix the updateFoodItem function
  updateFoodItem: async (
    id: string, 
    updateData: Partial<FoodItem>,
    ingredients: string[],
    timeSlots: TimeSlot[] = [],
    imageFile?: File
  ): Promise<FoodItem> => {
    try {
      // Create form data for multipart upload
      const formData = new FormData();
      
      // Add all update data fields
      if (updateData.name) formData.append('name', updateData.name);
      if (updateData.category) formData.append('category', updateData.category);
      if (updateData.originalPrice) formData.append('originalPrice', updateData.originalPrice.toString());
      if (updateData.discountedPrice) formData.append('discountedPrice', updateData.discountedPrice.toString());
      if (updateData.quantity) formData.append('quantity', updateData.quantity.toString());
      if (updateData.expiryDate) formData.append('expiryDate', updateData.expiryDate);
      if (updateData.description) formData.append('description', updateData.description);
      if (updateData.dietary) formData.append('dietary', JSON.stringify(updateData.dietary));
      if (updateData.vendor) formData.append('vendor', JSON.stringify(updateData.vendor));
      
      // Always include ingredients for emissions calculation
      formData.append('ingredients', JSON.stringify(ingredients));
      
      // Always include time slots
      formData.append('pickupTimeSlots', JSON.stringify(timeSlots));
      
      // Add image if provided
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const response = await apiClient.put(`/food-items/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating food item ${id}:`, error);
      throw error;
    }
  },
  

  deleteFoodItem: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/food-items/${id}`);
    } catch (error) {
      console.error(`Error deleting food item ${id}:`, error);
      throw error;
    }
  },

  // Emissions calculation endpoint
  calculateEmissions: async (
    dishName: string,
    ingredients: string[],
    quantity: number = 1,
    detailLevel: 'basic' | 'standard' | 'detailed' = 'standard'
  ): Promise<{total: number, saved: number}> => {
    try {
      console.log(`Calculating emissions for: ${dishName} with ${ingredients.length} ingredients`);
      
      // Make sure this path matches what your server expects
      const response = await apiClient.post('/emissions/calculate', {
        dishName,
        ingredients,
        quantity,
        detail_level: detailLevel
      });
      
      return response.data;
    } catch (error) {
      console.error('Error calculating emissions:', error);
      // Fallback values
      return {
        total: ingredients.length * 0.5,
        saved: ingredients.length * 0.35
      };
    }
  },

  // Orders management
  getVendorOrders: async (): Promise<Order[]> => {
    try {
      // Always use the hardcoded vendor ID
      const vendorId = getCurrentVendorName();
      console.log('Fetching orders for vendor:', vendorId);
      
      const response = await apiClient.get(`/vendor/orders?vendorId=${vendorId}`);
      console.log('Orders response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
      throw error;
    }
  },
  
  getVendorOrdersByStatus: async (status: Order['status']): Promise<Order[]> => {
    try {
      // Always use the hardcoded vendor ID
      const vendorId = getCurrentVendorName();
      console.log(`Fetching ${status} orders for vendor:`, vendorId);
      
      const response = await apiClient.get(`/vendor/orders?vendorId=${vendorId}&status=${status}`);
      console.log(`${status} orders response:`, response.data.length);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${status} orders:`, error);
      throw error;
    }
  },
  
  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<Order> => {
    try {
      console.log(`Updating order ${orderId} status to ${status}`);
      const response = await apiClient.put(`/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      throw error;
    }
  },
  
  completeOrder: async (orderId: string): Promise<void> => {
    try {
      console.log(`Completing order ${orderId} and updating inventory`);
      // This endpoint will update inventory automatically
      await apiClient.put(`/orders/${orderId}/complete`);
    } catch (error) {
      console.error(`Error completing order ${orderId}:`, error);
      throw error;
    }
  },
  
  getOrderCounts: async (): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    ready: number;
    completed: number;
    cancelled: number;
  }> => {
    try {
      // Always use the hardcoded vendor ID
      const vendorId = getCurrentVendorName();
      console.log('Fetching order counts for vendor:', vendorId);
      
      const response = await apiClient.get(`/vendor/orders/counts?vendorId=${vendorId}`);
      console.log('Order counts response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching order counts:', error);
      throw error;
    }
  }
};