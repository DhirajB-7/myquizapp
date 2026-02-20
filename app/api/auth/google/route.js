import { NextResponse } from 'next/server';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/mongodb';

export async function GET(req) {
    try {
        await connectToDatabase();
    } catch (err) {
        console.error('MongoDB connection failed:', err);
        return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?error=db_connection_failed`);
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // 1. Handle OAuth errors from Google
    if (error) {
        console.error('OAuth error from Google:', error);
        return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?error=${error}`);
    }

    // 2. Initial Redirect to Google
    if (!code) {
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
        // 3. Exchange Code for Access Token
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

        if (!tokenData.access_token) {
            console.log('Failed to get access token:', tokenData);
            return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?error=token_exchange_failed`);
        }

        // 4. Fetch User Profile (Using OIDC userinfo endpoint)
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const profile = await profileRes.json();

        // 5. Robust Email Extraction
        // Sometimes Google returns email in profile.email, sometimes in other fields
        const rawEmail = profile.email || profile.sub; // Fallback to sub if email is missing (though rare with correct scope)
        
        if (!profile.email) {
            console.error('Google did not return an email:', profile);
            return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?error=no_email_permission`);
        }

        const userEmail = String(profile.email).toLowerCase().trim();

        // 6. Database Operations (Find or Create)
        let user = await User.findOne({ email: userEmail });

        if (!user) {
            // NEW USER
            user = new User({
                name: profile.name || 'Google User',
                email: userEmail,
                provider: 'google',
                providerId: profile.sub || profile.id,
                avatar: profile.picture
            });
        } else {
            // UPDATE EXISTING USER
            user.name = profile.name || user.name;
            user.provider = 'google';
            user.providerId = profile.sub || profile.id;
            user.avatar = profile.picture || user.avatar;
        }

        // 7. Save the user to database
        try {
            await user.save();
            console.log('Google user saved successfully, id=', user._id);
        } catch (saveError) {
            console.error("Mongoose Save Error:", saveError.message, saveError);
            return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?error=db_save_failed`);
        }

        // 8. Generate App JWT
        const token = jwt.sign(
            { id: user._id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30d' }
        );

        // 9. Final Redirect with Token
        const redirectUrl = `${process.env.FRONTEND_URL}/login?token=${token}`;
        return NextResponse.redirect(redirectUrl);

    } catch (err) {
        console.error('Google OAuth Critical Error:', err.message, err.stack);
        return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_server_error`);
    }
}