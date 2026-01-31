"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, Clock, ChevronRight, Loader2, CheckCircle2, 
  Gamepad2, Music, Film, Tv, Book, Globe, Map, 
  Zap, Beaker, Ghost, Car, PawPrint, Users, Palette, 
  Landmark, Trophy, Cpu, Smartphone, Layout, BookOpen, Star 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

/* --- ICON MAPPING LOGIC --- */
const getTopicIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes('video games')) return <Gamepad2 size={24} color="#ec4899" />;
  if (n.includes('music')) return <Music size={24} color="#a855f7" />;
  if (n.includes('film')) return <Film size={24} color="#3b82f6" />;
  if (n.includes('television')) return <Tv size={24} color="#6366f1" />;
  if (n.includes('books')) return <Book size={24} color="#f59e0b" />;
  if (n.includes('geography')) return <Globe size={24} color="#10b981" />;
  if (n.includes('history')) return <Landmark size={24} color="#94a3b8" />;
  if (n.includes('politics')) return <Users size={24} color="#ef4444" />;
  if (n.includes('art')) return <Palette size={24} color="#f472b6" />;
  if (n.includes('celebrities')) return <Star size={24} color="#fbbf24" />;
  if (n.includes('animals')) return <PawPrint size={24} color="#10b981" />;
  if (n.includes('vehicles')) return <Car size={24} color="#64748b" />;
  if (n.includes('science')) return <Beaker size={24} color="#06b6d4" />;
  if (n.includes('gadgets')) return <Smartphone size={24} color="#6366f1" />;
  if (n.includes('computers')) return <Cpu size={24} color="#3b82f6" />;
  if (n.includes('mythology')) return <Zap size={24} color="#f59e0b" />;
  if (n.includes('sports')) return <Trophy size={24} color="#fbbf24" />;
  if (n.includes('cartoon')) return <Ghost size={24} color="#f472b6" />;
  if (n.includes('anime')) return <Layout size={24} color="#ec4899" />;
  return <BookOpen size={24} color="#94a3b8" />;
};

const TopicQuizManager = () => {
  // State
  const [topics, setTopics] = useState({});
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(15);
  const [userAnswers, setUserAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);

  const BASE_URL = 'https://noneditorial-professionally-serena.ngrok-free.dev';

  // 1. Initial Fetch: Topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch(`${BASE_URL}/Topics`, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        if (!response.ok) throw new Error("Server Error");
        const data = await response.json();
        setTopics(data);
      } catch (err) {
        toast.error("Failed to load topics");
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  // 2. Fetch Questions for Selected Topic
  const startTopicQuiz = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/Live/${id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      const data = await res.json();
      setQuestions(data);
      setGameStarted(true);
      setCurrentIndex(0);
      setTimer(15);
    } catch (err) {
      toast.error("Error fetching questions");
    } finally {
      setLoading(false);
    }
  };

  // 3. Timer Logic & Auto-Advance
  useEffect(() => {
    let interval;
    if (gameStarted && !isFinished && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && gameStarted && !isFinished) {
      handleNext(); 
    }
    return () => clearInterval(interval);
  }, [timer, gameStarted, isFinished]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimer(15);
    } else {
      setIsFinished(true);
    }
  };

  const handleAnswer = (optionText) => {
    setUserAnswers(prev => ({ ...prev, [currentIndex]: optionText }));
    // Small delay so user sees their selection
    setTimeout(handleNext, 400); 
  };

  const calculateScore = () => {
    return questions.reduce((score, q, idx) => {
      return userAnswers[idx] === q.correctOpt ? score + 1 : score;
    }, 0);
  };

  if (loading) return (
    <LoadingScreen>
      <Loader2 className="spinner" size={40} />
      <span>Syncing Live Topics...</span>
    </LoadingScreen>
  );

  return (
    <Container>
      <Toaster position="top-center" />
      
      {!gameStarted ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Header>
            <div className="live-badge"><Radio size={16} /> LIVE CHALLENGE</div>
            <h1>Choose a Topic</h1>
            <p>Select a category to start your live session</p>
          </Header>
          <TopicGrid>
            {Object.entries(topics).map(([id, name]) => (
              <TopicCard key={id} whileHover={{ y: -5 }} onClick={() => startTopicQuiz(id)}>
                <div className="topic-icon-box">
                  {getTopicIcon(name)}
                </div>
                <div className="topic-info">
                  <h3>{name}</h3>
                  <span className="topic-id">CATEGORY ID: {id}</span>
                </div>
                <ChevronRight size={20} className="arrow" />
              </TopicCard>
            ))}
          </TopicGrid>
        </motion.div>
      ) : isFinished ? (
        <ResultCard initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle2 size={64} color="#10b981" />
          <h2>Quiz Completed!</h2>
          <div className="score-box">
            <span className="big-score">{calculateScore()}</span>
            <span className="total">/ {questions.length}</span>
          </div>
          <RestartBtn onClick={() => window.location.reload()}>Try Another Topic</RestartBtn>
        </ResultCard>
      ) : (
        <QuizPlayArea>
          <div className="quiz-header">
            <div className="progress">Question {currentIndex + 1} of {questions.length}</div>
            <div className={`timer ${timer < 5 ? 'critical' : ''}`}>
              <Clock size={18} /> {timer}s
            </div>
          </div>
          <ProgressBar>
            <motion.div 
              className="fill" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} 
            />
          </ProgressBar>
          <AnimatePresence mode="wait">
            <QuestionBox 
              key={currentIndex} 
              initial={{ x: 30, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -30, opacity: 0 }}
            >
              <h2>{questions[currentIndex].question}</h2>
              <OptionsGrid>
                {['opt1', 'opt2', 'opt3', 'opt4'].map((optKey) => (
                  <OptionBtn 
                    key={optKey}
                    onClick={() => handleAnswer(questions[currentIndex][optKey])}
                    $selected={userAnswers[currentIndex] === questions[currentIndex][optKey]}
                  >
                    {questions[currentIndex][optKey]}
                  </OptionBtn>
                ))}
              </OptionsGrid>
            </QuestionBox>
          </AnimatePresence>
        </QuizPlayArea>
      )}
    </Container>
  );
};

/* --- STYLES --- */

const Container = styled.div`
  max-width: 900px; margin: 0 auto; padding: 40px 20px; color: white; min-height: 100vh;
`;

const Header = styled.div`
  text-align: center; margin-bottom: 40px;
  .live-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(239, 68, 68, 0.1); color: #ef4444;
    padding: 6px 15px; border-radius: 100px; font-weight: 900; font-size: 0.7rem;
    margin-bottom: 15px; border: 1px solid rgba(239, 68, 68, 0.2);
  }
  h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 10px; }
  p { color: #94a3b8; font-size: 1.1rem; }
`;

const TopicGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;
`;

const TopicCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 18px; border-radius: 24px; cursor: pointer; display: flex; align-items: center; gap: 16px;
  transition: all 0.3s ease; backdrop-filter: blur(10px);
  &:hover { background: rgba(255, 255, 255, 0.06); border-color: #3b82f6; .arrow { color: #3b82f6; transform: translateX(4px); } }
  .topic-icon-box { background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 16px; }
  .topic-info { flex: 1; h3 { font-size: 1.1rem; color: #fff; margin-bottom: 4px; } .topic-id { color: #64748b; font-size: 0.7rem; font-weight: 700; } }
  .arrow { color: #334155; transition: 0.3s; }
`;

const QuizPlayArea = styled.div`
  max-width: 700px; margin: 0 auto;
  .quiz-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
    .progress { font-weight: 700; color: #94a3b8; }
    .timer {
      display: flex; align-items: center; gap: 8px; background: rgba(30, 41, 59, 0.8);
      padding: 8px 16px; border-radius: 14px; font-weight: 800; font-family: monospace;
      &.critical { color: #ef4444; border: 1px solid #ef4444; }
    }
  }
`;

const ProgressBar = styled.div`
  height: 8px; background: rgba(255,255,255,0.05); border-radius: 20px; margin-bottom: 50px; overflow: hidden;
  .fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #2dd4bf); box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
`;

const QuestionBox = styled(motion.div)`
  h2 { font-size: 1.8rem; line-height: 1.4; margin-bottom: 40px; text-align: center; font-weight: 700; }
`;

const OptionsGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const OptionBtn = styled.button`
  background: ${props => props.$selected ? '#3b82f6' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.$selected ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'};
  color: white; padding: 22px; border-radius: 20px; font-size: 1rem;
  font-weight: 600; cursor: pointer; transition: 0.2s; text-align: left;
  &:hover { background: ${props => props.$selected ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)'}; transform: translateY(-2px); }
`;

const ResultCard = styled(motion.div)`
  text-align: center; background: rgba(255,255,255,0.02); padding: 60px 40px; border-radius: 32px;
  border: 1px solid rgba(255,255,255,0.08); margin: 0 auto; max-width: 500px;
  .score-box { margin: 30px 0; .big-score { font-size: 5rem; font-weight: 900; color: #10b981; } .total { font-size: 1.8rem; color: #64748b; } }
  h2 { font-size: 2.2rem; margin-top: 20px; font-weight: 800; }
`;

const LoadingScreen = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 20px; color: #94a3b8;
  .spinner { animation: spin 1s linear infinite; color: #3b82f6; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const RestartBtn = styled.button`
  background: #3b82f6; color: white; border: none; padding: 18px 36px; border-radius: 16px; font-weight: 800; cursor: pointer; transition: 0.2s;
  &:hover { background: #2563eb; transform: scale(1.05); }
`;

export default TopicQuizManager;