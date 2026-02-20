import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import Session from "@/models/Session";

export async function DELETE(req) {
  try {
    await connectToDatabase();

    // Get authorization token from headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("Delete account attempt without proper authorization header");
      return NextResponse.json(
        { message: "Unauthorized - No valid token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.warn("Delete account attempt with invalid token:", error.message);
      return NextResponse.json(
        { message: "Unauthorized - Invalid or expired token. Please log in again." },
        { status: 401 }
      );
    }

    if (!decoded.userId) {
      console.warn("Delete account attempt with missing userId in token");
      return NextResponse.json(
        { message: "Invalid token - User ID not found" },
        { status: 401 }
      );
    }

    // Get email from request body
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required to delete your account" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { message: "Invalid email format provided" },
        { status: 400 }
      );
    }

    // Find the user by ID
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.warn(`Delete account requested for non-existent user ID: ${decoded.userId}`);
      return NextResponse.json(
        { message: "Account not found. It may have already been deleted." },
        { status: 404 }
      );
    }

    // Verify that the provided email matches the authenticated user's email (case-insensitive)
    const normalizedProvidedEmail = String(email).toLowerCase().trim();
    const normalizedAccountEmail = user.email.toLowerCase();
    
    if (normalizedProvidedEmail !== normalizedAccountEmail) {
      console.warn(
        `Delete account email mismatch - User: ${user._id}, ` +
        `Provided: ${normalizedProvidedEmail}, Account: ${normalizedAccountEmail}`
      );
      return NextResponse.json(
        { message: "The email you entered does not match your account." },
        { status: 403 }
      );
    }

    // Log account deletion for security audit
    console.log(
      `[AUDIT] Account deletion initiated - ` +
      `User ID: ${user._id}, Email: ${user.email}, Provider: ${user.provider}, ` +
      `Created At: ${user.createdAt}, Deleted At: ${new Date().toISOString()}`
    );

    // Delete all sessions for this user first
    const deletedSessions = await Session.deleteMany({ userId: decoded.userId });
    console.log(`[AUDIT] Sessions deleted - User: ${user._id}, Count: ${deletedSessions.deletedCount}`);

    // Delete the user from database
    const deletedUser = await User.findByIdAndDelete(decoded.userId);
    
    if (!deletedUser) {
      console.error(`Failed to delete user from database - User ID: ${decoded.userId}`);
      return NextResponse.json(
        { message: "Failed to delete account. Please try again." },
        { status: 500 }
      );
    }

    console.log(
      `[AUDIT] Account deleted successfully - User ID: ${decoded.userId}, ` +
      `Email: ${deletedUser.email}, Provider: ${deletedUser.provider}`
    );

    return NextResponse.json(
      {
        message: "Your account and all associated data have been permanently deleted",
        deleted: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "DELETE_ACCOUNT_ERROR:", 
      error.message, 
      "Stack:", error.stack
    );
    return NextResponse.json(
      { message: "An error occurred while deleting your account. Please try again or contact support." },
      { status: 500 }
    );
  }
}