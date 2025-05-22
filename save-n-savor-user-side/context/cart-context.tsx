"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { toast } from "@/components/ui/use-toast"

export interface CartItem {
  id: number | string
  name: string
  vendor: string
  price: number
  quantity: number
  image: string
  pickupTime?: string
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: number | string) => void
  updateQuantity: (id: number | string, quantity: number) => void
  clearCart: () => void
  getCartCount: () => number
  getCartTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = async (item: CartItem) => {
    // Fetch the current food item stock from database
    const response = await fetch("/api/food-items")
    const foodItems: { id: string | number; quantity: number }[] = await response.json()
    const currentItem = foodItems.find((f) => f.id === item.id)

    if (currentItem) {
      setCartItems((prevItems) => {
        // Check if item already exists in cart
        const existingItem = prevItems.find((cartItem) => cartItem.id === item.id)
        const existingQty = existingItem?.quantity ?? 0
        const totalDesiredQty = existingQty + item.quantity
        if (totalDesiredQty > currentItem.quantity) {
          toast({
            title: "Quantity Exceeded",
            description: `Only ${currentItem.quantity} available. You've requested ${totalDesiredQty}.`,
            variant: "destructive",
          })
          return prevItems
        }

        // Update quantity or add new item
        const updatedItems = existingItem
          ? prevItems.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem
          )
          : [...prevItems, item]

        toast({
          title: "Added to cart!",
          description: `${item.quantity} x ${item.name} added to your cart`,
        })

        return updatedItems
      })
    } else {
      return
    }
  }

  const removeFromCart = (id: number | string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: number | string, quantity: number) => {
    if (quantity < 1) return

    setCartItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity: quantity } : item)))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
