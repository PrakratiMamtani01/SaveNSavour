"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, ShoppingBag, DollarSign, Package } from "lucide-react"
import { api, FoodItem } from "@/services/api"

export function InventorySummary() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    totalSales: 0,
    totalEmissionsSaved: 0
  })

  useEffect(() => {
    fetchInventoryStats()
  }, [])

  const fetchInventoryStats = async () => {
    try {
      setLoading(true)
      const items = await api.getFoodItems()
      
      // Calculate inventory statistics
      const availableItems = items.filter(item => item.quantity > 0).length
      
      // Calculate total CO2 emissions saved
      const totalEmissionsSaved = items.reduce((total, item) => {
        return total + (item.emissions?.saved || 0)
      }, 0)
      
      // Estimate total sales (discounted price * (original quantity - current quantity))
      // This is just a rough estimate since we don't track actual sales
      const totalSales = items.reduce((total, item) => {
        // Assume we sold some percentage of items that were added
        const estimatedSold = item.originalPrice * 0.3 // Assume 30% of original price was sold
        return total + estimatedSold
      }, 0)
      
      setStats({
        totalItems: items.length,
        availableItems,
        totalSales,
        totalEmissionsSaved
      })
    } catch (error) {
      console.error('Error fetching inventory stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Summary</CardTitle>
        <CardDescription>Overview of your inventory and environmental impact.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2">
          <div className="flex items-center space-x-4">
            <Package className="h-10 w-10 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">
                {loading ? <span className="animate-pulse">...</span> : stats.totalItems}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ShoppingBag className="h-10 w-10 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available Items</p>
              <p className="text-2xl font-bold">
                {loading ? <span className="animate-pulse">...</span> : stats.availableItems}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <DollarSign className="h-10 w-10 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estimated Revenue</p>
              <p className="text-2xl font-bold">
                {loading ? <span className="animate-pulse">...</span> : `$${stats.totalSales.toFixed(2)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Leaf className="h-10 w-10 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">CO2 Emissions Saved</p>
              <p className="text-2xl font-bold">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  `${stats.totalEmissionsSaved.toFixed(1)} kg`
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}