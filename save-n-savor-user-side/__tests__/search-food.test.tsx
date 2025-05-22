import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import BrowsePage from "@/app/browse/page"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}))

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}
global.navigator.geolocation = mockGeolocation

// Mock fetch API
global.fetch = jest.fn()

describe("Food Search Functionality", () => {
  // Setup common mocks
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock successful fetch response with food items
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: "Assorted Pastry Box",
          vendor: "Sweet Delights Bakery",
          originalPrice: 75,
          discountedPrice: 30,
          image: "/placeholder.svg",
          distance: "1.2 km",
          cuisine: "Bakery",
          dietary: ["Vegetarian"],
          pickupTime: "Today, 5-7 PM",
          rating: 4.5,
          lat: 25.197197,
          lng: 55.274376,
        },
        {
          id: 2,
          name: "Mediterranean Lunch Box",
          vendor: "Olive Garden Restaurant",
          originalPrice: 60,
          discountedPrice: 25,
          image: "/placeholder.svg",
          distance: "0.8 km",
          cuisine: "Mediterranean",
          dietary: ["Vegan Options"],
          pickupTime: "Today, 2-4 PM",
          rating: 4.2,
          lat: 25.198765,
          lng: 55.269876,
        },
      ],
    })

    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({ coords: { latitude: 25.2048, longitude: 55.2708 } }),
    )
  })

  // Test 1: Main Success Scenario - Search and find food
  test("successfully searches and displays food items", async () => {
    render(<BrowsePage />)

    // Wait for food items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
      expect(screen.getByText("Mediterranean Lunch Box")).toBeInTheDocument()
    })

    // Test search functionality
    const searchInput = screen.getByPlaceholderText(/search for food/i)
    fireEvent.change(searchInput, { target: { value: "pastry" } })

    // Check that only the matching item is displayed
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
      expect(screen.queryByText("Mediterranean Lunch Box")).not.toBeInTheDocument()
    })
  })

  // Test 2: Alternative Scenario 1 - Location services disabled
  test("handles disabled location services", async () => {
    // Mock geolocation error
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) =>
      error({ code: 1, message: "User denied geolocation" }),
    )

    render(<BrowsePage />)

    // Check if default location is used
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      // Verify food items still load with default location
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })
  })

  // Test 3: Alternative Scenario 2 - No food options available
  test("handles no food options available", async () => {
    // Mock empty response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<BrowsePage />)

    // Check for no results message
    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /reset filters/i })).toBeInTheDocument()
    })
  })

  // Test 4: Error Course - System failure
  test("handles system failure when fetching food items", async () => {
    // Mock fetch error
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Failed to fetch"))

    render(<BrowsePage />)

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to load food items/i)).toBeInTheDocument()
    })
  })

  // Test 5: Filter functionality
  test("filters food items by cuisine and dietary preferences", async () => {
    render(<BrowsePage />)

    // Wait for food items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Open filters
    const filterButton = screen.getByRole("button", { name: /filters/i })
    fireEvent.click(filterButton)

    // Select cuisine filter (assuming the filter sheet is open)
    const cuisineSelect = await screen.findByRole("combobox")
    fireEvent.change(cuisineSelect, { target: { value: "Bakery" } })

    // Apply filters
    const applyButton = screen.getByRole("button", { name: /apply filters/i })
    fireEvent.click(applyButton)

    // Check that only bakery items are displayed
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
      expect(screen.queryByText("Mediterranean Lunch Box")).not.toBeInTheDocument()
    })
  })

  // Test 6: Map view toggle
  test("toggles between list and map views", async () => {
    render(<BrowsePage />)

    // Wait for food items to load
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })

    // Switch to map view
    const mapViewTab = screen.getByRole("tab", { name: /map view/i })
    fireEvent.click(mapViewTab)

    // Check that map is displayed
    await waitFor(() => {
      expect(screen.getByText(/food locations/i)).toBeInTheDocument()
    })

    // Switch back to list view
    const listViewTab = screen.getByRole("tab", { name: /list view/i })
    fireEvent.click(listViewTab)

    // Check that list is displayed again
    await waitFor(() => {
      expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument()
    })
  })
})
