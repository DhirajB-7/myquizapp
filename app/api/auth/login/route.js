import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import Session from "@/models/Session";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  try {
    await connectToDatabase();

    // 1. Get the login details from the request body FIRST
    const { email, password } = await req.json();

    // 2. NOW find the user in the database
    // We must do this before we can use "user._id"
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email. Please sign up." }, 
        { status: 404 }
      );
    }

    // 3. Verify if the password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Password is incorrect. Please try again." }, 
        { status: 401 }
      );
    }

    // 4. Generate a unique Session ID
    const newSessionId = uuidv4(); 

    // 5. SAVE the session to MongoDB
    // Now "user._id" is available because we found the user in step 2
    await Session.create({
      userId: user._id,
      email: user.email,
      sessionId: newSessionId
    });

    // 6. Generate the JWT token containing the sessionId
    const token = jwt.sign(
      { userId: user._id, sessionId: newSessionId }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 7. Return the successful response
    return NextResponse.json({
      token,
      user: {
        name: user.name,
        email: user.email
      }
    }, { status: 200 });

  } catch (error) {
    // This will catch any unexpected errors
    console.error("LOGIN_ERROR:", error);
    return NextResponse.json(
      { message: "An error occurred during login. Please try again." }, 
      { status: 500 }
    );
  }
}