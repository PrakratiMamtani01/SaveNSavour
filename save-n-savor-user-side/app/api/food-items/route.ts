import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongoose';
import mongoose from 'mongoose';



export async function GET() {
  try {
    await dbConnect();
    const FoodItem = mongoose.models.FoodItem ||
      mongoose.model(
        "FoodItem",
        new mongoose.Schema({}, { strict: false }),
        "fooditems"     
      )
    
    const foodItems = await FoodItem.find({}).sort({ createdAt: -1 });
    
    // Transform the data to match the format expected by the UI
    const transformedItems = foodItems.map(item => {
      // Calculate a random distance between 0.5 and 5 km
      const distance = (Math.random() * 4.5 + 0.5).toFixed(1) + ' km';
      
      // Calculate a random rating between 3.5 and 5.0
      const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
      
      // Generate random coordinates near Dubai (for map display)
      const lat = 25.2 + (Math.random() * 0.1 - 0.05);
      const lng = 55.27 + (Math.random() * 0.1 - 0.05);
      let imageUrl = `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(item.name)}`
      if (item.image && item.image.data) {
        // Create a data URL from the Base64 data and content type
        imageUrl = `data:${item.image.contentType};base64,${item.image.data}`
      }
      return {
        id: item._id.toString(),
        name: item.name,
        vendor: item.vendor.name,
        vendorId: item.vendor.id,
        originalPrice: item.originalPrice,
        discountedPrice: item.discountedPrice,
        image: imageUrl,
        distance: distance,
        cuisine: item.category,
        dietary: item.dietary || [],
        pickupTime: `Today, ${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 12) + 1} PM`,
        rating: parseFloat(rating),
        lat: lat,
        lng: lng,
        description: item.description,
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        ingredients: item.ingredients,
        emissions: item.emissions
      };
    });
    
    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('Error fetching food items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food items' },
      { status: 500 }
    );
  }
}
