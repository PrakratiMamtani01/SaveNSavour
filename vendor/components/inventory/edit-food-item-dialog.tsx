"use client"

import { type ReactNode, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api, FoodItem, TimeSlot } from "@/services/api" // Import TimeSlot type
import { toast } from "react-toastify"
import { FoodItemForm } from "@/components/inventory/food-item-form"
import { useAuth } from "@/context/auth-context"

interface EditFoodItemDialogProps {
  children: ReactNode
  foodItem: FoodItem
  onSuccess?: () => void  // Callback for successful update
}

export function EditFoodItemDialog({ children, foodItem, onSuccess }: EditFoodItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth() // Get the current user

  const handleSubmit = async (formData: any, ingredients: string[], timeSlots: TimeSlot[], imageFile?: File) => {
    setLoading(true)
    
    try {
      // Use the existing vendor info if possible, or update from current user
      const updateData = {
        ...formData,
        vendor: formData.vendor || foodItem.vendor || {
          name: user?.businessName || user?.name || 'Unknown Vendor',
          id: user?.id || 'unknown-id',
          location: user?.location || 'Unknown Location'
        }
      }
      
      // Update the food item with emissions calculation
      await api.updateFoodItem(foodItem._id, updateData, ingredients, timeSlots, imageFile)
      
      toast.success('Food item updated successfully!')
      setOpen(false)
      
      // Call onSuccess callback to refresh the list
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error updating food item:', error)
      toast.error('Failed to update food item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Food Item</DialogTitle>
          <DialogDescription>Update the details of your surplus food item.</DialogDescription>
        </DialogHeader>
        <FoodItemForm 
          initialData={foodItem}
          onSubmit={handleSubmit} 
          isSubmitting={loading} 
        />
      </DialogContent>
    </Dialog>
  )
}