"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Leaf, Calculator } from "lucide-react"
import { api } from "@/services/api"
import { toast } from "react-toastify"

export function EmissionsCalculator() {
  const [dishName, setDishName] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [ingredients, setIngredients] = useState<string[]>([])
  const [newIngredient, setNewIngredient] = useState("")
  const [emissionsResult, setEmissionsResult] = useState<{ total: number; saved: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const ingredientsTextareaRef = useRef<HTMLTextAreaElement>(null)

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()])
      setNewIngredient("")
    }
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const parseIngredientsFromTextarea = () => {
    if (!ingredientsTextareaRef.current) return
    
    const text = ingredientsTextareaRef.current.value
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    setIngredients(lines)
  }

  const calculateEmissions = async () => {
    try {
      if (!dishName.trim()) {
        toast.warning("Please enter a dish name")
        return
      }

      if (ingredients.length === 0) {
        toast.warning("Please add at least one ingredient")
        return
      }

      setLoading(true)
      setEmissionsResult(null)

      // Use the API to calculate emissions
      const result = await api.calculateEmissions(
        dishName,
        ingredients,
        quantity,
        showDetails ? 'detailed' : 'standard'
      )

      setEmissionsResult(result)
      toast.success("Emissions calculated successfully!")
    } catch (error) {
      console.error("Error calculating emissions:", error)
      toast.error("Failed to calculate emissions")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-emerald-500" />
          CO2 Emissions Calculator
        </CardTitle>
        <CardDescription>
          Calculate the environmental impact of your food items by providing ingredients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dish-name">Dish Name</Label>
            <Input
              id="dish-name"
              placeholder="Enter dish name"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ingredients">Ingredients (one per line)</Label>
          <Textarea
            id="ingredients"
            placeholder="Enter each ingredient on a new line"
            className="min-h-[120px]"
            ref={ingredientsTextareaRef}
            defaultValue={ingredients.join('\n')}
          />
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={parseIngredientsFromTextarea}
            >
              Parse Ingredients
            </Button>
          </div>
        </div>

        {ingredients.length > 0 && (
          <div className="space-y-2">
            <Label>Added Ingredients</Label>
            <div className="max-h-[200px] overflow-y-auto space-y-1 border rounded-md p-2">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <span>{ingredient}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveIngredient(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            placeholder="Add another ingredient"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddIngredient()
              }
            }}
          />
          <Button type="button" onClick={handleAddIngredient}>
            Add
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show-details"
            checked={showDetails}
            onChange={(e) => setShowDetails(e.target.checked)}
          />
          <Label htmlFor="show-details">Show detailed calculation</Label>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => {
          setDishName("")
          setQuantity(1)
          setIngredients([])
          setEmissionsResult(null)
          if (ingredientsTextareaRef.current) {
            ingredientsTextareaRef.current.value = ""
          }
        }}>
          Reset
        </Button>
        <Button onClick={calculateEmissions} disabled={loading}>
          <Calculator className="mr-2 h-4 w-4" />
          {loading ? "Calculating..." : "Calculate Emissions"}
        </Button>
      </CardFooter>

      {emissionsResult && (
        <CardContent>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-6 w-6 text-emerald-600" />
                <h3 className="text-lg font-semibold text-emerald-700">Emission Results</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-emerald-700">Total CO2 Emissions:</p>
                  <p className="text-2xl font-bold">{emissionsResult.total.toFixed(2)} kg</p>
                  <p className="text-xs text-emerald-600">
                    For {quantity} serving(s) of {dishName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-emerald-700">CO2 Saved From Waste:</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {emissionsResult.saved.toFixed(2)} kg
                  </p>
                  <p className="text-xs text-emerald-600">
                    By preventing food waste
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-emerald-700">Environmental Impact Context:</p>
                <p className="text-sm mt-1">
                  Saving {emissionsResult.saved.toFixed(2)} kg of CO2 is equivalent to 
                  approximately {(emissionsResult.saved / 0.12).toFixed(1)} kilometers not driven by an average car.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      )}
    </Card>
  )
}