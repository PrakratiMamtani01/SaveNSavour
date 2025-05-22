// components/orders/orders-list.tsx
"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertCircle, Check, Eye, MoreHorizontal, X, ShoppingBag, AlertTriangle } from "lucide-react"
import { OrderDetailsDialog } from "@/components/orders/order-details-dialog"
import { toast } from "react-toastify"
import { api, Order } from "@/services/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Hardcoded vendor ID to match database
const VENDOR_ID = 'Spice Garden';

interface OrdersListProps {
  status?: Order['status'];
  refreshTrigger?: number;
}

export function VendorOrdersList({ status, refreshTrigger = 0 }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Always use hardcoded vendor ID
  useEffect(() => {
    console.log('Using hardcoded vendor ID in OrdersList:', VENDOR_ID);
  }, []);

  // Fetch orders on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger, status, retryCount]);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let data;
      if (status) {
        // Fetch orders with the specified status
        data = await api.getVendorOrdersByStatus(status);
      } else {
        // Fetch all orders
        data = await api.getVendorOrders();
      }
      
      console.log('Orders fetched successfully:', data);
      setOrders(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders from the database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    setRetryCount(prev => prev + 1);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((order) => order._id || ''));
    }
  };

  const toggleSelectOrder = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((orderId) => orderId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case "ready for pickup":
        return "bg-emerald-500";
      case "completed":
        return "bg-blue-500";
      case "pending":
        return "bg-amber-500";
      case "confirmed":
        return "bg-indigo-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setLoading(true);
      
      if (newStatus === 'completed') {
        // Use the special endpoint for completing orders that updates inventory
        await api.completeOrder(orderId);
        toast.success('Order completed and inventory updated');
      } else {
        // For other status changes, use the regular endpoint
        await api.updateOrderStatus(orderId, newStatus);
        toast.success(`Order status updated to ${newStatus}`);
      }
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );
      
      // Refresh the list to ensure we have the latest data
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle status change from the OrderDetailsDialog
  const handleOrderStatusChange = (orderId: string, newStatus: Order['status']) => {
    // Update the local state to reflect the change made in the dialog
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus } 
          : order
      )
    );
    
    // Refresh the list to ensure we have the latest data
    fetchOrders();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString; // Return original string if parsing fails
    }
  };

  const formatOrderItems = (items: Order['items']) => {
    return items.map(item => `${item.name} (${item.quantity})`).join(', ');
  };

  return (
    <div className="rounded-md border">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center">
            {error}
            <Button 
              variant="outline" 
              size="sm"
              className="ml-auto" 
              onClick={retryFetch}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Order Date</TableHead>
            <TableHead className="hidden md:table-cell">Pickup Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8">
                <div className="flex justify-center items-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-emerald-500 mr-2"></div>
                  Loading orders...
                </div>
              </TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                No orders found{status ? ` with status: ${status}` : ''}.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>
                  <Checkbox
                    checked={selectedOrders.includes(order._id || '')}
                    onCheckedChange={() => toggleSelectOrder(order._id || '')}
                    aria-label={`Select ${order.orderId}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{order.orderId}</TableCell>
                <TableCell>{order.customerName || 'Customer'}</TableCell>
                <TableCell className="hidden md:table-cell">{formatOrderItems(order.items)}</TableCell>
                <TableCell>${order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(order.date)}</TableCell>
                <TableCell className="hidden md:table-cell">{order.pickupTime}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <OrderDetailsDialog 
                        order={order} 
                        onStatusChange={handleOrderStatusChange}
                      >
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </OrderDetailsDialog>
                      
                      {order.status === "pending" && (
                        <DropdownMenuItem onClick={() => updateOrderStatus(order._id || '', "confirmed")}>
                          <Check className="mr-2 h-4 w-4" />
                          Confirm Order
                        </DropdownMenuItem>
                      )}
                      
                      {order.status === "confirmed" && (
                        <DropdownMenuItem onClick={() => updateOrderStatus(order._id || '', "ready for pickup")}>
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Mark as Ready
                        </DropdownMenuItem>
                      )}
                      
                      {order.status === "ready for pickup" && (
                        <DropdownMenuItem onClick={() => updateOrderStatus(order._id || '', "completed")}>
                          <Check className="mr-2 h-4 w-4" />
                          Complete Order
                        </DropdownMenuItem>
                      )}
                      
                      {(order.status === "pending" || order.status === "confirmed" || order.status === "ready for pickup") && (
                        <DropdownMenuItem onClick={() => updateOrderStatus(order._id || '', "cancelled")}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel Order
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}