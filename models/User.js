import mongoose from 'mongoose';

// Merged User schema combining fields from User.js and UserQuiz.js
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    // Password may be optional for OAuth users
    password: { type: String },
    // legacy secondary password field (kept for compatibility)
    password1: { type: String },
    // token version for logout/invalidate tokens
    tokenVersion: { type: Number, default: 0 },
    provider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
    providerId: { type: String },
    avatar: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Avoid model overwrite in watch / serverless environments
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;