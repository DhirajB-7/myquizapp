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
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=${error}`);
  }

  if (!code) {
    // Redirect to GitHub OAuth page
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.GITHUB_REDIRECT_URI,
      scope: 'user:email'
    });
    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    console.log('Redirecting user to GitHub OAuth endpoint ->', authUrl);
    console.log('Using redirect_uri:', process.env.GITHUB_REDIRECT_URI);
    return NextResponse.redirect(authUrl);
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
    console.log('GitHub token response:', { success: !!tokenData.access_token, error: tokenData.error });

    if (!tokenData.access_token) {
      console.error('No access token from GitHub:', tokenData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=no_token`);
    }

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
    let email = primaryEmailObj?.email || profile.email;

    console.log('GitHub profile response:', {
      hasEmail: !!email,
      email,
      name: profile.name || profile.login,
      id: profile.id
    });

    if (!email) {
      console.error('No email from GitHub:', { profile, emails });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=no_email_found`);
    }

    // Ensure email is not null or undefined before creating user
    email = String(email).toLowerCase().trim();
    if (!email || email === 'null' || email === 'undefined') {
      console.error('Invalid email:', email);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=invalid_email`);
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: profile.name || profile.login || 'GitHub User',
        email,
        provider: 'github',
        providerId: String(profile.id),
        avatar: profile.avatar_url
      });
      console.log('Creating new user:', { email, name: user.name });
      await user.save();
    } else {
      console.log('Updating existing user:', email);
      user.provider = 'github';
      user.providerId = String(profile.id);
      user.avatar = profile.avatar_url;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const redirectUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?token=${token}`;
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('GitHub OAuth error:', err.message, err.stack);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=${encodeURIComponent(err.message)}`);
  }
}
