"use client";
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Play,Globe, PlusCircle, Sparkles, Radio, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const QuickActions = () => {
  const router = useRouter();
  const [loadingIndex, setLoadingIndex] = useState(null);
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem("token");

  const handleAction = (action, index) => {
    setLoadingIndex(index);
    setTimeout(() => {
      action.onClick();
    }, 400);
  };

  const actions = [
    { 
      title: "Play Quiz", 
      desc: "Instantly join a game using a unique room code and compete with friends.", 
      icon: <Play size={26} />, 
      color: "#6366f1", 
      onClick: () => router.push('/play') 
    },
    { 
      title: "Create Quiz", 
      desc: "Design your own custom questions, set timers, and host your own sessions.", 
      icon: <PlusCircle size={26} />, 
      color: "#2d8cf0", 
      onClick: () => !isLoggedIn ? router.push('/login') : router.push('/create') 
    },
    { 
      title: "Live Sessions", 
      desc: "Real-time global challenges happening right now. Join and climb the leaderboard.", 
      icon: <Radio size={26} />, 
      color: "#f43f5e", 
      onClick: () => router.push('/browseQuizzes') 
    },
    { 
      title: "Quiz by AI", 
      desc: "Harness the power of AI to generate a complete quiz from any topic.", 
      icon: <Sparkles size={26} />, 
      color: "#9b59b6", 
      onClick: () => router.push('/generate-ai') 
    },
    { 
      title: "Public Quizzes", 
      desc: "Explore a massive library of community-created quizzes across all categories.", 
      icon: <Globe size={26} />, 
      color: "#10b981", 
      onClick: () => router.push('/public-library') 
    }
  ];

  return (
    <Container>
      {actions.map((action, index) => (
        <Card 
          key={index} 
          color={action.color} 
          style={{ "--i": index }}
          onClick={() => handleAction(action, index)}
        >
          {/* Desktop Glass Layer (Hidden on mobile via CSS) */}
          <div className="glass-layer" />
          
          <div className="content-wrapper">
            <div className="icon-box">{action.icon}</div>
            <div className="text-content">
              <h3>{action.title}</h3>
              <p>{action.desc}</p>
            </div>
            <button className="go-button">
              {loadingIndex === index ? (
                <Loader2 className="spinner" size={18} />
              ) : (
                "Start"
              )}
            </button>
          </div>
        </Card>
      ))}
    </Container>
  );
};

/* --- ANIMATIONS --- */
const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33% { transform: translateY(-8px) rotate(-1deg); }
  66% { transform: translateY(-4px) rotate(1deg); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/* --- STYLED COMPONENTS --- */
const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  width: 100%;
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
  margin-top: -60px;

  @media (min-width: 769px) {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    padding: 60px 20px;
    perspective: 1000px;
  }
`;

const Card = styled.div`
  /* MOBILE STYLES */
  border: 2px solid #fefefe;
  box-shadow: 6px 6px 0px #fefefe;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: transparent;
  min-height: 380px; 
  padding: 30px;

  .glass-layer { display: none; }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between; /* Spreads icon, text, and button evenly */
    height: 100%;
    width: 100%;
    gap: 15px;
  }

  .icon-box {
    color: ${props => props.color};
    background: rgba(255, 255, 255, 0.05);
    width: 75px; 
    height: 75px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed ${props => props.color};
    flex-shrink: 0;
    margin-bottom: 0; /* Removed margin to allow flex centering */
  }

  h3 {
    color: #fefefe;
    font-size: 1.5rem;
    margin: 10px 0;
  }

  p {
    color: #7e7e7e;
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0 auto;
    max-width: 200px;
  }

  .go-button {
    width: 100%;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 2px solid ${props => props.color};
    color: ${props => props.color};
    font-weight: bold;
    border-radius: 5px;
    box-shadow: 4px 4px 0px ${props => props.color};
    transition: all 0.1s;
    cursor: pointer;

    .spinner { animation: ${spin} 1s linear infinite; }
  }

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 10px 10px 0px ${props => props.color};
  }

  &:active {
    transform: translate(4px, 4px);
    box-shadow: 2px 2px 0px ${props => props.color};
  }

  /* DESKTOP OVERRIDES */
  @media (min-width: 769px) {

    width: 270px;
    height: 350px;
    min-height: unset;
    border: none;
    box-shadow: none;
    animation: ${float} 6s ease-in-out infinite;
    animation-delay: calc(var(--i) * -1.2s);
    padding: 0;

    .glass-layer {
      display: block;
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 1;
    }

    .content-wrapper {
      padding: 25px 20px;
      gap: 0;
    }

    .icon-box {
      width: 55px;
      height: 55px;
      border-radius: 16px;
      background: ${props => props.color}20;
      border: 1.5px solid ${props => props.color}40;
    }

    h3 { font-size: 1.2rem; margin-top: 15px; }
    p { color: #94a3b8; font-size: 0.8rem; }

    .go-button {
      border-radius: 12px;
      color: white;
      box-shadow: none;
    }

    &:hover {
      animation-play-state: paused;
      transform: scale(1.08) translateY(-15px);
      box-shadow: none;
      .glass-layer {
        border-color: ${props => props.color};
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px ${props => props.color}40;
      }
      .icon-box {
        background: ${props => props.color};
        color: white;
      }
      .go-button { background: ${props => props.color}; }
    }
  }
`;

export default QuickActions;