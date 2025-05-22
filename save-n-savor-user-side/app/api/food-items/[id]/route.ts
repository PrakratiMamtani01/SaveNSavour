import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongoose"
import mongoose from "mongoose"

// Reference the existing FoodItem model
const FoodItem = mongoose.models.FoodItem

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url)
    const id = url.pathname.split("/").pop() // extract the [id] from the path

    if (!id || (!mongoose.Types.ObjectId.isValid(id) && id.length !== 24)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 })
    }

    await dbConnect()

    const foodItem = await FoodItem.findById(id)

    if (!foodItem) {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 })
    }

    // Calculate a random distance between 0.5 and 5 km
    const distance = (Math.random() * 4.5 + 0.5).toFixed(1) + " km"

    // Calculate a random rating between 3.5 and 5.0
    const rating = (Math.random() * 1.5 + 3.5).toFixed(1)

    let imageUrl
    if (foodItem.image && foodItem.image.data) {
      // Create a data URL from the Base64 data and content type
      imageUrl = `data:${foodItem.image.contentType};base64,${foodItem.image.data}`
    }

    // Transform the data to match the format expected by the UI
    const transformedItem = {
      id: foodItem._id.toString(),
      name: foodItem.name,
      vendor: foodItem.vendor.name,
      vendorId: foodItem.vendor.id,
      vendorLocation: foodItem.vendor.location,
      originalPrice: foodItem.originalPrice,
      discountedPrice: foodItem.discountedPrice,
      image: imageUrl,
      distance: distance,
      cuisine: foodItem.category,
      dietary: foodItem.dietary || [],
      pickupTime: `Today, ${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 12) + 1} PM`,
      rating: Number.parseFloat(rating),
      description: foodItem.description,
      expiryDate: foodItem.expiryDate,
      quantity: foodItem.quantity,
      ingredients: foodItem.ingredients,
      emissions: foodItem.emissions,
      address: foodItem.vendor.location,
      pickupTimeSlots: foodItem.pickupTimeSlots || [
        { day: "Today", startTime: "5:00 PM", endTime: "6:00 PM" },
        { day: "Today", startTime: "6:00 PM", endTime: "7:00 PM" },
        { day: "Tomorrow", startTime: "10:00 AM", endTime: "11:00 AM" },
      ], // Add pickup time slots with fallback and day information
      reviews: [,],
    }

    return NextResponse.json(transformedItem)
  } catch (error) {
    console.error("Error fetching food item:", error)
    return NextResponse.json({ error: "Failed to fetch food item" }, { status: 500 })
  }
}
