// services/order-service.ts
import axios from 'axios';

// Define API URL
const API_URL = 'http://localhost:5000/api';

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
  customerName?: string;
  customerEmail?: string;
}

// Helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
}

// Get auth token from localStorage
function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

// Create headers with authorization token
function createHeaders() {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export const orderService = {
  // Get all orders for the vendor
  getVendorOrders: async (): Promise<Order[]> => {
    try {
      const response = await axios.get(`${API_URL}/vendors/orders`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
      throw error;
    }
  },
  
  // Get a specific order by ID
  getOrderById: async (orderId: string): Promise<Order> => {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  },
  
  // Update order status
  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<Order> => {
    try {
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      throw error;
    }
  },
  
  // Handle inventory update when order is completed
  updateInventoryForCompletedOrder: async (order: Order): Promise<void> => {
    try {
      // For each item in the order, reduce the inventory quantity
      for (const item of order.items) {
        await axios.put(
          `${API_URL}/food-items/${item.foodItemId}/reduce-quantity`,
          { quantity: item.quantity },
          { headers: { Authorization: `Bearer ${getAuthToken()}` } }
        );
      }
    } catch (error) {
      console.error('Error updating inventory after order completion:', error);
      throw error;
    }
  },
  
  // Get mock orders for development/demo
  getMockOrders: (): Order[] => {
    return [
      {
        _id: "ord1",
        orderId: "ORD-7842",
        date: new Date().toISOString(),
        items: [
          {
            foodItemId: "item1",
            name: "Butter Chicken",
            vendor: "Spice Garden",
            price: 11.99,
            quantity: 2,
            image: "/butter-chicken.jpg"
          },
          {
            foodItemId: "item2",
            name: "Garlic Naan",
            vendor: "Spice Garden",
            price: 2.99,
            quantity: 3,
            image: "/naan.jpg"
          }
        ],
        subtotal: 32.95,
        serviceFee: 2.00,
        total: 34.95,
        status: "pending",
        pickupAddress: "123 Al Wasl Road, Dubai",
        pickupTime: "Today, 6:30 PM",
        paymentMethod: "Credit Card",
        impact: {
          foodSaved: 1.2,
          co2Saved: 3.5
        },
        customerName: "Sarah Ahmed",
        customerEmail: "sarah.ahmed@example.com"
      },
      {
        _id: "ord2",
        orderId: "ORD-7841",
        date: new Date().toISOString(),
        items: [
          {
            foodItemId: "item3",
            name: "Vegetable Curry",
            vendor: "Spice Garden",
            price: 9.99,
            quantity: 1,
            image: "/veg-curry.jpg"
          },
          {
            foodItemId: "item4",
            name: "Samosas",
            vendor: "Spice Garden",
            price: 4.99,
            quantity: 4,
            image: "/samosas.jpg"
          }
        ],
        subtotal: 29.95,
        serviceFee: 2.00,
        total: 31.95,
        status: "confirmed",
        pickupAddress: "123 Al Wasl Road, Dubai",
        pickupTime: "Today, 7:45 PM",
        paymentMethod: "Credit Card",
        impact: {
          foodSaved: 0.9,
          co2Saved: 2.7
        },
        customerName: "Michael Chen",
        customerEmail: "michael.chen@example.com"
      },
      {
        _id: "ord3",
        orderId: "ORD-7840",
        date: new Date().toISOString(),
        items: [
          {
            foodItemId: "item5",
            name: "Chicken Biryani",
            vendor: "Spice Garden",
            price: 13.99,
            quantity: 2,
            image: "/biryani.jpg"
          }
        ],
        subtotal: 27.98,
        serviceFee: 2.00,
        total: 29.98,
        status: "ready for pickup",
        pickupAddress: "123 Al Wasl Road, Dubai",
        pickupTime: "Today, 5:15 PM",
        paymentMethod: "Cash",
        impact: {
          foodSaved: 1.4,
          co2Saved: 4.2
        },
        customerName: "Aisha Khan",
        customerEmail: "aisha.khan@example.com"
      },
      {
        _id: "ord4",
        orderId: "ORD-7839",
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        items: [
          {
            foodItemId: "item6",
            name: "Mixed Platter",
            vendor: "Spice Garden",
            price: 24.99,
            quantity: 1,
            image: "/mixed-platter.jpg"
          },
          {
            foodItemId: "item7",
            name: "Mango Lassi",
            vendor: "Spice Garden",
            price: 3.99,
            quantity: 2,
            image: "/mango-lassi.jpg"
          }
        ],
        subtotal: 32.97,
        serviceFee: 2.00,
        total: 34.97,
        status: "completed",
        pickupAddress: "123 Al Wasl Road, Dubai",
        pickupTime: "Yesterday, 7:30 PM",
        paymentMethod: "Credit Card",
        impact: {
          foodSaved: 1.6,
          co2Saved: 4.8
        },
        customerName: "David Wilson",
        customerEmail: "david.wilson@example.com"
      }
    ];
  }
};