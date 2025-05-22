"use client"

import React, { ReactNode, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api, TimeSlot } from "@/services/api" // Import TimeSlot type
import { toast } from "react-toastify"
import { FoodItemForm } from "@/components/inventory/food-item-form"
import { useAuth } from "@/context/auth-context"

interface CreateFoodItemDialogProps {
  children: ReactNode
  onSuccess?: () => void // Callback for successful creation
}

export function CreateFoodItemDialog({ children, onSuccess }: CreateFoodItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth() // Get the current user

  const handleSubmit = async (formData: any, ingredients: string[], timeSlots: TimeSlot[], imageFile?: File) => {
    setLoading(true)
    
    try {
      // Add vendor information from the authenticated user
      const foodItemData = {
        ...formData,
        vendor: {
          name: user?.businessName || user?.name || 'Unknown Vendor',
          id: user?.id || 'unknown-id',
          location: user?.location || 'Unknown Location'
        }
      }
      
      // Create the food item with emissions calculation
      await api.createFoodItem(foodItemData, ingredients, timeSlots, imageFile)
      
      toast.success(`Food item created successfully!`)
      setOpen(false)
      
      // Call the onSuccess callback to refresh the inventory list
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating food item:', error)
      toast.error('Failed to create food item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Food Item</DialogTitle>
          <DialogDescription>Create a new surplus food item to list on SaveN&apos;Savor.</DialogDescription>
        </DialogHeader>
        <FoodItemForm 
          onSubmit={handleSubmit} 
          isSubmitting={loading} 
        />
      </DialogContent>
    </Dialog>
  )
}