import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import nodemailer from "nodemailer";
import { otpStore } from "@/lib/otpMemory";

export async function POST(req) {
    try {
        await connectToDatabase();
        const { email, action, otpInput } = await req.json();

        // --- ACTION: SEND / RESEND CODE ---
        if (action === "send" || action === "reset") {
            const user = await User.findOne({ email });
            if (!user) {
                return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
            }

            // Generate 6-digit OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // SAVE TO MEMORY (Not Database)
            otpStore[email] = {
                otp: generatedOtp,
                expires: Date.now() + 10 * 60 * 1000 // 10 minutes
            };

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS,
                },
            });

            await transporter.sendMail({
                from: `"QUIZKRIDA SECURITY" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: "Your Password Reset Code",
                html: `
                <div style="font-family: sans-serif; background: #000; color: #fff; padding: 30px; border: 2px solid #ff0033; text-align: center;">
                    <h1 style="letter-spacing: 5px;">QUIZKRIDA</h1>
                    <p style="color: #888;">Use the code below to authorize your password reset:</p>
                    <div style="background: #111; padding: 20px; margin: 20px 0; border: 1px dashed #ff0033;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #ff0033;">${generatedOtp}</span>
                    </div>
                    <p style="font-size: 12px; color: #444;">This code is valid for 10 minutes.</p>
                </div>`
            });

            return NextResponse.json({ success: true, message: "OTP Sent" });
        }

        // --- ACTION: VERIFY CODE ---
        if (action === "verify") {
            const record = otpStore[email];

            if (!record || record.otp !== otpInput || Date.now() > record.expires) {
                return NextResponse.json({ success: false, message: "Invalid or expired code" }, { status: 400 });
            }

            return NextResponse.json({ success: true, message: "Verified" });
        }

        return NextResponse.json({ success: false, error: "Invalid Action" }, { status: 400 });

    } catch (error) {
        console.error("SEND_OTP_ERROR:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}