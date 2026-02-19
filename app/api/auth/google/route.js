import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  
  // Clean version for modern Mongoose
  await mongoose.connect(process.env.MONGODB_URI);
};
export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    // Redirect to Google OAuth consent page
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });
    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();

    // find or create user
    let user = await User.findOne({ email: profile.email });
    if (!user) {
      user = new User({
        name: profile.name,
        email: profile.email,
        provider: 'google',
        providerId: profile.sub,
        avatar: profile.picture
      });
      await user.save();
    } else {
      user.provider = 'google';
      user.providerId = profile.sub;
      user.avatar = profile.picture;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Redirect back to login page with token
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/login?token=${token}`;
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
