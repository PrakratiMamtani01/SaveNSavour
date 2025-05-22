import axios from "axios";
import { User } from "@/context/auth-context";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
};

const API_URL = "http://localhost:5000/api/auth"; // Make sure this matches your backend


export const authService = {
  // --- Real Login Function ---
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      console.log('Attempting login with credentials:', { email: credentials.email });
      const response = await axios.post(`${API_URL}/login`, credentials);

      const responseData = response.data;
      console.log('Login response received:', JSON.stringify(responseData));

      if (responseData.token) {
        // Store the token in localStorage separately for API calls
        localStorage.setItem("auth_token", responseData.token);
        
        // Also store the user data
        localStorage.setItem("currentUser", JSON.stringify({
          ...responseData.user,
          token: responseData.token // Include token in the user object too
        }));

        console.log('User and token stored in localStorage');

        // Return user data in expected format
        return {
          success: true,
          user: {
            id: responseData.user.id || responseData.user._id,
            email: responseData.user.email,
            name: responseData.user.name,
            businessName: responseData.user.businessName,
            location: responseData.user.location,
          },
          token: responseData.token, // Return token in the response
        };
      } else {
        console.warn('Login response did not contain a token');
        return {
          success: false,
          error: "Login failed. No authentication token received.",
        };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Login failed. Please try again.",
      };
    }
  },

  // --- Logout Function ---
  logout: async (): Promise<void> => {
    // Clear all authentication-related data
    localStorage.removeItem("currentUser");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    console.log('User logged out, all auth data cleared');
  },

  // Helper to check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("auth_token") || !!localStorage.getItem("currentUser");
  },

  // Get the current authentication token
  getToken: (): string | null => {
    return localStorage.getItem("auth_token");
  }
};