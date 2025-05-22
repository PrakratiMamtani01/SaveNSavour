"use client"
import { MainLayout } from "@/components/layout/main-layout"
import { InventoryList } from "@/components/inventory/inventory-list"
import { InventoryFilters } from "@/components/inventory/inventory-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateFoodItemDialog } from "@/components/inventory/create-food-item-dialog"
import { useState } from "react"

export function InventoryPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to trigger refresh
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <MainLayout title="Inventory Management">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Food Items</h2>
        <CreateFoodItemDialog onSuccess={triggerRefresh}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </CreateFoodItemDialog>
      </div>
      <div className="grid gap-6">
        <InventoryFilters />
        <InventoryList refreshTrigger={refreshTrigger} />
      </div>
    </MainLayout>
  )
}
