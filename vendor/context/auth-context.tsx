import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService } from "@/services/auth-service";
import { LoginCredentials, LoginResponse } from "@/services/auth-service";
import { toast } from "react-toastify";

// Define User type
export interface User {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  location?: string;
  businessType?: string;
}

// Define registration data type
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  vendorName: string;
  location: string;
  vendorType: string;
}

// Define AuthContext type
interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegistrationData) => Promise<boolean>;
  isAuthenticated: () => boolean;
}

// Create the Auth Context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Create AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const init = () => {
      try {
        const storedUser = localStorage.getItem("currentUser");
        const storedToken = localStorage.getItem("auth_token");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          if (storedToken) setToken(storedToken);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Login function now accepts email & password
  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const credentials: LoginCredentials = { email, password };
      const response: LoginResponse = await authService.login(credentials);
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem(
          "currentUser",
          JSON.stringify({ ...response.user, token: response.token })
        );
        toast.success("Login successful!");
        return true;
      } else {
        const msg = response.error || "Login failed";
        setError(msg);
        toast.error(msg);
        return false;
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const msg = err.message || "An unexpected error occurred";
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("auth_token");
    toast.success("Logged out successfully");
  };

  // Register function (unchanged)
  const register = async (data: RegistrationData): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      const body = await res.json();
      if (res.ok && body.user) {
        // Auto-login
        return await login(data.email, data.password);
      } else {
        const msg = body.message || "Registration failed";
        setError(msg);
        toast.error(msg);
        return false;
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      const msg = err.message || "An unexpected error occurred";
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => !!token;

  const contextValue: AuthContextProps = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
