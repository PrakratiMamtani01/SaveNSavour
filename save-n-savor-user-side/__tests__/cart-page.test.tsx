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

describe("Cart Page", () => {
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
            items: [
              {
                id: "1",
                name: "Assorted Pastry Box",
                vendor: "Sweet Delights Bakery",
                price: 30,
                quantity: 2,
                image: "/placeholder.svg",
              },
            ],
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

  test("renders cart with items", async () => {
    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Check for cart item details
    expect(screen.getByText("Sweet Delights Bakery")).toBeInTheDocument()
    expect(screen.getByText("Today, 5:00 PM - 6:00 PM")).toBeInTheDocument()
    expect(screen.getByText("AED 60.00")).toBeInTheDocument() // 2 * 30 = 60
  })

  test("allows adjusting quantity", async () => {
    // Mock API for quantity check
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "1", quantity: 5 }],
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

    // Initial quantity should be 2
    expect(screen.getByText("2", { exact: true })).toBeInTheDocument()

    // Increase quantity
    const increaseButton = screen.getByRole("button", { name: "+" })
    fireEvent.click(increaseButton)

    // Check that quantity increased
    await waitFor(() => {
      expect(screen.getByText("3", { exact: true })).toBeInTheDocument()
    })

    // Check that total price updated
    expect(screen.getByText("AED 90.00")).toBeInTheDocument() // 3 * 30 = 90
  })

  test("prevents invalid quantity adjustments", async () => {
    // Mock API for quantity check with limited availability
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "1", quantity: 2 }], // Only 2 available
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

    // Try to increase quantity beyond available
    const increaseButton = screen.getByRole("button", { name: "+" })
    fireEvent.click(increaseButton)

    // Check that toast was called with error message
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Invalid Quantity",
        variant: "destructive",
      }),
    )
  })

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

  test("places an order successfully", async () => {
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

  test("shows error when not logged in", async () => {
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

  test("renders empty cart message when cart is empty", async () => {
    // Mock empty cart
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === "cart") return JSON.stringify([])
      return null
    })

    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Check for empty cart message
    await waitFor(() => {
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
    })
  })

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

  test("switches payment method to cash on pickup", async () => {
    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Select cash on pickup payment method
    const cashOption = screen.getByLabelText(/cash on pickup/i)
    fireEvent.click(cashOption)

    // Check that cash option is selected
    expect(cashOption).toBeChecked()

    // Place order with cash payment
    const placeOrderButton = screen.getByRole("button", { name: /place order/i })
    fireEvent.click(placeOrderButton)

    // Check if order API was called with cash payment method
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/orders",
        expect.objectContaining({
          body: expect.stringContaining('"paymentMethod":"cash"'),
        }),
      )
    })
  })

  test("handles error when no card is selected", async () => {
    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Select credit card payment method but don't select a card
    const creditCardOption = screen.getByLabelText(/credit\/debit card/i)
    fireEvent.click(creditCardOption)

    // Place order without selecting a card
    const placeOrderButton = screen.getByRole("button", { name: /place order/i })
    fireEvent.click(placeOrderButton)

    // Check if toast was called with error message
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Select a Card",
        variant: "destructive",
      }),
    )
  })

  test("handles empty cart when trying to place order", async () => {
    // Mock empty cart
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === "cart") return JSON.stringify([])
      if (key === "user")
        return JSON.stringify({
          _id: "user123",
          name: "Test User",
          email: "test@example.com",
          paymentMethods: [{ nameOnCard: "Test User", cardNumberLast4: "4242", expiry: "12/25" }],
        })
      return null
    })

    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for empty cart message
    await waitFor(() => {
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
    })

    // Try to find place order button (should not exist)
    const placeOrderButton = screen.queryByRole("button", { name: /place order/i })
    expect(placeOrderButton).not.toBeInTheDocument()

    // Check for browse food button
    const browseButton = screen.getByRole("link", { name: /browse available food/i })
    expect(browseButton).toBeInTheDocument()
  })

  // New tests to improve coverage for lines 35-36, 79-84, 157-158, 245, 360

  test("handles invalid JSON in localStorage user data", async () => {
    // Mock invalid JSON in localStorage for user
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
      if (key === "user") return "{invalid-json"
      return null
    })

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Check if console.error was called with error about parsing
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error parsing user from localStorage:", expect.any(Error))

    // Verify localStorage.removeItem was called to clean up invalid data
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user")

    // Restore console.error
    consoleErrorSpy.mockRestore()
  })

  test("handles item not found in handleQuantityChange", async () => {
    // Mock API response with no matching item
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "999", quantity: 5 }], // Different ID than what's in cart
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

    // Try to increase quantity
    const increaseButton = screen.getByRole("button", { name: "+" })
    fireEvent.click(increaseButton)

    // Function should return early without updating quantity
    // The quantity should remain at 2
    expect(screen.getByText("2", { exact: true })).toBeInTheDocument()
  })

  test("handles JSON parse error in API response", async () => {
    // Mock API response with invalid JSON
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => "invalid-json-response",
    })

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

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
          description: "Invalid response from server",
          variant: "destructive",
        }),
      )
    })

    // Check if console.error was called
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to parse response as JSON:", expect.any(Error))

    // Restore console.error
    consoleErrorSpy.mockRestore()
  })

  test("renders the important reminder alert", async () => {
    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Check for the important reminder alert (line 245)
    expect(screen.getByText("Important Reminder")).toBeInTheDocument()
    expect(screen.getByText(/please arrive during your selected pickup time/i)).toBeInTheDocument()
  })

  test("renders the add new card button", async () => {
    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )

    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Select credit card payment method
    const creditCardOption = screen.getByLabelText(/credit\/debit card/i)
    fireEvent.click(creditCardOption)

    // Check for the add new card button (line 360)
    const addNewCardButton = screen.getByRole("button", { name: /add new card/i })
    expect(addNewCardButton).toBeInTheDocument()

    // Click the add new card button
    fireEvent.click(addNewCardButton)

    // Check if router was called to redirect to profile page
    const router = require("next/navigation").useRouter()
    expect(router.push).toHaveBeenCalledWith("/profile")
  })

  test("renders user with no payment methods", async () => {
    // Mock user with no payment methods
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
      if (key === "user")
        return JSON.stringify({
          _id: "user123",
          name: "Test User",
          email: "test@example.com",
          paymentMethods: [], // Empty payment methods array
        })
      return null
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

    // Select credit card payment method
    const creditCardOption = screen.getByLabelText(/credit\/debit card/i)
    fireEvent.click(creditCardOption)

    // Check for the "No saved cards found" message
    expect(screen.getByText("No saved cards found.")).toBeInTheDocument()
  })
})
