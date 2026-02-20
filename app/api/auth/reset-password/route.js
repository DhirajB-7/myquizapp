import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { otpStore } from "@/lib/otpMemory";
import Session from "@/models/Session";

export async function POST(req) {
    try {
        await connectToDatabase();

        // FIX: Combine both into ONE await req.json()
        const { userId, sessionId, email, otpInput, newPassword } = await req.json();

        // 1. Optional: Security check to see if requester is logged in
        // Note: Usually, Reset Password is for users NOT logged in, 
        // so you might not even need the 'activeSession' check here unless 
        // this is an "Inside-App" password change.
        if (userId && sessionId) {
            const activeSession = await Session.findOne({ userId, sessionId });
            if (!activeSession) {
                return NextResponse.json({ message: "Session invalid" }, { status: 401 });
            }
        }

        // 2. Check if the OTP exists in memory
        const record = otpStore[email];
        if (!record) {
            return NextResponse.json(
                { success: false, message: "Session expired. Request a new code." },
                { status: 400 }
            );
        }

        // 3. Verify OTP and Expiry
        if (record.otp !== otpInput) {
            return NextResponse.json({ success: false, message: "Invalid code" }, { status: 400 });
        }

        if (Date.now() > record.expires) {
            delete otpStore[email]; 
            return NextResponse.json({ success: false, message: "Code has expired" }, { status: 400 });
        }

        // 4. Update the User in MongoDB
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // 5. GLOBAL LOGOUT: Kill every active session for this user!
        // This ensures the hacker (or old devices) are kicked out immediately.
        await Session.deleteMany({ userId: user._id });

        // 6. Cleanup Memory
        delete otpStore[email];

        return NextResponse.json({
            success: true,
            message: "Password updated and all devices logged out!"
        }, { status: 200 });

    } catch (error) {
        console.error("RESET_ERROR:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}