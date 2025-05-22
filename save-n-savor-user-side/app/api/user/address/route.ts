import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongoose"
import User from "@/models/user"

export async function POST(req: Request) {
    try {
        const { userId, address } = await req.json()

        if (!userId || !address) {
            return NextResponse.json({ error: "Missing userId or address" }, { status: 400 })
        }

        await dbConnect()

        const user = await User.findById(userId)
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        user.addresses.push(address)
        await user.save()

        return NextResponse.json({
            message: "Address added successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                addresses: user.addresses,
                paymentMethods: user.paymentMethods ?? [], // default empty array
            }
        })
    } catch (error) {
        console.error("Error adding address:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
