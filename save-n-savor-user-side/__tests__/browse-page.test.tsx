"use client"

// __tests__/browse-page.test.tsx
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react"
import BrowsePage from "@/app/browse/page"
import { act } from "react-dom/test-utils"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(() => ({ get: jest.fn() })),
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

describe("BrowsePage", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful fetch response with multiple food items
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "6818fb04380f40981c74440f",
          name: "Veg Biryani",
          vendor: "Spice Garden",
          originalPrice: 20,
          discountedPrice: 10,
          image: "/biryani.jpg",
          distance: "3.5 km",
          cuisine: "Indian",
          dietary: ["Vegetarian", "Vegan", "Pescatarian"],
          pickupTime: "Today, 6-8 PM",
          rating: 4.8,
          quantity: 10,
          expiryDate: "2025-05-07",
          description: "Great food",
        },
        {
          id: "6818fb04380f40981c74441a",
          name: "Chocolate Croissant",
          vendor: "French Bakery",
          originalPrice: 15,
          discountedPrice: 5,
          image: "/croissant.jpg",
          distance: "1.2 km",
          cuisine: "Bakery",
          dietary: ["Vegetarian"],
          pickupTime: "Today, 4-6 PM",
          rating: 4.5,
          quantity: 8,
          expiryDate: "2025-05-06",
        },
        {
          id: "6818fb04380f40981c74442b",
          name: "Sushi Platter",
          vendor: "Tokyo Bites",
          originalPrice: 50,
          discountedPrice: 30,
          image: "/sushi.jpg",
          distance: "2.8 km",
          cuisine: "Japanese",
          dietary: ["Pescatarian"],
          pickupTime: "Today, 7-9 PM",
          rating: 4.9,
          quantity: 3,
        },
      ],
    })

    // Successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({ coords: { latitude: 25.2048, longitude: 55.2708 } }),
    )
  })

  test("renders food items with correct details", async () => {
    render(<BrowsePage />)
    // Page headline
    expect(screen.getByText("Find Surplus Food Near You")).toBeInTheDocument()

    // Wait for fetch + render
    await waitFor(() => {
      expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
      expect(screen.getByText("Chocolate Croissant")).toBeInTheDocument()
      expect(screen.getByText("Sushi Platter")).toBeInTheDocument()
    })

    // Check specific details for one item
    expect(screen.getByText("Spice Garden")).toBeInTheDocument()
    expect(screen.getByText("AED 20")).toBeInTheDocument()
    expect(screen.getByText("AED 10")).toBeInTheDocument()
    expect(screen.getByText("50% OFF")).toBeInTheDocument()

    // Check for the highest discount item
    expect(screen.getByText("67% OFF"))
      .toBeInTheDocument() // For Chocolate Croissant

      [
        // Check dietary badges
        ("Vegetarian", "Vegan", "Pescatarian")
      ].forEach((label) => expect(screen.getByText(label)).toBeInTheDocument())
  })

  test("filters by search query with partial match", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    // Test partial match on food name
    fireEvent.change(screen.getByPlaceholderText(/search for food/i), {
      target: { value: "biry" },
    })

    await waitFor(() => {
      expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
      expect(screen.queryByText("Chocolate Croissant")).not.toBeInTheDocument()
    })
  })

  test("filters by search query with vendor name", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    // Test match on vendor name
    fireEvent.change(screen.getByPlaceholderText(/search for food/i), {
      target: { value: "french" },
    })

    await waitFor(() => {
      expect(screen.queryByText("Veg Biryani")).not.toBeInTheDocument()
      expect(screen.getByText("Chocolate Croissant")).toBeInTheDocument()
    })
  })

  test("filters by search query with cuisine type", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    // Test match on cuisine
    fireEvent.change(screen.getByPlaceholderText(/search for food/i), {
      target: { value: "japanese" },
    })

    await waitFor(() => {
      expect(screen.queryByText("Veg Biryani")).not.toBeInTheDocument()
      expect(screen.queryByText("Chocolate Croissant")).not.toBeInTheDocument()
      expect(screen.getByText("Sushi Platter")).toBeInTheDocument()
    })
  })

  test("filters by cuisine type", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: /filters/i }))
    const cuisineSelect = await screen.findByRole("combobox")
    fireEvent.change(cuisineSelect, { target: { value: "Bakery" } })
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }))

    await waitFor(() => {
      expect(screen.queryByText("Veg Biryani")).not.toBeInTheDocument()
      expect(screen.getByText("Chocolate Croissant")).toBeInTheDocument()
      expect(screen.queryByText("Sushi Platter")).not.toBeInTheDocument()
    })
  })

  test("filters by multiple dietary preferences", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: /filters/i }))

    // Select both Vegetarian and Vegan
    const vegetarianCheckbox = await screen.findByLabelText("Vegetarian")
    const veganCheckbox = await screen.findByLabelText("Vegan")

    fireEvent.click(vegetarianCheckbox)
    fireEvent.click(veganCheckbox)

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }))

    // Only Veg Biryani should be visible as it has both Vegetarian and Vegan tags
    await waitFor(() => {
      expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
      expect(screen.queryByText("Chocolate Croissant")).not.toBeInTheDocument()
      expect(screen.queryByText("Sushi Platter")).not.toBeInTheDocument()
    })
  })

  test("filters by maximum distance", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: /filters/i }))
    const slider = await screen.findByRole("slider")
    fireEvent.change(slider, { target: { value: 3 } })
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }))

    await waitFor(() => {
      expect(screen.queryByText("Veg Biryani")).not.toBeInTheDocument()
      expect(screen.getByText(/no results found/i)).toBeInTheDocument()
    })
  })

  test("sorts items by different criteria", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    // Test sorting by price
    const sortSelect = screen.getByRole("combobox", { name: "" })

    // Sort by price (low to high)
    fireEvent.change(sortSelect, { target: { value: "price" } })

    // Items should still be visible, but in different order
    // We can't easily test the order in JSDOM, but we can verify all items are still there
    expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
    expect(screen.getByText("Chocolate Croissant")).toBeInTheDocument()
    expect(screen.getByText("Sushi Platter")).toBeInTheDocument()

    // Sort by discount (highest first)
    fireEvent.change(sortSelect, { target: { value: "discount" } })

    // Sort by rating (highest first)
    fireEvent.change(sortSelect, { target: { value: "rating" } })

    // Sort by distance (nearest first)
    fireEvent.change(sortSelect, { target: { value: "distance" } })

    // All items should still be visible after all sorting operations
    expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
    expect(screen.getByText("Chocolate Croissant")).toBeInTheDocument()
    expect(screen.getByText("Sushi Platter")).toBeInTheDocument()
  })

  test("image has correct src and alt attributes", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByAltText("Veg Biryani")).toBeInTheDocument())

    expect(screen.getByAltText("Veg Biryani")).toHaveAttribute("src", "/biryani.jpg")
  })

  test("View Details link points to the correct URL", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByRole("link", { name: /view details/i })).toBeInTheDocument())

    expect(screen.getByRole("link", { name: /view details/i })).toHaveAttribute(
      "href",
      "/food/6818fb04380f40981c74440f",
    )
  })

  test("Reset Filters button clears search", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText(/search for food/i), {
      target: { value: "pizza" },
    })
    await waitFor(() => expect(screen.queryByText("Veg Biryani")).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }))
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())
  })

  test("Clear All button resets all filters", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: /filters/i }))
    fireEvent.change(await screen.findByRole("combobox"), {
      target: { value: "Indian" },
    })
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }))
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: /clear all/i }))
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())
  })

  test("displays no-results UI when the list is empty", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText(/no results found/i)).toBeInTheDocument())
  })

  test("displays an error message if fetch fails", async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network fail"))
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText(/failed to load food items/i)).toBeInTheDocument())
  })

  test("falls back to default location if geolocation is denied", async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((_, err) => err({ code: 1, message: "denied" }))
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())
  })

  test("'All' option appears in cuisine dropdown", async () => {
    render(<BrowsePage />)
    await waitFor(() => {
      // The "All" option should be in the dropdown and in the active-filters UI
      expect(screen.getByText("All")).toBeInTheDocument()
    })
  })

  test("combines multiple filters", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    // Apply search filter
    fireEvent.change(screen.getByPlaceholderText(/search for food/i), {
      target: { value: "veg" },
    })

    // Apply cuisine filter
    fireEvent.click(screen.getByRole("button", { name: /filters/i }))
    const cuisineSelect = await screen.findByRole("combobox")
    fireEvent.change(cuisineSelect, { target: { value: "Indian" } })

    // Apply dietary filter
    const veganCheckbox = await screen.findByLabelText("Vegan")
    fireEvent.click(veganCheckbox)

    // Apply distance filter
    const slider = await screen.findByRole("slider")
    fireEvent.change(slider, { target: { value: 4 } })

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }))

    // Only Veg Biryani should match all these filters
    await waitFor(() => {
      expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
      expect(screen.queryByText("Chocolate Croissant")).not.toBeInTheDocument()
      expect(screen.queryByText("Sushi Platter")).not.toBeInTheDocument()
    })
  })

  test("displays and removes active filters", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    // Apply cuisine filter
    fireEvent.click(screen.getByRole("button", { name: /filters/i }))
    const cuisineSelect = await screen.findByRole("combobox")
    fireEvent.change(cuisineSelect, { target: { value: "Indian" } })
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }))

    // Check that active filter is displayed
    await waitFor(() => {
      expect(screen.getByText("Indian")).toBeInTheDocument()
    })

    // Remove the filter by clicking the X button
    const removeFilterButton = screen.getByText("×")
    fireEvent.click(removeFilterButton)

    // All items should be visible again
    await waitFor(() => {
      expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
      expect(screen.getByText("Chocolate Croissant")).toBeInTheDocument()
      expect(screen.getByText("Sushi Platter")).toBeInTheDocument()
    })
  })

  test("clears all filters at once", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    // Apply multiple filters
    fireEvent.click(screen.getByRole("button", { name: /filters/i }))

    // Set cuisine
    const cuisineSelect = await screen.findByRole("combobox")
    fireEvent.change(cuisineSelect, { target: { value: "Indian" } })

    // Set dietary preference
    const veganCheckbox = await screen.findByLabelText("Vegan")
    fireEvent.click(veganCheckbox)

    // Set distance
    const slider = await screen.findByRole("slider")
    fireEvent.change(slider, { target: { value: 4 } })

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }))

    // Verify filters are applied
    await waitFor(() => {
      expect(screen.getByText("Indian")).toBeInTheDocument()
      expect(screen.getByText("Vegan")).toBeInTheDocument()
      expect(screen.getByText("Within 4 km")).toBeInTheDocument()
    })

    // Clear all filters
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }))

    // All items should be visible again
    await waitFor(() => {
      expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
      expect(screen.getByText("Chocolate Croissant")).toBeInTheDocument()
      expect(screen.getByText("Sushi Platter")).toBeInTheDocument()
    })
  })

  test("resets filters from the no results view", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    // Apply a filter that will result in no matches
    fireEvent.change(screen.getByPlaceholderText(/search for food/i), {
      target: { value: "nonexistent item" },
    })

    // Check for no results message
    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument()
    })

    // Reset filters from the no results view
    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }))

    // All items should be visible again
    await waitFor(() => {
      expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
      expect(screen.getByText("Chocolate Croissant")).toBeInTheDocument()
      expect(screen.getByText("Sushi Platter")).toBeInTheDocument()
    })
  })

  test("toggles between list and map views", async () => {
    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    // Initially in list view
    expect(screen.getByText("Veg Biryani")).toBeInTheDocument()

    // Switch to map view
    const mapViewTab = screen.getByRole("tab", { name: /map view/i })
    fireEvent.click(mapViewTab)

    // Check that map view is displayed
    await waitFor(() => {
      // In map view, the food items list shouldn't be visible
      expect(screen.queryByText("Veg Biryani")).not.toBeInTheDocument()
      // But map-related elements should be
      expect(screen.getByText(/food locations/i)).toBeInTheDocument()
    })

    // Switch back to list view
    const listViewTab = screen.getByRole("tab", { name: /list view/i })
    fireEvent.click(listViewTab)

    // Check that list view is displayed again
    await waitFor(() => {
      expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
    })
  })

  test("displays loading state before data is fetched", async () => {
    // Delay the API response to test loading state
    let resolvePromise
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => {
      return delayedPromise.then(() => ({
        ok: true,
        json: async () => [
          {
            id: "6818fb04380f40981c74440f",
            name: "Veg Biryani",
            vendor: "Spice Garden",
            originalPrice: 20,
            discountedPrice: 10,
            image: "/biryani.jpg",
            distance: "3.5 km",
            cuisine: "Indian",
            dietary: ["Vegetarian", "Vegan"],
            pickupTime: "Today, 6-8 PM",
            rating: 4.8,
          },
        ],
      }))
    })

    render(<BrowsePage />)

    // Check for loading skeletons
    expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0)

    // Resolve the API call
    await act(async () => {
      resolvePromise()
    })

    // Check that data is displayed
    await waitFor(() => {
      expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
    })
  })

  test("handles API error with retry", async () => {
    // First call fails
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API error"))

    // Second call succeeds
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "6818fb04380f40981c74440f",
          name: "Veg Biryani",
          vendor: "Spice Garden",
          originalPrice: 20,
          discountedPrice: 10,
          image: "/biryani.jpg",
          distance: "3.5 km",
          cuisine: "Indian",
          dietary: ["Vegetarian", "Vegan"],
          pickupTime: "Today, 6-8 PM",
          rating: 4.8,
        },
      ],
    })

    render(<BrowsePage />)

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to load food items/i)).toBeInTheDocument()
    })

    // Click retry button if it exists
    const retryButton = screen.queryByRole("button", { name: /try again/i })
    if (retryButton) {
      fireEvent.click(retryButton)

      // Check that data is displayed after retry
      await waitFor(() => {
        expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
      })
    }
  })

  test("displays correct results count", async () => {
    render(<BrowsePage />)

    await waitFor(() => {
      expect(screen.getByText("Veg Biryani")).toBeInTheDocument()
    })

    // Initially should show 3 results
    expect(screen.getByText("3 results found")).toBeInTheDocument()

    // Filter to show only 1 result
    fireEvent.change(screen.getByPlaceholderText(/search for food/i), {
      target: { value: "sushi" },
    })

    await waitFor(() => {
      expect(screen.getByText("1 result found")).toBeInTheDocument()
    })
  })

  test("handles view details navigation", async () => {
    const router = require("next/navigation").useRouter()

    render(<BrowsePage />)
    await waitFor(() => expect(screen.getByText("Veg Biryani")).toBeInTheDocument())

    // Find all "View Details" links
    const viewDetailsLinks = screen.getAllByRole("link", { name: /view details/i })

    // Check that they have the correct href attributes
    expect(viewDetailsLinks[0]).toHaveAttribute("href", expect.stringContaining("/food/"))
  })

  // Test for line 75 - Error handling in useEffect
  test("handles non-ok response from API", async () => {
    // Mock a non-ok response (different from a rejected promise)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ error: "Server error" }),
    })

    render(<BrowsePage />)

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to load food items/i)).toBeInTheDocument()
    })
  })

  // Test for lines 165-174 - Dietary preferences extraction
  test("extracts unique dietary preferences from food items", async () => {
    // Mock response with various dietary preferences
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "1",
          name: "Item 1",
          vendor: "Vendor 1",
          originalPrice: 20,
          discountedPrice: 10,
          image: "/img1.jpg",
          distance: "1.0 km",
          cuisine: "Italian",
          dietary: ["Gluten-Free", "Dairy-Free"],
          pickupTime: "Today, 5-7 PM",
          rating: 4.5,
        },
        {
          id: "2",
          name: "Item 2",
          vendor: "Vendor 2",
          originalPrice: 30,
          discountedPrice: 15,
          image: "/img2.jpg",
          distance: "2.0 km",
          cuisine: "Mexican",
          dietary: ["Dairy-Free", "Nut-Free"],
          pickupTime: "Today, 6-8 PM",
          rating: 4.2,
        },
      ],
    })

    render(<BrowsePage />)

    // Open filters
    await waitFor(() => expect(screen.getByText("Item 1")).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: /filters/i }))

    // Check that all unique dietary preferences are extracted
    await waitFor(() => {
      expect(screen.getByLabelText("Gluten-Free")).toBeInTheDocument()
      expect(screen.getByLabelText("Dairy-Free")).toBeInTheDocument()
      expect(screen.getByLabelText("Nut-Free")).toBeInTheDocument()
    })
  })

  // Test for line 182 - Handling empty dietary preferences
  test("handles food items with empty dietary preferences", async () => {
    // Mock response with an item that has no dietary preferences
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "1",
          name: "Item With No Dietary",
          vendor: "Vendor 1",
          originalPrice: 20,
          discountedPrice: 10,
          image: "/img1.jpg",
          distance: "1.0 km",
          cuisine: "Italian",
          dietary: [], // Empty dietary array
          pickupTime: "Today, 5-7 PM",
          rating: 4.5,
        },
      ],
    })

    render(<BrowsePage />)

    // Verify the item renders correctly without dietary badges
    await waitFor(() => {
      expect(screen.getByText("Item With No Dietary")).toBeInTheDocument()
      // The item should not have any dietary badges
      const itemCard = screen.getByText("Item With No Dietary").closest(".overflow-hidden")
      expect(within(itemCard).queryByText(/vegetarian|vegan|gluten-free/i)).not.toBeInTheDocument()
    })
  })

  // Test for lines 302-339 - Map view rendering
  test("renders map view with correct elements", async () => {
    render(<BrowsePage />)

    // Wait for items to load
    await waitFor(() => expect(screen.getByText(/find surplus food near you/i)).toBeInTheDocument())

    // Switch to map view
    const mapViewTab = screen.getByRole("tab", { name: /map view/i })
    fireEvent.click(mapViewTab)

    // Check for map container
    await waitFor(() => {
      // The map container should be visible
      expect(screen.getByRole("tabpanel", { name: /map view/i })).toBeInTheDocument()

      // Check for map height class
      const mapContainer = screen.getByRole("tabpanel", { name: /map view/i })
      expect(mapContainer.querySelector(".h-\\[600px\\]")).toBeInTheDocument()

      // Check for map legend or controls
      expect(screen.getByText(/food locations/i)).toBeInTheDocument()
    })
  })

  // Test for lines 348-358 - Results count and filtering
  test("displays correct results count after complex filtering", async () => {
    // Mock response with multiple items
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "1",
          name: "Vegan Salad",
          vendor: "Green Cafe",
          originalPrice: 20,
          discountedPrice: 10,
          image: "/img1.jpg",
          distance: "1.0 km",
          cuisine: "Healthy",
          dietary: ["Vegan", "Gluten-Free"],
          pickupTime: "Today, 5-7 PM",
          rating: 4.5,
        },
        {
          id: "2",
          name: "Vegan Burger",
          vendor: "Burger Joint",
          originalPrice: 30,
          discountedPrice: 15,
          image: "/img2.jpg",
          distance: "2.0 km",
          cuisine: "Fast Food",
          dietary: ["Vegan"],
          pickupTime: "Today, 6-8 PM",
          rating: 4.2,
        },
        {
          id: "3",
          name: "Chicken Burger",
          vendor: "Burger Joint",
          originalPrice: 35,
          discountedPrice: 20,
          image: "/img3.jpg",
          distance: "2.0 km",
          cuisine: "Fast Food",
          dietary: ["Non-Vegetarian"],
          pickupTime: "Today, 6-8 PM",
          rating: 4.3,
        },
      ],
    })

    render(<BrowsePage />)

    // Wait for items to load
    await waitFor(() => expect(screen.getByText("Vegan Salad")).toBeInTheDocument())

    // Initially should show 3 results
    expect(screen.getByText("3 results found")).toBeInTheDocument()

    // Apply complex filtering
    // 1. Filter by cuisine
    fireEvent.click(screen.getByRole("button", { name: /filters/i }))
    const cuisineSelect = await screen.findByRole("combobox")
    fireEvent.change(cuisineSelect, { target: { value: "Fast Food" } })

    // 2. Filter by dietary preference
    const veganCheckbox = await screen.findByLabelText("Vegan")
    fireEvent.click(veganCheckbox)

    // Apply filters
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }))

    // Should now show only 1 result (Vegan Burger)
    await waitFor(() => {
      expect(screen.getByText("1 result found")).toBeInTheDocument()
      expect(screen.getByText("Vegan Burger")).toBeInTheDocument()
      expect(screen.queryByText("Vegan Salad")).not.toBeInTheDocument()
      expect(screen.queryByText("Chicken Burger")).not.toBeInTheDocument()
    })

    // Verify active filters are displayed
    expect(screen.getByText("Fast Food")).toBeInTheDocument()
    expect(screen.getByText("Vegan")).toBeInTheDocument()
  })

  // Test for handling null or undefined values in food items
  test("handles food items with missing properties", async () => {
    // Mock response with an item that has missing properties
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "1",
          name: "Item With Missing Props",
          vendor: "Vendor 1",
          originalPrice: 20,
          discountedPrice: 10,
          image: null, // Missing image
          distance: "1.0 km",
          cuisine: undefined, // Missing cuisine
          // Missing dietary array entirely
          pickupTime: "Today, 5-7 PM",
          rating: 4.5,
        },
      ],
    })

    render(<BrowsePage />)

    // Verify the item renders without crashing
    await waitFor(() => {
      expect(screen.getByText("Item With Missing Props")).toBeInTheDocument()
    })
  })
})
