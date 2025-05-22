"use client"

import { renderHook, act } from "@testing-library/react"
import { useUser } from "@/hooks/useUser"
import { jest } from "@jest/globals"

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

describe("useUser Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()
  })

  test("initializes with null user and hydrated false", () => {
    const { result } = renderHook(() => useUser())

    expect(result.current.user).toBeNull()
    expect(result.current.hydrated).toBe(false)
  })

  test("loads user from localStorage", async () => {
    const mockUser = {
      _id: "user123",
      name: "Test User",
      email: "test@example.com",
      addresses: [],
      paymentMethods: [],
    }

    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockUser))

    const { result, rerender } = renderHook(() => useUser())

    // Wait for the useEffect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    rerender()

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.hydrated).toBe(true)
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("user")
  })

  test("handles invalid JSON in localStorage", async () => {
    mockLocalStorage.getItem.mockReturnValueOnce("invalid-json")

    const { result, rerender } = renderHook(() => useUser())

    // Wait for the useEffect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    rerender()

    expect(result.current.user).toBeNull()
    expect(result.current.hydrated).toBe(true)
  })

  test("handles empty localStorage", async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(null)

    const { result, rerender } = renderHook(() => useUser())

    // Wait for the useEffect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    rerender()

    expect(result.current.user).toBeNull()
    expect(result.current.hydrated).toBe(true)
  })
})
