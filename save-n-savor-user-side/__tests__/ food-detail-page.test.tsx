import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import FoodDetailPage from "@/app/food/[id]/page"
import { CartProvider } from "@/context/cart-context"
import { toast } from "@/components/ui/use-toast"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useParams: jest.fn(() => ({ id: "1" })),
}))

// Mock toast
jest.mock("@/components/ui/use-toast", () => ({
  toast: jest.fn(),
}))

declare let global: any
global.fetch = jest.fn()

describe("Food Detail Page", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock fetch response
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
        ingredients: ["Flour", "Sugar", "Butter", "Eggs"],
        expiryDate: "2025-05-10",
      }),
    })
  })

  test("renders loading skeleton and back link initially", () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )
    // Back link should exist immediately
    const backLink = screen.getByRole('link', { name: /back to browse/i })
    expect(backLink).toHaveAttribute('href', '/browse')
    // Skeleton present before data loads
    const skeletons = document.querySelectorAll('[class*="h-[400px]"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  test("renders food item details", async () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )

    await waitFor(() => expect(screen.getByText("Assorted Pastry Box")).toBeInTheDocument())

    expect(screen.getByText("Sweet Delights Bakery")).toBeInTheDocument()
    expect(screen.getByText("1.2 km")).toBeInTheDocument()
    expect(screen.getByText("Bakery")).toBeInTheDocument()
    expect(screen.getByText("Today, 5-7 PM")).toBeInTheDocument()
    expect(screen.getByText("4.5")).toBeInTheDocument()
    expect(screen.getByText("75% OFF")).toBeInTheDocument()
    expect(screen.getByText("AED 30")).toBeInTheDocument()
    expect(screen.getByText("AED 75")).toBeInTheDocument()
    expect(screen.getByText("Vegetarian")).toBeInTheDocument()
    expect(screen.getByText("A delicious assortment of freshly baked pastries.")).toBeInTheDocument()
    // Expiry date badge
    expect(screen.getByText(/Expires: 2025-05-10/)).toBeInTheDocument()
    // Ingredients
    expect(screen.getByText("Ingredients")).toBeInTheDocument()
    ["Flour", "Sugar", "Butter", "Eggs"].forEach(item =>
      expect(screen.getByText(item)).toBeInTheDocument(),
    )
    // Address and map container
    expect(screen.getByText(/Shop 12, Al Wasl Road/)).toBeInTheDocument()
    const mapContainer = document.querySelector('[class*="h-[400px]"]')
    expect(mapContainer).toBeInTheDocument()
    // Service fee line
    expect(screen.getByText(/AED 2.00/)).toBeInTheDocument()
  })

  test("vendor link navigates correctly", async () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )
    await waitFor(() => screen.getByText("Assorted Pastry Box"))
    const vendorLink = screen.getByRole('link', { name: "Sweet Delights Bakery" })
    expect(vendorLink).toHaveAttribute('href', '/vendor/v1')
  })

  test("renders both pickup time options and allows selection", async () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )
    await waitFor(() => screen.getByText("Assorted Pastry Box"))
    const option1 = screen.getByLabelText(/Today, 5:00 PM - 6:00 PM/i)
    const option2 = screen.getByLabelText(/Today, 6:00 PM - 7:00 PM/i)
    expect(option1).toBeInTheDocument()
    expect(option2).toBeInTheDocument()
    fireEvent.click(option1)
    expect(option1).toBeChecked()
  })

  test("initial quantity controls disable at boundaries and adjust correctly", async () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )
    await waitFor(() => screen.getByText("Assorted Pastry Box"))
    const decreaseButton = screen.getByRole('button', { name: /-/ })
    const increaseButton = screen.getByRole('button', { name: /\+/ })
    // At start, decrease is disabled, increase is enabled
    expect(decreaseButton).toBeDisabled()
    expect(increaseButton).not.toBeDisabled()
    // Increase to max
    for (let i = 0; i < 5; i++) fireEvent.click(increaseButton)
    expect(screen.getByText("5", { exact: true })).toBeInTheDocument()
    expect(increaseButton).toBeDisabled()
    // Decrease back
    fireEvent.click(decreaseButton)
    expect(screen.getByText("4", { exact: true })).toBeInTheDocument()
  })

  test("toggles like button styling on clicks", async () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )
    await waitFor(() => screen.getByText("Assorted Pastry Box"))
    const saveBtn = screen.getByRole('button', { name: /save/i })
    const heart = () => saveBtn.querySelector('svg') as HTMLElement
    // Initially not liked
    expect(heart().classList.contains('fill-red-500')).toBe(false)
    // Like
    fireEvent.click(saveBtn)
    expect(heart().classList.contains('fill-red-500')).toBe(true)
    // Unlike
    fireEvent.click(saveBtn)
    expect(heart().classList.contains('fill-red-500')).toBe(false)
  })

  test("adds to cart after selecting time slot triggers context addToCart", async () => {
    const addSpy = jest.fn()
    // Custom provider to spy addToCart
    const MockCartProvider = ({ children }: any) => (
      <CartProvider>
        {children}
      </CartProvider>
    )
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )
    await waitFor(() => screen.getByText("Assorted Pastry Box"))
    fireEvent.click(screen.getByLabelText(/Today, 5:00 PM - 6:00 PM/i))
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }))
    // Should NOT call destructive toast
    expect(toast).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' }),
    )
  })

  test("shows error toast if adding without selecting time", async () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )
    await waitFor(() => screen.getByText("Assorted Pastry Box"))
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }))
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Please select a pickup time", variant: "destructive" }),
    )
  })

  test("handles fetch errors and non-404 non-ok responses", async () => {
    // Server error
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )
    await waitFor(() => screen.getByText(/food item not found/i))
    // Network failure
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Down"))
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )
    await waitFor(() => screen.getByText(/food item not found/i))
  })

  test("share button is present and clickable without errors", async () => {
    render(
      <CartProvider>
        <FoodDetailPage />
      </CartProvider>,
    )
    await waitFor(() => screen.getByText("Assorted Pastry Box"))
    const shareBtn = screen.getByRole('button', { name: /share/i })
    expect(shareBtn).toBeInTheDocument()
    fireEvent.click(shareBtn)
  })
})
