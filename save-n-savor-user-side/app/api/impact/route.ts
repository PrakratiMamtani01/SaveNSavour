import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongoose"
import User from "@/models/user"
import mongoose from "mongoose"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")
    const period = url.searchParams.get("period") || "all-time" // all-time, monthly, weekly

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId format:", userId)
      return NextResponse.json(
        {
          error: "Invalid userId format",
          message:
            "The provided user ID is not in a valid format. Please ensure you're logged in with a valid account.",
        },
        { status: 400 },
      )
    }

    await dbConnect()

    // Get the current user
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get all users to calculate ranking
    const allUsers = await User.find({})

    // Filter orders based on the selected period
    const now = new Date()
    const filteredOrders = user.orders.filter((order) => {
      const orderDate = new Date(order.date)
      if (period === "weekly") {
        // Orders from the last 7 days
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        return orderDate >= weekAgo
      } else if (period === "monthly") {
        // Orders from the last 30 days
        const monthAgo = new Date(now)
        monthAgo.setDate(now.getDate() - 30)
        return orderDate >= monthAgo
      }
      // All-time: return all orders
      return true
    })

    // Calculate user impact metrics
    const ordersPlaced = filteredOrders.length
    const foodSaved = filteredOrders.reduce((total, order) => total + (order.impact?.foodSaved || 0), 0)
    const co2Saved = filteredOrders.reduce((total, order) => total + (order.impact?.co2Saved || 0), 0)

    // Calculate money saved (original price - discounted price)
    const moneySaved = filteredOrders.reduce((total, order) => {
      const originalTotal = order.items.reduce((sum, item) => {
        // Assuming original price is 2.5x the discounted price
        const originalPrice = item.price * 2.5
        return sum + originalPrice * item.quantity
      }, 0)
      return total + (originalTotal - order.total)
    }, 0)

    // Calculate user rankings based on CO2 saved
    const userRankings = allUsers.map((u) => {
      // Filter orders based on the selected period for each user
      const userOrders = u.orders.filter((order) => {
        const orderDate = new Date(order.date)
        if (period === "weekly") {
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 7)
          return orderDate >= weekAgo
        } else if (period === "monthly") {
          const monthAgo = new Date(now)
          monthAgo.setDate(now.getDate() - 30)
          return orderDate >= monthAgo
        }
        return true
      })

      // Calculate total CO2 saved for this user
      const userCO2Saved = userOrders.reduce((total, order) => total + (order.impact?.co2Saved || 0), 0)

      return {
        userId: u._id.toString(),
        co2Saved: userCO2Saved,
      }
    })

    // Sort users by CO2 saved (descending)
    userRankings.sort((a, b) => b.co2Saved - a.co2Saved)

    // Find the current user's rank
    const userRank = userRankings.findIndex((u) => u.userId === userId) + 1
    const totalUsers = userRankings.length

    // Calculate achievement levels
    // Food Rescuer: Based on orders placed
    let foodRescuerLevel = 1
    let foodRescuerProgress = 0

    if (ordersPlaced >= 500) {
      foodRescuerLevel = 3
      foodRescuerProgress = 100
    } else if (ordersPlaced >= 50) {
      foodRescuerLevel = 2
      foodRescuerProgress = Math.min(100, Math.round(((ordersPlaced - 50) / 450) * 100))
    } else {
      foodRescuerLevel = 1
      foodRescuerProgress = Math.min(100, Math.round((ordersPlaced / 50) * 100))
    }

    // Eco Warrior: Based on CO2 saved
    // Level 1: 0-100kg, Level 2: 100-500kg, Level 3: 500kg+
    let ecoWarriorLevel = 1
    let ecoWarriorProgress = 0

    if (co2Saved >= 500) {
      ecoWarriorLevel = 3
      ecoWarriorProgress = 100
    } else if (co2Saved >= 100) {
      ecoWarriorLevel = 2
      ecoWarriorProgress = Math.min(100, Math.round(((co2Saved - 100) / 400) * 100))
    } else {
      ecoWarriorLevel = 1
      ecoWarriorProgress = Math.min(100, Math.round((co2Saved / 100) * 100))
    }

    // Regular Saver: Based on money saved
    // Level 1: 0-1000 AED, Level 2: 1000-5000 AED, Level 3: 5000+ AED
    let regularSaverLevel = 1
    let regularSaverProgress = 0

    if (moneySaved >= 5000) {
      regularSaverLevel = 3
      regularSaverProgress = 100
    } else if (moneySaved >= 1000) {
      regularSaverLevel = 2
      regularSaverProgress = Math.min(100, Math.round(((moneySaved - 1000) / 4000) * 100))
    } else {
      regularSaverLevel = 1
      regularSaverProgress = Math.min(100, Math.round((moneySaved / 1000) * 100))
    }

    // Prepare badges data
    const badges = [
      {
        name: "Food Rescuer",
        level: foodRescuerLevel,
        progress: foodRescuerProgress,
        description: "Awarded for rescuing food through orders",
      },
      {
        name: "Eco Warrior",
        level: ecoWarriorLevel,
        progress: ecoWarriorProgress,
        description: "Awarded for reducing CO₂ emissions",
      },
      {
        name: "Regular Saver",
        level: regularSaverLevel,
        progress: regularSaverProgress,
        description: "Awarded for saving money while reducing waste",
      },
    ]

    return NextResponse.json({
      ordersPlaced,
      foodSaved,
      co2Saved,
      moneySaved,
      rank: userRank,
      totalUsers,
      badges,
      period,
    })
  } catch (error) {
    console.error("Error fetching impact data:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: (error as Error).message,
        stack: (error as Error).stack,
      },
      { status: 500 },
    )
  }
}
