"use client";
import React, { useRef, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, useScroll, useMotionValue, useSpring } from 'framer-motion';
import {
    ArrowUpRight, Twitter, Instagram, Github, Zap, Target, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import QuickActions from './QuickActions';

const LandingPage = () => {
    const featuresRef = useRef(null);
    // 1. Set to a static number initially to match Server-Side Rendering
    const [randomUsers, setRandomUsers] = useState(5000);
    const [isMounted, setIsMounted] = useState(false); 
    const { scrollYProgress } = useScroll();
    const scaleProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        // 2. Set isMounted to true once we are on the client
        setIsMounted(true);
        
        // Trigger initial random number immediately on mount
        setRandomUsers(Math.floor(Math.random() * 9000) + 1000);

        const interval = setInterval(() => {
            setRandomUsers(Math.floor(Math.random() * 9000) + 1000);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const scrollToFeatures = () => {
        featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    function getRandomNumber() {
        return Math.floor(Math.random() * (1500 - 1000 + 1)) + 1000;
    }

    return (
        <PageWrapper>
            <ScrollProgress style={{ scaleX: scaleProgress }} />

            <HeroSection
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <GlitchText
                    className="tagline"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <span data-text="THE NEXT GEN">THE NEXT GEN</span>
                </GlitchText>

                <motion.h1
                    initial={{ y: 50, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                >
                    <AnimatedWord delay={0.5}>LEVEL</AnimatedWord>{' '}
                    <AnimatedWord delay={0.6}>UP</AnimatedWord>{' '}
                    <AnimatedWord delay={0.7}>YOUR</AnimatedWord>
                    <br />
                    <span className="outline-text">
                        <AnimatedWord delay={0.8}>INTELLECT</AnimatedWord>
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    QuizKrida blends artistic design with AI precision to turn
                    learning into a high-stakes digital experience.
                </motion.p>

                <motion.div
                    className="hero-btns"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                >
                    <Link href="/login" className="brutal-btn-primary">
                        <span>START THE JOURNEY</span>
                        <ArrowUpRight size={20} />
                    </Link>
                    <button className="brutal-btn-outline" onClick={scrollToFeatures}>
                        <span>OUR APPROACH</span>
                    </button>
                </motion.div>

                <FloatingStats
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                >
                    <StatItem>
                        <Zap size={16} />
                        {/* 3. Use isMounted to prevent text mismatch during hydration */}
                        <span>{isMounted ? randomUsers : "5000"} USERS</span>
                    </StatItem>
                    <StatItem>
                        <Target size={16} />
                        <span>99.9% UPTIME</span>
                    </StatItem>
                    <StatItem>
                        <TrendingUp size={16} />
                        <span>₹5K+ PRIZES</span>
                    </StatItem>
                </FloatingStats>
            </HeroSection>

            {/* Rest of your component remains exactly the same... */}
            <ApproachSection ref={featuresRef}>
                <motion.div
                    className="section-label"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    01 — STEPS
                </motion.div>

                <div className="approach-grid">
                    <div className="approach-card">
                        <span className="num">/01</span>
                        <h3>GENERATE</h3>
                        <p>Leverage advanced AI to curate specialized challenges in seconds.</p>
                    </div>
                    <div className="approach-card">
                        <span className="num">/02</span>
                        <h3>COMPETE</h3>
                        <p>Engage in high-octane arenas against global intellectual peers.</p>
                    </div>
                    <div className="approach-card">
                        <span className="num">/03</span>
                        <h3>TRIUMPH</h3>
                        <p>Secure legacies and premium rewards for your mental prowess.</p>
                    </div>
                </div>
            </ApproachSection>

            <CardsWrapper
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
                <QuickActions />
            </CardsWrapper>


            <StatsSection>
                <motion.div
                    className="stats-header"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <h2>
                        DESIGNED FOR <br />
                        <span className="gradient">PERFORMANCE.</span>
                    </h2>
                </motion.div>

                <div className="stats-grid">
                    <div className="stat-item">
                        <h4>{isMounted ? randomUsers : "5000"}</h4>
                        <p>Global Competitors</p>
                    </div>
                    <div className="stat-item">
                        <h4>$5K+</h4>
                        <p>Prize Pool</p>
                    </div>
                    <div className="stat-item">
                        <h4>24/7</h4>
                        <p>Live Arenas</p>
                    </div>
                </div>

                <WinnerTicker>
                    <div className="ticker-track">
                        <span>● @Dhiraj_01 won $50 in Weekly Quiz</span>
                        <span>● @Alex_Dev just earned 'AI Master' Badge</span>
                        <span>● @Rahul.js won the Science Bowl</span>
                        <span>● @Dhiraj_01 won $50 in Weekly Quiz</span>
                        <span>● @Dhiraj_01 won $50 in Weekly Quiz</span>
                        <span>● @Alex_Dev just earned 'AI Master' Badge</span>
                    </div>
                </WinnerTicker>
            </StatsSection>

            <Footer>
                <div className="footer-top">
                    <motion.div
                        className="footer-brand"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2>QUIZ<span>KRIDA</span></h2>
                        <p>CRAFTING COMPETITIVE EXPERIENCES THAT INSPIRE AND CONVERT CURIOSITY INTO KNOWLEDGE.</p>
                    </motion.div>

                    <motion.div
                        className="footer-nav"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="nav-group">
                            <h5>NAVIGATE</h5>
                            <Link href="/">HOME</Link>
                            <Link href="/about">ABOUT US</Link>
                            <Link href="/services">SERVICES</Link>
                        </div>
                        <div className="nav-group">
                            <h5>CONNECT</h5>
                            <a href="mailto:hello@quizkrida.com">GET IN TOUCH</a>
                            <div className="socials">
                                <SocialIcon
                                    as={motion.a}
                                    href="https://github.com/DhirajB-7"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.2, rotate: 5 }}
                                >
                                    <Github size={18} />
                                </SocialIcon>
                                <SocialIcon
                                    as={motion.a}
                                    href="https://www.instagram.com/dhiraj_birajdar_77/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.2, rotate: -5 }}
                                >
                                    <Instagram size={18} />
                                </SocialIcon>
                                <SocialIcon
                                    as={motion.a}
                                    href="https://www.linkedin.com/in/dhiraj-birajdar-b920302aa/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.2, rotate: 5 }}
                                >
                                    <Twitter size={18} />
                                </SocialIcon>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 QUIZKRIDA. ALL RIGHTS RESERVED.</p>
                    <div className="legal">
                        <span>PRIVACY POLICY</span>
                        <span>TERMS OF SERVICE</span>
                    </div>
                </div>
            </Footer>
        </PageWrapper>
    );
};
// --- Animations ---
const AnimatedWord = ({ children, delay }) => (
    <motion.span
        style={{ display: 'inline-block' }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
            delay,
            type: "spring",
            stiffness: 200,
            damping: 20
        }}
    >
        {children}
    </motion.span>
);
const marquee = keyframes`
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
`;

const glitch = keyframes`
    0%, 100% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
`;

const float = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
`;

// --- Styled Components ---

const ScrollProgress = styled(motion.div)`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #fff;
    transform-origin: 0%;
    z-index: 9999;
`;


const PageWrapper = styled.div`
    color: #fff;
    min-height: 100vh;
    margin-top:-150px;
    width: 100%;
    font-family: 'Courier New', monospace;
    background: #000;
    position: relative;
    overflow-x: hidden;
    
    /* Grid overlay */
    &::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
            linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
        background-size: 50px 50px;
        pointer-events: none;
        z-index: 0;
    }
`;

const GlitchText = styled(motion.div)`
    position: relative;
    
    span {
        position: relative;
        display: inline-block;
        
        &::before,
        &::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        &::before {
            left: 2px;
            text-shadow: -2px 0 #fff;
            clip: rect(24px, 550px, 90px, 0);
            animation: ${glitch} 3s infinite linear alternate-reverse;
        }
        
        &::after {
            left: -2px;
            text-shadow: -2px 0 #fff;
            clip: rect(85px, 550px, 140px, 0);
            animation: ${glitch} 2.5s infinite linear alternate-reverse;
        }
    }
`;

const HeroSection = styled(motion.section)`
    position: relative;
    z-index: 1;
    padding: 200px 20px 80px;
    text-align: center;
    max-width: 1200px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;

    @media (min-width: 768px) {
        padding: 240px 20px 120px;
    }

    .tagline {
        font-size: 0.7rem;
        letter-spacing: 0.8em;
        color: #888;
        margin-bottom: 40px;
        text-transform: uppercase;
        font-weight: 900;
        
        @media (min-width: 768px) {
            font-size: 0.85rem;
        }
    }

    h1 {
        font-size: clamp(3rem, 15vw, 8rem);
        font-weight: 900;
        line-height: 0.9;
        letter-spacing: -0.05em;
        margin-bottom: 40px;
        text-transform: uppercase;

        .outline-text {
            color: transparent;
            -webkit-text-stroke: 2px #fff;
            text-stroke: 2px #fff;
        }
    }

    p {
        max-width: 600px;
        margin: 0 auto 50px;
        color: #888;
        font-size: 0.85rem;
        line-height: 1.8;
        font-weight: 700;
        letter-spacing: 0.05em;
        
        @media (min-width: 768px) {
            font-size: 1rem;
            max-width: 700px;
        }
    }

    .hero-btns {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 20px;
        padding: 0 20px;
        
        @media (min-width: 768px) { 
            flex-direction: row; 
            gap: 20px; 
            padding: 0;
        }
    }

    .brutal-btn-primary,
    .brutal-btn-outline {
        padding: 20px 40px;
        font-weight: 900;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        position: relative;
        overflow: hidden;
        
        span {
            position: relative;
            z-index: 2;
        }
    }

    .brutal-btn-primary {
        background: #fff;
        color: #000;
        border: 4px solid #fff;
        text-decoration: none;
        
        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: #000;
            transition: left 0.3s ease;
            z-index: 1;
        }
        
        &:hover {
            color: #fff;
            
            &::before {
                left: 0;
            }
            
            svg {
                color: #fff;
            }
        }
        
        svg {
            position: relative;
            z-index: 2;
            transition: color 0.3s ease;
        }
    }

    .brutal-btn-outline {
        background: transparent;
        color: #fff;
        border: 4px solid #fff;
        cursor: pointer;
        
        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: #fff;
            transition: left 0.3s ease;
            z-index: 1;
        }
        
        &:hover {
            color: #000;
            
            &::before {
                left: 0;
            }
        }
    }
`;

const FloatingStats = styled(motion.div)`
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-top: 80px;
    flex-wrap: wrap;
    
    @media (max-width: 768px) {
        gap: 20px;
        margin-top: 60px;
    }
`;

const StatItem = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    border: 2px solid #fff;
    background: #000;
    animation: ${float} 3s ease-in-out infinite;
    
    &:nth-child(2) {
        animation-delay: 0.5s;
    }
    
    &:nth-child(3) {
        animation-delay: 1s;
    }
    
    span {
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.1em;
    }
    
    svg {
        animation: ${pulse} 2s ease-in-out infinite;
    }
`;

const ApproachSection = styled.section`
    position: relative;
    z-index: 1;
    padding: 120px 24px;
    max-width: 1400px;
    margin: 0 auto;
    
    @media (min-width: 768px) {
        padding: 160px 40px;
    }

    .section-label {
        font-size: 0.7rem;
        color: #888;
        margin-bottom: 60px;
        letter-spacing: 0.5em;
        font-weight: 900;
        text-transform: uppercase;
        
        @media (min-width: 768px) { 
            margin-bottom: 80px;
            font-size: 0.8rem;
        }
    }

    .approach-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 40px;
        
        @media (min-width: 768px) { 
            grid-template-columns: repeat(3, 1fr); 
            gap: 60px;
        }
    }
`;

const ApproachCard = styled(motion.div)`
    border: 4px solid #fff;
    padding: 40px;
    background: #000;
    position: relative;
    cursor: pointer;
    
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    
    .num { 
        color: #fff; 
        font-size: 0.8rem; 
        font-weight: 900;
        letter-spacing: 0.1em;
    }
    
    .icon {
        font-size: 2rem;
    }
    
    h3 { 
        font-size: 1.8rem; 
        letter-spacing: 0.05em; 
        margin-bottom: 16px; 
        font-weight: 900;
        text-transform: uppercase;
    }
    
    p { 
        color: #888; 
        line-height: 1.8; 
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .card-border {
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 4px solid #fff;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    &:hover .card-border {
        opacity: 1;
    }
`;

const CardsWrapper = styled(motion.div)`
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto 120px;
    padding: 0 20px;
    
    @media (min-width: 768px) { 
        margin-bottom: 160px; 
    }
`;

const StatsSection = styled.section`
    position: relative;
    z-index: 1;
    padding: 120px 0;
    border-top: 4px solid #fff;
    border-bottom: 4px solid #fff;
    
    @media (min-width: 768px) { 
        padding: 160px 0; 
    }
    
    .stats-header {
        text-align: center;
        margin-bottom: 80px;
        
        @media (min-width: 768px) { 
            margin-bottom: 120px; 
        }
        
        h2 { 
            font-size: clamp(2rem, 8vw, 5rem); 
            font-weight: 900;
            padding: 0 20px;
            letter-spacing: -0.02em;
            line-height: 1.1;
            text-transform: uppercase;
            
            .gradient { 
                color: transparent;
                -webkit-text-stroke: 2px #fff;
                text-stroke: 2px #fff;
            }
        }
    }

    .stats-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 60px;
        max-width: 1200px;
        margin: 0 auto 100px;
        padding: 0 20px;
        
        @media (min-width: 768px) { 
            grid-template-columns: repeat(3, 1fr);
            margin-bottom: 120px;
            gap: 40px;
        }
    }

    .stat-item {
        text-align: center;
        padding: 40px;
        border: 4px solid #fff;
        background: #000;
        transition: transform 0.2s ease;
        
        h4 { 
            font-size: 4rem; 
            font-weight: 900; 
            margin-bottom: 10px;
            letter-spacing: -0.02em;
            
            @media (min-width: 768px) { 
                font-size: 5rem; 
            }
        }
        
        p { 
            color: #888; 
            text-transform: uppercase; 
            letter-spacing: 0.2em; 
            font-size: 0.7rem; 
            font-weight: 900;
        }
    }
`;

const WinnerTicker = styled.div`
    border-top: 4px solid #fff;
    border-bottom: 4px solid #fff;
    padding: 30px 0;
    overflow: hidden;
    background: #000;
    
    .ticker-track {
        display: flex;
        gap: 80px;
        animation: ${marquee} 40s linear infinite;
        white-space: nowrap;
        
        @media (min-width: 768px) { 
            gap: 120px; 
        }
        
        span { 
            font-weight: 900; 
            letter-spacing: 0.1em; 
            color: #fff; 
            font-size: 0.85rem;
            text-transform: uppercase;
        }
    }
`;

const Footer = styled.footer`
    position: relative;
    z-index: 1;
    background: #000;
    padding: 60px 20px 30px;
    border-top: 4px solid #fff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    
    @media (min-width: 768px) { 
        padding: 140px 40px 50px;
        min-height: auto;
    }

    .footer-top {
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        display: grid;
        grid-template-columns: 1fr;
        gap: 50px;
        margin-bottom: 60px;
        
        @media (min-width: 1024px) { 
            display: flex;
            justify-content: space-between;
            margin-bottom: 100px;
        }
    }

    .footer-brand {
        max-width: 500px;
        
        h2 { 
            font-weight: 900; 
            letter-spacing: -0.02em; 
            margin-bottom: 20px; 
            font-size: 2.5rem;
            text-transform: uppercase;
            
            @media (min-width: 768px) {
                font-size: 2rem;
            }
            
            span { 
                color: transparent;
                -webkit-text-stroke: 1px #fff;
            } 
        }
        
        p { 
            color: #888; 
            line-height: 1.8; 
            font-size: 0.9rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            
            @media (min-width: 768px) {
                font-size: 0.85rem;
            }
        }
    }

    .footer-nav {
        display: grid;
        grid-template-columns: 1fr;
        gap: 50px;
        
        @media (min-width: 640px) {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        
        @media (min-width: 768px) { 
            gap: 100px; 
        }
        
        .nav-group {
            display: flex;
            flex-direction: column;
            gap: 20px;
            
            @media (min-width: 768px) {
                gap: 16px;
            }
            
            h5 { 
                color: #888; 
                letter-spacing: 0.3em; 
                font-size: 0.75rem; 
                margin-bottom: 8px; 
                font-weight: 900;
                text-transform: uppercase;
                
                @media (min-width: 768px) {
                    font-size: 0.7rem;
                }
            }
            
            a { 
                color: #fff; 
                text-decoration: none; 
                font-size: 1rem; 
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                transition: all 0.2s;
                width: fit-content;
                
                @media (min-width: 768px) {
                    font-size: 0.85rem;
                }
                
                &:hover { 
                    color: #888;
                    transform: translateX(4px);
                }
            }
            
            .socials { 
                display: flex; 
                gap: 30px; 
                color: #fff; 
                margin-top: 8px;
                
                @media (min-width: 768px) {
                    gap: 20px;
                    margin-top: 12px;
                }
            }
        }
    }

    .footer-bottom {
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding-top: 30px;
        border-top: 2px solid #fff;
        color: #888;
        font-size: 0.7rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-top: auto;
        
        @media (min-width: 768px) { 
            flex-direction: row; 
            padding-top: 50px;
            gap: 24px;
        }
        
        .legal { 
            display: flex; 
            flex-direction: column;
            gap: 15px;
            text-align: center;
            font-weight: 900;
            
            @media (min-width: 768px) {
                flex-direction: row;
                gap: 30px;
            }
            
            span { 
                cursor: pointer; 
                transition: 0.2s; 
                
                &:hover { 
                    color: #fff; 
                }
            }
        }
    }
`;

const SocialIcon = styled(motion.div)`
  background: none;
  border: 1px solid #222;
  color: #444;
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.3s;

  &:hover {
    color: #fff;
    border-color: #fff;
  }
`;

export default LandingPage;