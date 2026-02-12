import connectToDatabase from "@/lib/mongodb";
import User from "@/models/UserQuiz";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found with this email" }, { status: 401 });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Password Incorrect" }, { status: 401 });
    }

    // Generate JWT token with user ID
    // ✅ This userId is used in the delete endpoint to verify user identity
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return token and user data
    // ✅ The email is stored in localStorage and used for delete verification
    return NextResponse.json({
      token,
      user: { 
        name: user.name, 
        email: user.email  // ✅ Email returned here for frontend display
      }
    }, { status: 200 });
  } catch (error) {
    console.error("LOGIN_ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}