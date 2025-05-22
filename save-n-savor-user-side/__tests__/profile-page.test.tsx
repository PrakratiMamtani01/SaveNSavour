import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ProfilePage from "@/app/profile/page"
import { useRouter } from "next/navigation"

// Mock the next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

// Mock fetch API
global.fetch = jest.fn()

describe("ProfilePage - Orders Tab", () => {
  // Setup common mocks
  beforeEach(() => {
    // Mock localStorage
    const mockUser = {
      _id: "user123",
      name: "Test User",
      email: "test@example.com",
      orders: [
        {
          orderId: "ORD-12345678",
          date: "2023-05-15T10:30:00Z",
          status: "confirmed",
          items: [
            { name: "Assorted Pastry Box", quantity: 2, price: 30, vendor: "Sweet Delights Bakery" },
            { name: "Fresh Fruit Basket", quantity: 1, price: 20, vendor: "Green Market Grocery" },
          ],
          total: 80,
          subtotal: 78,
          serviceFee: 2,
          pickupAddress: "Sweet Delights Bakery, Dubai, UAE",
          pickupTime: "Today, 5-7 PM",
          impact: { foodSaved: 1.5, co2Saved: 3.75 },
        },
      ],
    }

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => JSON.stringify(mockUser)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })

    // Mock router
    const mockRouter = { push: jest.fn() }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    // Mock fetch response for orders
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ orders: mockUser.orders }),
    })
  })

  // Test 1: Renders the orders tab correctly
  test("renders the orders tab and displays order history heading", async () => {
    render(<ProfilePage />)

    // Click on the Orders tab
    const ordersTab = screen.getByRole("tab", { name: /orders/i })
    userEvent.click(ordersTab)

    // Check if the order history heading is displayed
    await waitFor(() => {
      expect(screen.getByText("Order History")).toBeInTheDocument()
      expect(screen.getByText("View your recent orders")).toBeInTheDocument()
    })
  })

  // Test 2: Displays orders when they exist
  test("displays user orders when they exist", async () => {
    render(<ProfilePage />)

    // Click on the Orders tab
    const ordersTab = screen.getByRole("tab", { name: /orders/i })
    userEvent.click(ordersTab)

    // Check if order details are displayed
    await waitFor(() => {
      expect(screen.getByText("ORD-12345678")).toBeInTheDocument()
      expect(screen.getByText("2x Assorted Pastry Box")).toBeInTheDocument()
      expect(screen.getByText("1x Fresh Fruit Basket")).toBeInTheDocument()
      expect(screen.getByText("Total: AED 80.00")).toBeInTheDocument()
    })
  })

  // Test 3: Shows empty state when no orders exist
  test("displays empty state when no orders exist", async () => {
    // Override localStorage to return user with no orders
    const mockUserNoOrders = {
      _id: "user123",
      name: "Test User",
      email: "test@example.com",
      orders: [],
    }

    const getItemMock = jest.spyOn(window.localStorage, "getItem")
    getItemMock.mockReturnValueOnce(JSON.stringify(mockUserNoOrders))
    // Mock fetch to return empty orders array
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ orders: [] }),
    })

    render(<ProfilePage />)

    // Click on the Orders tab
    const ordersTab = screen.getByRole("tab", { name: /orders/i })
    userEvent.click(ordersTab)

    // Check if empty state message is displayed
    await waitFor(() => {
      expect(screen.getByText("You haven't placed any orders yet.")).toBeInTheDocument()
      expect(screen.getByRole("link", { name: /browse food/i })).toBeInTheDocument()
    })
  })

  // Test 4: Correctly formats dates and prices
  test("correctly formats order date and price", async () => {
    render(<ProfilePage />)

    // Click on the Orders tab
    const ordersTab = screen.getByRole("tab", { name: /orders/i })
    userEvent.click(ordersTab)

    // Check if date and price are formatted correctly
    await waitFor(() => {
      // May 15, 2023 is the expected formatted date for '2023-05-15T10:30:00Z'
      expect(screen.getByText(/May 15, 2023/)).toBeInTheDocument()
      expect(screen.getByText("Total: AED 80.00")).toBeInTheDocument()
    })
  })

  // Test 5: Displays correct badge color based on order status
  test("displays correct badge color based on order status", async () => {
    render(<ProfilePage />)

    // Click on the Orders tab
    const ordersTab = screen.getByRole("tab", { name: /orders/i })
    userEvent.click(ordersTab)

    // Check if the badge has the correct class for 'confirmed' status
    await waitFor(() => {
      const badge = screen.getByText("Confirmed")
      expect(badge).toHaveClass("bg-blue-100")
      expect(badge).toHaveClass("text-blue-600")
    })
  })
})
