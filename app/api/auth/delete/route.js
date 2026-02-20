import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import Session from "@/models/Session";
import { apiRequest } from '@/lib/api';

export async function DELETE(req) {
  try {
    await connectToDatabase();

    // Get authorization token from headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { message: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Get email from request body
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { message: "Account not found. It may have already been deleted." },
        { status: 404 }
      );
    }

    // Verify that the provided email matches the authenticated user's email
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { message: "The email you entered does not match your account." },
        { status: 403 }
      );
    }

    // Log account deletion for security audit
    console.log(`Account deletion initiated - Email: ${user.email}, Provider: ${user.provider}, ID: ${user._id}`);

    // Delete the user from database
    await User.findByIdAndDelete(decoded.userId);
    await Session.deleteMany({ userId: decoded.userId });
    
    console.log(`Account deleted successfully - ID: ${decoded.userId}`);
    return NextResponse.json(
      {
        message: "Account deleted successfully",
        deleted: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE_ACCOUNT_ERROR:", error.message, error);
    return NextResponse.json(
      { message: "An error occurred while deleting your account. Please try again." },
      { status: 500 }
    );
  }
}