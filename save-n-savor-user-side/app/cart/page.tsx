"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, Clock, CreditCard, AlertCircle, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { useCart } from "@/context/cart-context"

export default function CartPage() {
  const router = useRouter()
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Form state for credit card
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        console.log("User loaded from localStorage:", parsedUser)
      } catch (error) {
        console.error("Error parsing user from localStorage:", error)
        localStorage.removeItem("user")
      }
    }
  }, [])

  const handleRemoveItem = (id: number | string) => {
    removeFromCart(id)
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart",
    })
  }

  const handleQuantityChange = async (id: number | string, newQuantity: number) => {
    const response = await fetch("/api/food-items")
    const foodItems: { id: string | number; quantity: number }[] = await response.json()
    const item = foodItems.find((item) => item.id === id)

    if (!item) return
    if (newQuantity < 1 || newQuantity > item.quantity) {
      toast({
        title: "Invalid Quantity",
        description: `Please select a quantity between 1 and ${item.quantity}.`,
        variant: "destructive",
      })
      return
    }

    updateQuantity(id, newQuantity)
  }

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to place an order",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Add some items before checking out.",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "credit-card") {
      if (
        selectedCardIndex === null ||
        isNaN(selectedCardIndex) ||
        selectedCardIndex < 0 ||
        selectedCardIndex >= user.paymentMethods.length
      ) {
        toast({
          title: "Select a Card",
          description: "Please choose a saved card to proceed.",
          variant: "destructive",
        })
        return
      }
    }

    try {
      setIsProcessing(true)

      console.log("User data:", user)
      console.log("Cart items:", cartItems)

      // Calculate totals
      const subtotal = getCartTotal()
      const serviceFee = 2.0
      const total = subtotal + serviceFee

      // Get the first vendor's address as pickup address (simplified)
      const pickupAddress = cartItems[0]?.vendor ? `${cartItems[0].vendor}, Dubai, UAE` : "Dubai, UAE"

      // Get the pickup time from the first item (simplified)
      const pickupTime = cartItems[0]?.pickupTime

      // Create order object
      const orderData = {
        userId: user._id,
        items: cartItems.map((item) => ({
          foodItemId: item.id.toString(), // Convert to string to avoid ObjectId issues
          name: item.name,
          vendor: item.vendor,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal,
        serviceFee,
        total,
        pickupAddress,
        pickupTime,
        paymentMethod,
      }

      console.log("Order data being sent:", orderData)

      // Send order to API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const responseText = await response.text()
      console.log("API response text:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
        throw new Error("Invalid response from server")
      }

      if (!response.ok) {
        // Check if there are unavailable items
        if (data.unavailableItems && data.unavailableItems.length > 0) {
          const itemNames = data.unavailableItems.map((item) => `${item.name}: ${item.reason}`).join("\n")
          throw new Error(`Some items are unavailable:\n${itemNames}`)
        }
        throw new Error(data.error || "Failed to place order")
      }

      // Clear the cart
      clearCart()

      toast({
        title: "Order placed successfully!",
        description: "Your order has been placed. You will receive a confirmation shortly.",
      })

      // Navigate to confirmation page with the order ID
      console.log("Redirecting to order confirmation with ID:", data.order.orderId)

      // Add a small delay to ensure the order is saved before redirecting
      setTimeout(() => {
        router.push(`/order-confirmation?orderId=${data.order.orderId}`)
      }, 1000)
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Failed to place order",
        description: (error as Error).message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate totals
  const subtotal = getCartTotal()
  const serviceFee = 2.0
  const total = subtotal + serviceFee

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/browse">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-8 text-green-600">Your Cart</h1>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                <CardDescription>Review your items before checkout</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                    <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.vendor}</p>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{item.pickupTime}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="mx-2">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">AED {(item.price * item.quantity).toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-red-500"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Alert className="mt-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-600">Important Reminder</AlertTitle>
              <AlertDescription>
                Please arrive during your selected pickup time. Items not picked up may be donated or discarded, and
                refunds are not available for missed pickups.
              </AlertDescription>
            </Alert>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>AED {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Fee</span>
                      <span>AED {serviceFee.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>AED {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Payment Method</h3>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 border rounded-md p-3">
                          <RadioGroupItem value="credit-card" id="credit-card" />
                          <Label htmlFor="credit-card" className="flex-grow">
                            Credit/Debit Card
                          </Label>
                          <CreditCard className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-3">
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash" className="flex-grow">
                            Cash on Pickup
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {paymentMethod === "credit-card" && (
                    <div className="space-y-4">
                      <h3 className="font-medium mb-2">Cards</h3>
                      <RadioGroup
                        value={String(selectedCardIndex)}
                        onValueChange={(val) => setSelectedCardIndex(Number(val))}
                      >
                        {(user?.paymentMethods ?? []).length > 0 ? (
                          user.paymentMethods.map(
                            (card: { nameOnCard: string; cardNumberLast4: string; expiry: string }, idx: number) => (
                              <div
                                key={idx}
                                className={`border rounded-md p-3 flex items-center space-x-3 ${selectedCardIndex === idx ? "ring-2 ring-green-600" : ""}`}
                              >
                                <RadioGroupItem value={String(idx)} id={`card-${idx}`} />
                                <Label htmlFor={`card-${idx}`} className="flex flex-col gap-1">
                                  <span className="font-medium">
                                    {card.nameOnCard} •••• {card.cardNumberLast4}
                                  </span>
                                  <span className="text-sm text-gray-500">Expires {card.expiry}</span>
                                </Label>
                              </div>
                            ),
                          )
                        ) : (
                          <p className="text-sm text-gray-500">No saved cards found.</p>
                        )}
                      </RadioGroup>
                      <Button variant="outline" className="w-full" onClick={() => router.push("/profile")}>
                        {" "}
                        <PlusCircle className="h-4 w-4 mr-2" /> Add New Card
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Place Order"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/browse">Browse Available Food</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
