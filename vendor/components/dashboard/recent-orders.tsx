"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { api, Order } from "@/services/api"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true)
        // Fetch all orders
        const allOrders = await api.getVendorOrders()
        
        // Sort by date (newest first) and take the most recent 4
        const sortedOrders = allOrders
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 4)
        
        setOrders(sortedOrders)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch orders:", err)
        setError("Could not load recent orders")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Format order items into readable string
  const formatOrderItems = (items: Order['items']) => {
    return items.map(item => `${item.name} (${item.quantity})`).join(", ")
  }

  // Format date nicely
  const formatDate = (dateString: string) => {
    const orderDate = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Check if the order was today
    if (orderDate.toDateString() === today.toDateString()) {
      return `Today, ${orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // Check if the order was yesterday
    if (orderDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // Otherwise format with date
    return orderDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    }) + `, ${orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case "ready for pickup":
        return "bg-emerald-500"
      case "completed":
        return "bg-blue-500"
      case "pending":
        return "bg-amber-500"
      case "confirmed":
        return "bg-indigo-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatStatus = (status: string) => {
    return status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>
          {loading ? "Loading orders..." : error ? "Error loading orders" : `You have ${orders.length} recent orders.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          // Loading skeleton
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-4 w-12 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 && !error ? (
          <p className="text-center text-muted-foreground py-6">No recent orders found.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage 
                      src="/diverse-group.png" 
                      alt={order.customerName || "Customer"} 
                    />
                    <AvatarFallback>
                      {(order.customerName || "CU").substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {order.customerName || "Customer"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatOrderItems(order.items)}
                    </p>
                    <div className="flex items-center pt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.date)}
                      </p>
                      <Badge
                        className={`ml-2 ${getStatusColor(order.status)}`}
                      >
                        {formatStatus(order.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className="font-medium">
                    ${order.total.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => router.push('/orders')}
        >
          View All Orders
        </Button>
      </CardFooter>
    </Card>
  )
}