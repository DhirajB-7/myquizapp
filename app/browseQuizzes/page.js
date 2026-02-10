"use client";
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, Clock, ChevronRight, Loader2, CheckCircle2, 
  Gamepad2, Music, Film, Tv, Book, Globe, Map, 
  Zap, Beaker, Ghost, Car, PawPrint, Users, Palette, 
  Landmark, Trophy, Cpu, Smartphone, Layout, BookOpen, Star, RefreshCcw 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

/* --- ICON MAPPING (MONOCHROME) --- */
const getTopicIcon = (name) => {
  const n = name.toLowerCase();
  const iconProps = { size: 24, color: "#fff" };
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

  const BASE_URL = 'https://quizbyaiservice-production.up.railway.app';
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch(`${BASE_URL}/Topics`, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
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
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      const data = await res.json();
      setQuestions(data);
      setGameStarted(true);
      setCurrentIndex(0);
      setTimer(60);
    } catch (err) {
      toast.error("DEPLOYMENT FAILED");
    } finally {
      setLoading(false);
    }
  };

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
      setTimer(60);
    } else {
      setIsFinished(true);
    }
  };

  const handleAnswer = (optionText) => {
    setUserAnswers(prev => ({ ...prev, [currentIndex]: optionText }));
    setTimeout(handleNext, 400); 
  };

  const calculateScore = () => {
    return questions.reduce((score, q, idx) => {
      return userAnswers[idx] === q.correctOpt ? score + 1 : score;
    }, 0);
  };

  if (loading) return (
    <LoadingScreen>
      <Loader2 className="spinner" size={32} />
      <span>INITIALIZING DATA STREAM...</span>
    </LoadingScreen>
  );

  return (
    <Container>
      <Toaster toastOptions={{ style: { background: '#000', color: '#fff', border: '1px solid #222', borderRadius: '0px' } }} />
      
      {!gameStarted ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Header>
            <div className="live-badge"><Radio size={12} /> LIVE STREAMS</div>
            <h1>SELECT SECTOR</h1>
            <p>CHOOSE A DATABASE TO INITIALIZE TEST SEQUENCE</p>
          </Header>
          <TopicGrid>
            {Object.entries(topics).map(([id, name]) => (
              <TopicCard key={id} onClick={() => startTopicQuiz(id)}>
                <div className="topic-icon-box">
                  {getTopicIcon(name)}
                </div>
                <div className="topic-info">
                  <h3>{name.toUpperCase()}</h3>
                  <span className="topic-id">SECTOR ID: {id}</span>
                </div>
                <ChevronRight size={18} className="arrow" />
              </TopicCard>
            ))}
          </TopicGrid>
        </motion.div>
      ) : isFinished ? (
        <ResultCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <CheckCircle2 size={48} color="#fff" />
          <h2>SEQUENCE COMPLETE</h2>
          <div className="score-box">
            <span className="big-score">{calculateScore()}</span>
            <span className="total"> / {questions.length}</span>
          </div>
          <RestartBtn onClick={() => window.location.reload()}>RE-INITIALIZE</RestartBtn>
        </ResultCard>
      ) : (
        <QuizPlayArea>
          <div className="quiz-header">
            <div className="progress">STATION {currentIndex + 1} // {questions.length}</div>
            <div className={`timer ${timer < 10 ? 'critical' : ''}`}>
              <Clock size={14} /> <span className="timer-text">T-MINUS {timer}S</span>
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
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
            >
              <h2>{questions[currentIndex].question.toUpperCase()}</h2>
              <OptionsGrid>
                {['opt1', 'opt2', 'opt3', 'opt4'].map((optKey) => (
                  <OptionBtn 
                    key={optKey}
                    onClick={() => handleAnswer(questions[currentIndex][optKey])}
                    $selected={userAnswers[currentIndex] === questions[currentIndex][optKey]}
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
  );
};

/* --- STYLES (ZOLVI B&W RESPONSIVE) --- */

const Container = styled.div`
  max-width: 1200px; 
  margin: 0 auto; 
  padding: 40px 16px; 
  color: white; 
  min-height: 100vh;

  @media (min-width: 768px) {
    padding: 80px 40px;
  }
`;

const Header = styled.div`
  margin-bottom: 40px;
  @media (min-width: 768px) {
    margin-bottom: 60px;
  }

  .live-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: #000; color: #fff;
    padding: 4px 12px; border: 1px solid #fff; font-weight: 900; font-size: 0.55rem;
    margin-bottom: 16px; letter-spacing: 0.2em;
  }
  h1 { 
    font-size: 1.8rem; font-weight: 900; margin-bottom: 8px; letter-spacing: -1px; 
    @media (min-width: 768px) { font-size: 2.8rem; }
  }
  p { color: #555; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; }
`;

const TopicGrid = styled.div`
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 1px;
  background: #222; 
  border: 1px solid #222;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const TopicCard = styled.div`
  background: #000; 
  padding: 20px; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  gap: 16px;
  transition: 0.2s;
  
  &:hover { 
    background: #0a0a0a; 
    .arrow { transform: translateX(5px); color: #fff; }
  }

  .topic-icon-box { border: 1px solid #222; padding: 10px; flex-shrink: 0; }
  .topic-info { 
    flex: 1; 
    min-width: 0; /* Prevents text overflow */
    h3 { 
      font-size: 0.8rem; font-weight: 900; letter-spacing: 0.05em; margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    } 
    .topic-id { color: #444; font-size: 0.55rem; font-weight: 800; } 
  }
  .arrow { color: #222; transition: 0.2s; flex-shrink: 0; }
`;

const QuizPlayArea = styled.div`
  max-width: 800px; 
  margin: 0 auto;
  
  .quiz-header {
    display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px;
    .progress { font-weight: 900; color: #444; font-size: 0.65rem; letter-spacing: 0.1em; }
    .timer {
      display: flex; align-items: center; gap: 6px; font-weight: 900; font-size: 0.65rem;
      &.critical { color: #fff; animation: blink 0.5s infinite; }
      .timer-text { display: block; }
    }
  }
  @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
`;

const ProgressBar = styled.div`
  height: 2px; background: #111; margin-bottom: 40px;
  @media (min-width: 768px) { margin-bottom: 60px; }
  .fill { height: 100%; background: #fff; }
`;

const QuestionBox = styled(motion.div)`
  h2 { 
    font-size: 1.25rem; line-height: 1.4; margin-bottom: 30px; text-align: left; font-weight: 900; letter-spacing: -0.02em; 
    @media (min-width: 768px) { font-size: 1.8rem; margin-bottom: 50px; }
  }
`;

const OptionsGrid = styled.div`
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 1px; 
  background: #222; 
  border: 1px solid #222;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const OptionBtn = styled.button`
  background: ${props => props.$selected ? '#111' : '#000'};
  border: none;
  color: ${props => props.$selected ? '#fff' : '#666'}; 
  padding: 20px; 
  font-size: 0.75rem;
  font-weight: 800; 
  cursor: pointer; 
  transition: 0.15s; 
  text-align: left;
  display: flex; 
  align-items: center; 
  gap: 12px;

  @media (min-width: 768px) {
    padding: 28px;
    font-size: 0.85rem;
  }

  .indicator { 
    width: 6px; height: 6px; border: 1px solid #222; flex-shrink: 0;
    background: ${props => props.$selected ? '#fff' : 'transparent'};
    border-color: ${props => props.$selected ? '#fff' : '#222'};
  }
  
  .opt-text { line-height: 1.2; }
  
  &:hover { 
    color: #fff; 
    background: #0a0a0a; 
    .indicator { border-color: #444; }
  }
`;

const ResultCard = styled(motion.div)`
  text-align: center; border: 1px solid #222; padding: 40px 20px;
  @media (min-width: 768px) { padding: 80px 40px; }

  .score-box { 
    margin: 30px 0; 
    .big-score { font-size: 4rem; font-weight: 900; color: #fff; @media (min-width: 768px) { font-size: 7rem; } } 
    .total { font-size: 1.2rem; color: #444; font-weight: 900; } 
  }
  h2 { font-size: 1rem; font-weight: 900; letter-spacing: 0.2em; }
`;

const LoadingScreen = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; gap: 24px; padding: 20px;
  span { font-weight: 900; font-size: 0.6rem; letter-spacing: 0.2em; color: #444; text-align: center; }
  .spinner { animation: spin 1s linear infinite; color: #fff; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const RestartBtn = styled.button`
  background: #fff; color: #000; border: none; padding: 16px 32px; font-weight: 900; cursor: pointer; transition: 0.2s;
  letter-spacing: 0.1em; width: 100%; max-width: 300px;
  font-size: 0.8rem;
  &:hover { background: #eee; transform: translateY(-2px); }
`;

export default TopicQuizManager;