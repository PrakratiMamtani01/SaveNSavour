import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

let isConnected = false;

export async function dbConnect(): Promise<void> {
    if (isConnected) return;

    const db = await mongoose.connect(MONGODB_URI);
    isConnected = !!db.connections[0].readyState;
}
