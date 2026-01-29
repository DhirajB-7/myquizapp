"use client";
import { useState, useEffect } from 'react';

export default function SignupForm() {
  const [step, setStep] = useState(1); // 1: Signup, 2: OTP
  const [email, setEmail] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  // Timer Logic
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const sendOtp = async () => {
    setLoading(true);
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, action: "send" })
    });
    const data = await res.json();
    if (data.success) {
      setStep(2);
      setTimer(60); // 60s cooldown
    } else {
      alert(data.error);
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, action: "verify", otpInput })
    });
    const data = await res.json();
    if (data.success) {
      alert("Account Verified & Created!");
      // Logic to redirect to Dashboard
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="signup-container">
      {step === 1 ? (
        <div>
          <h2>Join QUIZKRIDA</h2>
          <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <button onClick={sendOtp} disabled={loading}>
            {loading ? "Sending..." : "Create Account"}
          </button>
        </div>
      ) : (
        <div>
          <h2>Verify Email</h2>
          <p>Code sent to {email}</p>
          <input maxLength="6" placeholder="Enter 6-digit code" onChange={(e) => setOtpInput(e.target.value)} />
          <button onClick={verifyOtp}>Verify</button>
          
          <div className="resend">
            {timer > 0 ? `Resend in ${timer}s` : <button onClick={sendOtp}>Resend Code</button>}
          </div>
        </div>
      )}
    </div>
  );
}