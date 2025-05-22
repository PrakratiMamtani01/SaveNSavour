"use client"

import { Plus, Package, ShoppingBag, FileText, BarChart3, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function QuickActions() {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)
  
  // Simulate export action
  const handleExportData = () => {
    setIsExporting(true)
    setTimeout(() => {
      setIsExporting(false)
      // You could trigger a toast notification here
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks you can perform quickly.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button className="w-full justify-start" onClick={() => router.push('/inventory?action=create')}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Food Item
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => router.push('/inventory')}
        >
          <Package className="mr-2 h-4 w-4" />
          Manage Inventory
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => router.push('/orders')}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          View Orders
        </Button>
      </CardContent>
    </Card>
  )
}