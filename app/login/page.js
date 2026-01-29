"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Layout, Mail, Lock, User, LogOut, ArrowRight, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Form = () => {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [userName, setUserName] = useState("");
    const [isFlipped, setIsFlipped] = useState(false);

    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isEnteringDashboard, setIsEnteringDashboard] = useState(false);

    // OTP & Step Logic
    const [step, setStep] = useState(1); // 1: Signup Form, 2: OTP Verification
    const [otpInput, setOtpInput] = useState("");
    const [timer, setTimer] = useState(0);

    const [signupData, setSignupData] = useState({ name: "", email: "", password: "" });
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [signupError, setSignupError] = useState("");
    const [loginError, setLoginError] = useState("");

    const primaryColor = "#2563eb";

    // Auth Check
    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        if (token && user) {
            try {
                const parsedUser = JSON.parse(user);
                setIsAuth(true);
                setUserName(parsedUser?.name || "User");
            } catch (e) {
                localStorage.clear();
            }
        }
    }, []);

    // OTP Timer Effect
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleToggle = () => {
        setIsFlipped(!isFlipped);
        setStep(1); // Reset to signup step if they flip
        setSignupError("");
        setLoginError("");
        setSignupData({ name: "", email: "", password: "" });
        setLoginData({ email: "", password: "" });
        setConfirmPassword("");
    };

    const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);

    // STEP 1: Send OTP
    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setSignupError("");
        const { name, email, password } = signupData;
        if (!name || !email || !password || !confirmPassword) return setSignupError("All fields are required");
        if (!isEmailValid(email)) return setSignupError("Please enter a valid email");
        if (!validatePassword(password)) return setSignupError("Password too weak");
        if (password !== confirmPassword) return setSignupError("Passwords do not match");

        setIsSigningUp(true);
        const loadingToast = toast.loading("Sending verification code...");
        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, action: "send" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send code");

            toast.success("Code sent to your email!", { id: loadingToast });
            setStep(2); // Move to OTP step
            setTimer(60);
        } catch (err) {
            toast.error(err.message, { id: loadingToast });
        } finally {
            setIsSigningUp(false);
        }
    };

    // STEP 2: Verify OTP and Create User
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpInput) return toast.error("Please enter the code");

        setIsSigningUp(true);
        const loadingToast = toast.loading("Verifying code...");
        try {
            // 1. Verify OTP
            const verifyRes = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: signupData.email, action: "verify", otpInput }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message || "Invalid or expired code");

            // 2. If OTP valid, create the account
            const signupRes = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupData),
            });
            const signupDataRes = await signupRes.json();
            if (!signupRes.ok) throw new Error(signupDataRes.message || "Signup failed");

            toast.success("Verified! Please login 🎉", { id: loadingToast });
            setStep(1);
            setIsFlipped(false); // Flip back to Login
        } catch (err) {
            toast.error(err.message, { id: loadingToast });
        } finally {
            setIsSigningUp(false);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError("");
        const { email, password } = loginData;
        if (!email || !password) return setLoginError("All fields are required");
        setIsLoggingIn(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Invalid credentials");
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setIsAuth(true);
            setUserName(data.user?.name || "User");
            toast.success("Welcome back!");
            router.push("/");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = () => {
        setIsLoggingOut(true);
        toast.success("Logged out safely");
        localStorage.clear();
        setIsAuth(false);
        setTimeout(() => (router.push("/")), 1000);
    };

    const handleDashboardClick = () => {
        setIsEnteringDashboard(true);
        router.push("/dashboard");
    };

    return (
        <StyledWrapper $primary={primaryColor}>
            <Toaster position="top-center" reverseOrder={false} />
            <div className="wrapper">
                {isAuth ? (
                    <div className="profile-card">
                        <div className="avatar">{userName[0]?.toUpperCase()}</div>
                        <h2>Hello, {userName}!</h2>
                        <div className="status-badge">SESSION ACTIVE</div>
                        <div className="action-area">
                            <button className="main-btn" onClick={handleDashboardClick} disabled={isEnteringDashboard}>
                                {isEnteringDashboard ? <Loader2 size={18} className="spinner-icon" /> : <Layout size={18} />}
                                {isEnteringDashboard ? "Loading..." : "Dashboard"}
                            </button>
                            <button className="main-btn logout-btn" onClick={handleLogout} disabled={isLoggingOut}>
                                <LogOut size={18} /> {isLoggingOut ? "Ending..." : "Logout"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="auth-container">
                        <div className="toggle-container">
                            <span className={!isFlipped ? "active" : ""} onClick={() => setIsFlipped(false)}>Login</span>
                            <div className="switch-wrapper">
                                <label className="switch">
                                    <input type="checkbox" checked={isFlipped} onChange={handleToggle} />
                                    <span className="slider" />
                                </label>
                            </div>
                            <span className={isFlipped ? "active" : ""} onClick={() => setIsFlipped(true)}>Sign Up</span>
                        </div>

                        <div className={`flip-card__inner ${isFlipped ? 'is-flipped' : ''}`}>
                            {/* LOGIN FRONT */}
                            <div className="flip-card__front">
                                <div className="form-header">
                                    <div className="title">Welcome Back</div>
                                    <p className="subtitle">Enter your credentials to access your account</p>
                                </div>
                                <form onSubmit={handleLoginSubmit} className="form-content">
                                    <div className="input-group">
                                        <label><Mail size={14} /> Email</label>
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            value={loginData.email}
                                            onChange={(e) => { setLoginData({ ...loginData, email: e.target.value }); setLoginError(""); }}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label><Lock size={14} /> Password</label>
                                        <div className="password-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={loginData.password}
                                                onChange={(e) => { setLoginData({ ...loginData, password: e.target.value }); setLoginError(""); }}
                                            />
                                            <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-footer">
                                        <span className="forgot-pwd">Forgot password?</span>
                                    </div>
                                    {loginError && <p className="error-text">{loginError}</p>}
                                    <button className="main-btn" disabled={isLoggingIn}>
                                        {isLoggingIn ? "Logging in..." : "Login"} <ArrowRight size={18} />
                                    </button>
                                </form>
                                <div className="decorative-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>

                            {/* SIGNUP BACK (Handles Step 1 and 2) */}
                            <div className="flip-card__back">
                                {step === 1 ? (
                                    <>
                                        <div className="title">Create Account</div>
                                        <form onSubmit={handleSignupSubmit} className="form-content">
                                            <div className="input-group">
                                                <label><User size={14} /> Full Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="john doe"
                                                    value={signupData.name}
                                                    onChange={(e) => { setSignupData({ ...signupData, name: e.target.value }); setSignupError(""); }}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label><Mail size={14} /> Email Address</label>
                                                <input
                                                    type="email"
                                                    placeholder="hello@world.com"
                                                    value={signupData.email}
                                                    onChange={(e) => { setSignupData({ ...signupData, email: e.target.value }); setSignupError(""); }}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label><Lock size={14} /> Password</label>
                                                <div className="password-wrapper">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="8+ characters"
                                                        value={signupData.password}
                                                        onChange={(e) => { setSignupData({ ...signupData, password: e.target.value }); setSignupError(""); }}
                                                    />
                                                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label><CheckCircle size={14} /> Confirm Password</label>
                                                <div className="password-wrapper">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="Re-type password"
                                                        value={confirmPassword}
                                                        onChange={(e) => { setConfirmPassword(e.target.value); setSignupError(""); }}
                                                    />
                                                    <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                </div>
                                            </div>
                                            {signupError && <p className="error-text">{signupError}</p>}
                                            <button className="main-btn" disabled={isSigningUp}>
                                                {isSigningUp ? "Sending..." : "Continue"} <ArrowRight size={18} />
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        <div className="title">Verify Email</div>
                                        <p className="subtitle" style={{ marginBottom: "20px" }}>Enter the 6-digit code sent to <br /><strong>{signupData.email}</strong></p>
                                        <form onSubmit={handleVerifyOtp} className="form-content">
                                            <div className="input-group">
                                                <label><ShieldCheck size={14} /> Verification Code</label>
                                                <input
                                                    type="text"
                                                    maxLength="6"
                                                    placeholder="000000"
                                                    style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem' }}
                                                    value={otpInput}
                                                    onChange={(e) => setOtpInput(e.target.value)}
                                                />
                                            </div>
                                            <button className="main-btn" disabled={isSigningUp}>
                                                {isSigningUp ? "Verifying..." : "Verify & Signup"} <CheckCircle size={18} />
                                            </button>

                                            <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                                {timer > 0 ? (
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Resend code in {timer}s</span>
                                                ) : (
                                                    <span
                                                        onClick={handleSignupSubmit}
                                                        style={{ fontSize: '0.8rem', color: primaryColor, cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        Resend Code
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', cursor: 'pointer' }}
                                            >
                                                ← Back to Signup
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StyledWrapper>
    );
};

// ... (Rest of your StyledWrapper CSS remains exactly the same)
const StyledWrapper = styled.div`
  min-height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  margin-top: -40px;

  .spinner-icon {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .wrapper {
    width: 100%;
    max-width: 400px;
    padding: 20px;
  }

  /* --- Profile/Logout Card --- */
  .profile-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 40px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0,0,0,0.3);

    h2 { color: ${props => props.$primary}; margin: 15px 0; }
    
    .avatar {
      width: 80px; height: 80px;
      background: ${props => props.$primary};
      border-radius: 50%;
      margin: 0 auto;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; font-weight: bold;
      box-shadow: 0 0 20px ${props => props.$primary}66;
    }

    .status-badge {
      background: rgba(46, 204, 113, 0.1); color: #2ecc71;
      padding: 6px 15px; border-radius: 20px; display: inline-block;
      font-size: 0.8rem; font-weight: bold; border: 1px solid rgba(46, 204, 113, 0.2);
      margin-bottom: 30px;
    }
  }

  /* --- Flip Card Core --- */
  .auth-container {
    perspective: 1000px;
  }

  .toggle-container {
    display: flex; justify-content: center; align-items: center; gap: 15px;
    margin-bottom: 30px;
    span { font-size: 0.9rem; color: #7e7e7e; cursor: pointer; transition: 0.3s; }
    span.active { color: ${props => props.$primary}; font-weight: bold; }
  }

  .switch {
    position: relative; display: inline-block; width: 50px; height: 24px;
    input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(255,255,255,0.1); transition: .4s; border-radius: 34px;
      &:before {
        position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
        background-color: white; transition: .4s; border-radius: 50%;
      }
    }
    input:checked + .slider { background-color: ${props => props.$primary}; }
    input:checked + .slider:before { transform: translateX(26px); }
  }

  .flip-card__inner {
    position: relative; width: 100%; height: 580px;
    transition: transform 0.8s; transform-style: preserve-3d;
    &.is-flipped { transform: rotateY(180deg); }
  }

  .flip-card__front, .flip-card__back {
    position: absolute; width: 100%; height: 100%;
    backface-visibility: hidden;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 30px;
    display: flex; flex-direction: column;
    justify-content: center;
  }

  .flip-card__back { transform: rotateY(180deg); }

  .form-header {
    margin-bottom: 30px;
    text-align: center;
    animation: fadeInDown 0.6s ease-out;
  }

  .subtitle {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
    margin-top: -5px;
  }

  .title { font-size: 1.5rem; font-weight: bold; color: ${props => props.$primary}; margin-bottom: 20px; }
  
  .form-content { display: flex; flex-direction: column; gap: 15px; }

  .input-group {
    display: flex; flex-direction: column; gap: 6px;
    label { 
      display: flex; align-items: center; gap: 6px;
      color: ${props => props.$primary}; font-size: 0.7rem; font-weight: bold; text-transform: uppercase;
    }
    input {
      width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; padding: 12px 15px; color: white; outline: none; transition: 0.3s;
      &:focus { border-color: ${props => props.$primary}; background: rgba(0,0,0,0.4); }
    }
  }

  .password-wrapper {
    position: relative;
    .eye-btn {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: #7e7e7e; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
  }

  .form-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: -5px;
  }

  .forgot-pwd {
    font-size: 0.75rem;
    color: ${props => props.$primary};
    cursor: pointer;
    opacity: 0.8;
    &:hover { text-decoration: underline; opacity: 1; }
  }

  .error-text { color: #ff4b4b; font-size: 0.8rem; text-align: center; }

  .main-btn {
    width: 100%; padding: 14px; background: ${props => props.$primary};
    border: none; color: white; border-radius: 12px; font-weight: bold;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    cursor: pointer; transition: 0.3s;
    box-shadow: 0 10px 20px ${props => props.$primary}4d;
    margin-top: 10px;
    &:hover { transform: translateY(-2px); opacity: 0.9; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  .decorative-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 40px;
    span {
      width: 6px; height: 6px;
      background: ${props => props.$primary};
      border-radius: 50%;
      opacity: 0.3;
      animation: pulse 1.5s infinite ease-in-out;
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }

  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.2); opacity: 0.6; }
  }

  .logout-btn {
    background: rgba(255, 75, 75, 0.1); color: #ff4b4b; 
    border: 1px solid rgba(255, 75, 75, 0.2); box-shadow: none;
    &:hover { background: rgba(255, 75, 75, 0.2); }
  }
`;

export default Form;