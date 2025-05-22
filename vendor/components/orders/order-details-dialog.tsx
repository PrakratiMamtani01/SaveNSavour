// components/orders/order-details-dialog.tsx
"use client"

import { useState } from "react"
import { type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, X, ShoppingBag, Leaf } from "lucide-react"
import { toast } from "react-toastify"
import { api, Order } from "@/services/api"

interface OrderDetailsDialogProps {
  children: ReactNode;
  order: Order;
  onStatusChange?: (orderId: string, newStatus: Order['status']) => void;
}

export function OrderDetailsDialog({ children, order, onStatusChange }: OrderDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order>(order);

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

  // Update order status
  const updateOrderStatus = async (newStatus: Order['status']) => {
    try {
      setLoading(true);
      
      if (newStatus === 'completed') {
        // Special endpoint for completing orders - updates inventory
        await api.completeOrder(currentOrder._id || '');
        toast.success('Order completed and inventory updated');
      } else {
        // Regular status update
        await api.updateOrderStatus(currentOrder._id || '', newStatus);
        toast.success(`Order status updated to ${newStatus}`);
      }
      
      // Update local state
      setCurrentOrder(prevOrder => ({ ...prevOrder, status: newStatus }));
      
      // Notify parent component
      if (onStatusChange) {
        onStatusChange(currentOrder._id || '', newStatus);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>View and manage the order {currentOrder.orderId}.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Order {currentOrder.orderId}</h3>
            <Badge className={getStatusColor(currentOrder.status)}>
              {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Customer Information</h4>
              <p className="text-sm">{currentOrder.customerName || 'Customer'}</p>
              <p className="text-sm text-muted-foreground">{currentOrder.customerEmail || 'customer@example.com'}</p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-2">Order Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Date:</span>
                  <span>{formatDate(currentOrder.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pickup Time:</span>
                  <span>{currentOrder.pickupTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pickup Location:</span>
                  <span>{currentOrder.pickupAddress}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payment Method:</span>
                  <span>{currentOrder.paymentMethod || 'Credit Card'}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-2">Items</h4>
              <div className="space-y-2">
                {currentOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-2">Environmental Impact</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Leaf className="h-4 w-4 text-emerald-500 mr-2" />
                  <span>{currentOrder.impact?.foodSaved?.toFixed(1) || '0.0'} kg of food saved</span>
                </div>
                <div className="flex items-center text-sm">
                  <Leaf className="h-4 w-4 text-emerald-500 mr-2" />
                  <span>{currentOrder.impact?.co2Saved?.toFixed(1) || '0.0'} kg of CO2 emissions reduced</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-medium">
              <span>Subtotal</span>
              <span>${currentOrder.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Service Fee</span>
              <span>${currentOrder.serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${currentOrder.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          {currentOrder.status === "pending" && (
            <>
              <Button 
                variant="outline" 
                onClick={() => updateOrderStatus("cancelled")} 
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Order
              </Button>
              <Button 
                onClick={() => updateOrderStatus("confirmed")} 
                disabled={loading}
              >
                <Check className="mr-2 h-4 w-4" />
                Confirm Order
              </Button>
            </>
          )}
          
          {currentOrder.status === "confirmed" && (
            <>
              <Button 
                variant="outline" 
                onClick={() => updateOrderStatus("cancelled")} 
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Order
              </Button>
              <Button 
                onClick={() => updateOrderStatus("ready for pickup")} 
                disabled={loading}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Mark as Ready
              </Button>
            </>
          )}
          
          {currentOrder.status === "ready for pickup" && (
            <>
              <Button 
                variant="outline" 
                onClick={() => updateOrderStatus("cancelled")} 
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Order
              </Button>
              <Button 
                onClick={() => updateOrderStatus("completed")} 
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Complete & Update Inventory
              </Button>
            </>
          )}
          
          {(currentOrder.status === "completed" || currentOrder.status === "cancelled") && (
            <Button onClick={() => setOpen(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}