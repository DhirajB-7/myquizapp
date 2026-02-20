// app/api/auth/verify/route.js
import { NextResponse } from 'next/server'; // Use NextResponse for reliability
import nodemailer from 'nodemailer';
import { otpStore } from '@/lib/otpMemory';

export async function POST(req) {
  try {
    const { email, action, otpInput } = await req.json();

    if (action === "send") {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      // Store OTP in shared memory with 5-minute expiry
      otpStore[email] = { 
        otp: generatedOtp, 
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
      };

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { 
          user: process.env.GMAIL_USER, 
          pass: process.env.GMAIL_PASS 
        }
      });

      await transporter.sendMail({
        from: `"QUIZKRIDA" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Your Verification Code",
        html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      .container { animation: fadeIn 0.8s ease-out; }
      .otp-card { animation: pulse 2s infinite ease-in-out; }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f7ff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <table class="container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.1);">
            
            <tr>
              <td align="center" style="background-color: #2563eb; padding: 40px 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; letter-spacing: 2px; font-weight: 800;">QUIZKRIDA</h1>
                <p style="color: #bfdbfe; margin-top: 10px; font-size: 16px;">Ready to test your knowledge?</p>
              </td>
            </tr>

            <tr>
              <td style="padding: 40px 30px; text-align: center;">
                <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px;">Verify Your Email</h2>
                <p style="color: #64748b; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">
                  Welcome to the arena! Use the secure code below to complete your registration.
                </p>

                <div class="otp-card" style="display: inline-block; background: #f0f7ff; border: 2px solid #2563eb; border-radius: 12px; padding: 20px 30px; margin-bottom: 30px;">
                  <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #2563eb;">
                    ${generatedOtp}
                  </span>
                </div>

                <p style="color: #94a3b8; font-size: 13px; margin-bottom: 0;">
                  This code expires in <b>5 minutes</b>.<br>
                  If you didn't request this, please ignore this email.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 20px; background-color: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  &copy; 2026 QUIZKRIDA Gaming Platform<br>
                  Built for the winners.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `,
      });

      // ALWAYS return a valid JSON response
      return NextResponse.json({ success: true, message: "OTP Sent" });
    }

    if (action === "verify") {
      const record = otpStore[email];
      
      if (!record) {
        return NextResponse.json(
          { success: false, message: "No verification code found. Please request a new one." },
          { status: 400 }
        );
      }

      if (record.otp !== otpInput) {
        return NextResponse.json(
          { success: false, message: "Invalid verification code. Please check and try again." },
          { status: 400 }
        );
      }

      if (Date.now() > record.expires) {
        delete otpStore[email];
        return NextResponse.json(
          { success: false, message: "Verification code has expired. Please request a new one." },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, message: "Email verified successfully!" });
    }

    // Fallback for unknown actions
    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Backend Error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}