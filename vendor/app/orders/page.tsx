// app/orders/page.tsx
"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { VendorOrdersList } from "@/components/orders/orders-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Card, 
  CardContent,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { ShoppingBag, ArrowUpIcon, Clock, Check, X } from "lucide-react"
import { useState } from "react"

export default function Orders() {
  const [activeTab, setActiveTab] = useState("all")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to refresh orders list
  const refreshOrders = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <MainLayout title="Orders Management">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Customer Orders</h2>
        <Button onClick={refreshOrders}>
          Refresh Orders
        </Button>
      </div>

      {/* Orders Summary */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 flex items-center">
                <ArrowUpIcon className="mr-1 h-3 w-3" />
                0%
              </span>{" "}
              from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Successfully fulfilled
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Orders cancelled
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