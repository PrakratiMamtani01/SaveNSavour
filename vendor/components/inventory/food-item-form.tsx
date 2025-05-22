import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusCircle, MinusCircle, Upload, Leaf } from "lucide-react"
import { api, FoodItem } from "@/services/api"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "react-toastify"
import { PickupTimeSlots, TimeSlot } from "./pickup-time-slots"

interface FoodItemFormProps {
  initialData?: Partial<FoodItem>;
  onSubmit: (data: any, ingredients: string[], timeSlots: TimeSlot[], imageFile?: File) => Promise<void>;
  isSubmitting: boolean;
}

export function FoodItemForm({ initialData, onSubmit, isSubmitting }: FoodItemFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    originalPrice: initialData?.originalPrice || 0,
    discountedPrice: initialData?.discountedPrice || 0,
    quantity: initialData?.quantity || 0,
    expiryDate: initialData?.expiryDate || '',
    description: initialData?.description || '',
    dietary: initialData?.dietary || [],
  });
  
  const [ingredients, setIngredients] = useState<string[]>(initialData?.ingredients || []);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(initialData?.pickupTimeSlots || []);
  const [newIngredient, setNewIngredient] = useState('');
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [emissionsEstimate, setEmissionsEstimate] = useState<{total: number, saved: number} | null>(
    initialData?.emissions ? {
      total: initialData.emissions.total,
      saved: initialData.emissions.saved
    } : null
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial image preview if available
  useEffect(() => {
    if (initialData?._id && initialData?.image?.data) {
      setImagePreview(`data:${initialData.image.contentType};base64,${initialData.image.data}`);
    } else if (initialData?._id) {
      setImagePreview(api.getImageUrl(initialData._id));
    }
  }, [initialData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // For numeric inputs, ensure we're parsing as numbers
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? '' : parseFloat(value) // Allow empty input but parse valid numbers
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    console.log(`Updated ${name} to:`, value); // Add this for debugging
  };
  
  
  const handleDietaryChange = (value: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        dietary: [...formData.dietary, value]
      });
    } else {
      setFormData({
        ...formData,
        dietary: formData.dietary.filter(item => item !== value)
      });
    }
  };
  
  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };
  
  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Function to estimate emissions based on current ingredients
  const estimateEmissions = async () => {
    try {
      if (ingredients.length === 0) {
        toast.warn("Add some ingredients to estimate emissions");
        return;
      }
      
      // Get the current quantity from the form (default to 1 if not set)
      const quantity = parseInt(formData.quantity.toString()) || 1;
      
      console.log("Estimating emissions for:", {
        dishName: formData.name || "Food Item",
        ingredients: ingredients,
        quantity: quantity
      });
      
      // Use 'detailed' mode to match server calculation and pass quantity
      const data = await api.calculateEmissions(
        formData.name || "Food Item",
        ingredients,
        quantity,
        'detailed' // Match the server's calculation mode
      );
      
      console.log("Emissions calculation result:", data);
      
      // Update state with the estimate
      setEmissionsEstimate({
        total: data.total,
        saved: data.saved
      });
      
      toast.success(`Emissions estimated: ${data.saved.toFixed(1)} kg CO2 saved for ${quantity} item(s)`);
    } catch (error) {
      console.error('Error estimating emissions:', error);
      
      // Provide fallback values with quantity factored in
      const quantity = parseInt(formData.quantity.toString()) || 1;
      const fallbackEmissions = {
        total: ingredients.length * 0.5 * quantity,
        saved: ingredients.length * 0.35 * quantity
      };
      
      setEmissionsEstimate(fallbackEmissions);
      
      toast.info(`Using estimated emissions: ${fallbackEmissions.saved.toFixed(1)} kg CO2 saved for ${quantity} item(s)`);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Make sure numeric values are properly parsed as numbers
      const submissionData = {
        ...formData,
        originalPrice: parseFloat(formData.originalPrice.toString() || '0'),
        discountedPrice: parseFloat(formData.discountedPrice.toString() || '0'),
        quantity: parseInt(formData.quantity.toString() || '0')
      };
      
      console.log("Submitting data:", submissionData);
      
      await onSubmit(submissionData, ingredients, timeSlots, imageFile);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select 
            name="category" 
            value={formData.category} 
            onValueChange={(value) => setFormData({...formData, category: value})}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main-course">Main Course</SelectItem>
              <SelectItem value="appetizer">Appetizer</SelectItem>
              <SelectItem value="dessert">Dessert</SelectItem>
              <SelectItem value="beverage">Beverage</SelectItem>
              <SelectItem value="side">Side Dish</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="originalPrice">Original Price ($)</Label>
          <Input
            id="originalPrice"
            name="originalPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.originalPrice}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="discountedPrice">Discounted Price ($)</Label>
          <Input
            id="discountedPrice"
            name="discountedPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.discountedPrice}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            name="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Dietary Preferences</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="vegetarian" 
              checked={formData.dietary.includes('Vegetarian')}
              onCheckedChange={(checked) => handleDietaryChange('Vegetarian', checked as boolean)}
            />
            <label htmlFor="vegetarian">Vegetarian</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="vegan" 
              checked={formData.dietary.includes('Vegan')}
              onCheckedChange={(checked) => handleDietaryChange('Vegan', checked as boolean)}
            />
            <label htmlFor="vegan">Vegan</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="vegetarian-options" 
              checked={formData.dietary.includes('Vegetarian Options')}
              onCheckedChange={(checked) => handleDietaryChange('Vegetarian Options', checked as boolean)}
            />
            <label htmlFor="vegetarian-options">Vegetarian Options</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="vegan-options" 
              checked={formData.dietary.includes('Vegan Options')}
              onCheckedChange={(checked) => handleDietaryChange('Vegan Options', checked as boolean)}
            />
            <label htmlFor="vegan-options">Vegan Options</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="gluten-free" 
              checked={formData.dietary.includes('Gluten-Free')}
              onCheckedChange={(checked) => handleDietaryChange('Gluten-Free', checked as boolean)}
            />
            <label htmlFor="gluten-free">Gluten Free</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="pescatarian" 
              checked={formData.dietary.includes('Pescatarian')}
              onCheckedChange={(checked) => handleDietaryChange('Pescatarian', checked as boolean)}
            />
            <label htmlFor="pescatarian">Pescatarian</label>
          </div>
        </div>
      </div>
      
      {/* Pickup Time Slots section */}
      <div className="space-y-2">
        <PickupTimeSlots
          timeSlots={timeSlots}
          onChange={setTimeSlots}
        />
      </div>
      
      {/* Ingredients section - important for emissions calculation */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Ingredients (for emissions calculation)</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={estimateEmissions}
            disabled={isSubmitting}
          >
            <Leaf className="mr-2 h-4 w-4 text-emerald-500" />
            Estimate Emissions
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            placeholder="Add ingredient"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddIngredient();
              }
            }}
          />
          <Button 
            type="button" 
            onClick={handleAddIngredient}
            size="sm"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1 mt-2">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
              <span>{ingredient}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => handleRemoveIngredient(index)}
              >
                <MinusCircle className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
        {ingredients.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No ingredients added. Adding ingredients improves emissions calculation.
          </p>
        )}

        {/* Emissions estimate display */}
        {emissionsEstimate && (
          <Card className="bg-emerald-50 border-emerald-200 mt-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="h-5 w-5 text-emerald-600" />
                <h4 className="text-sm font-medium text-emerald-700">Environmental Impact</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-emerald-700">Total CO2 Emissions:</p>
                  <p className="font-bold">{emissionsEstimate.total.toFixed(2)} kg</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700">CO2 Saved From Waste:</p>
                  <p className="font-bold text-emerald-600">{emissionsEstimate.saved.toFixed(2)} kg</p>
                </div>
              </div>
              <p className="text-xs text-emerald-700 mt-2">
                Based on {ingredients.length} ingredients for {formData.quantity || 1} item(s)
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Image upload section */}
      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>
        <div className="flex items-center gap-4">
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            ref={fileInputRef}
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {imageFile ? 'Change Image' : 'Upload Image'}
          </Button>
          {imagePreview && (
            <div className="w-16 h-16 rounded-md overflow-hidden border">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}