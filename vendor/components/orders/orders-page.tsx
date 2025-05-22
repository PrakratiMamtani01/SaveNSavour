// pages/orders-page.tsx
"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { VendorOrdersList } from "@/components/orders/orders-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { RefreshCw, ShoppingBag, Clock, Check, X, AlertCircle } from "lucide-react"
import { api } from "@/services/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [orderCounts, setOrderCounts] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    ready: 0,
    completed: 0,
    cancelled: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Log the vendor ID on component mount for debugging
  useEffect(() => {
    const vendorId = localStorage.getItem('vendor_id') || 'vendor-123';
    console.log('Current vendor ID in OrdersPage:', vendorId);
    
    // Set vendor ID for testing if not already set
    if (!localStorage.getItem('vendor_id')) {
      console.log('Setting default vendor ID for testing');
      localStorage.setItem('vendor_id', 'vendor-123');
    }
    
    fetchOrderCounts();
  }, []);

  useEffect(() => {
    fetchOrderCounts();
  }, [refreshTrigger]);

  // Function to refresh orders list
  const refreshOrders = () => {
    console.log('Refreshing orders');
    setRefreshTrigger(prev => prev + 1);
  };

  // Function to fetch order counts for the cards
  const fetchOrderCounts = async () => {
    try {
      setLoading(true);
      const counts = await api.getOrderCounts();
      console.log('Order counts fetched:', counts);
      setOrderCounts(counts);
      setError(null);
    } catch (error) {
      console.error('Error fetching order counts:', error);
      setError('Could not fetch order statistics. Dashboard may show inaccurate data.');
      
      // If API call fails, try to count orders manually
      try {
        const orders = await api.getVendorOrders();
        const manualCounts = {
          total: orders.length,
          pending: orders.filter(o => o.status === 'pending').length,
          confirmed: orders.filter(o => o.status === 'confirmed').length,
          ready: orders.filter(o => o.status === 'ready for pickup').length,
          completed: orders.filter(o => o.status === 'completed').length,
          cancelled: orders.filter(o => o.status === 'cancelled').length
        };
        console.log('Manually calculated order counts:', manualCounts);
        setOrderCounts(manualCounts);
      } catch (e) {
        console.error('Failed to manually count orders:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Orders Management">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Customer Orders</h2>
        <Button onClick={refreshOrders}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Orders
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Orders Summary */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCounts.total}</div>
            <p className="text-xs text-muted-foreground">
              All orders in your system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCounts.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Check className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCounts.confirmed}</div>
            <p className="text-xs text-muted-foreground">
              Ready to prepare
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCounts.ready}</div>
            <p className="text-xs text-muted-foreground">
              Ready for pickup
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Check className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCounts.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully fulfilled
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="ready">Ready for Pickup</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <VendorOrdersList refreshTrigger={refreshTrigger} />
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          <VendorOrdersList status="pending" refreshTrigger={refreshTrigger} />
        </TabsContent>
        
        <TabsContent value="confirmed" className="space-y-4">
          <VendorOrdersList status="confirmed" refreshTrigger={refreshTrigger} />
        </TabsContent>
        
        <TabsContent value="ready" className="space-y-4">
          <VendorOrdersList status="ready for pickup" refreshTrigger={refreshTrigger} />
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          <VendorOrdersList status="completed" refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </MainLayout>
  )
}