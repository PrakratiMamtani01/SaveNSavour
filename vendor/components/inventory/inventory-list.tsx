// components/inventory/inventory-list.tsx
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
import { Edit, MoreHorizontal, Trash, Leaf, Image as ImageIcon, AlertCircle, Plus } from "lucide-react"
import { EditFoodItemDialog } from "@/components/inventory/edit-food-item-dialog"
import { api, FoodItem } from '@/services/api'
import { toast } from "react-toastify"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CreateFoodItemDialog } from "@/components/inventory/create-food-item-dialog"

interface InventoryListProps {
  refreshTrigger?: number; // Prop to trigger refresh
}

export function InventoryList({ refreshTrigger }: InventoryListProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [inventoryItems, setInventoryItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vendorName, setVendorName] = useState<string>('your business') // Default vendor name

  useEffect(() => {
    fetchItems()
    
    // Try to get vendor name from local storage or context
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.businessName) {
          setVendorName(user.businessName);
        } else if (user.name) {
          setVendorName(user.name);
        }
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    }
  }, [refreshTrigger]) // Fetch when refreshTrigger changes

  const fetchItems = async () => {
    try {
      setLoading(true)
      const items = await api.getFoodItems() // This now filters by vendor automatically
      setInventoryItems(items)
      setError(null)
    } catch (error) {
      console.error('Error fetching items:', error)
      setError('Failed to load inventory items. Please try again later.')
      toast.error('Failed to load inventory items')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === inventoryItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(inventoryItems.map((item) => item._id))
    }
  }

  const toggleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-500"
      case "Low Stock":
        return "bg-amber-500"
      case "Out of Stock":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatus = (item: FoodItem) => {
    if (item.quantity === 0) return 'Out of Stock'
    if (item.quantity < 5) return 'Low Stock'
    return 'Available'
  }

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      await api.deleteFoodItem(id)
      toast.success('Item deleted successfully')
      fetchItems() // Refresh the list
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (item: FoodItem) => {
    if (item._id && item.image?.data) {
      // Return base64 data URL for images stored in MongoDB
      return `data:${item.image.contentType};base64,${item.image.data}`
    } else if (item._id) {
      // Fallback to API's getImageUrl method if no embedded image data
      return api.getImageUrl(item._id)
    }
    return null
  }

  return (
    <div className="rounded-md border">
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button 
              variant="link" 
              className="ml-2 p-0 h-auto text-red-600 underline" 
              onClick={fetchItems}
            >
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
                checked={selectedItems.length === inventoryItems.length && inventoryItems.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="hidden md:table-cell">Quantity</TableHead>
            <TableHead className="hidden md:table-cell">Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Dietary</TableHead>
            <TableHead className="hidden lg:table-cell">CO2 Saved</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-8">
                <div className="flex justify-center items-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-emerald-500 mr-2"></div>
                  Loading inventory items for {vendorName}...
                </div>
              </TableCell>
            </TableRow>
          ) : inventoryItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                <div className="flex flex-col items-center gap-4">
                  <p>No food items found for {vendorName}.</p>
                  <CreateFoodItemDialog onSuccess={fetchItems}>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Your First Item
                    </Button>
                  </CreateFoodItemDialog>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            inventoryItems.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item._id)}
                    onCheckedChange={() => toggleSelectItem(item._id)}
                    aria-label={`Select ${item.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="w-16 h-16 rounded-md overflow-hidden border">
                    {getImageUrl(item) ? (
                      <img 
                        src={getImageUrl(item)!} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="hidden md:table-cell">{item.category}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>${item.discountedPrice.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground line-through">${item.originalPrice.toFixed(2)}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{item.quantity}</TableCell>
                <TableCell className="hidden md:table-cell">{item.expiryDate}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(getStatus(item))}>{getStatus(item)}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {item.dietary && item.dietary.map((diet) => (
                      <Badge key={diet} variant="outline">
                        {diet}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Leaf className="h-4 w-4" />
                    <span>{item.emissions?.saved.toFixed(1) || '0.0'} kg</span>
                  </div>
                </TableCell>
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
                      <EditFoodItemDialog foodItem={item} onSuccess={fetchItems}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </EditFoodItemDialog>
                      <DropdownMenuItem onClick={() => handleDelete(item._id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
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