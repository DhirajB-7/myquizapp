"use client";
import React, { useState, useEffect } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Clock, ChevronRight, Loader2, CheckCircle2,
  Gamepad2, Music, Film, Tv, Book, Globe, Map,
  Zap, Beaker, Ghost, Car, PawPrint, Users, Palette,
  Landmark, Trophy, Cpu, Smartphone, Layout, BookOpen, Star, RefreshCcw
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

/* --- GLOBAL SCROLL & RESET --- */
const GlobalStyles = createGlobalStyle`
  html {
    scroll-behavior: smooth;
    background-color: #000;
  }
  
  /* Custom Scrollbar for Chrome, Edge, Safari */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #000;
  }
  ::-webkit-scrollbar-thumb {
    background: #222;
    border: 1px solid #000;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #fff;
  }

  /* Selection styling */
  ::selection {
    background: #fff;
    color: #000;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: inherit;
    overflow-x: hidden;
  }
`;

/* --- ICON MAPPING --- */
const getTopicIcon = (name) => {
  const n = name.toLowerCase();
  const iconProps = { size: 24 };
  if (n.includes('video games')) return <Gamepad2 {...iconProps} />;
  if (n.includes('music')) return <Music {...iconProps} />;
  if (n.includes('film')) return <Film {...iconProps} />;
  if (n.includes('television')) return <Tv {...iconProps} />;
  if (n.includes('books')) return <Book {...iconProps} />;
  if (n.includes('geography')) return <Globe {...iconProps} />;
  if (n.includes('history')) return <Landmark {...iconProps} />;
  if (n.includes('politics')) return <Users {...iconProps} />;
  if (n.includes('art')) return <Palette {...iconProps} />;
  if (n.includes('celebrities')) return <Star {...iconProps} />;
  if (n.includes('animals')) return <PawPrint {...iconProps} />;
  if (n.includes('vehicles')) return <Car {...iconProps} />;
  if (n.includes('science')) return <Beaker {...iconProps} />;
  if (n.includes('gadgets')) return <Smartphone {...iconProps} />;
  if (n.includes('computers')) return <Cpu {...iconProps} />;
  if (n.includes('mythology')) return <Zap {...iconProps} />;
  if (n.includes('sports')) return <Trophy {...iconProps} />;
  if (n.includes('cartoon')) return <Ghost {...iconProps} />;
  if (n.includes('anime')) return <Layout {...iconProps} />;
  return <BookOpen {...iconProps} />;
};

const TopicQuizManager = () => {
  const [topics, setTopics] = useState({});
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(60);
  const [userAnswers, setUserAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);

  const BASE_URL = ' https://quizbyapi-42ai.onrender.com/api/v1';

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch(`${BASE_URL}/Topics`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY
          },
        });
        const data = await response.json();
        setTopics(data);
      } catch (err) {
        toast.error("COMMUNICATION ERROR");
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const startTopicQuiz = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/Live/${id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY
        },
      });
      const data = await res.json();
      setQuestions(data);
      setGameStarted(true);
      setCurrentIndex(0);
      setTimer(60);
      setUserAnswers({});
      setIsFinished(false);
      window.scrollTo(0, 0); // Scroll to top on start
    } catch (err) {
      toast.error("DEPLOYMENT FAILED");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleNext = () => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setTimer(60);
      } else {
        setIsFinished(true);
      }
    };

    let interval;
    if (gameStarted && !isFinished && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && gameStarted && !isFinished) {
      handleNext();
    }
    return () => clearInterval(interval);
  }, [timer, gameStarted, isFinished, currentIndex, questions.length]);

  const handleAnswer = (optionText) => {
    setUserAnswers(prev => ({ ...prev, [currentIndex]: optionText }));
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setTimer(60);
      } else {
        setIsFinished(true);
      }
    }, 400);
  };

  const calculateScore = () => {
    return questions.reduce((score, q, idx) => {
      return userAnswers[idx] === q.correctOpt ? score + 1 : score;
    }, 0);
  };

  const handleRestart = () => {
    setGameStarted(false);
    setIsFinished(false);
    setCurrentIndex(0);
    setTimer(60);
    setUserAnswers({});
    setQuestions([]);
    window.scrollTo(0, 0);
  };

  if (loading) return (
    <LoadingScreen>
      <Loader2 className="spinner" size={32} />
      <span>INITIALIZING DATA STREAM...</span>
    </LoadingScreen>
  );

  return (
    <>
      <GlobalStyles />
      <Container>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#000',
              color: '#fff',
              border: '1px solid #222',
              borderRadius: '0px',
              fontSize: '0.85rem',
              fontWeight: '700'
            }
          }}
        />

        {!gameStarted ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Header>
              <div className="live-badge">
                <Radio size={12} className="pulse-icon" /> LIVE STREAMS
              </div>
              <h1>SELECT SECTOR</h1>
              <p>CHOOSE A TOPIC TO INITIALIZE TEST SEQUENCE</p>
            </Header>
            <TopicGrid>
              {Object.entries(topics).map(([id, name], index) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TopicCard onClick={() => startTopicQuiz(id)}>
                    <div className="topic-icon-box">
                      {getTopicIcon(name)}
                    </div>
                    <div className="topic-info">
                      <h3>{name.toUpperCase()}</h3>
                      <span className="topic-id">SECTOR ID: {id}</span>
                    </div>
                    <ChevronRight size={18} className="arrow" />
                  </TopicCard>
                </motion.div>
              ))}
            </TopicGrid>
          </motion.div>
        ) : isFinished ? (
          <ResultCard
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <CheckCircle2 size={64} color="#fff" />
            <h2>SEQUENCE COMPLETE</h2>
            <div className="score-box">
              <span className="big-score">{calculateScore()}</span>
              <span className="total"> / {questions.length}</span>
            </div>
            <RestartBtn onClick={handleRestart}>
              <RefreshCcw size={18} />
              RE-INITIALIZE
            </RestartBtn>
          </ResultCard>
        ) : (
          <QuizPlayArea>
            <div className="quiz-header">
              <div className="progress">
                STATION {currentIndex + 1} // {questions.length}
              </div>
              <div className={`timer ${timer < 10 ? 'critical' : ''}`}>
                <Clock size={14} />
                <span className="timer-text">T-MINUS {timer}S</span>
              </div>
            </div>
            <ProgressBar>
              <motion.div
                className="fill"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              />
            </ProgressBar>
            <AnimatePresence mode="wait">
              <QuestionBox
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <h2>{questions[currentIndex].question.toUpperCase()}</h2>
                <OptionsGrid>
                  {['opt1', 'opt2', 'opt3', 'opt4'].map((optKey) => (
                    <OptionBtn
                      key={optKey}
                      onClick={() => handleAnswer(questions[currentIndex][optKey])}
                      $selected={userAnswers[currentIndex] === questions[currentIndex][optKey]}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className="indicator" />
                      <span className="opt-text">{questions[currentIndex][optKey].toUpperCase()}</span>
                    </OptionBtn>
                  ))}
                </OptionsGrid>
              </QuestionBox>
            </AnimatePresence>
          </QuizPlayArea>
        )}
      </Container>
    </>
  );
};

/* --- ENHANCED STYLES --- */

const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const Container = styled.div`
  max-width: 1200px; 
  margin: 0 auto; 
  padding: 20px 16px; 
  color: white; 
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;

  @media (min-width: 768px) { padding: 60px 40px; }
  @media (min-width: 1024px) { padding: 80px 40px; }
`;

const Header = styled.div`
  margin-bottom: 40px;
  
  .live-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: #fff; color: #000;
    padding: 8px 16px; font-weight: 900; font-size: 0.6rem;
    margin-bottom: 24px; letter-spacing: 0.2em;
    box-shadow: 5px 5px 0px #ff0033;
    
    .pulse-icon {
      animation: ${pulse} 2s infinite ease-in-out;
      color: #ff0033;
    }
  }

  h1 { 
    font-size: clamp(2.2rem, 8vw, 4.5rem); 
    font-weight: 950; margin: 0 0 16px 0;
    letter-spacing: -3px; line-height: 0.85;
  }

  p { 
    color: #666; font-size: 0.85rem; font-weight: 700;
    letter-spacing: 0.05em; max-width: 500px; line-height: 1.5;
  }
`;

const TopicGrid = styled.div`
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 20px;
  margin-top: 20px;

  @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1024px) { grid-template-columns: repeat(3, 1fr); gap: 30px; }
`;

const TopicCard = styled.div`
  background: #0a0a0a; 
  padding: 25px; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  gap: 20px;
  border: 1px solid #1a1a1a;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  
  &:hover { 
    background: #111;
    border-color: #fff;
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.8), 10px 10px 0px #fff;

    .arrow { transform: translateX(8px); color: #fff; }
    .topic-icon-box { border-color: #fff; background: #fff; color: #000; }
  }

  .topic-icon-box { 
    border: 1px solid #222; padding: 12px; 
    transition: all 0.3s ease; display: flex;
  }

  .topic-info { 
    flex: 1; 
    h3 { 
      font-size: 1rem; font-weight: 900; letter-spacing: 0.05em; margin-bottom: 4px;
    } 
    .topic-id { color: #444; font-size: 0.65rem; font-weight: 800; } 
  }
  .arrow { color: #222; transition: 0.3s ease; }
`;

const QuizPlayArea = styled.div`
  max-width: 800px; 
  margin: 0 auto;
  
  .quiz-header {
    display: flex; justify-content: space-between; align-items: center; 
    margin-bottom: 25px; padding-bottom: 15px;
    border-bottom: 1px solid #111;

    .progress { font-weight: 900; color: #444; font-size: 0.75rem; letter-spacing: 0.2em; }
    .timer {
      background: #000; padding: 10px 18px; border: 1px solid #222;
      display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 0.8rem;
      &.critical { color: #ff0033; border-color: #ff0033; animation: ${blink} 0.5s infinite; }
    }
  }
`;

const ProgressBar = styled.div`
  height: 4px; background: #111; margin-bottom: 50px;
  .fill { height: 100%; background: #fff; box-shadow: 0 0 15px #fff; }
`;

const QuestionBox = styled(motion.div)`
  h2 { 
    font-size: clamp(1.4rem, 4vw, 2.5rem); 
    line-height: 1.1; margin-bottom: 50px; font-weight: 950; letter-spacing: -1px; 
  }
`;

const OptionsGrid = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 15px;
  @media (min-width: 768px) { grid-template-columns: repeat(2, 1fr); gap: 20px; }
`;

const OptionBtn = styled(motion.button)`
  background: ${props => props.$selected ? '#fff' : '#0a0a0a'};
  border: 1px solid ${props => props.$selected ? '#fff' : '#1a1a1a'};
  color: ${props => props.$selected ? '#000' : '#888'}; 
  padding: 24px; font-size: 0.9rem; font-weight: 800; 
  cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px;
  transition: all 0.2s ease;

  &:hover { 
    border-color: #fff; 
    color: ${props => props.$selected ? '#000' : '#fff'};
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.4);
  }

  .indicator { 
    width: 10px; height: 10px; border: 2px solid #222;
    background: ${props => props.$selected ? '#000' : 'transparent'};
  }
`;

const ResultCard = styled(motion.div)`
  text-align: center; border: 2px solid #fff; background: #000;
  padding: 60px 30px; box-shadow: 20px 20px 0px #111;
  max-width: 600px; margin: 0 auto;

  .score-box { 
    margin: 40px 0; 
    .big-score { font-size: 8rem; font-weight: 950; color: #fff; line-height: 1; } 
    .total { font-size: 1.5rem; color: #333; font-weight: 900; letter-spacing: 0.3em; } 
  }
  h2 { font-size: 1.2rem; font-weight: 900; letter-spacing: 0.3em; margin-top: 20px; }
`;

const LoadingScreen = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center; 
  min-height: 100vh; gap: 25px; background: #000;
  span { font-weight: 900; font-size: 0.7rem; letter-spacing: 0.3em; color: #444; }
  .spinner { animation: ${spin} 1s linear infinite; color: #fff; }
`;

const RestartBtn = styled.button`
  background: #fff; color: #000; border: none; padding: 20px 40px; 
  font-weight: 950; cursor: pointer; transition: 0.3s;
  letter-spacing: 0.2em; width: 100%; max-width: 300px;
  display: flex; align-items: center; justify-content: center; gap: 12px;
  &:hover { background: #ff0033; color: #fff; transform: translateY(-5px); }
`;

export default TopicQuizManager;