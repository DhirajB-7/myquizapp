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
        if (action === "send") {
            // Validate email exists
            const user = await User.findOne({ email });
            if (!user) {
                return NextResponse.json(
                    { success: false, message: "No account found with this email address." },
                    { status: 404 }
                );
            }

            // Generate 6-digit OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // SAVE TO MEMORY (Shared OTP store)
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
                    <p style="font-size: 12px; color: #666;">If you didn't request a password reset, please ignore this email.</p>
                </div>`
            });

            return NextResponse.json(
                { success: true, message: "Reset code sent successfully! Check your email." },
                { status: 200 }
            );
        }

        // --- ACTION: VERIFY CODE ---
        if (action === "verify") {
            const record = otpStore[email];

            if (!record) {
                return NextResponse.json(
                    { success: false, message: "No reset code found. Please request a new one." },
                    { status: 400 }
                );
            }

            if (record.otp !== otpInput) {
                return NextResponse.json(
                    { success: false, message: "The reset code is incorrect. Please check and try again." },
                    { status: 400 }
                );
            }

            if (Date.now() > record.expires) {
                delete otpStore[email];
                return NextResponse.json(
                    { success: false, message: "Reset code has expired. Please request a new one." },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { success: true, message: "Code verified. You can now reset your password." },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { success: false, message: "Invalid action" },
            { status: 400 }
        );

    } catch (error) {
        console.error("FORGOT_PASSWORD_ERROR:", error);
        return NextResponse.json(
            { success: false, message: "An error occurred. Please try again later." },
            { status: 500 }
        );
    }
}