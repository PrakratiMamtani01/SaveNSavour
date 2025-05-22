"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle, MapPin, Clock, Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface OrderItem {
  name: string
  vendor: string
  price: number
  quantity: number
  image: string
}

interface Order {
  orderId: string
  date: string
  status: string
  items: OrderItem[]
  subtotal: number
  serviceFee: number
  total: number
  pickupAddress: string
  pickupTime: string
  impact: {
    foodSaved: number
    co2Saved: number
  }
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      setError("You need to be logged in to view order details")
      setLoading(false)
      return
    }

    let parsedUser
    try {
      parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      console.log("User loaded from localStorage:", parsedUser)
    } catch (error) {
      console.error("Error parsing user from localStorage:", error)
      setError("Invalid user data")
      setLoading(false)
      return
    }

    // If no orderId is provided, show error
    if (!orderId) {
      setError("No order ID provided")
      setLoading(false)
      return
    }

    // Fetch order details
    const fetchOrder = async () => {
      try {
        setLoading(true)
        console.log("Fetching order:", orderId, "for user:", parsedUser._id)

        const response = await fetch(`/api/orders/${orderId}?userId=${parsedUser._id}`)

        console.log("Order API response status:", response.status)

        const responseText = await response.text()
        console.log("Order API response text:", responseText)

        let data
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          console.error("Failed to parse response as JSON:", e)
          throw new Error("Invalid response from server")
        }

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch order details")
        }

        console.log("Order data received:", data.order)
        setOrder(data.order)
      } catch (error) {
        console.error("Error fetching order:", error)
        setError((error as Error).message || "Failed to load order details")

        // If we haven't retried too many times and it's a "not found" error,
        // we'll retry after a delay (the order might still be saving)
        if (retryCount < 3 && (error as Error).message.includes("not found")) {
          console.log(`Retrying in 2 seconds... (attempt ${retryCount + 1})`)
          setTimeout(() => {
            setRetryCount(retryCount + 1)
          }, 2000)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, retryCount])

  // If we're still loading or retrying
  if (loading || (retryCount > 0 && retryCount <= 3)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>

          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4 py-2">
                    <Skeleton className="w-16 h-16 rounded-md" />
                    <div className="flex-grow">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-24 mb-1" />
                      <div className="flex justify-between mt-1">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 mt-0.5" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 mt-0.5" />
                  <div>
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Error Loading Order</h1>
          <p className="text-gray-600 mb-6">{error || "Failed to load order details"}</p>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/browse">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Format date
  const orderDate = new Date(order.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-600">Order Confirmed!</h1>
          <p className="text-gray-600 mt-2">
            Thank you for your order. Your confirmation number is <span className="font-medium">{order.orderId}</span>
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Order placed on {orderDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4 py-2">
                  <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.vendor}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm">Qty: {item.quantity}</span>
                      <span className="font-medium">AED {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>AED {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee</span>
                <span>AED {order.serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>AED {order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pickup Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Pickup Address</h3>
                  <p className="text-gray-600">{order.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Pickup Time</h3>
                  <p className="text-gray-600">{order.pickupTime}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Order Date</h3>
                  <p className="text-gray-600">{orderDate}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Get Directions
            </Button>
          </CardFooter>
        </Card>

        <Card className="mb-8 bg-green-50 border-green-100">
          <CardHeader>
            <CardTitle className="text-green-700">Your Environmental Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4">
                <div className="text-2xl font-bold text-green-600 mb-1">{order.impact.foodSaved.toFixed(1)} kg</div>
                <p className="text-green-700">Food Rescued</p>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-green-600 mb-1">{order.impact.co2Saved.toFixed(1)} kg</div>
                <p className="text-green-700">CO₂ Emissions Saved</p>
              </div>
            </div>
            <div className="mt-4 text-center text-green-700 text-sm">
              Thank you for making a difference! Share your impact with friends and family.
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Badge className="bg-green-600 hover:bg-green-700">Share Your Impact</Badge>
          </CardFooter>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/profile">View My Orders</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/browse">
              Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
