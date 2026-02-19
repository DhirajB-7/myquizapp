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
    // Redirect to GitHub OAuth page
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.GITHUB_REDIRECT_URI,
      scope: 'user:email'
    });
    return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI
      })
    });

    const tokenData = await tokenRes.json();

    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${tokenData.access_token}`, Accept: 'application/vnd.github.v3+json' }
    });
    const profile = await profileRes.json();

    // fetch primary email
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `token ${tokenData.access_token}`, Accept: 'application/vnd.github.v3+json' }
    });
    const emails = await emailsRes.json();
    const primaryEmailObj = emails.find(e => e.primary) || emails[0];
    const email = primaryEmailObj?.email || profile.email;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: profile.name || profile.login,
        email,
        provider: 'github',
        providerId: String(profile.id),
        avatar: profile.avatar_url
      });
      await user.save();
    } else {
      user.provider = 'github';
      user.providerId = String(profile.id);
      user.avatar = profile.avatar_url;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/login?token=${token}`;
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
