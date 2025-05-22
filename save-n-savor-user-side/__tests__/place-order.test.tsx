"use client"

import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import CartPage from "@/app/cart/page"
import { CartProvider } from "@/context/cart-context"
import { toast } from "@/components/ui/use-toast"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

// Mock toast
jest.mock("@/components/ui/use-toast", () => ({
  toast: jest.fn(),
}))

// Mock fetch API
global.fetch = jest.fn()

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
})

describe("Place Order Functionality", () => {
  // Setup common mocks
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock cart items in localStorage
    const cartItems = [
      {
        id: "1",
        name: "Assorted Pastry Box",
        vendor: "Sweet Delights Bakery",
        price: 30,
        quantity: 2,
        image: "/placeholder.svg",
        pickupTime: "Today, 5:00 PM - 6:00 PM",
      },
    ]
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === "cart") return JSON.stringify(cartItems)
      if (key === "user")
        return JSON.stringify({
          _id: "user123",
          name: "Test User",
          email: "test@example.com",
          paymentMethods: [{ nameOnCard: "Test User", cardNumberLast4: "4242", expiry: "12/25" }],
        })
      return null
    })

    // Mock successful order placement
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          message: "Order placed successfully",
          order: {
            orderId: "ORD-12345678",
            date: new Date().toISOString(),
            items: cartItems,
            subtotal: 60,
            serviceFee: 2,
            total: 62,
            status: "confirmed",
            pickupAddress: "Sweet Delights Bakery, Dubai, UAE",
            pickupTime: "Today, 5:00 PM - 6:00 PM",
            impact: { foodSaved: 1.5, co2Saved: 3.75 },
          },
        }),
    })
  })

  // Test 1: Main Success Scenario - Place order successfully
  test("successfully places an order", async () => {
    const router = require("next/navigation").useRouter()

    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Select payment method
    const creditCardOption = screen.getByLabelText(/credit\/debit card/i)
    fireEvent.click(creditCardOption)

    // Select saved card
    const savedCard = screen.getByLabelText(/test user •••• 4242/i)
    fireEvent.click(savedCard)

    // Place order
    const placeOrderButton = screen.getByRole("button", { name: /place order/i })
    fireEvent.click(placeOrderButton)

    // Check if order API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/orders", expect.any(Object))
    })

    // Check if toast was called with success message
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Order placed successfully!",
      }),
    )

    // Check if router was called to redirect to confirmation page
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith(expect.stringContaining("/order-confirmation?orderId=ORD-12345678"))
    })
  })

  // Test 2: Alternate Course 1 - Modify cart before checkout
  test("allows modifying cart before checkout", async () => {
    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Initial quantity should be 2
    expect(screen.getByText("2", { exact: true })).toBeInTheDocument()

    // Increase quantity
    const increaseButton = screen.getByRole("button", { name: "+" })
    fireEvent.click(increaseButton)

    // Check that quantity increased
    expect(screen.getByText("3", { exact: true })).toBeInTheDocument()

    // Check that total price updated
    expect(screen.getByText("AED 90.00")).toBeInTheDocument()
  })

  // Test 3: Alternate Course 2 - Cancel during payment (remove item from cart)
  test("allows removing items from cart", async () => {
    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Remove item from cart
    const removeButton = screen.getByRole("button", { name: "" })
    fireEvent.click(removeButton)

    // Check if toast was called with success message
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Item removed",
      }),
    )

    // Check that empty cart message is displayed
    await waitFor(() => {
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
    })
  })

  // Test 4: Error handling - Not logged in
  test("shows error when trying to place order without being logged in", async () => {
    // Mock user not logged in
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === "cart")
        return JSON.stringify([
          {
            id: "1",
            name: "Assorted Pastry Box",
            vendor: "Sweet Delights Bakery",
            price: 30,
            quantity: 2,
            image: "/placeholder.svg",
            pickupTime: "Today, 5:00 PM - 6:00 PM",
          },
        ])
      return null
    })

    const router = require("next/navigation").useRouter()

    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Place order
    const placeOrderButton = screen.getByRole("button", { name: /place order/i })
    fireEvent.click(placeOrderButton)

    // Check if toast was called with error message
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Please log in",
        variant: "destructive",
      }),
    )

    // Check if router was called to redirect to login page
    expect(router.push).toHaveBeenCalledWith("/login")
  })

  // Test 5: Error handling - API error
  test("handles API error when placing order", async () => {
    // Mock API error
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () =>
        JSON.stringify({
          error: "Failed to place order",
        }),
    })

    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Select payment method
    const creditCardOption = screen.getByLabelText(/credit\/debit card/i)
    fireEvent.click(creditCardOption)

    // Select saved card
    const savedCard = screen.getByLabelText(/test user •••• 4242/i)
    fireEvent.click(savedCard)

    // Place order
    const placeOrderButton = screen.getByRole("button", { name: /place order/i })
    fireEvent.click(placeOrderButton)

    // Check if toast was called with error message
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Failed to place order",
          variant: "destructive",
        }),
      )
    })
  })

  // Test 6: Error handling - Unavailable items
  test("handles unavailable items when placing order", async () => {
    // Mock unavailable items response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () =>
        JSON.stringify({
          error: "Some items are unavailable or have insufficient quantity",
          unavailableItems: [{ id: "1", name: "Assorted Pastry Box", reason: "Only 1 available, but 2 requested" }],
        }),
    })

    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Select payment method
    const creditCardOption = screen.getByLabelText(/credit\/debit card/i)
    fireEvent.click(creditCardOption)

    // Select saved card
    const savedCard = screen.getByLabelText(/test user •••• 4242/i)
    fireEvent.click(savedCard)

    // Place order
    const placeOrderButton = screen.getByRole("button", { name: /place order/i })
    fireEvent.click(placeOrderButton)

    // Check if toast was called with error message about unavailable items
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Failed to place order",
          description: expect.stringContaining("Some items are unavailable"),
          variant: "destructive",
        }),
      )
    })
  })
})
