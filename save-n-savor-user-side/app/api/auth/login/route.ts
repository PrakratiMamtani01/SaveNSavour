import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/mongoose';
import User from '@/models/user';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  await dbConnect();

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    addresses: user.addresses || [],
    paymentMethods: user.paymentMethods || []
  };

  return NextResponse.json({ message: 'Login successful', user: safeUser });
}
