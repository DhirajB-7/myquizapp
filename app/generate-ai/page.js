"use client";
import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Sparkles, Zap, Globe, Cpu, Loader2, Trophy, RefreshCcw, Timer, ChevronRight, Lock, ShieldCheck, X, Activity, Terminal } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- ENHANCED ZOLVI THEME ---
const theme = {
    bg: "#050505",
    surface: "#0d0d0d",
    surfaceLighter: "#151515",
    border: "#262626",
    borderActive: "#404040",
    text: "#FFFFFF",
    muted: "#737373",
    accent: "#FFFFFF",
    danger: "#FF4444",
    success: "#00FF41",
    cyan: "#00F0FF",
    font: "'Monaco', 'Consolas', monospace"
};

const SECONDS_PER_QUESTION = 60;
const PLAY_LIMIT = 3;
const COOLDOWN_MS = 2 * 60 * 60 * 1000;;

const AIGenerator = () => {
    // --- LOGIC PRESERVED ---
    const [isLoading, setIsLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
    const [remainingAttempts, setRemainingAttempts] = useState(PLAY_LIMIT);

    const [formData, setFormData] = useState({
        topic: '',
        count: 10,
        difficulty: 'Moderate',
        language: 'English'
    });
    const getDeviceFingerprint = () => {
    const { userAgent, language, hardwareConcurrency } = window.navigator;
    const { width, height, colorDepth } = window.screen;
    const timezone = new Date().getTimezoneOffset();
    
    // Combine traits into one unique string
    const id = `${userAgent}|${language}|${hardwareConcurrency}|${width}x${height}|${colorDepth}|${timezone}`;
    return btoa(id).slice(0, 32); // Convert to a short Base64 string
};

    const checkRateLimit = async () => {
    try {
        const fingerprint = getDeviceFingerprint();
        const storageKey = `quiz_limit_${fingerprint}`;
        const localData = JSON.parse(localStorage.getItem(storageKey) || '{"count": 0, "resetTime": 0}');
        const now = Date.now();

        // 1. Check if the 2-hour cooldown has finished
        if (localData.resetTime > 0 && now > localData.resetTime) {
            const freshData = { count: 0, resetTime: 0 };
            localStorage.setItem(storageKey, JSON.stringify(freshData));
            setRemainingAttempts(PLAY_LIMIT);
            return { allowed: true, data: freshData, key: storageKey };
        }

        // 2. If the user is currently in a cooldown period
        if (localData.resetTime > 0 && now < localData.resetTime) {
            const diff = localData.resetTime - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            toast.error(`Limit reached! Try again in ${hours}h ${minutes}m`);
            setRemainingAttempts(0);
            return { allowed: false, data: localData, key: storageKey };
        }

        // 3. Regular check: Do they have attempts left?
        const attemptsLeft = Math.max(0, PLAY_LIMIT - localData.count);
        setRemainingAttempts(attemptsLeft);

        if (attemptsLeft === 0) {
            toast.error("No attempts left. Try again in 2 hours.");
            return { allowed: false, data: localData, key: storageKey };
        }

        return { allowed: true, data: localData, key: storageKey };
    } catch (e) {
        return { allowed: true, data: { count: 0 }, key: 'fallback' };
    }
};

    useEffect(() => { checkRateLimit(); }, []);

    useEffect(() => {
        if (!quizData || isSubmitted) return;
        if (timeLeft === 0) {
            handleNextQuestion();
            return;
        }
        const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, quizData, isSubmitted]);

    const handleNextQuestion = () => {
        const isLastQuestion = currentQuestionIdx === quizData.length - 1;
        if (isLastQuestion) {
            handleSubmitExam();
        } else {
            setCurrentQuestionIdx(prev => prev + 1);
            setTimeLeft(SECONDS_PER_QUESTION);
        }
    };

   const handleGenerate = async () => {
    // 1. Basic Validation
    if (!formData.topic) { 
        toast.error("Please enter a topic first!"); 
        return; 
    }

    setIsLoading(true);

    // 2. Check Device-Based Rate Limit
    const limitStatus = await checkRateLimit();
    if (!limitStatus.allowed) {
        // The toast with the remaining time is already handled inside checkRateLimit
        setIsLoading(false);
        return;
    }

    try {
        // 3. Call the API
        const response = await fetch(`https://quizbyapi-42ai.onrender.com/api/v1/Generate`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY // Your friend's key
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error("API_ERROR");

        const data = await response.json();

        // 4. Set Quiz Data and Start Timer
        setQuizData(data);
        setCurrentQuestionIdx(0); // Ensure we start at the first question
        setTimeLeft(SECONDS_PER_QUESTION); // Reset timer to 30s

        // 5. "Burn" one attempt and set 2-hour cooldown if it was the last one
        const newCount = limitStatus.data.count + 1;
        const cooldownActive = newCount >= PLAY_LIMIT;
        
        // Calculate reset time (Now + 2 hours)
        const resetTime = cooldownActive ? Date.now() + (2 * 60 * 60 * 1000) : 0;

        localStorage.setItem(limitStatus.key, JSON.stringify({
            count: newCount,
            resetTime: resetTime
        }));

        // 6. Update the Frontend UI for remaining chances
        setRemainingAttempts(Math.max(0, PLAY_LIMIT - newCount));

        if (cooldownActive) {
            toast.success("Quiz Generated! Note: This is your last attempt for 2 hours.");
        } else {
            toast.success("Quiz Generated successfully!");
        }

    } catch (error) { 
        console.error(error);
        toast.error("Failed to generate quiz. Please try again."); 
    } finally { 
        setIsLoading(false); 
    }
};

    const handleSubmitExam = () => {
        let currentScore = 0;
        quizData.forEach((q, idx) => { if (userAnswers[idx] === q.correctOpt) currentScore++; });
        setScore(currentScore);
        setIsSubmitted(true);
    };

    return (
        <PageContainer>

            <BackgroundDecor>
                <div className="grid-overlay" />
                <div className="scanline" />
            </BackgroundDecor>

            {!quizData ? (
                <GeneratorWrapper>
                    <NoirCard>
                        <Header>
                            <div className="limit-chip">STATUS: {remainingAttempts > 0 ? 'READY' : 'COOLDOWN'} || CHANCES: {remainingAttempts}</div>
                            <BrandIcon><Cpu size={32} /></BrandIcon>
                            <div className="text-wrapper">
                                <h2>AI_QUIZ</h2>
                                <p>Generate questions by AI and compete in real-time challenges.</p>
                            </div>
                        </Header>

                        <FormGrid>
                            <InputGroup>
                                <label><Terminal size={12} /> ENTER TOPIC NAME</label>
                                <input
                                    placeholder="Enter Your Topic..."
                                    value={formData.topic}
                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                />
                            </InputGroup>

                            <InputGroup>
                                <label><Zap size={12} /> Enter Your Level</label>
                                <div className="pill-container">
                                    {['Easy', 'Moderate', 'Hard'].map((level) => (
                                        <Pill key={level} $active={formData.difficulty === level} onClick={() => setFormData({ ...formData, difficulty: level })}>
                                            {level}
                                        </Pill>
                                    ))}
                                </div>
                            </InputGroup>

                            <InputGroup>
                                <label><Globe size={12} /> SELCET LANGUAGE</label>
                                <div className="pill-container">
                                    {['English', 'Hindi', 'Marathi'].map((lang) => (
                                        <Pill
                                            key={lang}
                                            $active={formData.language === lang}
                                            onClick={() => setFormData({ ...formData, language: lang })}
                                        >
                                            {lang.toUpperCase()}
                                        </Pill>
                                    ))}
                                </div>
                            </InputGroup>

                            <PrimaryButton onClick={handleGenerate} disabled={isLoading || !formData.topic}>
                                {isLoading ? <Loader2 size={16} className="spinner" /> : "START_QUIZ"}
                            </PrimaryButton>
                        </FormGrid>
                    </NoirCard>
                  
                </GeneratorWrapper>
            ) : (
                <ResultContainer $isSubmitted={isSubmitted}>
                    <ResultHeader>
                        <div className="title-area">
                            <div className={isSubmitted ? "score-badge high-alert" : "success-badge"}>
                                {isSubmitted ? `TOTAL_SCORE: ${score}/${quizData.length}` : `TIMER: ${timeLeft}s`}
                            </div>
                            <h2>{isSubmitted ? "RESULT" : `QUIZ_TITLE: ${formData.topic}`}</h2>
                        </div>
                        {isSubmitted && (
                            <GhostButton onClick={() => {
                                setQuizData(null);
                                setUserAnswers({});
                                setCurrentQuestionIdx(0);
                                setIsSubmitted(false);
                                setScore(0);
                            }}>
                                <RefreshCcw size={14} /> TAKE_ANOTHER_QUIZ
                            </GhostButton>
                        )}
                    </ResultHeader>

                    {!isSubmitted && (
                        <TimerWrapper>
                            <TimerBarFill progress={(timeLeft / SECONDS_PER_QUESTION) * 100} />
                        </TimerWrapper>
                    )}

                    <QuizContent $isSubmitted={isSubmitted}>
                        <QuestionGrid>
                            {quizData.map((q, idx) => {
                                if (!isSubmitted && idx !== currentQuestionIdx) return null;
                                return (
                                    <QuestionCard key={idx} $isSubmitted={isSubmitted}>
                                        <div className="card-header">
                                            <div className="q-num">Q_NO: [0{idx + 1}]</div>
                                        </div>
                                        <h3>{q.question}</h3>
                                        <div className="options-list">
                                            {[q.opt1, q.opt2, q.opt3, q.opt4].map((opt, i) => {
                                                const isSelected = userAnswers[idx] === opt;
                                                const isCorrect = opt === q.correctOpt;
                                                let status = "";
                                                if (isSubmitted) {
                                                    if (isCorrect) status = "correct";
                                                    else if (isSelected) status = "wrong";
                                                } else if (isSelected) status = "selected";

                                                return (
                                                    <Option
                                                        key={i}
                                                        className={status}
                                                        onClick={() => !isSubmitted && setUserAnswers(prev => ({ ...prev, [idx]: opt }))}
                                                    >
                                                        <span className="key">{String.fromCharCode(65 + i)}</span>
                                                        <span className="val">{opt}</span>
                                                        {status === "correct" && <ShieldCheck size={14} className="status-icon" />}
                                                    </Option>
                                                );
                                            })}
                                        </div>
                                    </QuestionCard>
                                );
                            })}
                        </QuestionGrid>
                    </QuizContent>

                    {!isSubmitted && (
                        <QuizFooter>
                            <SubmitButton onClick={handleNextQuestion}>
                                {currentQuestionIdx === quizData.length - 1 ? "FINAL_SUBMIT" : "NEXT_QUESTION"}
                                <ChevronRight size={18} />
                            </SubmitButton>
                        </QuizFooter>
                    )}
                </ResultContainer>
            )}
        </PageContainer>
    );
};

/* --- ENHANCED MODERN STYLES --- */

const spin = keyframes` from { transform: rotate(0deg); } to { transform: rotate(360deg); } `;
const fadeIn = keyframes` from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } `;
const scan = keyframes` 0% { top: 0% } 100% { top: 100% } `;

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${theme.bg};
  color: ${theme.text};
  font-family: ${theme.font};
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 20px;

  @media (max-width: 767px) {
    padding: 15px;
    align-items: flex-start;
    overflow-y: auto;
  }
`;

const BackgroundDecor = styled.div`
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  .grid-overlay {
    position: absolute; inset: 0;
    background-image: linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px);
    background-size: 40px 40px; opacity: 0.15;
  }
  .scanline {
    position: absolute; width: 100%; height: 2px; background: rgba(255,255,255,0.05);
    top: 0; animation: ${scan} 8s linear infinite;
  }
`;

const GeneratorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 500px;
  z-index: 1;

  @media (min-width: 1024px) {
    flex-direction: row;
    max-width: 900px;
    align-items: center;
    height: fit-content;
  }

  @media (max-width: 767px) {
    margin-top: 20px;
    margin-bottom: 20px;
  }
`;

const NoirCard = styled.div`
  flex: 1;
  background: ${theme.surface};
  border: 1px solid ${theme.border};
  padding: 30px;
  animation: ${fadeIn} 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  position: relative;
  box-shadow: 20px 20px 0px -5px rgba(0,0,0,1);

  @media (min-width: 768px) {
    padding: 40px;
  }

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    width: 20px;
    height: 20px;
    border-top: 2px solid ${theme.accent};
    border-left: 2px solid ${theme.accent};
  }
`;

const BrandIcon = styled.div`
  margin: 0 auto 20px;
  color: ${theme.accent};
  background: ${theme.surfaceLighter};
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;

  .limit-chip {
    display: inline-block;
    font-size: 0.6rem;
    color: ${theme.cyan};
    background: rgba(0, 240, 255, 0.05);
    padding: 4px 12px;
    margin-bottom: 20px;
    border: 1px solid rgba(0, 240, 255, 0.2);
  }

  h2 {
    font-size: 1.4rem;
    font-weight: 900;
    letter-spacing: 3px;
    margin-bottom: 8px;
  }

  p {
    font-size: 0.7rem;
    color: ${theme.muted};
  }

  @media (max-width: 767px) {
    h2 {
      font-size: 1.2rem;
    }
  }
`;

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  label {
    font-size: 0.65rem;
    color: ${theme.muted};
    font-weight: 900;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  input {
    background: #000;
    border: 1px solid ${theme.border};
    padding: 16px;
    color: #fff;
    font-family: inherit;
    transition: all 0.2s;
    font-size: 0.9rem;

    &:focus {
      border-color: ${theme.accent};
      box-shadow: 0 0 15px rgba(255,255,255,0.05);
      outline: none;
    }
  }

  .pill-container {
    display: flex;
    background: ${theme.border};
    gap: 1px;
    border: 1px solid ${theme.border};
    overflow: hidden;
  }
`;

const Pill = styled.button`
  flex: 1;
  background: ${p => p.$active ? '#fff' : '#000'};
  color: ${p => p.$active ? '#000' : '#fff'};
  border: none;
  padding: 12px;
  font-size: 0.7rem;
  font-family: inherit;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.$active ? '#fff' : theme.surfaceLighter};
  }
`;

const PrimaryButton = styled.button`
  background: #fff;
  color: #000;
  border: none;
  padding: 18px;
  font-weight: 900;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: 2px;
  font-size: 0.8rem;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
    background: #eee;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    animation: ${spin} 1s linear infinite;
  }
`;

const ResultContainer = styled.div`
  width: 100%;
  max-width: 900px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  /* FIXED: Better height calculation for desktop */
  height: ${p => p.$isSubmitted ? 'auto' : 'calc(100vh - 40px)'};
  max-height: ${p => p.$isSubmitted ? 'none' : 'calc(100vh - 40px)'};

  @media (max-width: 767px) {
    height: auto;
    max-height: none;
    padding-top: 0;
    padding-bottom: 20px;
  }
`;

const ResultHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
  flex-shrink: 0;
  padding: 0 20px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }

  @media (max-width: 767px) {
    padding: 0;
  }

  .title-area {
    .success-badge, .score-badge {
      font-size: 0.75rem;
      font-weight: 900;
      color: ${theme.cyan};
      margin-bottom: 12px;
      padding-left: 10px;
      border-left: 3px solid ${theme.cyan};
    }

    .high-alert {
      color: ${theme.success};
      border-color: ${theme.success};
    }

    h2 {
      font-size: 1.5rem;
      font-weight: 900;
      letter-spacing: -0.5px;

      @media (max-width: 767px) {
        font-size: 1.2rem;
      }
    }
  }
`;

const TimerWrapper = styled.div`
  width: 100%;
  height: 4px;
  background: ${theme.border};
  margin-bottom: 20px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;

  @media (min-width: 768px) {
    margin: 0 20px 20px 20px;
    width: calc(100% - 40px);
  }
`;

const TimerBarFill = styled.div`
  height: 100%;
  width: ${p => p.progress}%;
  background: ${theme.accent};
  transition: width 1s linear;
  box-shadow: 0 0 10px ${theme.accent};
`;

const QuizContent = styled.div`
  /* FIXED: Proper scrolling for both states */
  flex: 1;
  overflow-y: ${p => p.$isSubmitted ? 'auto' : 'auto'};
  overflow-x: hidden;
  min-height: 0;
  padding: 0 20px;

  @media (max-width: 767px) {
    padding: 0;
  }

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${theme.surface};
  }

  &::-webkit-scrollbar-thumb {
    background: ${theme.border};
    border-radius: 3px;

    &:hover {
      background: ${theme.muted};
    }
  }
`;

const QuestionGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* FIXED: Add padding bottom so last question isn't cut off */
  padding-bottom: ${p => p.$isSubmitted ? '0' : '20px'};

  @media (max-width: 767px) {
    gap: 15px;
    padding-bottom: 0;
  }
`;

const QuestionCard = styled.div`
  background: ${theme.surface};
  border: 1px solid ${theme.border};
  padding: 25px;
  animation: ${fadeIn} 0.5s ease;

  @media (max-width: 767px) {
    padding: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid ${theme.border};

    .q-num, .q-id {
      font-size: 0.65rem;
      color: ${theme.muted};
      font-weight: 700;
    }
  }

  h3 {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 25px;
    color: ${theme.text};
    font-weight: 500;

    @media (max-width: 767px) {
      font-size: 1rem;
      margin-bottom: 20px;
    }
  }

  .options-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;

    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
    }
  }
`;

const Option = styled.div`
  padding: 16px;
  border: 1px solid ${theme.border};
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  background: #000;
  position: relative;

  @media (max-width: 767px) {
    padding: 14px;
    font-size: 0.8rem;
  }

  .key {
    font-size: 0.65rem;
    font-weight: 900;
    color: ${theme.muted};
    width: 24px;
    height: 24px;
    border: 1px solid ${theme.border};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .val {
    flex: 1;
  }

  &:hover {
    border-color: ${theme.muted};
    background: ${theme.surfaceLighter};
  }

  &.selected {
    border-color: ${theme.accent};
    background: rgba(255,255,255,0.05);
  }

  &.correct {
    border-color: ${theme.success};
    color: ${theme.success};
    background: rgba(0, 255, 65, 0.05);
    font-weight: 900;

    .key {
      border-color: ${theme.success};
      color: ${theme.success};
    }
  }

  &.wrong {
    border-color: ${theme.danger};
    color: ${theme.danger};
    background: rgba(255, 68, 68, 0.05);

    .key {
      border-color: ${theme.danger};
      color: ${theme.danger};
    }
  }

  .status-icon {
    margin-left: auto;
    flex-shrink: 0;
  }
`;

const QuizFooter = styled.div`
  /* FIXED: Always visible, sticky at bottom */
  padding: 20px;
  flex-shrink: 0;
  background: ${theme.bg};
  border-top: 1px solid ${theme.border};

  @media (max-width: 767px) {
    padding: 15px 0;
    background: transparent;
    border-top: none;
  }
`;

const SubmitButton = styled(PrimaryButton)`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  clip-path: polygon(0 0, 95% 0, 100% 30%, 100% 100%, 5% 100%, 0 70%);

  @media (max-width: 767px) {
    max-width: 100%;
    padding: 16px;
    font-size: 0.75rem;
  }
`;

const GhostButton = styled.button`
  background: transparent;
  color: #fff;
  border: 1px solid ${theme.border};
  padding: 12px 24px;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;

  &:hover {
    background: #fff;
    color: #000;
  }

  @media (max-width: 767px) {
    padding: 10px 16px;
    font-size: 0.65rem;
    width: 100%;
    justify-content: center;
  }
`;

export default AIGenerator;
