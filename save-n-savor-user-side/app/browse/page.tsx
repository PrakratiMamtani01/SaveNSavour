"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MapPin, Search, Filter, Utensils, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FoodMap from "@/components/food-map"
import { Skeleton } from "@/components/ui/skeleton"

// Interface for food items
interface FoodItem {
  id: string
  name: string
  vendor: string
  originalPrice: number
  discountedPrice: number
  image: string
  distance: string
  cuisine: string
  dietary: string[]
  pickupTime: string
  rating: number
  lat: number
  lng: number
  description?: string
  expiryDate?: string
  quantity?: number
  ingredients?: string[]
  emissions?: {
    saved: number
    total: number
  }
}

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("All")
  const [selectedDietary, setSelectedDietary] = useState<string[]>([])
  const [maxDistance, setMaxDistance] = useState(5)
  const [sortBy, setSortBy] = useState("distance")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cuisineTypes, setCuisineTypes] = useState<string[]>(["All"])
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([])

  // Fetch food items from API
  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/food-items") // Use absolute path

        if (!response.ok) {
          throw new Error("Failed to fetch food items")
        }

        const data = await response.json()

        setFoodItems(data)

        // Extract unique cuisine types and dietary preferences
        const cuisines = new Set<string>(["All"])
        const dietary = new Set<string>()

        data.forEach((item: any) => {
          if (item.cuisine) cuisines.add(item.cuisine)
          if (Array.isArray(item.dietary)) {
            item.dietary.forEach((diet: string) => dietary.add(diet))
          }
        })

        setCuisineTypes(Array.from(cuisines))
        setDietaryPreferences(Array.from(dietary))
      } catch (err) {
        console.error("Error fetching food items:", err)
        setError("Failed to load food items.")
        setFoodItems([])
        setCuisineTypes(["All"])
        setDietaryPreferences([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchFoodItems()
  }, [])

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          // Default to Dubai center if location access is denied
          setUserLocation({ lat: 25.2048, lng: 55.2708 })
        },
      )
    }
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    if (foodItems.length === 0) return

    let filtered = [...foodItems]

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.cuisine.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply cuisine filter
    if (selectedCuisine !== "All") {
      filtered = filtered.filter((item) => item.cuisine === selectedCuisine)
    }

    // Apply dietary preferences
    if (selectedDietary.length > 0) {
      filtered = filtered.filter((item) => selectedDietary.some((pref) => item.dietary.includes(pref)))
    }

    // Apply distance filter
    filtered = filtered.filter((item) => {
      const distanceValue = Number.parseFloat(item.distance.split(" ")[0])
      return distanceValue <= maxDistance
    })

    // Apply sorting
    if (sortBy === "distance") {
      filtered.sort((a, b) => {
        return Number.parseFloat(a.distance.split(" ")[0]) - Number.parseFloat(b.distance.split(" ")[0])
      })
    } else if (sortBy === "price") {
      filtered.sort((a, b) => a.discountedPrice - b.discountedPrice)
    } else if (sortBy === "discount") {
      filtered.sort((a, b) => {
        const discountA = ((a.originalPrice - a.discountedPrice) / a.originalPrice) * 100
        const discountB = ((b.originalPrice - b.discountedPrice) / b.originalPrice) * 100
        return discountB - discountA
      })
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating)
    }

    setFilteredItems(filtered)
  }, [searchQuery, selectedCuisine, selectedDietary, maxDistance, sortBy, foodItems])

  const toggleDietaryPreference = (preference: string) => {
    if (selectedDietary.includes(preference)) {
      setSelectedDietary(selectedDietary.filter((pref) => pref !== preference))
    } else {
      setSelectedDietary([...selectedDietary, preference])
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCuisine("All")
    setSelectedDietary([])
    setMaxDistance(5)
    setSortBy("distance")
  }

  // Loading skeleton component
  const FoodItemSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-1/3" />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-green-600">Find Surplus Food Near You</h1>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for food, restaurants, or cuisines"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Nearest First</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="discount">Highest Discount</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Options</SheetTitle>
                <SheetDescription>Refine your search with these filters</SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Cuisine Type</h3>
                  <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cuisine" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuisineTypes.map((cuisine) => (
                        <SelectItem key={cuisine} value={cuisine}>
                          {cuisine}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Dietary Preferences</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {dietaryPreferences.map((preference) => (
                      <div key={preference} className="flex items-center space-x-2">
                        <Checkbox
                          id={preference}
                          checked={selectedDietary.includes(preference)}
                          onCheckedChange={() => toggleDietaryPreference(preference)}
                        />
                        <Label htmlFor={preference}>{preference}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium">Maximum Distance</h3>
                    <span className="text-sm text-gray-500">{maxDistance} km</span>
                  </div>
                  <Slider
                    value={[maxDistance]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => setMaxDistance(value[0])}
                  />
                </div>
              </div>
              <SheetFooter>
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <SheetClose asChild>
                  <Button className="bg-green-600 hover:bg-green-700">Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* View Tabs (List/Map) */}
      <Tabs defaultValue="list" className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-6">
          {/* Error message */}
          {error && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}

          {/* Active Filters */}
          {(selectedCuisine !== "All" || selectedDietary.length > 0 || maxDistance !== 5) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCuisine !== "All" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {selectedCuisine}
                  <button onClick={() => setSelectedCuisine("All")} className="ml-1 rounded-full hover:bg-gray-200 p-1">
                    ×
                  </button>
                </Badge>
              )}
              {selectedDietary.map((diet) => (
                <Badge key={diet} variant="secondary" className="flex items-center gap-1">
                  {diet}
                  <button
                    onClick={() => toggleDietaryPreference(diet)}
                    className="ml-1 rounded-full hover:bg-gray-200 p-1"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {maxDistance !== 5 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Within {maxDistance} km
                  <button onClick={() => setMaxDistance(5)} className="ml-1 rounded-full hover:bg-gray-200 p-1">
                    ×
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="text-sm text-gray-500" onClick={resetFilters}>
                Clear All
              </Button>
            </div>
          )}

          {/* Results Count */}
          {!isLoading && (
            <p className="text-gray-500 mb-4">
              {filteredItems.length} {filteredItems.length === 1 ? "result" : "results"} found
            </p>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <FoodItemSkeleton />
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden bg-white border-2 border-green-100 shadow-sm">
                  <div className="relative h-48 w-full">
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-green-600 hover:bg-green-700">
                        {Math.round(((item.originalPrice - item.discountedPrice) / item.originalPrice) * 100)}% OFF
                      </Badge>
                    </div>
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">{item.name}</CardTitle>
                    </div>
                    <CardDescription>{item.vendor}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{item.distance}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Utensils className="h-4 w-4 mr-1" />
                        <span className="text-sm">{item.cuisine}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-500 mb-2">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">{item.pickupTime}</span>
                    </div>
                    {item.expiryDate && <div className="text-sm text-amber-600 mb-2">Expires: {item.expiryDate}</div>}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.dietary.map((diet) => (
                        <Badge key={diet} variant="outline" className="text-xs bg-green-50">
                          {diet}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 line-through text-sm">AED {item.originalPrice}</span>
                        <span className="text-green-600 font-bold">AED {item.discountedPrice}</span>
                      </div>
                      {item.quantity !== undefined && (
                        <span className="text-sm text-gray-500">{item.quantity} left</span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                      <Link href={`/food/${item.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search terms to find more options.</p>
              <Button onClick={resetFilters}>Reset Filters</Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="map" className="mt-6">
          <div className="h-[600px] rounded-lg overflow-hidden border">
            {/* Google maps */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
