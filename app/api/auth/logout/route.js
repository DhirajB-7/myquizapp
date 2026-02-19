import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ message: 'Logged out successfully' });
    }

    // Verify token is valid before logout
    jwt.verify(token, process.env.JWT_SECRET);

    // Note: OAuth tokens are managed by Google/GitHub on their servers
    // We just need to clear the token on client side (localStorage)
    // Optional: If you have refresh tokens stored, you could invalidate them here

    return NextResponse.json({ message: 'Logged out successfully', success: true });
  } catch (err) {
    console.error('Logout error:', err);
    // Even if token is invalid, consider logout successful
    return NextResponse.json({ message: 'Logged out successfully', success: true });
  }
}
