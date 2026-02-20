"use client";
import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash, FaGoogle, FaGithub } from "react-icons/fa";
import { Layout, Mail, Lock, User, LogOut, ArrowRight, CheckCircle, Loader2, ShieldCheck, Cpu, Trash2, AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Form = () => {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [isFlipped, setIsFlipped] = useState(false);

    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isEnteringDashboard, setIsEnteringDashboard] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    // Delete Account States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteEmailInput, setDeleteEmailInput] = useState("");
    const [deleteError, setDeleteError] = useState("");

    // Forgot Password States
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: otp, 3: new password
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotOtp, setForgotOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [forgotPasswordTimer, setForgotPasswordTimer] = useState(0);
    const [forgotPasswordError, setForgotPasswordError] = useState("");
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        if (token && user) {
            try {
                const parsedUser = JSON.parse(user);
                setIsAuth(true);
                setUserName(parsedUser?.name || "User");
                setUserEmail(parsedUser?.email || "");
            } catch (e) {
                localStorage.clear();
            }
        }
    }, []);

    // Handle OAuth redirect token or error (e.g. /login?token=... or /login?error=...)
    useEffect(() => {
      try {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        const errorParam = url.searchParams.get('error');
        const tokenParam = url.searchParams.get('token');
        
        // Handle OAuth error
        if (errorParam) {
          const errorMsg = decodeURIComponent(errorParam).replace(/_/g, ' ');
          let userFriendlyMsg;
          
          if (errorMsg.includes('access_denied')) {
            userFriendlyMsg = 'You denied the OAuth connection. Please try again.';
          } else if (errorMsg.includes('invalid')) {
            userFriendlyMsg = 'Invalid OAuth credentials. Please try again.';
          } else if (errorMsg.includes('email')) {
            userFriendlyMsg = 'Unable to fetch email from your account. Please use password login.';
          } else if (errorMsg.includes('timeout')) {
            userFriendlyMsg = 'OAuth connection timed out. Please try again.';
          } else if (errorMsg.includes('db_connection_failed')) {
            userFriendlyMsg = 'Database connection failed. Please try again in a moment.';
          } else if (errorMsg.includes('db_save_failed')) {
            userFriendlyMsg = 'Failed to save your profile. Please try again.';
          } else if (errorMsg.includes('oauth_server_error')) {
            userFriendlyMsg = 'OAuth server error. Please try again in a moment.';
          } else {
            userFriendlyMsg = `OAuth Error: ${errorMsg}`;
          }
          
          toast.error(userFriendlyMsg);
          url.searchParams.delete('error');
          window.history.replaceState({}, '', url.toString());
          return;
        }

        // Handle OAuth token
        if (!tokenParam) return;

        (async () => {
          const loadingToast = toast.loading('Verifying OAuth sign-in...');
          try {
            // store token and fetch user
            localStorage.setItem('token', tokenParam);
            const res = await fetch(`/api/auth/me?token=${tokenParam}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch user profile');
            localStorage.setItem('user', JSON.stringify(data.user));
            setIsAuth(true);
            setUserName(data.user?.name || 'User');
            setUserEmail(data.user?.email || '');
            toast.success(`Welcome, ${data.user?.name}! 🎉`, { id: loadingToast });
            // remove token from URL
            url.searchParams.delete('token');
            window.history.replaceState({}, '', url.toString());
            setTimeout(() => router.push('/'), 1000);
          } catch (err) {
            toast.error(err.message || 'OAuth sign-in failed. Please try again.', { id: loadingToast });
          }
        })();
      } catch (err) {
        console.error('OAuth token handling error', err);
        toast.error('An unexpected error occurred. Please try again.');
      }
    }, []);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    useEffect(() => {
        if (forgotPasswordTimer > 0) {
            const interval = setInterval(() => setForgotPasswordTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [forgotPasswordTimer]);

   

    const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setSignupError("");
        const { name, email, password } = signupData;
        if (!name || !email || !password || !confirmPassword) return setSignupError("All fields are required");
        if (!isEmailValid(email)) return setSignupError("Please enter a valid email");
        if (!validatePassword(password)) return setSignupError("Password must be at least 8 characters with uppercase, lowercase, number and special character");
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
            if (!res.ok) throw new Error(data.error || "Failed to send verification code");
            toast.success("Verification code sent to your email! Check your inbox.", { id: loadingToast });
            setStep(2);
            setTimer(60);
        } catch (err) {
            const errorMsg = err.message || "An error occurred while sending the code";
            toast.error(errorMsg, { id: loadingToast });
            setSignupError(errorMsg);
        } finally {
            setIsSigningUp(false);
        }
    };

    const handleResendCode = async () => {
        if (timer > 0) return;
        
        setIsSigningUp(true);
        const loadingToast = toast.loading("Resending verification code...");
        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: signupData.email, action: "send" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send code");
            toast.success("New code sent to your email!", { id: loadingToast });
            setTimer(60);
            setOtpInput("");
        } catch (err) {
            toast.error(err.message, { id: loadingToast });
        } finally {
            setIsSigningUp(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpInput) return toast.error("Please enter the verification code");
        setIsSigningUp(true);
        const loadingToast = toast.loading("Verifying code...");
        try {
            const verifyRes = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: signupData.email, action: "verify", otpInput }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
                if (verifyRes.status === 400) throw new Error("Invalid or expired verification code. Please request a new one.");
                throw new Error(verifyData.message || "Verification failed");
            }

            toast.loading("Creating your account...", { id: loadingToast });
            const signupRes = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupData),
            });
            const signupDataRes = await signupRes.json();
            if (!signupRes.ok) {
                if (signupRes.status === 400) throw new Error("Email already registered. Please log in.");
                throw new Error(signupDataRes.message || "Account creation failed");
            }

            toast.success("Account created successfully! Please log in.", { id: loadingToast });
            setStep(1);
            setIsFlipped(false);
            setOtpInput("");
            setSignupData({ name: "", email: "", password: "" });
            setConfirmPassword("");
        } catch (err) {
            const errorMsg = err.message || "An error occurred during verification";
            toast.error(errorMsg, { id: loadingToast });
        } finally {
            setIsSigningUp(false);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError("");
        const { email, password } = loginData;
        if (!email || !password) return setLoginError("Email and password are required");
        setIsLoggingIn(true);
        const loadingToast = toast.loading("Signing you in...");
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401) throw new Error("Invalid email or password");
                if (res.status === 404) throw new Error("Account not found. Please sign up.");
                throw new Error(data.message || "Login failed");
            }
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setIsAuth(true);
            setUserName(data.user?.name || "User");
            setUserEmail(data.user?.email || "");
            toast.success(`Welcome back, ${data.user?.name}! 🎉`, { id: loadingToast });
            setTimeout(() => (router.push("/")), 1000);
        } catch (err) {
            const errorMsg = err.message || "An error occurred during login";
            toast.error(errorMsg, { id: loadingToast });
            setLoginError(errorMsg);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        const loadingToast = toast.loading("Signing you out...");
        try {
            const token = localStorage.getItem("token");
            if (token) {
                const res = await fetch(`/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                if (!res.ok) throw new Error("Logout failed");
            }
            toast.success("You've been signed out safely. See you soon!", { id: loadingToast });
        } catch (err) {
            console.error('Logout error:', err);
            toast.error("Error during logout. Please try again.", { id: loadingToast });
        } finally {
            localStorage.clear();
            setIsAuth(false);
            setTimeout(() => router.push("/"), 1000);
            setIsLoggingOut(false);
        }
    };

    const handleDashboardClick = () => {
        setIsEnteringDashboard(true);
        router.push("/dashboard");
    };

    const handleDeleteAccount = async () => {
        setDeleteError("");
        
        // Validate email is provided
        if (!deleteEmailInput || deleteEmailInput.trim() === "") {
            setDeleteError("Please enter your email address to confirm deletion");
            return;
        }

        // Trim and validate email format
        const trimmedEmail = deleteEmailInput.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(trimmedEmail)) {
            setDeleteError("Please enter a valid email address");
            return;
        }

        // Check if email matches the account email (case-insensitive)
        const normalizedInputEmail = trimmedEmail.toLowerCase();
        const normalizedAccountEmail = userEmail.toLowerCase();
        
        if (normalizedInputEmail !== normalizedAccountEmail) {
            setDeleteError(
                `The email does not match your account. Your account email is: ${userEmail}`
            );
            return;
        }

        setIsDeleting(true);
        const loadingToast = toast.loading("Verifying email and deleting account...");

        try {
            const token = localStorage.getItem("token");
            
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            // Call delete API with the verified email
            const res = await fetch("/api/auth/delete", {
                method: "DELETE",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ email: trimmedEmail }),
            });

            const data = await res.json();
            
            if (!res.ok) {
                // Provide specific error messages based on status
                if (res.status === 401) {
                    throw new Error("Your session has expired. Please log in again.");
                } else if (res.status === 403) {
                    throw new Error("The email you entered does not match your account.");
                } else if (res.status === 404) {
                    throw new Error("Account not found. It may have already been deleted.");
                } else {
                    throw new Error(data.message || "Failed to delete your account. Please try again.");
                }
            }

            toast.success("Account and all associated data deleted successfully", { id: loadingToast });
            
            // Clear all local data
            localStorage.clear();
            sessionStorage.clear();
            setIsAuth(false);
            setShowDeleteModal(false);
            setDeleteEmailInput("");
            setDeleteError("");
            
            // Redirect to home page
            setTimeout(() => router.push("/"), 1500);
        } catch (err) {
            const errorMsg = err.message || "An error occurred while deleting your account. Please try again.";
            console.error("Account deletion error:", errorMsg);
            toast.error(errorMsg, { id: loadingToast });
            setDeleteError(errorMsg);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleOAuth = (provider) => {
      // navigate to API which will redirect to provider
      window.location.href = `/api/auth/${provider}`;
    };

    const handleCloseDeleteModal = () => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setDeleteEmailInput("");
            setDeleteError("");
        }
    };

    // Forgot Password Functions
    const handleForgotPasswordEmail = async (e) => {
        e.preventDefault();
        setForgotPasswordError("");
        
        if (!forgotEmail) return setForgotPasswordError("Email is required");
        if (!isEmailValid(forgotEmail)) return setForgotPasswordError("Please enter a valid email");

        setIsResettingPassword(true);
        const loadingToast = toast.loading("Sending reset code...");
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail, action: "send" }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 404) throw new Error("Email not found. Please check your email address.");
                throw new Error(data.error || "Failed to send reset code");
            }
            toast.success("Reset code sent to your email! Check your inbox and spam folder.", { id: loadingToast });
            setForgotPasswordStep(2);
            setForgotPasswordTimer(600); // 10 minutes
        } catch (err) {
            const errorMsg = err.message || "An error occurred while sending the reset code";
            toast.error(errorMsg, { id: loadingToast });
            setForgotPasswordError(errorMsg);
        } finally {
            setIsResettingPassword(false);
        }
    };

    const handleResendForgotPasswordCode = async () => {
        if (forgotPasswordTimer > 0) return;
        
        setIsResettingPassword(true);
        const loadingToast = toast.loading("Resending reset code...");
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail, action: "send" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send code");
            toast.success("New code sent to your email!", { id: loadingToast });
            setForgotPasswordTimer(60);
            setForgotOtp("");
        } catch (err) {
            toast.error(err.message, { id: loadingToast });
        } finally {
            setIsResettingPassword(false);
        }
    };

    const handleVerifyForgotPasswordOtp = async (e) => {
        e.preventDefault();
        setForgotPasswordError("");
        
        if (!forgotOtp) return setForgotPasswordError("Please enter the code");

        setIsResettingPassword(true);
        const loadingToast = toast.loading("Verifying code...");
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail, action: "verify", otpInput: forgotOtp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Invalid or expired code");
            toast.success("Code verified!", { id: loadingToast });
            setForgotPasswordStep(3);
        } catch (err) {
            toast.error(err.message, { id: loadingToast });
            setForgotPasswordError(err.message);
        } finally {
            setIsResettingPassword(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setForgotPasswordError("");
        
        if (!forgotOtp) return setForgotPasswordError("Reset code is required");
        if (!newPassword || !confirmNewPassword) return setForgotPasswordError("All password fields are required");
        if (!validatePassword(newPassword)) return setForgotPasswordError("Password must be at least 8 characters with uppercase, lowercase, number and special character");
        if (newPassword !== confirmNewPassword) return setForgotPasswordError("Passwords do not match");

        setIsResettingPassword(true);
        const loadingToast = toast.loading("Resetting your password...");
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: forgotEmail, 
                    otpInput: forgotOtp,
                    newPassword 
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 400) throw new Error("Invalid or expired reset code. Please request a new one.");
                if (res.status === 404) throw new Error("Account not found. Please check your email.");
                throw new Error(data.message || "Password reset failed");
            }
            toast.success("Password reset successfully! You can now log in with your new password.", { id: loadingToast });
            setShowForgotPassword(false);
            setForgotPasswordStep(1);
            setForgotEmail("");
            setForgotOtp("");
            setNewPassword("");
            setConfirmNewPassword("");
            setForgotPasswordError("");
            setForgotPasswordTimer(0);
            setIsFlipped(false);
        } catch (err) {
            const errorMsg = err.message || "An error occurred while resetting your password";
            toast.error(errorMsg, { id: loadingToast });
            setForgotPasswordError(errorMsg);
        } finally {
            setIsResettingPassword(false);
        }
    };

    const closeForgotPasswordModal = () => {
        if (!isResettingPassword) {
            setShowForgotPassword(false);
            setForgotPasswordStep(1);
            setForgotEmail("");
            setForgotOtp("");
            setNewPassword("");
            setConfirmNewPassword("");
            setForgotPasswordError("");
            setForgotPasswordTimer(0);
        }
    };

    return (
        <StyledWrapper>
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#000',
                        color: '#fff',
                        border: '2px solid #fff',
                        borderRadius: '0',
                        fontSize: '13px',
                        fontWeight: '600',
                        letterSpacing: '0.5px',
                        padding: '16px 20px'
                    }
                }}
            />

            {/* DELETE ACCOUNT MODAL */}
            {showDeleteModal && (
                <ModalOverlay onClick={handleCloseDeleteModal}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <CloseButton onClick={handleCloseDeleteModal} disabled={isDeleting}>
                            <X size={20} />
                        </CloseButton>
                        
                        <div className="modal-header">
                            <AlertTriangle size={48} />
                            <h3>Delete Account</h3>
                            <p className="modal-subtitle">This action cannot be undone</p>
                        </div>
                        
                        <div className="modal-body">
                            <div className="warning-box">
                                <AlertTriangle size={18} />
                                <div>
                                    <p className="warning-title">Permanent Action</p>
                                    <p className="warning-text">All your data will be permanently deleted</p>
                                </div>
                            </div>
                            
                            <div className="current-email-box">
                                <label>Your current email</label>
                                <div className="email-display">
                                    <Mail size={16} />
                                    <span>{userEmail}</span>
                                </div>
                            </div>
                            
                            <div className="input-group">
                                <label>Type your email to confirm</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={deleteEmailInput}
                                    onChange={(e) => {
                                        setDeleteEmailInput(e.target.value);
                                        setDeleteError("");
                                    }}
                                    disabled={isDeleting}
                                    autoFocus
                                />
                            </div>
                            
                            {deleteError && <p className="error-text">{deleteError}</p>}
                        </div>
                        
                        <div className="modal-actions">
                            <button 
                                className="cancel-btn" 
                                onClick={handleCloseDeleteModal}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button 
                                className="delete-btn" 
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 size={18} className="spinner-icon" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={18} />
                                        Delete Account
                                    </>
                                )}
                            </button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* FORGOT PASSWORD MODAL */}
            {showForgotPassword && (
                <ModalOverlay onClick={closeForgotPasswordModal}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <CloseButton onClick={closeForgotPasswordModal} disabled={isResettingPassword}>
                            <X size={20} />
                        </CloseButton>
                        
                        {forgotPasswordStep === 1 && (
                            <>
                                <div className="modal-header">
                                    <Lock size={48} />
                                    <h3>Reset Password</h3>
                                    <p className="modal-subtitle">Enter your email to receive a reset code</p>
                                </div>
                                
                                <form onSubmit={handleForgotPasswordEmail}>
                                    <div className="modal-body">
                                        <div className="input-group">
                                            <label><Mail size={14} /> Email Address</label>
                                            <input
                                                type="email"
                                                placeholder="you@example.com"
                                                value={forgotEmail}
                                                onChange={(e) => {
                                                    setForgotEmail(e.target.value);
                                                    setForgotPasswordError("");
                                                }}
                                                disabled={isResettingPassword}
                                                autoFocus
                                            />
                                        </div>
                                        {forgotPasswordError && <p className="error-text">{forgotPasswordError}</p>}
                                    </div>
                                    
                                    <div className="modal-actions">
                                        <button 
                                            type="button"
                                            className="cancel-btn" 
                                            onClick={closeForgotPasswordModal}
                                            disabled={isResettingPassword}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            className="submit-btn" 
                                            disabled={isResettingPassword}
                                        >
                                            {isResettingPassword ? (
                                                <>
                                                    <Loader2 size={18} className="spinner-icon" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    Send Code
                                                    <ArrowRight size={18} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {forgotPasswordStep === 2 && (
                            <>
                                <div className="modal-header">
                                    <ShieldCheck size={48} />
                                    <h3>Verify Code</h3>
                                    <p className="modal-subtitle">Enter code sent to {forgotEmail}</p>
                                </div>
                                
                                <form onSubmit={handleVerifyForgotPasswordOtp}>
                                    <div className="modal-body">
                                        <div className="input-group">
                                            <label><ShieldCheck size={14} /> Verification Code</label>
                                            <input
                                                type="text"
                                                maxLength="6"
                                                placeholder="000000"
                                                className="otp-input"
                                                value={forgotOtp}
                                                onChange={(e) => {
                                                    setForgotOtp(e.target.value);
                                                    setForgotPasswordError("");
                                                }}
                                                disabled={isResettingPassword}
                                                autoFocus
                                            />
                                        </div>
                                        
                                        <div className="otp-footer">
                                            {forgotPasswordTimer > 0 ? (
                                                <span className="cooldown">Resend code in {forgotPasswordTimer}s</span>
                                            ) : (
                                                <button 
                                                    type="button"
                                                    className="resend-link" 
                                                    onClick={handleResendForgotPasswordCode}
                                                    disabled={isResettingPassword}
                                                >
                                                    Resend Code
                                                </button>
                                            )}
                                        </div>

                                        {forgotPasswordError && <p className="error-text">{forgotPasswordError}</p>}
                                    </div>
                                    
                                    <div className="modal-actions">
                                        <button 
                                            type="button"
                                            className="cancel-btn" 
                                            onClick={() => setForgotPasswordStep(1)}
                                            disabled={isResettingPassword}
                                        >
                                            ← Back
                                        </button>
                                        <button 
                                            type="submit"
                                            className="submit-btn" 
                                            disabled={isResettingPassword}
                                        >
                                            {isResettingPassword ? (
                                                <>
                                                    <Loader2 size={18} className="spinner-icon" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    Verify
                                                    <CheckCircle size={18} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {forgotPasswordStep === 3 && (
                            <>
                                <div className="modal-header">
                                    <Lock size={48} />
                                    <h3>New Password</h3>
                                    <p className="modal-subtitle">Create a new password for your account</p>
                                </div>
                                
                                <form onSubmit={handleResetPassword}>
                                    <div className="modal-body">
                                        <div className="input-group">
                                            <label><Lock size={14} /> New Password</label>
                                            <div className="password-wrapper">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter new password"
                                                    value={newPassword}
                                                    onChange={(e) => {
                                                        setNewPassword(e.target.value);
                                                        setForgotPasswordError("");
                                                    }}
                                                    disabled={isResettingPassword}
                                                />
                                                <button 
                                                    type="button" 
                                                    className="eye-btn" 
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="input-group">
                                            <label><CheckCircle size={14} /> Confirm Password</label>
                                            <div className="password-wrapper">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Confirm new password"
                                                    value={confirmNewPassword}
                                                    onChange={(e) => {
                                                        setConfirmNewPassword(e.target.value);
                                                        setForgotPasswordError("");
                                                    }}
                                                    disabled={isResettingPassword}
                                                />
                                                <button 
                                                    type="button" 
                                                    className="eye-btn" 
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </div>

                                        {forgotPasswordError && <p className="error-text">{forgotPasswordError}</p>}
                                    </div>
                                    
                                    <div className="modal-actions">
                                        <button 
                                            type="button"
                                            className="cancel-btn" 
                                            onClick={() => setForgotPasswordStep(2)}
                                            disabled={isResettingPassword}
                                        >
                                            ← Back
                                        </button>
                                        <button 
                                            type="submit"
                                            className="submit-btn" 
                                            disabled={isResettingPassword}
                                        >
                                            {isResettingPassword ? (
                                                <>
                                                    <Loader2 size={18} className="spinner-icon" />
                                                    Resetting...
                                                </>
                                            ) : (
                                                <>
                                                    Reset Password
                                                    <CheckCircle size={18} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </ModalContent>
                </ModalOverlay>
            )}

            <div className="wrapper">
                {isAuth ? (
                    <ProfileCard>
                        <div className="avatar-container">
                            <div className="avatar">{userName[0]?.toUpperCase()}</div>
                            <div className="pulse-ring"></div>
                            <div className="pulse-ring delay"></div>
                        </div>
                        <h2>{userName}</h2>
                        <p className="user-email">{userEmail}</p>
                        <div className="status-badge">
                            <span className="dot"></span> 
                            <span>Active</span>
                        </div>
                        <div className="action-area">
                            <button className="main-btn primary-btn" onClick={handleDashboardClick} disabled={isEnteringDashboard}>
                                {isEnteringDashboard ? (
                                    <>
                                        <Loader2 size={18} className="spinner-icon" />
                                        Loading Dashboard...
                                    </>
                                ) : (
                                    <>
                                        <Layout size={18} />
                                        Open Dashboard
                                    </>
                                )}
                            </button>
                            <button className="main-btn secondary-btn" onClick={handleLogout} disabled={isLoggingOut}>
                                <LogOut size={18} /> 
                                {isLoggingOut ? "Logging out..." : "Sign Out"}
                            </button>
                            <button 
                                className="main-btn danger-btn" 
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <Trash2 size={18} /> 
                                Delete Account
                            </button>
                        </div>
                    </ProfileCard>
                ) : (
                    <AuthContainer>
                        <div className="toggle-container">
                            <button 
                                className={`toggle-option ${!isFlipped ? "active" : ""}`} 
                                onClick={() => setIsFlipped(false)}
                            >
                                Sign In
                            </button>
                           
                            <button 
                                className={`toggle-option ${isFlipped ? "active" : ""}`} 
                                onClick={() => setIsFlipped(true)}
                            >
                                Sign Up
                            </button>
                        </div>

                        <div className={`flip-card__inner ${isFlipped ? 'is-flipped' : ''}`}>
                            {/* LOGIN CARD */}
                            <CardFace className="flip-card__front">
                                <div className="form-header">
                                    <div className="icon-wrapper">
                                        <Cpu size={40} />
                                    </div>
                                    <h3>Welcome Back</h3>
                                    <p className="subtitle">Sign in to your account</p>
                                </div>
                                <form onSubmit={handleLoginSubmit} className="form-content">
                                    <div className="input-group">
                                        <label>
                                            <Mail size={14} /> 
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            value={loginData.email}
                                            onChange={(e) => { 
                                                setLoginData({ ...loginData, email: e.target.value }); 
                                                setLoginError(""); 
                                            }}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>
                                            <Lock size={14} /> 
                                            Password
                                        </label>
                                        <div className="password-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                value={loginData.password}
                                                onChange={(e) => { 
                                                    setLoginData({ ...loginData, password: e.target.value }); 
                                                    setLoginError(""); 
                                                }}
                                            />
                                            <button 
                                                type="button" 
                                                className="eye-btn" 
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-footer-row">
                                        <span 
                                            className="forgot-pwd" 
                                            onClick={() => setShowForgotPassword(true)}
                                        >
                                            Forgot password?
                                        </span>
                                    </div>
                                    {loginError && <p className="error-text">{loginError}</p>}
                                    <button className="main-btn submit-btn" type="submit" disabled={isLoggingIn}>
                                        {isLoggingIn ? (
                                            <>
                                                <Loader2 size={18} className="spinner-icon" />
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                Sign In
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                    <div style={{ marginTop: 12, display: 'flex', gap: 10, flexDirection: 'column' }}>
                                      <button type="button" className="main-btn secondary-btn" onClick={() => handleOAuth('google')}><FaGoogle size={16} style={{marginRight: '8px'}} />Sign in with Google</button>
                                      <button type="button" className="main-btn secondary-btn" onClick={() => handleOAuth('github')}><FaGithub size={16} style={{marginRight: '8px'}} />Sign in with GitHub</button>
                                    </div>
                                    
                                </form>
                            </CardFace>

                            {/* SIGNUP CARD */}
                            <CardFace className="flip-card__back">
                                {step === 1 ? (
                                    <>
                                        <div className="form-header">
                                            <div className="icon-wrapper">
                                                <User size={40} />
                                            </div>
                                            <h3>Create Account</h3>
                                            <p className="subtitle">Join us today</p>
                                        </div>
                                        <form onSubmit={handleSignupSubmit} className="form-content">
                                            <div className="input-group">
                                                <label>
                                                    <User size={14} /> 
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="John Doe"
                                                    value={signupData.name}
                                                    onChange={(e) => { 
                                                        setSignupData({ ...signupData, name: e.target.value }); 
                                                        setSignupError(""); 
                                                    }}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>
                                                    <Mail size={14} /> 
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    value={signupData.email}
                                                    onChange={(e) => { 
                                                        setSignupData({ ...signupData, email: e.target.value }); 
                                                        setSignupError(""); 
                                                    }}
                                                />
                                            </div>
                                            <div className="grid-2">
                                                <div className="input-group">
                                                    <label>
                                                        <Lock size={14} /> 
                                                        Password
                                                    </label>
                                                    <div className="password-wrapper">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            value={signupData.password}
                                                            onChange={(e) => { 
                                                                setSignupData({ ...signupData, password: e.target.value }); 
                                                                setSignupError(""); 
                                                            }}
                                                        />
                                                        <button 
                                                            type="button" 
                                                            className="eye-btn" 
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="input-group">
                                                    <label>
                                                        <CheckCircle size={14} /> 
                                                        Confirm
                                                    </label>
                                                    <div className="password-wrapper">
                                                        <input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            value={confirmPassword}
                                                            onChange={(e) => { 
                                                                setConfirmPassword(e.target.value); 
                                                                setSignupError(""); 
                                                            }}
                                                        />
                                                        <button 
                                                            type="button" 
                                                            className="eye-btn" 
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        >
                                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {signupError && <p className="error-text">{signupError}</p>}
                                            <button className="main-btn submit-btn" type="submit" disabled={isSigningUp}>
                                                {isSigningUp ? (
                                                    <>
                                                        <Loader2 size={18} className="spinner-icon" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Create Account
                                                        <ArrowRight size={18} />
                                                    </>
                                                )}
                                            </button>
                                              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexDirection: 'column' }}>
                                                <button type="button" className="main-btn secondary-btn" onClick={() => handleOAuth('google')}><FaGoogle size={16} style={{marginRight: '8px'}} />Sign up with Google</button>
                                                <button type="button" className="main-btn secondary-btn" onClick={() => handleOAuth('github')}><FaGithub size={16} style={{marginRight: '8px'}} />Sign up with GitHub</button>
                                              </div>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-header">
                                            <div className="icon-wrapper glow">
                                                <ShieldCheck size={40} />
                                            </div>
                                            <h3>Verify Email</h3>
                                            <p className="subtitle">Enter code sent to {signupData.email}</p>
                                        </div>
                                        <form onSubmit={handleVerifyOtp} className="form-content">
                                            <div className="input-group">
                                                <label>
                                                    <ShieldCheck size={14} /> 
                                                    Verification Code
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength="6"
                                                    placeholder="000000"
                                                    className="otp-input"
                                                    value={otpInput}
                                                    onChange={(e) => setOtpInput(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <button className="main-btn submit-btn glow-btn" type="submit" disabled={isSigningUp}>
                                                {isSigningUp ? (
                                                    <>
                                                        <Loader2 size={18} className="spinner-icon" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        Verify & Complete
                                                        <CheckCircle size={18} />
                                                    </>
                                                )}
                                            </button>
                                            <div className="otp-footer">
                                                {timer > 0 ? (
                                                    <span className="cooldown">Resend code in {timer}s</span>
                                                ) : (
                                                    <button 
                                                        type="button"
                                                        className="resend-link" 
                                                        onClick={handleResendCode}
                                                        disabled={isSigningUp}
                                                    >
                                                        Resend Code
                                                    </button>
                                                )}
                                                <button 
                                                    type="button" 
                                                    className="back-link" 
                                                    onClick={() => {
                                                        setStep(1);
                                                        setOtpInput("");
                                                    }}
                                                >
                                                    ← Back to Sign Up
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </CardFace>
                        </div>
                    </AuthContainer>
                )}
            </div>
        </StyledWrapper>
    );
};

/* ANIMATIONS */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { 
    transform: scale(1); 
    opacity: 0.8; 
  }
  50% { 
    transform: scale(1.8); 
    opacity: 0; 
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

/* STYLED COMPONENTS */
const StyledWrapper = styled.div`
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  padding: 20px;
  position: relative;

  .spinner-icon { 
    animation: ${spin} 1s linear infinite; 
  }

  .wrapper { 
    width: 100%; 
    max-width: 480px; 
    position: relative;
    z-index: 2;
  }
`;

const ProfileCard = styled.div`
  background: linear-gradient(145deg, #1a1a1a, #0f0f0f);
  padding: 50px 35px;
  text-align: center;
  position: relative;
  overflow: hidden;
  border: 2px solid #2a2a2a;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  animation: ${slideUp} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.05),
      transparent
    );
    transition: left 0.6s;
  }

  &:hover {
    transform: translateY(-8px);
    border-color: #fff;
    box-shadow: 
      0 30px 80px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);

    &::before {
      left: 100%;
    }
  }

  h2 { 
    font-size: 1.75rem;
    font-weight: 700;
    margin: 25px 0 8px;
    color: #fff;
    letter-spacing: -0.5px;
  }
  
  .user-email {
    font-size: 0.9rem;
    color: #888;
    margin-bottom: 25px;
    font-weight: 400;
  }
  
  .avatar-container {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 0 auto 10px;
  }

  .avatar {
    width: 100%;
    height: 100%;
    border: 3px solid #fff;
    background: linear-gradient(135deg, #222, #000);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: 700;
    position: relative;
    z-index: 2;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .pulse-ring {
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border: 2px solid rgba(255, 255, 255, 0.5);
    animation: ${pulse} 2.5s cubic-bezier(0.24, 0, 0.38, 1) infinite;
    z-index: 1;
    
    &.delay {
      animation-delay: 0.3s;
      border-color: rgba(255, 255, 255, 0.3);
    }
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    background: rgba(0, 255, 100, 0.1);
    border: 1px solid rgba(0, 255, 100, 0.3);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #00ff64;
    margin-bottom: 35px;
    text-transform: uppercase;
    
    .dot {
      width: 6px;
      height: 6px;
      background: #00ff64;
      border-radius: 50%;
      box-shadow: 0 0 12px #00ff64;
      animation: ${pulse} 2s ease-in-out infinite;
    }
  }
  
  .action-area {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* PERFECT BUTTON STYLES FOR PROFILE CARD */
  .main-btn {
    width: 100%;
    padding: 16px 24px;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 2px solid;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
      z-index: 0;
    }

    &:hover:not(:disabled)::before {
      width: 300px;
      height: 300px;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    &:not(:disabled):active {
      transform: scale(0.97);
    }

    svg {
      position: relative;
      z-index: 1;
    }

    & > * {
      position: relative;
      z-index: 1;
    }
  }

  .primary-btn {
    background: #fff;
    border-color: #fff;
    color: #000;
    box-shadow: 
      0 4px 15px rgba(255, 255, 255, 0.2),
      inset 0 -2px 0 rgba(0, 0, 0, 0.1);
    
    &:hover:not(:disabled) {
      background: #000;
      color: #fff;
      border-color: #fff;
      box-shadow: 
        0 0 0 4px rgba(255, 255, 255, 0.2),
        0 10px 40px rgba(255, 255, 255, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      transform: translateY(-3px);
    }

    &:active:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 
        0 0 0 4px rgba(255, 255, 255, 0.2),
        0 5px 20px rgba(255, 255, 255, 0.2);
    }
  }

  .secondary-btn {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
    box-shadow: inset 0 0 0 rgba(255, 255, 255, 0);
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.05);
      border-color: #fff;
      box-shadow: 
        0 0 0 4px rgba(255, 255, 255, 0.1),
        0 8px 30px rgba(255, 255, 255, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transform: translateY(-3px);
    }

    &:active:not(:disabled) {
      transform: translateY(-1px);
    }
  }

  .danger-btn {
    background: transparent;
    border-color: rgba(255, 68, 68, 0.4);
    color: #ff4444;
    box-shadow: inset 0 0 0 rgba(255, 68, 68, 0);
    
    &:hover:not(:disabled) {
      background: rgba(255, 68, 68, 0.1);
      border-color: #ff4444;
      color: #ff4444;
      box-shadow: 
        0 0 0 4px rgba(255, 68, 68, 0.15),
        0 8px 30px rgba(255, 68, 68, 0.3),
        inset 0 1px 0 rgba(255, 68, 68, 0.2);
      transform: translateY(-3px);
    }

    &:active:not(:disabled) {
      transform: translateY(-1px);
    }
  }

  @media (max-width: 480px) {
    padding: 40px 25px;
  }
`;

const AuthContainer = styled.div`
  perspective: 1500px;
  animation: ${fadeIn} 0.5s ease;

  .toggle-container {
  margin-top: -350px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px;
    margin-bottom: 30px;
    position: relative;
    z-index: 10;
    
    .toggle-option {
      background: none;
      border: none;
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #555;
      cursor: pointer;
      transition: all 0.3s;
      padding: 8px 12px;
      position: relative;
      z-index: 10;
      
      &.active {
        color: #fff;
        text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
      }

      &:hover:not(.active) {
        color: #888;
      }
    }
  }

  .switch-wrapper {
    position: relative;
    z-index: 10;
  }

  .switch {
    position: relative;
    width: 50px;
    height: 26px;
    
    input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #1a1a1a;
      border: 2px solid #333;
      transition: 0.4s;
      border-radius: 100px;
      
      &:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 3px;
        bottom: 3px;
        background: #555;
        transition: 0.4s;
        border-radius: 50%;
      }
    }
    
    input:checked + .slider {
      background: #fff;
      border-color: #fff;
    }
    
    input:checked + .slider:before {
      transform: translateX(24px);
      background: #000;
    }
  }

  .flip-card__inner {
    position: relative;
    width: 100%;
    min-height: unset;
    transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-style: preserve-3d;
    
    &.is-flipped {
      transform: rotateY(180deg);
    }
  }

  @media (max-width: 400px) {
    .flip-card__inner {
      min-height: unset;
    }
  }
`;

const CardFace = styled.div`
  position: absolute;
  width: 100%;
  min-height: 100%;
  backface-visibility: hidden;
  background: linear-gradient(145deg, #1a1a1a, #0f0f0f);
  border: 2px solid #2a2a2a;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  overflow: visible;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.05),
      transparent
    );
    transition: left 0.6s;
    pointer-events: none;
    z-index: 0;
  }

  &:hover {
    border-color: #fff;
    box-shadow: 
      0 30px 90px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transform: translateY(-5px);

    &::before {
      left: 100%;
    }
  }

  &.flip-card__back {
    transform: rotateY(180deg);

    &:hover {
      transform: rotateY(180deg) translateY(-5px);
    }
  }

  /* Ensure form content is above the shimmer effect */
  .form-header,
  .form-content {
    position: relative;
    z-index: 1;
  }

  .form-header {
    text-align: center;
    margin-bottom: 18px;
    
    .icon-wrapper {
      display: inline-flex;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 12px;
      transition: all 0.3s;
      
      svg {
        color: #fff;
      }

      &.glow {
        background: rgba(255, 255, 255, 0.1);
        border-color: #fff;
        box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
        
        svg {
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
        }
      }
    }
    
    h3 {
      font-size: 1.3rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    }
    
    .subtitle {
      font-size: 0.8rem;
      color: #888;
      font-weight: 400;
    }

    .modal-subtitle {
      font-size: 0.85rem;
      color: #888;
      margin-top: 8px;
    }
  }

  .input-group {
    margin-bottom: 12px;
    
    label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #aaa;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 10px;
      letter-spacing: 0.3px;
    }
    
    input {
      width: 100%;
      background: #0a0a0a;
      border: 2px solid #222;
      border-radius: 6px;
      padding: 10px 12px;
      color: #fff;
      outline: none;
      transition: all 0.3s;
      font-size: 0.95rem;
      font-weight: 400;
      
      &:focus {
        border-color: #fff;
        background: #000;
        box-shadow: 
          0 0 0 3px rgba(255, 255, 255, 0.1),
          0 0 20px rgba(255, 255, 255, 0.05);
      }
      
      &::placeholder {
        color: #444;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .otp-input {
      text-align: center;
      letter-spacing: 16px;
      font-size: 1.8rem;
      font-weight: 700;
      padding: 18px;
    }
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  .password-wrapper {
    position: relative;
    
    .eye-btn {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #555;
      cursor: pointer;
      padding: 4px;
      transition: color 0.2s;
      z-index: 10;
      
      &:hover {
        color: #fff;
      }
    }
  }

  .form-footer-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }
  
  .forgot-pwd {
    font-size: 0.85rem;
    color: #888;
    cursor: pointer;
    font-weight: 500;
    transition: color 0.2s;
    
    &:hover {
      color: #fff;
    }
  }
  
  .error-text {
    color: #ff4444;
    font-size: 0.85rem;
    text-align: center;
    margin-bottom: 18px;
    font-weight: 500;
    padding: 12px;
    background: rgba(255, 68, 68, 0.1);
    border: 1px solid rgba(255, 68, 68, 0.3);
    border-radius: 4px;
  }

  /* PERFECT BUTTON STYLES */
  .main-btn {
    width: 100%;
    padding: 16px 24px;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 2px solid;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
    text-transform: none;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
      z-index: 0;
    }

    &:hover:not(:disabled)::before {
      width: 300px;
      height: 300px;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    &:not(:disabled):active {
      transform: scale(0.97);
    }

    svg {
      position: relative;
      z-index: 1;
    }

    & > * {
      position: relative;
      z-index: 1;
    }
  }

  .submit-btn {
    background: #fff;
    border-color: #fff;
    color: #000;
    box-shadow: 
      0 4px 15px rgba(255, 255, 255, 0.2),
      inset 0 -2px 0 rgba(0, 0, 0, 0.1);
    
    &:hover:not(:disabled) {
      background: #000;
      color: #fff;
      border-color: #fff;
      box-shadow: 
        0 0 0 4px rgba(255, 255, 255, 0.2),
        0 10px 40px rgba(255, 255, 255, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      transform: translateY(-3px);
    }

    &:active:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 
        0 0 0 4px rgba(255, 255, 255, 0.2),
        0 5px 20px rgba(255, 255, 255, 0.2);
    }
  }

  .glow-btn {
    animation: ${shimmer} 3s linear infinite;
    background-size: 200% 100%;
    box-shadow: 
      0 0 30px rgba(255, 255, 255, 0.3),
      inset 0 0 20px rgba(255, 255, 255, 0.1);
  }

  .otp-footer {
    margin-top: 16px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
    
    .cooldown {
      font-size: 0.85rem;
      color: #666;
      font-weight: 500;
    }
    
    .resend-link {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: underline;
      transition: opacity 0.2s;
      padding: 8px;
      
      &:hover:not(:disabled) {
        opacity: 0.8;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .back-link {
      background: none;
      border: none;
      color: #888;
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 500;
      transition: color 0.2s;
      padding: 8px;
      
      &:hover {
        color: #fff;
      }
    }
  }

  @media (max-width: 480px) {
    padding: 30px 20px;
    
    .form-header {
      margin-bottom: 25px;
      
      h3 { 
        font-size: 1.5rem; 
      }
      
      .icon-wrapper { 
        padding: 14px; 
        margin-bottom: 12px;
        margin-top: 0;
      }
    }

    .input-group {
      margin-bottom: 16px;
      
      input {
        padding: 12px 14px;
      }
    }
    
    .grid-2 {
      gap: 12px;
    }
    
    .main-btn {
      padding: 14px 20px;
      font-size: 0.9rem;
    }

    .error-text {
      margin-bottom: 14px;
      padding: 10px;
    }

    .otp-footer {
      margin-top: 20px;
      gap: 12px;
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(12px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.3s ease;
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, #1a1a1a, #0f0f0f);
  border: 2px solid #2a2a2a;
  border-radius: 8px;
  max-width: 520px;
  width: 100%;
  padding: 40px 35px;
  position: relative;
  animation: ${slideUp} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 
    0 30px 80px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  max-height: 90vh;
  overflow-y: auto;

  .modal-header {
    text-align: center;
    margin-bottom: 35px;

    svg {
      color: #fff;
      filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.3));
      margin-bottom: 18px;
    }
    
    h3 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }

    .modal-subtitle {
      font-size: 0.9rem;
      color: #888;
      font-weight: 400;
    }
  }

  .modal-body {
    margin-bottom: 30px;

    .warning-box {
      background: rgba(255, 68, 68, 0.08);
      border: 2px solid rgba(255, 68, 68, 0.3);
      border-radius: 6px;
      padding: 18px;
      margin-bottom: 28px;
      display: flex;
      align-items: flex-start;
      gap: 14px;

      svg {
        color: #ff4444;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .warning-title {
        font-size: 0.95rem;
        font-weight: 700;
        color: #ff4444;
        margin-bottom: 4px;
      }

      .warning-text {
        font-size: 0.85rem;
        color: #ff8888;
        font-weight: 400;
        line-height: 1.5;
      }
    }

    .current-email-box {
      margin-bottom: 24px;

      label {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: #aaa;
        margin-bottom: 10px;
        letter-spacing: 0.3px;
      }

      .email-display {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: #0a0a0a;
        border: 2px solid #222;
        border-radius: 6px;
        
        svg {
          color: #666;
          flex-shrink: 0;
        }

        span {
          font-size: 0.95rem;
          color: #fff;
          font-weight: 500;
        }
      }
    }

    .input-group {
      margin-bottom: 20px;

      label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #aaa;
        margin-bottom: 10px;
        letter-spacing: 0.3px;
      }

      input {
        width: 100%;
        background: #0a0a0a;
        border: 2px solid #222;
        border-radius: 6px;
        padding: 14px 16px;
        color: #fff;
        outline: none;
        transition: all 0.3s;
        font-size: 0.95rem;
        
        &:focus {
          border-color: #fff;
          background: #000;
          box-shadow: 
            0 0 0 3px rgba(255, 255, 255, 0.1),
            0 0 20px rgba(255, 255, 255, 0.05);
        }
        
        &::placeholder {
          color: #444;
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .otp-input {
        text-align: center;
        letter-spacing: 12px;
        font-size: 1.5rem;
        font-weight: 700;
        padding: 16px;
      }
    }

    .password-wrapper {
      position: relative;

      .eye-btn {
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #555;
        cursor: pointer;
        padding: 4px;
        transition: color 0.2s;
        z-index: 10;
        
        &:hover {
          color: #fff;
        }
      }
    }

    .error-text {
      color: #ff4444;
      font-size: 0.85rem;
      margin-top: 12px;
      font-weight: 500;
      padding: 12px;
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid rgba(255, 68, 68, 0.3);
      border-radius: 4px;
    }

    .otp-footer {
      margin-top: 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .cooldown {
        font-size: 0.85rem;
        color: #666;
        font-weight: 500;
      }
      
      .resend-link {
        background: none;
        border: none;
        color: #fff;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        text-decoration: underline;
        transition: opacity 0.2s;
        padding: 8px;
        
        &:hover:not(:disabled) {
          opacity: 0.8;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }

  .modal-actions {
    display: flex;
    gap: 14px;

    button {
      flex: 1;
      padding: 16px 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border-radius: 8px;
      border: 2px solid;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
        z-index: 0;
      }

      &:hover:not(:disabled)::before {
        width: 300px;
        height: 300px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
      }

      &:not(:disabled):active {
        transform: scale(0.97);
      }

      svg {
        position: relative;
        z-index: 1;
      }

      & > * {
        position: relative;
        z-index: 1;
      }
    }

    .cancel-btn {
      background: transparent;
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.05);
        border-color: #fff;
        box-shadow: 
          0 0 0 4px rgba(255, 255, 255, 0.1),
          0 8px 30px rgba(255, 255, 255, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transform: translateY(-3px);
      }

      &:active:not(:disabled) {
        transform: translateY(-1px);
      }
    }

    .delete-btn,
    .submit-btn {
      background: #fff;
      border-color: #fff;
      color: #000;
      box-shadow: 
        0 4px 15px rgba(255, 255, 255, 0.3);

      &:hover:not(:disabled) {
        background: #000;
        border-color: #fff;
        color: #fff;
        box-shadow: 
          0 0 0 4px rgba(255, 255, 255, 0.2),
          0 10px 40px rgba(255, 255, 255, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
        transform: translateY(-3px);
      }

      &:active:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 
          0 0 0 4px rgba(255, 255, 255, 0.2),
          0 5px 20px rgba(255, 255, 255, 0.3);
      }
    }

    .delete-btn {
      background: #ff4444;
      border-color: #ff4444;
      color: #fff;

      &:hover:not(:disabled) {
        background: #cc0000;
        border-color: #cc0000;
        color: #fff;
        box-shadow: 
          0 0 0 4px rgba(255, 68, 68, 0.2),
          0 10px 40px rgba(255, 68, 68, 0.5);
      }
    }
  }

  @media (max-width: 480px) {
    padding: 30px 25px;

    .modal-actions {
      flex-direction: column;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #888;
  transition: all 0.3s;
  z-index: 100;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #fff;
    color: #fff;
    transform: rotate(90deg);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

export default Form;