"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Layout, Mail, Lock, User, LogOut, ArrowRight, CheckCircle, Loader2, ShieldCheck, Cpu } from 'lucide-react';
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

    const [step, setStep] = useState(1);
    const [otpInput, setOtpInput] = useState("");
    const [timer, setTimer] = useState(0);

    const [signupData, setSignupData] = useState({ name: "", email: "", password: "" });
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [signupError, setSignupError] = useState("");
    const [loginError, setLoginError] = useState("");

    const primaryColor = "#ffffff";

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

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleToggle = () => {
        setIsFlipped(!isFlipped);
        setStep(1);
        setSignupError("");
        setLoginError("");
        setSignupData({ name: "", email: "", password: "" });
        setLoginData({ email: "", password: "" });
        setConfirmPassword("");
    };

    const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);

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
            setStep(2);
            setTimer(60);
        } catch (err) {
            toast.error(err.message, { id: loadingToast });
        } finally {
            setIsSigningUp(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpInput) return toast.error("Please enter the code");
        setIsSigningUp(true);
        const loadingToast = toast.loading("Verifying code...");
        try {
            const verifyRes = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: signupData.email, action: "verify", otpInput }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message || "Invalid or expired code");

            const signupRes = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupData),
            });
            const signupDataRes = await signupRes.json();
            if (!signupRes.ok) throw new Error(signupDataRes.message || "Signup failed");

            toast.success("Verified! Please login 🎉", { id: loadingToast });
            setStep(1);
            setIsFlipped(false);
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
        setTimeout(() => (router.push("/")), 800);
    };

    const handleDashboardClick = () => {
        setIsEnteringDashboard(true);
        router.push("/dashboard");
    };

    return (
        <StyledWrapper $primary={primaryColor}>
            <Toaster
                toastOptions={{
                    style: {
                        background: '#0a0a0a',
                        color: '#fff',
                        border: '1px solid #ffffff20',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        letterSpacing: '1px'
                    }
                }}
            />
            <div className="wrapper">
                {isAuth ? (
                    <div className="profile-card">
                        <div className="avatar-container">
                            <div className="avatar">{userName[0]?.toUpperCase()}</div>
                            <div className="pulse-ring"></div>
                        </div>
                        <h2>{userName.toUpperCase()}</h2>
                        <div className="status-badge">
                            <span className="dot"></span> SYSTEM_ONLINE
                        </div>
                        <div className="action-area">
                            <button className="main-btn" onClick={handleDashboardClick} disabled={isEnteringDashboard}>
                                {isEnteringDashboard ? <Loader2 size={16} className="spinner-icon" /> : <Layout size={16} />}
                                {isEnteringDashboard ? "CONNECTING..." : "ACCESS_DASHBOARD"}
                            </button>
                            <button className="main-btn logout-btn" onClick={handleLogout} disabled={isLoggingOut}>
                                <LogOut size={16} /> {isLoggingOut ? "EXITING..." : "TERMINATE_SESSION"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="auth-container">
                        <div className="toggle-container">
                            <span className={!isFlipped ? "active" : ""} onClick={() => setIsFlipped(false)}>AUTH_LOGIN</span>
                            <div className="switch-wrapper">
                                <label className="switch">
                                    <input type="checkbox" checked={isFlipped} onChange={handleToggle} />
                                    <span className="slider" />
                                </label>
                            </div>
                            <span className={isFlipped ? "active" : ""} onClick={() => setIsFlipped(true)}>USER_CREATE</span>
                        </div>

                        <div className={`flip-card__inner ${isFlipped ? 'is-flipped' : ''}`}>
                            {/* FRONT SIDE: LOGIN */}
                            <div className="flip-card__front card-face">
                                <div className="corner-decor top-left"></div>
                                <div className="corner-decor bottom-right"></div>
                                <div className="form-header">
                                    <Cpu size={32} className="header-icon" />
                                    <div className="title">IDENT_PROTOCOL</div>
                                    <p className="subtitle">CREDENTIALS_REQUIRED_FOR_ENTRY</p>
                                </div>
                                <form onSubmit={handleLoginSubmit} className="form-content">
                                    <div className="input-group">
                                        <label><Mail size={12} /> EMAIL_LINK</label>
                                        <input
                                            type="email"
                                            placeholder="USER@GMAIL.COM"
                                            value={loginData.email}
                                            onChange={(e) => { setLoginData({ ...loginData, email: e.target.value }); setLoginError(""); }}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label><Lock size={12} /> ENCRYPTION_KEY</label>
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
                                    <div className="form-footer-row">
                                        <span className="forgot-pwd">KEY_RECOVERY?</span>
                                    </div>
                                    {loginError && <p className="error-text">{loginError}</p>}
                                    <button className="main-btn" disabled={isLoggingIn}>
                                        {isLoggingIn ? "VALIDATING..." : "EXECUTE_LOGIN"} <ArrowRight size={16} />
                                    </button>
                                </form>
                            </div>

                            {/* BACK SIDE: SIGNUP / OTP */}
                            <div className="flip-card__back card-face">
                                <div className="corner-decor top-right"></div>
                                <div className="corner-decor bottom-left"></div>
                                {step === 1 ? (
                                    <>
                                        <div className="form-header">
                                            <User size={32} className="header-icon" />
                                            <div className="title">NEW_ENTRY</div>
                                            <p className="subtitle">REGISTER_ON_ZOLVI_CORE</p>
                                        </div>
                                        <form onSubmit={handleSignupSubmit} className="form-content">
                                            <div className="input-group">
                                                <label><User size={12} /> FULL_NAME</label>
                                                <input
                                                    type="text"
                                                    placeholder="NAME_STRING"
                                                    value={signupData.name}
                                                    onChange={(e) => { setSignupData({ ...signupData, name: e.target.value }); setSignupError(""); }}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label><Mail size={12} /> EMAIL_ADDRESS</label>
                                                <input
                                                    type="email"
                                                    placeholder="NAME@DOMAIN.COM"
                                                    value={signupData.email}
                                                    onChange={(e) => { setSignupData({ ...signupData, email: e.target.value }); setSignupError(""); }}
                                                />
                                            </div>
                                            <div className="grid-2">
                                                <div className="input-group">
                                                    <label><Lock size={12} /> ACCESS_KEY</label>
                                                    <div className="password-wrapper">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••"
                                                            value={signupData.password}
                                                            onChange={(e) => { setSignupData({ ...signupData, password: e.target.value }); setSignupError(""); }}
                                                        />
                                                        <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="input-group">
                                                    <label><CheckCircle size={12} /> REPEAT</label>
                                                    <div className="password-wrapper">
                                                        <input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            placeholder="••••"
                                                            value={confirmPassword}
                                                            onChange={(e) => { setConfirmPassword(e.target.value); setSignupError(""); }}
                                                        />
                                                        <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {signupError && <p className="error-text">{signupError}</p>}
                                            <button className="main-btn" disabled={isSigningUp}>
                                                {isSigningUp ? "PROCESSING..." : "REGISTER_USER"} <ArrowRight size={16} />
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-header">
                                            <ShieldCheck size={32} className="header-icon glow" />
                                            <div className="title">OTP_VALIDATION</div>
                                            <p className="subtitle">VERIFYING: {signupData.email.toUpperCase()}</p>
                                        </div>
                                        <form onSubmit={handleVerifyOtp} className="form-content">
                                            <div className="input-group">
                                                <label><ShieldCheck size={12} /> SECURE_TOKEN</label>
                                                <input
                                                    type="text"
                                                    maxLength="6"
                                                    placeholder="000000"
                                                    className="otp-input"
                                                    value={otpInput}
                                                    onChange={(e) => setOtpInput(e.target.value)}
                                                />
                                            </div>
                                            <button className="main-btn glow-btn" disabled={isSigningUp}>
                                                {isSigningUp ? "VERIFYING..." : "COMPLETE_REGISTRATION"} <CheckCircle size={16} />
                                            </button>
                                            <div className="otp-footer">
                                                {timer > 0 ? (
                                                    <span className="cooldown">TTL_EXPIRES: {timer}S</span>
                                                ) : (
                                                    <span className="resend-link" onClick={handleSignupSubmit}>REQUEST_NEW_TOKEN</span>
                                                )}
                                                <button type="button" className="back-link" onClick={() => setStep(1)}>← TERMINATE_PROCESS</button>
                                            </div>
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

const StyledWrapper = styled.div`
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
  background-image: 
    radial-gradient(circle at 2px 2px, #111 1px, transparent 0);
  background-size: 40px 40px;
  color: #fff;
  font-family: 'JetBrains Mono', 'Inter', monospace;
  padding: 20px;

  /* Global Animations */
  .spinner-icon { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .wrapper { 
    width: 100%; 
    max-width: 440px; 
    position: relative;
  }

  /* --- Profile Card --- */
  .profile-card {
    background: #1E1E1E;
    border: 1px solid #1a1a1a;
    padding: 30px;
    text-align: center;
    position: relative;
    overflow: hidden;

    h2 { letter-spacing: 4px; font-size: 1rem; margin: 20px 0; font-weight: 900; color: #fff; }
    
    .avatar-container {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto;
    }

    .avatar {
      width: 100%; height: 100%;
      border: 1px solid #fff;
      background: #000;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: bold;
      position: relative;
      z-index: 2;
    }

    .pulse-ring {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border: 1px solid #fff;
      animation: pulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    .status-badge {
      font-size: 0.6rem; letter-spacing: 2px;
      padding: 6px 16px; border: 1px solid #222;
      margin-bottom: 30px; display: inline-flex; align-items: center; gap: 8px;
      color: #00ff41; background: #00ff4105;
      
      .dot { width: 4px; height: 4px; background: #00ff41; border-radius: 50%; box-shadow: 0 0 10px #00ff41; }
    }
    
    .action-area { display: flex; flex-direction: column; gap: 12px; }
  }

  /* --- Auth Container & Toggles --- */
  .auth-container { 
    perspective: 1200px;
  }

  .toggle-container {
    display: flex; 
    justify-content: space-between;
    align-items: center; 
    padding: 0 10px;
    margin-bottom: 25px;
    
    span { 
      font-size: 0.6rem; 
      letter-spacing: 2px; 
      color: #333; 
      cursor: pointer; 
      transition: 0.3s; 
      font-weight: 900;
    }
    
    span.active { color: #fff; text-shadow: 0 0 10px #fff; }
  }

  .switch {
    position: relative; width: 44px; height: 22px;
    input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
      background-color: #000; border: 1px solid #222; transition: .4s;
      &:before {
        position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px;
        background-color: #222; transition: .4s;
      }
    }
    input:checked + .slider { border-color: #fff; }
    input:checked + .slider:before { transform: translateX(22px); background-color: #fff; }
  }

  /* --- Flip Card --- */
  .flip-card__inner {
    position: relative; width: 100%; min-height: 520px;
    transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); transform-style: preserve-3d;
    &.is-flipped { transform: rotateY(180deg); }
  }

  .card-face {
    position: absolute; width: 100%; height: 100%;
    backface-visibility: hidden;
    background: #1E1E1E;
    border: 1px solid #1a1a1a;
    padding: 40px 30px;
    display: flex; flex-direction: column;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
  }

  .flip-card__back { transform: rotateY(180deg); }

  /* Corner Accents */
  .corner-decor {
    position: absolute; width: 20px; height: 20px; border: 1px solid #333;
    &.top-left { top: -1px; left: -1px; border-right: none; border-bottom: none; }
    &.top-right { top: -1px; right: -1px; border-left: none; border-bottom: none; }
    &.bottom-left { bottom: -1px; left: -1px; border-right: none; border-top: none; }
    &.bottom-right { bottom: -1px; right: -1px; border-left: none; border-top: none; }
  }

  .form-header {
    text-align: center; margin-bottom: 30px;
    .header-icon { color: #fff; margin-bottom: 15px; opacity: 0.8; }
    .header-icon.glow { filter: drop-shadow(0 0 8px #fff); }
    .title { font-size: 1rem; letter-spacing: 5px; font-weight: 900; color: #fff; margin-bottom: 8px;}
    .subtitle { font-size: 0.55rem; letter-spacing: 2px; color: #444; }
  }

  /* --- Inputs --- */
  .input-group {
    margin-bottom: 18px;
    label { 
      display: flex; align-items: center; gap: 8px;
      color: #555; font-size: 0.55rem; letter-spacing: 2px; margin-bottom: 8px; font-weight: 700;
    }
    input {
      width: 100%; background: #080808; border: 1px solid #1a1a1a;
      border-radius: 2px; padding: 14px; color: #fff; outline: none; transition: 0.3s;
      font-size: 0.8rem; letter-spacing: 1px;
      &:focus { border-color: #fff; background: #000; box-shadow: 0 0 15px rgba(255,255,255,0.05); }
      &::placeholder { color: #222; }
    }
    .otp-input {
        text-align: center; letter-spacing: 12px; font-size: 1.5rem; font-weight: 900; color: #fff;
    }
  }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .password-wrapper {
    position: relative;
    .eye-btn {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: #333; cursor: pointer;
      &:hover { color: #fff; }
    }
  }

  .form-footer-row { display: flex; justify-content: flex-end; margin-bottom: 10px; }
  .forgot-pwd { font-size: 0.55rem; color: #333; cursor: pointer; letter-spacing: 1px; &:hover { color: #fff; } }
  .error-text { color: #ff0033; font-size: 0.6rem; text-align: center; margin-bottom: 15px; letter-spacing: 1px; }

  /* --- Buttons --- */
  .main-btn {
    width: 100%; padding: 16px; background: #fff;
    border: 1px solid #fff; color: #000; font-weight: 900; letter-spacing: 2px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    cursor: pointer; transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); 
    font-size: 0.7rem;
    &:hover { background: transparent; color: #fff; transform: translateY(-2px); }
    &:disabled { background: #0a0a0a; color: #222; cursor: not-allowed; border: 1px solid #1a1a1a; transform: none; }
  }

  .glow-btn { box-shadow: 0 0 20px rgba(255,255,255,0.1); }

  .logout-btn {
    background: transparent; color: #ff0033; border: 1px solid #ff003330;
    &:hover { background: #ff0033; color: #000; border-color: #ff0033; }
  }

  .otp-footer {
    margin-top: 25px; text-align: center; display: flex; flex-direction: column; gap: 15px;
    .cooldown { font-size: 0.6rem; color: #444; letter-spacing: 1px; }
    .resend-link { color: #fff; cursor: pointer; font-size: 0.6rem; letter-spacing: 1px; text-decoration: underline; }
    .back-link { background: none; border: none; color: #333; font-size: 0.55rem; cursor: pointer; letter-spacing: 1px; &:hover { color: #fff; } }
  }

  /* Responsive Adjustments */
  @media (max-width: 480px) {
    padding: 15px;
    .card-face { padding: 30px 20px; }
    .wrapper { max-width: 100%; }
    .title { font-size: 0.9rem; }
    .grid-2 { grid-template-columns: 1fr; gap: 0; }
  }
`;

export default Form;