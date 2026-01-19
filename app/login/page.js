"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Form = () => {
    const [isAuth, setIsAuth] = useState(false);
    const [userName, setUserName] = useState("");

    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const [signupData, setSignupData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });

    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // 🔴 Hook-based error messages
    const [signupError, setSignupError] = useState("");
    const [loginError, setLoginError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        if (token && user) {
            setIsAuth(true);
            try {
                setUserName(JSON.parse(user)?.name || "User");
            } catch {
                setUserName("User");
            }
        }
    }, []);

    const isEmailValid = (email) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validatePassword = (password) =>
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);

    /* ---------------- SIGNUP ---------------- */
    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setSignupError("");

        const { name, email, password } = signupData;

        if (!name || !email || !password || !confirmPassword) {
            setSignupError("All fields are required");
            return;
        }

        if (!isEmailValid(email)) {
            setSignupError("Please enter a valid email");
            return;
        }

        if (!validatePassword(password)) {
            setSignupError(
                "Password must be 8+ chars, include uppercase, lowercase, number & special character"
            );
            return;
        }

        if (password !== confirmPassword) {
            setSignupError("Passwords do not match");
            return;
        }

        setIsSigningUp(true);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupData),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Signup failed");
                return;
            }

            toast.success("Signup successful 🎉 Please login");

            setSignupData({ name: "", email: "", password: "" });
            setConfirmPassword("");
        } catch {
            toast.error("Server error");
        } finally {
            setIsSigningUp(false);
        }
    };

    /* ---------------- LOGIN ---------------- */
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError("");

        const { email, password } = loginData;

        if (!email || !password) {
            setLoginError("Email and password are required");
            return;
        }

        if (!isEmailValid(email)) {
            setLoginError("Invalid email address");
            return;
        }

        setIsLoggingIn(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Invalid credentials");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            setIsAuth(true);
            setUserName(data.user?.name || "User");

            toast.success("Login successful 🎉");

            setTimeout(() => (window.location.href = "/"), 1000);
        } catch {
            toast.error("Server error");
        } finally {
            setIsLoggingIn(false);
        }
    };

    /* ---------------- LOGOUT ---------------- */
    const handleLogout = () => {
        setIsLoggingOut(true);
        localStorage.clear();
        toast.success("Logged out");

        setTimeout(() => {
            setIsAuth(false);
            setIsLoggingOut(false);
            window.location.href = "/";
        }, 1000);
    };

    return (
        <StyledWrapper>
            <Toaster position="top-center" />

            <div className="wrapper">
                {isAuth ? (
                    <div className="profile-card">
                        <div className="avatar">{userName[0]}</div>
                        <h2>Hello, {userName}!</h2>
                        <button className="flip-card__btn">Dashboard</button>
                        <button
                            className="flip-card__btn logout-btn"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? "Ending..." : "Logout"}
                        </button>
                    </div>
                ) : (
                    <div className="card-switch">
                        <label className="switch">
                            <input className="toggle" type="checkbox" />
                            <span className="slider" />
                            <span className="card-side" />

                            <div className="flip-card__inner">
                                {/* LOGIN */}
                                <div className="flip-card__front">
                                    <div className="title">Log in</div>
                                    <form onSubmit={handleLoginSubmit} className="flip-card__form">
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            className="flip-card__input"
                                            onChange={(e) => {
                                                setLoginData({
                                                    ...loginData,
                                                    email: e.target.value,
                                                });
                                                setLoginError("");
                                            }}
                                        />
                                        <div className="password-field">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password"
                                                className="flip-card__input"
                                                onChange={(e) => {
                                                    setLoginData({
                                                        ...loginData,
                                                        password: e.target.value,
                                                    });
                                                    setLoginError("");
                                                }}

                                            />
                                            <span
                                                className="eye-icon"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setShowPassword(!showPassword);
                                                }}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </span>
                                        </div>
                                        {loginError && (
                                            <p className="form-error">{loginError}</p>
                                        )}

                                        <button className="flip-card__btn" disabled={isLoggingIn}>
                                            {isLoggingIn ? "WAIT..." : "Let's go!"}
                                        </button>
                                    </form>
                                </div>

                                {/* SIGNUP */}
                                <div className="flip-card__back">
                                    <div className="title">Sign up</div>
                                    <form onSubmit={handleSignupSubmit} className="flip-card__form">
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            className="flip-card__input"
                                            onChange={(e) => {
                                                setSignupData({
                                                    ...signupData,
                                                    name: e.target.value,
                                                });
                                                setSignupError("");
                                            }}
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            className="flip-card__input"
                                            onChange={(e) => {
                                                setSignupData({
                                                    ...signupData,
                                                    email: e.target.value,
                                                });
                                                setSignupError("");
                                            }}
                                        />

                                        <div className="password-field">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password"
                                                className="flip-card__input"
                                                onChange={(e) => {
                                                    setSignupData({
                                                        ...signupData,
                                                        password: e.target.value,
                                                    });
                                                    setSignupError("");
                                                }}
                                            />
                                            <span
                                                className="eye-icon"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setShowPassword(!showPassword);
                                                }}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </span>
                                        </div>

                                        <div className="password-field">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm Password"
                                                className="flip-card__input"
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    setSignupError("");
                                                }}
                                            />
                                            <span
                                                className="eye-icon"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setShowConfirmPassword(!showConfirmPassword);
                                                }}
                                            >
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                            </span>
                                        </div>

                                        {signupError && (
                                            <p className="form-error">{signupError}</p>
                                        )}

                                        <button
                                            className="flip-card__btn"
                                            disabled={isSigningUp}
                                        >
                                            {isSigningUp ? "WAIT..." : "Confirm!"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </label>
                    </div>
                )}
            </div>
        </StyledWrapper>
    );
};
const StyledWrapper = styled.div`
  /* (Your existing CSS remains exactly the same) */
  .wrapper {
    --input-focus: #2d8cf0;
    --font-color: #fefefe;
    --font-color-sub: #7e7e7e;
    --main-color: #fefefe;
    --logout-color: #ff4b4b;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 64px);
  }

  .profile-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    width: 300px;
    padding: 30px 20px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px var(--main-color);
  }

  .profile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
  }

  .avatar {
      width: 60px;
      height: 60px;
      background: var(--input-focus);
      border: 2px solid var(--main-color);
      box-shadow: 4px 4px var(--main-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: var(--font-color);
  }

  .profile-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
      align-items: center;
  }

  .logout-btn {
      margin-top: 0;
      border-color: var(--logout-color);
      box-shadow: 4px 4px var(--logout-color);
      color: var(--logout-color);
  }
  
  .logout-btn:active {
      box-shadow: 0px 0px var(--logout-color);
      transform: translate(3px, 3px);
  }

  .switch {
    transform: translateY(-200px);
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 30px;
    width: 50px;
    height: 20px;
  }

  .card-side::before {
    position: absolute;
    content: 'Log in';
    left: -70px;
    top: 0;
    width: 100px;
    text-decoration: underline;
    color: var(--font-color);
    font-weight: 600;
  }

  .card-side::after {
    position: absolute;
    content: 'Sign up';
    left: 70px;
    top: 0;
    width: 100px;
    text-decoration: none;
    color: var(--font-color);
    font-weight: 600;
  }

  .toggle {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    box-sizing: border-box;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px var(--main-color);
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-color);
    transition: 0.3s;
  }

  .slider:before {
    box-sizing: border-box;
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    border: 2px solid var(--main-color);
    border-radius: 5px;
    left: -2px;
    bottom: 2px;
    background-color: var(--bg-color);
    box-shadow: 0 3px 0 var(--main-color);
    transition: 0.3s;
  }

  .toggle:checked + .slider {
    background-color: var(--input-focus);
  }

  .toggle:checked + .slider:before {
    transform: translateX(30px);
  }

  .toggle:checked ~ .card-side:before {
    text-decoration: none;
  }

  .toggle:checked ~ .card-side:after {
    text-decoration: underline;
  }

  .flip-card__inner {
    width: 300px;
    height: 350px;
    position: relative;
    background-color: transparent;
    perspective: 1000px;
    text-align: center;
    transition: transform 0.8s;
    transform-style: preserve-3d;
  }

  .toggle:checked ~ .flip-card__inner {
    transform: rotateY(180deg);
  }

  .toggle:checked ~ .flip-card__front {
    box-shadow: none;
  }

  .flip-card__front, .flip-card__back {
    padding: 20px;
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    background: var(--bg-color);
    gap: 20px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px var(--main-color);
  }

  .flip-card__back {
    width: 100%;
    transform: rotateY(180deg);
  }

  .flip-card__form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .title {
    margin: 20px 0 20px 0;
    font-size: 25px;
    font-weight: 900;
    text-align: center;
    color: var(--main-color);
  }

  .flip-card__input {
    width: 250px;
    height: 40px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 4px 4px var(--main-color);
    font-size: 15px;
    font-weight: 600;
    color: var(--font-color);
    padding: 5px 10px;
    outline: none;
  }

  .flip-card__input::placeholder {
    color: var(--font-color-sub);
    opacity: 0.8;
  }

  .flip-card__input:focus {
    border: 2px solid var(--input-focus);
  }

  .flip-card__btn:active, .button-confirm:active {
    box-shadow: 0px 0px var(--main-color);
    transform: translate(3px, 3px);
  }

  .flip-card__btn {
    margin: 20px 0 20px 0;
    width: 120px;
    height: 40px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 4px 4px var(--main-color);
    font-size: 17px;
    font-weight: 600;
    color: var(--font-color);
    cursor: pointer;
  }
`;

export default Form;