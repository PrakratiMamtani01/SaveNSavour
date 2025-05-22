import { render } from "@testing-library/react"
import BrowseLoading from "@/app/browse/loading"
import OrderConfirmationLoading from "@/app/order-confirmation/loading"

describe("Loading Components", () => {
  test("BrowseLoading component renders correctly", () => {
    const { container } = render(<BrowseLoading />)
    // The component returns null, so the container should be empty
    expect(container.firstChild).toBeNull()
  })

  test("OrderConfirmationLoading component renders correctly", () => {
    const { container } = render(<OrderConfirmationLoading />)
    // The component returns null, so the container should be empty
    expect(container.firstChild).toBeNull()
  })
})
