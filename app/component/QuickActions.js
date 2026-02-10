"use client";
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Play, Globe, PlusCircle, Sparkles, Radio, Loader2, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const QuickActions = () => {
  const router = useRouter();
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem("token");

  const handleAction = (action, index) => {
    setLoadingIndex(index);
    setTimeout(() => {
      action.onClick();
    }, 400);
  };

  const actions = [
    { title: "PLAY QUIZ", desc: "Enter a room code, play instantly, and check your score right away.", icon: <Play size={20} />, onClick: () => router.push('/play') },
    { title: "CREATE QUIZ", desc: "Build personalized quiz, add timer, and host your own quiz.", icon: <PlusCircle size={20} />, onClick: () => !isLoggedIn ? router.push('/login') : router.push('/create') },
    { title: "QUIZ BY AI", desc: "Just choose a topic, and AI will generate a quiz for you. Attend it and get your score instantly.", icon: <Sparkles size={20} />, onClick: () => router.push('/generate-ai') },
    { title: "AI-ASSISTED QUIZ", desc: "Automatically build quiz from AI-created question data in seconds.", icon: <Sparkles size={20} />, onClick: () => router.push('/quick-quiz-maker') },
    { title: "PUBLIC GALLERY", desc: "Explore a wide collection of public quizzes created by others, or create your own anytime.", icon: <Globe size={20} />, onClick: () => router.push('/public-library') },
    { title: "GLOBAL TOPICS", desc: "Discover global topics and test your knowledge in different areas.", icon: <Radio size={20} />, onClick: () => router.push('/browseQuizzes') },

  ];

  return (
    <Wrapper>
      <SectionHeader
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-label">02 — ACTIONS</div>
        <h2>CHOOSE YOUR<br />PATH</h2>
      </SectionHeader>

      <GridContainer>
        {actions.map((action, index) => (
          <BrutalistCard 
            key={index} 
            onClick={() => handleAction(action, index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            $isHovered={hoveredIndex === index}
          >
            {/* Card Number Badge */}
            <CardNumber>/{String(index + 1).padStart(2, '0')}</CardNumber>
            
            {/* Icon Section */}
            <IconSection $isHovered={hoveredIndex === index}>
              {action.icon}
            </IconSection>
            
            {/* Content */}
            <CardContent>
              <CardTitle>{action.title}</CardTitle>
              <CardDesc>{action.desc}</CardDesc>
            </CardContent>

            {/* Footer Action */}
            <CardFooter>
              {loadingIndex === index ? (
                <LoadingState>
                  <Loader2 className="spinner" size={18} />
                  <span>LOADING...</span>
                </LoadingState>
              ) : (
                <ActionButton $isHovered={hoveredIndex === index}>
                  <span>EXECUTE</span>
                  <ArrowUpRight size={18} />
                </ActionButton>
              )}
            </CardFooter>

            {/* Brutal Border Effects */}
            <TopBorder $isHovered={hoveredIndex === index} />
            <BottomBorder $isHovered={hoveredIndex === index} />
          </BrutalistCard>
        ))}
      </GridContainer>
    </Wrapper>
  );
};

/* --- ANIMATIONS --- */
const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const glitchShift = keyframes`
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(2px, -2px); }
  66% { transform: translate(-2px, 2px); }
`;

const expandWidth = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

/* --- STYLED COMPONENTS --- */

const Wrapper = styled.div`
  width: 100%;
  padding: 40px 20px;
  background: #1E1E1E;
  
  @media (min-width: 768px) { 
    padding: 80px 40px; 
  }
`;

const SectionHeader = styled.div`
  max-width: 1400px;
  margin: 0 auto 60px;
  
  .header-label {
    font-size: 0.7rem;
    color: #888;
    margin-bottom: 20px;
    letter-spacing: 0.5em;
    font-weight: 900;
    text-transform: uppercase;
  }
  
  h2 {
    font-size: clamp(2rem, 6vw, 4rem);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.02em;
    color: #fff;
    text-transform: uppercase;
  }
  
  @media (min-width: 768px) {
    margin-bottom: 80px;
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  max-width: 1400px;
  margin: 0 auto;
  border: 4px solid #fff;
  
  @media (min-width: 640px) { 
    grid-template-columns: repeat(2, 1fr); 
  }
  
  @media (min-width: 1024px) { 
    grid-template-columns: repeat(3, 1fr); 
  }
`;

const CardNumber = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 0.75rem;
  font-weight: 900;
  color: #888;
  letter-spacing: 0.1em;
  z-index: 10;
  
  @media (min-width: 768px) {
    top: 30px;
    left: 30px;
    font-size: 0.85rem;
  }
`;

const IconSection = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$isHovered ? '#fff' : '#000'};
  color: ${props => props.$isHovered ? '#000' : '#fff'};
  margin-bottom: 30px;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  transform: ${props => props.$isHovered ? 'rotate(5deg) scale(1.1)' : 'rotate(0deg) scale(1)'};
  
  svg {
    stroke-width: 3;
  }
  
  @media (min-width: 768px) {
    width: 70px;
    height: 70px;
  }
`;

const CardContent = styled.div`
  flex: 1;
  margin-bottom: 30px;
`;

const CardTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: #fff;
  margin-bottom: 16px;
  text-transform: uppercase;
  line-height: 1.2;
  
  @media (min-width: 768px) { 
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
`;

const CardDesc = styled.p`
  font-size: 0.75rem;
  color: #888;
  line-height: 1.6;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  @media (min-width: 768px) { 
    font-size: 0.85rem;
    line-height: 1.8;
  }
`;

const CardFooter = styled.div`
  margin-top: auto;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  color: #fff;
  font-weight: 900;
  text-transform: uppercase;
  
  .spinner { 
    animation: ${spin} 1s linear infinite; 
  }
`;

const ActionButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 0;
  border-top: 2px solid ${props => props.$isHovered ? '#fff' : 'rgba(255, 255, 255, 0.2)'};
  transition: all 0.3s ease;
  
  span {
    font-size: 0.75rem;
    font-weight: 900;
    letter-spacing: 0.2em;
    color: #fff;
    text-transform: uppercase;
  }
  
  svg {
    transition: transform 0.3s ease;
    transform: ${props => props.$isHovered ? 'translate(4px, -4px)' : 'translate(0, 0)'};
  }
`;

const TopBorder = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 4px;
  width: ${props => props.$isHovered ? '100%' : '0%'};
  background: #fff;
  transition: width 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  z-index: 20;
`;

const BottomBorder = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  height: 4px;
  width: ${props => props.$isHovered ? '100%' : '0%'};
  background: #fff;
  transition: width 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  z-index: 20;
`;

const BrutalistCard = styled.div`
  position: relative;
  background: #000;
  padding: 80px 30px 30px;
  min-height: 350px;
  cursor: pointer;
  overflow: hidden;
  border: 2px solid #fff;
  border-right-width: ${props => props.$columnIndex !== 2 ? '1px' : '2px'};
  border-bottom-width: ${props => props.$rowIndex !== 1 ? '1px' : '2px'};
  transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
  display: flex;
  flex-direction: column;
  
  @media (min-width: 768px) {
    padding: 100px 40px 40px;
    min-height: 400px;
  }

  /* Grid pattern background */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size: 20px 20px;
    opacity: ${props => props.$isHovered ? '1' : '0'};
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  /* Hover Effects */
  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 8px 8px 0 #fff;
    z-index: 10;
  }

  &:active {
    transform: translate(0, 0);
    box-shadow: 4px 4px 0 #fff;
  }

  /* Mobile Active State */
  @media (max-width: 767px) {
    &:active {
      background: #111;
      
      ${IconSection} {
        background: #fff;
        color: #000;
        animation: ${glitchShift} 0.3s ease;
      }
    }
  }
`;

export default QuickActions;