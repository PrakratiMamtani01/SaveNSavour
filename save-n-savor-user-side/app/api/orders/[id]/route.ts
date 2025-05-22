import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongoose"
import User from "@/models/user"
import mongoose from "mongoose"

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const contextParams = await context.params
    const orderId = contextParams.id
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId format:", userId)
      return NextResponse.json({ error: "Invalid userId format" }, { status: 400 })
    }

    await dbConnect()
    console.log("Connected to database")

    // get user
    const user = await User.findById(userId)
    if (!user) {
      console.error("User not found:", userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    console.log("Found user:", user._id)

    // Check if orders array exists
    if (!user.orders || !Array.isArray(user.orders)) {
      console.error("User has no orders array")
      return NextResponse.json({ error: "User has no orders" }, { status: 404 })
    }

    console.log(
      "User orders:",
      user.orders.map((o: { orderId: string }) => o.orderId)
    )

    const order = user.orders.find(
      (order: { orderId: string }) => order.orderId === orderId
    )
    if (!order) {
      console.error("Order not found:", orderId)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    console.log("Found order:", order.orderId)

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error fetching order:", error)
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
