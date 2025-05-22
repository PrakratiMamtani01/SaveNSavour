"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Clock, Utensils, Star, Plus, Minus, Share2, Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useCart } from "@/context/cart-context"
import { Skeleton } from "@/components/ui/skeleton"
import FoodMap from "@/components/food-map"

// Mock data for food item details (fallback if API fails)
const mockFoodItems = [
  {
    id: "1",
    name: "Assorted Pastry Box",
    vendor: "Sweet Delights Bakery",
    vendorId: "v1",
    originalPrice: 75,
    discountedPrice: 30,
    image: "/placeholder.svg?key=gf2m1",
    distance: "1.2 km",
    cuisine: "Bakery",
    dietary: ["Vegetarian"],
    pickupTime: "Today, 5-7 PM",
    rating: 4.5,
    description:
      "A delicious assortment of freshly baked pastries including croissants, danishes, and muffins. Perfect for breakfast or afternoon tea. All items were baked today and are in perfect condition.",
    address: "Shop 12, Al Wasl Road, Jumeirah, Dubai",
    lat: 25.197197,
    lng: 55.274376,
    reviews: [
      {
        id: 1,
        user: "Ahmed M.",
        rating: 5,
        comment: "Excellent quality pastries, great value for money!",
        date: "2 days ago",
      },
      { id: 2, user: "Sarah K.", rating: 4, comment: "Very fresh and tasty. Will order again.", date: "1 week ago" },
    ],
    quantity: 5,
  },
  {
    id: "2",
    name: "Mediterranean Lunch Box",
    vendor: "Olive Garden Restaurant",
    vendorId: "v2",
    originalPrice: 60,
    discountedPrice: 25,
    image: "/placeholder.svg?key=cqkzz",
    distance: "0.8 km",
    cuisine: "Mediterranean",
    dietary: ["Vegan Options"],
    pickupTime: "Today, 2-4 PM",
    rating: 4.2,
    description:
      "A hearty Mediterranean lunch box featuring hummus, falafel, tabbouleh salad, and pita bread. All made fresh today with quality ingredients. Perfect for a nutritious lunch or dinner.",
    address: "Marina Mall, Level 1, Dubai Marina, Dubai",
    lat: 25.198765,
    lng: 55.269876,
    reviews: [
      {
        id: 1,
        user: "Mohammed A.",
        rating: 4,
        comment: "Delicious and filling lunch. Great value!",
        date: "3 days ago",
      },
      {
        id: 2,
        user: "Fatima H.",
        rating: 5,
        comment: "The hummus is amazing! Everything was fresh.",
        date: "2 weeks ago",
      },
    ],
    quantity: 3,
  },
]

// Interface for food item
interface FoodItem {
  id: string
  name: string
  vendor: string
  vendorId: string
  vendorLocation: string
  originalPrice: number
  discountedPrice: number
  image: string
  distance: string
  cuisine: string
  dietary: string[]
  pickupTime: string
  rating: number
  description: string
  address: string
  reviews: {
    id: number
    user: string
    rating: number
    comment: string
    date: string
  }[]
  quantity: number
  expiryDate?: string
  ingredients?: string[]
  emissions?: {
    saved: number
    total: number
  }
  pickupTimeSlots?: {
    day: string
    startTime: string
    endTime: string
  }[]
}

export default function FoodDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [foodItem, setFoodItem] = useState<FoodItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedPickupTime, setSelectedPickupTime] = useState("")
  const [isLiked, setIsLiked] = useState(false)

  const { addToCart } = useCart()

  // Fetch food item data
  useEffect(() => {
    const fetchFoodItem = async () => {
      try {
        setIsLoading(true)

        // If not in mock data, try to fetch from API
        const response = await fetch(`/api/food-items/${id}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Food item not found")
          }
          throw new Error("Failed to fetch food item")
        }

        const data = await response.json()
        setFoodItem(data)
      } catch (err) {
        console.error("Error fetching food item:", err)
        setError((err as Error).message || "Failed to load food item")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFoodItem()
  }, [id])

  const handleQuantityChange = (newQuantity: number) => {
    if (foodItem && newQuantity >= 1 && newQuantity <= foodItem.quantity) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    if (!foodItem) return

    if (!selectedPickupTime) {
      toast({
        title: "Please select a pickup time",
        description: "You need to select a pickup time before adding to cart",
        variant: "destructive",
      })
      return
    }

    // Get the selected time slot
    let pickupTimeText = ""
    if (foodItem.pickupTimeSlots && foodItem.pickupTimeSlots.length > 0) {
      const slotIndex = Number.parseInt(selectedPickupTime, 10)
      if (!isNaN(slotIndex) && slotIndex >= 0 && slotIndex < foodItem.pickupTimeSlots.length) {
        const slot = foodItem.pickupTimeSlots[slotIndex]
        pickupTimeText = `${slot.day}, ${slot.startTime} - ${slot.endTime}`
      }
    } else {
      // Fallback for legacy format
      pickupTimeText = selectedPickupTime === "5-6pm" ? "Today, 5:00 PM - 6:00 PM" : "Today, 6:00 PM - 7:00 PM"
    }

    // Add to cart
    addToCart({
      id: foodItem.id,
      name: foodItem.name,
      vendor: foodItem.vendor,
      price: foodItem.discountedPrice,
      quantity: quantity,
      image: foodItem.image,
      pickupTime: pickupTimeText,
    })
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/browse">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="flex gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[600px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !foodItem) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Food item not found</h1>
        <p className="mb-6">The food item you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/browse">Browse Available Food</Link>
        </Button>
      </div>
    )
  }

  const discountPercentage = Math.round(
    ((foodItem.originalPrice - foodItem.discountedPrice) / foodItem.originalPrice) * 100,
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/browse">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Food Image and Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative rounded-lg overflow-hidden">
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <Badge className="bg-green-600 hover:bg-green-700 text-white">{discountPercentage}% OFF</Badge>
            </div>
            <img
              src={foodItem.image || "/placeholder.svg"}
              alt={foodItem.name}
              className="w-full h-[400px] object-cover"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{foodItem.name}</h1>
            <div className="flex items-center mt-2">
              <Link href={`/vendor/${foodItem.vendorId}`} className="text-green-600 hover:underline">
                {foodItem.vendor}
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{foodItem.distance}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Utensils className="h-4 w-4 mr-1" />
                <span>{foodItem.cuisine}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>{foodItem.pickupTime}</span>
              </div>
              <div className="flex items-center text-amber-500">
                <Star className="h-4 w-4 mr-1 fill-current" />
                <span>{foodItem.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {foodItem.dietary.map((diet) => (
                <Badge key={diet} variant="outline" className="bg-green-50">
                  {diet}
                </Badge>
              ))}
            </div>

            {foodItem.expiryDate && (
              <div className="mt-4">
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  Expires: {foodItem.expiryDate}
                </Badge>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-600">{foodItem.description}</p>
            </div>

            {foodItem.ingredients && foodItem.ingredients.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Ingredients</h2>
                <ul className="list-disc pl-5 text-gray-600">
                  {foodItem.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Map */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Pickup Location</h2>
              <p className="text-gray-600 mb-2">{foodItem.address}</p>
              <div className="h-[400px] overflow-hidden bg-gray-100 rounded-lg relative">
                <div className="absolute inset-0">
                  <FoodMap location={foodItem.vendorLocation} />
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="vendor">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="vendor">About Vendor</TabsTrigger>
            </TabsList>
            {/* <TabsContent value="reviews" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews</CardTitle>
                  <CardDescription>See what others are saying about this food item</CardDescription>
                </CardHeader>
                <CardContent>
                  {foodItem.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {foodItem.reviews.map((review) => (
                        <div key={review.id} className="pb-4 border-b last:border-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{review.user}</div>
                              <div className="flex items-center mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? "text-amber-500 fill-current" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">{review.date}</div>
                          </div>
                          <p className="mt-2 text-gray-600">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No reviews yet for this item.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Write a Review
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent> */}
            <TabsContent value="vendor" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{foodItem.vendor}</CardTitle>
                  <CardDescription>Learn more about this food provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {foodItem.vendor} is committed to reducing food waste while providing quality food at discounted
                    prices. They have been a partner with Save N' Savor since 2023.
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-50">
                      4.7 ★ Overall Rating
                    </Badge>
                    <Badge variant="outline" className="bg-green-50">
                      500+ Meals Saved
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Order Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>Complete your order information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 line-through">AED {foodItem.originalPrice}</span>
                    <span className="text-2xl font-bold text-green-600">AED {foodItem.discountedPrice}</span>
                  </div>
                  <Badge className="bg-green-600 hover:bg-green-700">{discountPercentage}% OFF</Badge>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Quantity</h3>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="mx-4 font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= foodItem.quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="ml-4 text-sm text-gray-500">{foodItem.quantity} available</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Select Pickup Time</h3>
                  <RadioGroup value={selectedPickupTime} onValueChange={setSelectedPickupTime}>
                    <div className="grid grid-cols-1 gap-2">
                      {foodItem.pickupTimeSlots && foodItem.pickupTimeSlots.length > 0 ? (
                        foodItem.pickupTimeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={`${index}`} id={`time-slot-${index}`} />
                            <Label htmlFor={`time-slot-${index}`}>
                              {slot.day}, {slot.startTime} - {slot.endTime}
                            </Label>
                          </div>
                        ))
                      ) : (
                        // Fallback to default time slots if none are provided
                        <>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="5-6pm" id="5-6pm" />
                            <Label htmlFor="5-6pm">Today, 5:00 PM - 6:00 PM</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="6-7pm" id="6-7pm" />
                            <Label htmlFor="6-7pm">Today, 6:00 PM - 7:00 PM</Label>
                          </div>
                        </>
                      )}
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Special Instructions (Optional)</h3>
                  <Textarea placeholder="Any special requests for pickup?" />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>AED {(foodItem.discountedPrice * quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span>AED 2.00</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>AED {(foodItem.discountedPrice * quantity + 2).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleAddToCart}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <div className="flex w-full gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsLiked(!isLiked)}>
                    <Heart className={`mr-2 h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                    Save
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
