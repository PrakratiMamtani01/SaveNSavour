import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import FoodDetailPage from "@/app/food/[id]/page"
import { CartProvider } from "@/context/cart-context"
import { toast } from "@/components/ui/use-toast"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useParams: jest.fn(() => ({
    id: "1",
  })),
}))

// Mock toast
jest.mock("@/components/ui/use-toast", () => ({
  toast: jest.fn(),
}))

// Mock fetch API
global.fetch = jest.fn()

describe("Add to Cart Functionality", () => {
  // Setup common mocks
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful fetch response with food item details
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "1",
        name: "Assorted Pastry Box",
        vendor: "Sweet Delights Bakery",
        vendorId: "v1",
        originalPrice: 75,
        discountedPrice: 30,
        image: "/placeholder.svg",
        distance: "1.2 km",
        cuisine: "Bakery",
        dietary: ["Vegetarian"],
        pickupTime: "Today, 5-7 PM",
        rating: 4.5,
        description: "A delicious assortment of freshly baked pastries.",
        address: "Shop 12, Al Wasl Road, Jumeirah, Dubai",
        quantity: 5,
        pickupTimeSlots: [
          { day: "Today", startTime: "5:00 PM", endTime: "6:00 PM" },
          { day: "Today", startTime: "6:00 PM", endTime: "7:00 PM" },
        ],
      }),
    })
  })

  // Test 1: Main Success Scenario - Add item to cart
  test("successfully adds item to cart", async () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )

    // Wait for food item to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Select pickup time
    const timeSlot = await screen.findByLabelText(/Today, 5:00 PM - 6:00 PM/i)
    fireEvent.click(timeSlot)

    // Add to cart
    const addToCartButton = screen.getByRole("button", { name: /add to cart/i })
    fireEvent.click(addToCartButton)

    // Check if toast was called with success message
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Added to cart!",
      }),
    )
  })

  // Test 2: Alternative Scenario - Insufficient Inventory
  test("handles insufficient inventory when adding to cart", async () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )

    // Wait for food item to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Try to increase quantity beyond available
    const increaseButton = screen.getAllByRole("button", { name: "+" })[0]

    // Click multiple times to exceed available quantity (5)
    for (let i = 0; i < 10; i++) {
      fireEvent.click(increaseButton)
    }

    // Check that quantity is limited to available amount
    const quantityElement = screen.getByText("5", { exact: true })
    expect(quantityElement).toBeInTheDocument()
  })

  // Test 3: Error when no pickup time is selected
  test("shows error when trying to add to cart without selecting pickup time", async () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )

    // Wait for food item to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Add to cart without selecting pickup time
    const addToCartButton = screen.getByRole("button", { name: /add to cart/i })
    fireEvent.click(addToCartButton)

    // Check if toast was called with error message
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Please select a pickup time",
        variant: "destructive",
      }),
    )
  })

  // Test 4: Quantity adjustment
  test("allows adjusting quantity within available limits", async () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )

    // Wait for food item to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Initial quantity should be 1
    expect(screen.getByText("1", { exact: true })).toBeInTheDocument()

    // Increase quantity
    const increaseButton = screen.getAllByRole("button", { name: "+" })[0]
    fireEvent.click(increaseButton)

    // Check that quantity increased
    expect(screen.getByText("2", { exact: true })).toBeInTheDocument()

    // Decrease quantity
    const decreaseButton = screen.getAllByRole("button", { name: "-" })[0]
    fireEvent.click(decreaseButton)

    // Check that quantity decreased
    expect(screen.getByText("1", { exact: true })).toBeInTheDocument()

    // Try to decrease below 1
    fireEvent.click(decreaseButton)

    // Check that quantity remains at 1
    expect(screen.getByText("1", { exact: true })).toBeInTheDocument()
  })

  // Test 5: Error handling when fetching food item fails
  test("handles error when fetching food item details", async () => {
    // Mock fetch error
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Failed to fetch"))

    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/food item not found/i)).toBeInTheDocument()
    })
  })
})
