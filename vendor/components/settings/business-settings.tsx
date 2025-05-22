"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-toastify"
import { useAuth } from "@/context/auth-context" // Import useAuth
import { Loader2, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function BusinessSettings() {
  // Get user data from context
  const { user } = useAuth() 
  
  // Initialize state with user data
  const [businessData, setBusinessData] = useState({
    name: user?.businessName || "",
    type: user?.businessType || "",
    description: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: user?.location?.split(',')[0]?.trim() || "",
    state: user?.location?.split(',')[1]?.trim() || "",
    zip: ""
  })
  
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update state when user data changes
  useEffect(() => {
    if (user) {
      setBusinessData(prevData => ({
        ...prevData,
        name: user.businessName || user.name || prevData.name,
        email: user.email || prevData.email,
        type: user.businessType || prevData.type,
        city: user.location?.split(',')?.[0]?.trim() || prevData.city,
        state: user.location?.split(',')?.[1]?.trim() || prevData.state
      }))
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBusinessData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setBusinessData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // For now, we'll just simulate a successful save
      // In a real application, you would call your API here
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Business profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving business profile:', error)
      toast.error('Failed to update business profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to user data
    if (user) {
      setBusinessData({
        name: user.businessName || user.name || "",
        type: user.businessType || "",
        description: "",
        email: user.email || "",
        phone: "",
        address: "",
        city: user.location?.split(',')[0]?.trim() || "",
        state: user.location?.split(',')[1]?.trim() || "",
        zip: ""
      })
    }
    
    setIsEditing(false)
    
    // Clear file input and preview
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (logoFile) {
      URL.revokeObjectURL(logoPreview || '')
      setLogoFile(null)
      setLogoPreview(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="ml-2">Loading business information...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>Manage your business details and location information.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={businessData.name} 
              onChange={handleChange} 
              disabled={!isEditing} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Business Type</Label>
            <Select 
              disabled={!isEditing} 
              value={businessData.type} 
              onValueChange={(value) => handleSelectChange("type", value)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="cafe">Café</SelectItem>
                <SelectItem value="bakery">Bakery</SelectItem>
                <SelectItem value="grocery">Grocery Store</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Business Description</Label>
            <Textarea
              id="description"
              name="description"
              value={businessData.description}
              onChange={handleChange}
              disabled={!isEditing}
              className="min-h-[100px]"
              placeholder={!isEditing ? "No description added yet" : "Enter a description of your business"}
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={businessData.email} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Business Phone</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                value={businessData.phone} 
                onChange={handleChange} 
                disabled={!isEditing}
                placeholder={!isEditing ? "No phone number added yet" : "Enter phone number"} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={businessData.address}
              onChange={handleChange}
              disabled={!isEditing}
              className="min-h-[80px]"
              placeholder={!isEditing ? "No address added yet" : "Enter your business address"}
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                name="city" 
                value={businessData.city} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">Emirate/State</Label>
              <Input 
                id="state" 
                name="state" 
                value={businessData.state} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zip">Postal Code</Label>
              <Input 
                id="zip" 
                name="zip" 
                value={businessData.zip} 
                onChange={handleChange} 
                disabled={!isEditing}
                placeholder={!isEditing ? "No postal code added yet" : "Enter postal code"} 
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Business Info
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}