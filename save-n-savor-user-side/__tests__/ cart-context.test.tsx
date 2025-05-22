"use client"

import { render, act } from "@testing-library/react"
import { CartProvider, useCart } from "@/context/cart-context"
import { toast } from "@/components/ui/use-toast"

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

// Test component that uses the cart context
const TestComponent = () => {
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartCount, getCartTotal } = useCart()

  return (
    <div>
      <div data-testid="cart-count">{getCartCount()}</div>
      <div data-testid="cart-total">{getCartTotal()}</div>
      <button
        data-testid="add-item"
        onClick={() =>
          addToCart({
            id: 1,
            name: "Test Item",
            vendor: "Test Vendor",
            price: 10,
            quantity: 1,
            image: "/test.jpg",
          })
        }
      >
        Add Item
      </button>
      <button
        data-testid="add-item-with-error"
        onClick={() =>
          addToCart({
            id: 2,
            name: "Error Item",
            vendor: "Test Vendor",
            price: 15,
            quantity: 10, // Trying to add more than available
            image: "/test.jpg",
          })
        }
      >
        Add Error Item
      </button>
      <button data-testid="update-quantity" onClick={() => updateQuantity(1, 2)}>
        Update Quantity
      </button>
      <button data-testid="update-quantity-invalid" onClick={() => updateQuantity(1, 0)}>
        Update Invalid Quantity
      </button>
      <button data-testid="remove-item" onClick={() => removeFromCart(1)}>
        Remove Item
      </button>
      <button data-testid="clear-cart" onClick={() => clearCart()}>
        Clear Cart
      </button>
      <ul>
        {cartItems.map((item) => (
          <li key={item.id} data-testid={`item-${item.id}`}>
            {item.name} - {item.quantity}
          </li>
        ))}
      </ul>
    </div>
  )
}

describe("CartContext", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()

    // Mock fetch for food items
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, quantity: 5 },
        { id: 2, quantity: 5 },
      ],
    })
  })

  test("initializes with empty cart", () => {
    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    expect(getByTestId("cart-count").textContent).toBe("0")
    expect(getByTestId("cart-total").textContent).toBe("0")
  })

  test("loads cart from localStorage on initial render", () => {
    // Set up localStorage with cart items
    const cartItems = [{ id: 1, name: "Test Item", vendor: "Test Vendor", price: 10, quantity: 2, image: "/test.jpg" }]
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(cartItems))

    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    expect(getByTestId("cart-count").textContent).toBe("2")
    expect(getByTestId("cart-total").textContent).toBe("20")
    expect(getByTestId("item-1")).toBeInTheDocument()
  })

  test("adds item to cart", async () => {
    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    await act(async () => {
      getByTestId("add-item").click()
    })

    expect(getByTestId("cart-count").textContent).toBe("1")
    expect(getByTestId("cart-total").textContent).toBe("10")
    expect(getByTestId("item-1")).toBeInTheDocument()
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Added to cart!" }))
  })

  test("handles quantity exceeded error when adding to cart", async () => {
    // Mock fetch to return limited quantity
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, quantity: 5 },
        { id: 2, quantity: 5 }, // Only 5 available, but trying to add 10
      ],
    })

    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    await act(async () => {
      getByTestId("add-item-with-error").click()
    })

    // Should show error toast
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Quantity Exceeded",
        variant: "destructive",
      }),
    )
  })

  test("handles API error when adding to cart", async () => {
    // Mock fetch to fail
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API error"))

    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    await act(async () => {
      getByTestId("add-item").click()
    })

    // Cart should remain empty
    expect(getByTestId("cart-count").textContent).toBe("0")
  })

  test("updates quantity of item in cart", () => {
    // Set up localStorage with cart items
    const cartItems = [{ id: 1, name: "Test Item", vendor: "Test Vendor", price: 10, quantity: 1, image: "/test.jpg" }]
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(cartItems))

    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    act(() => {
      getByTestId("update-quantity").click()
    })

    expect(getByTestId("cart-count").textContent).toBe("2")
    expect(getByTestId("cart-total").textContent).toBe("20")
    expect(getByTestId("item-1").textContent).toContain("2")
  })

  test("ignores invalid quantity updates", () => {
    // Set up localStorage with cart items
    const cartItems = [{ id: 1, name: "Test Item", vendor: "Test Vendor", price: 10, quantity: 1, image: "/test.jpg" }]
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(cartItems))

    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    act(() => {
      getByTestId("update-quantity-invalid").click()
    })

    // Quantity should remain unchanged
    expect(getByTestId("cart-count").textContent).toBe("1")
    expect(getByTestId("item-1").textContent).toContain("1")
  })

  test("removes item from cart", () => {
    // Set up localStorage with cart items
    const cartItems = [{ id: 1, name: "Test Item", vendor: "Test Vendor", price: 10, quantity: 1, image: "/test.jpg" }]
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(cartItems))

    const { getByTestId, queryByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    act(() => {
      getByTestId("remove-item").click()
    })

    expect(getByTestId("cart-count").textContent).toBe("0")
    expect(getByTestId("cart-total").textContent).toBe("0")
    expect(queryByTestId("item-1")).not.toBeInTheDocument()
  })

  test("clears cart", () => {
    // Set up localStorage with cart items
    const cartItems = [
      { id: 1, name: "Test Item", vendor: "Test Vendor", price: 10, quantity: 1, image: "/test.jpg" },
      { id: 2, name: "Another Item", vendor: "Test Vendor", price: 15, quantity: 2, image: "/test2.jpg" },
    ]
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(cartItems))

    const { getByTestId, queryByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    act(() => {
      getByTestId("clear-cart").click()
    })

    expect(getByTestId("cart-count").textContent).toBe("0")
    expect(getByTestId("cart-total").textContent).toBe("0")
    expect(queryByTestId("item-1")).not.toBeInTheDocument()
    expect(queryByTestId("item-2")).not.toBeInTheDocument()
  })

  test("adds quantity to existing item", async () => {
    // Set up localStorage with cart items
    const cartItems = [{ id: 1, name: "Test Item", vendor: "Test Vendor", price: 10, quantity: 1, image: "/test.jpg" }]
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(cartItems))

    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    await act(async () => {
      getByTestId("add-item").click()
    })

    expect(getByTestId("cart-count").textContent).toBe("2")
    expect(getByTestId("cart-total").textContent).toBe("20")
    expect(getByTestId("item-1").textContent).toContain("2")
  })

  test("saves cart to localStorage when it changes", () => {
    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    act(() => {
      getByTestId("add-item").click()
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("cart", expect.any(String))
    const savedCart = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
    expect(savedCart).toHaveLength(1)
    expect(savedCart[0].id).toBe(1)
    expect(savedCart[0].quantity).toBe(1)
  })

  test("handles localStorage errors", () => {
    // Mock localStorage.getItem to throw an error
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw new Error("localStorage error")
    })

    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    // Should initialize with empty cart despite the error
    expect(getByTestId("cart-count").textContent).toBe("0")
  })

  test("handles adding item with invalid response from API", async () => {
    // Mock fetch to return invalid response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid response" }),
    })

    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    await act(async () => {
      getByTestId("add-item").click()
    })

    // Cart should remain empty
    expect(getByTestId("cart-count").textContent).toBe("0")
  })

  test("handles adding item when item not found in API response", async () => {
    // Mock fetch to return empty array
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    await act(async () => {
      getByTestId("add-item").click()
    })

    // Cart should remain empty
    expect(getByTestId("cart-count").textContent).toBe("0")
  })
})
