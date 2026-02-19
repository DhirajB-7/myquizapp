import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../../../models/User';

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
};

export async function GET(req) {
  await connectDB();
  try {
    const url = new URL(req.url);
    let token = url.searchParams.get('token');
    if (!token) {
      const auth = req.headers.get('authorization') || '';
      if (auth.startsWith('Bearer ')) token = auth.split(' ')[1];
    }
    if (!token) return NextResponse.json({ error: 'No token provided' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-__v');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
