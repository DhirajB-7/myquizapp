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
const COOLDOWN_HOURS = 2;

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

    const checkRateLimit = async () => {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const { ip } = await res.json();
            const storageKey = `quiz_limit_${ip}`;
            const localData = JSON.parse(localStorage.getItem(storageKey) || '{"count": 0, "resetTime": 0}');
            const now = Date.now();

            if (localData.resetTime > 0 && now > localData.resetTime) {
                const freshData = { count: 0, resetTime: 0 };
                localStorage.setItem(storageKey, JSON.stringify(freshData));
                setRemainingAttempts(PLAY_LIMIT);
                return { allowed: true, data: freshData, key: storageKey };
            }
            setRemainingAttempts(Math.max(0, PLAY_LIMIT - localData.count));
            return { allowed: localData.count < PLAY_LIMIT, data: localData, key: storageKey };
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleGenerate = async () => {
        if (!formData.topic) { toast.error("TOPIC_REQUIRED"); return; }
        setIsLoading(true);
        const limitStatus = await checkRateLimit();
        if (!limitStatus.allowed) {
            toast.error("SYSTEM_LIMIT_REACHED");
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch('https://quizbyapi.onrender.com/api/v1/Generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            setQuizData(data);
            setTimeLeft(SECONDS_PER_QUESTION);
            const newCount = limitStatus.data.count + 1;
            localStorage.setItem(limitStatus.key, JSON.stringify({
                count: newCount,
                resetTime: newCount >= PLAY_LIMIT ? Date.now() + (COOLDOWN_HOURS * 3600000) : 0
            }));
            setRemainingAttempts(PLAY_LIMIT - newCount);
        } catch (error) { toast.error("SYNTHESIS_FAILED"); }
        finally { setIsLoading(false); }
    };

    const handleSubmitExam = () => {
        let currentScore = 0;
        quizData.forEach((q, idx) => { if (userAnswers[idx] === q.correctOpt) currentScore++; });
        setScore(currentScore);
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <PageContainer>
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#000', color: '#fff', border: `1px solid ${theme.border}`, borderRadius: '0px', fontFamily: theme.font } }} />

            <BackgroundDecor>
                <div className="grid-overlay" />
                <div className="scanline" />
            </BackgroundDecor>

            {!quizData ? (
                <GeneratorWrapper>
                    <NoirCard>
                        <Header>
                            <div className="limit-chip">SYS_STS: {remainingAttempts > 0 ? 'READY' : 'COOLDOWN'} // ATMP: {remainingAttempts}</div>
                            <BrandIcon><Cpu size={32} /></BrandIcon>
                            <div className="text-wrapper">
                                <h2>AI_QUIZ</h2>
                                <p>NEURAL_CORE_v2.06 // SESSION_ESTABLISHED</p>
                            </div>
                        </Header>

                        <FormGrid>
                            <InputGroup>
                                <label><Terminal size={12} /> TOPIC_INPUT_MODULE</label>
                                <input
                                    placeholder="Enter Protocol Topic..."
                                    value={formData.topic}
                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                />
                            </InputGroup>

                            <InputGroup>
                                <label><Zap size={12} /> COMPLEXITY_CALIBRATION</label>
                                <div className="pill-container">
                                    {['Easy', 'Moderate', 'Hard'].map((level) => (
                                        <Pill key={level} $active={formData.difficulty === level} onClick={() => setFormData({ ...formData, difficulty: level })}>
                                            {level}
                                        </Pill>
                                    ))}
                                </div>
                            </InputGroup>

                            <InputGroup>
                                <label><Globe size={12} /> LANG_INTERFACE</label>
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
                                {isLoading ? <Loader2 size={16} className="spinner" /> : "INITIATE_SEQUENCE"}
                            </PrimaryButton>
                        </FormGrid>
                    </NoirCard>
                    <StatusSidebar>
                        <StatusBox>
                            <Activity size={16} />
                            <span>NET_STATUS: NOMINAL</span>
                        </StatusBox>
                        <StatusBox>
                            <ShieldCheck size={16} />
                            <span>SEC_LEVEL: CLASS_A</span>
                        </StatusBox>
                    </StatusSidebar>
                </GeneratorWrapper>
            ) : (
                <ResultContainer>
                    <ResultHeader>
                        <div className="title-area">
                            <div className={isSubmitted ? "score-badge high-alert" : "success-badge"}>
                                {isSubmitted ? `FINAL_EVAL: ${score}/${quizData.length}` : `SYNC_TIMER: ${timeLeft}s`}
                            </div>
                            <h2>{isSubmitted ? "EVALUATION_REPORT" : `PROCESSED_DOMAIN: ${formData.topic}`}</h2>
                        </div>
                        {isSubmitted && (
                            <GhostButton onClick={() => {
                                setQuizData(null);          // Clears the quiz questions
                                setUserAnswers({});         // CLEARS PREVIOUS SELECTIONS
                                setCurrentQuestionIdx(0);   // RESETS TO FIRST QUESTION
                                setIsSubmitted(false);      // RESETS SUBMISSION STATE
                                setScore(0);                // RESETS SCORE
                            }}>
                                <RefreshCcw size={14} /> SYSTEM_REBOOT
                            </GhostButton>
                        )}
                    </ResultHeader>

                    {!isSubmitted && (
                        <TimerWrapper>
                            <TimerBarFill progress={(timeLeft / SECONDS_PER_QUESTION) * 100} />
                        </TimerWrapper>
                    )}

                    <QuestionGrid>
                        {quizData.map((q, idx) => {
                            if (!isSubmitted && idx !== currentQuestionIdx) return null;
                            return (
                                <QuestionCard key={idx} $isSubmitted={isSubmitted}>
                                    <div className="card-header">
                                        <div className="q-num">NODE_IDX: [0{idx + 1}]</div>
                                        <div className="q-id">AUTH_ID: {Math.floor(Math.random() * 9000) + 1000}</div>
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

                    {!isSubmitted && (
                        <StickyFooter>
                            <SubmitButton onClick={handleNextQuestion}>
                                {currentQuestionIdx === quizData.length - 1 ? "COMMIT_TO_MEMORY" : "ACCESS_NEXT_NODE"}
                                <ChevronRight size={18} />
                            </SubmitButton>
                        </StickyFooter>
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
  min-height: 100vh; background: ${theme.bg}; color: ${theme.text};
  font-family: ${theme.font}; padding: 20px;
  display: flex; justify-content: center; align-items: flex-start;
  position: relative; overflow-x: hidden;

  @media (min-width: 768px) { padding: 60px 40px; }
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
  display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 500px; z-index: 1;
  @media (min-width: 1024px) {
    flex-direction: row; max-width: 850px; align-items: flex-start;
  }
`;

const StatusSidebar = styled.div`
  display: flex; flex-direction: row; gap: 10px;
  @media (min-width: 1024px) { flex-direction: column; width: 220px; }
`;

const StatusBox = styled.div`
  flex: 1; background: ${theme.surface}; border: 1px solid ${theme.border};
  padding: 12px; display: flex; align-items: center; gap: 10px;
  font-size: 0.65rem; color: ${theme.muted}; font-weight: 900;
  text-transform: uppercase; letter-spacing: 1px;
`;

const NoirCard = styled.div`
  flex: 1; background: ${theme.surface}; border: 1px solid ${theme.border};
  padding: 30px; animation: ${fadeIn} 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  position: relative; box-shadow: 20px 20px 0px -5px rgba(0,0,0,1);
  
  @media (min-width: 768px) { padding: 50px; }

  &::before {
    content: ''; position: absolute; top: -1px; left: -1px; width: 20px; height: 20px;
    border-top: 2px solid ${theme.accent}; border-left: 2px solid ${theme.accent};
  }
`;

const BrandIcon = styled.div`
  margin: 0 auto 20px; color: ${theme.accent}; 
  background: ${theme.surfaceLighter}; width: 64px; height: 64px;
  display: flex; align-items: center; justify-content: center;
  clip-path: polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%);
`;

const Header = styled.div`
  text-align: center; margin-bottom: 40px;
  .limit-chip { 
    display: inline-block; font-size: 0.6rem; color: ${theme.cyan}; 
    background: rgba(0, 240, 255, 0.05); padding: 4px 12px; margin-bottom: 20px;
    border: 1px solid rgba(0, 240, 255, 0.2);
  }
  h2 { font-size: 1.4rem; font-weight: 900; letter-spacing: 3px; margin-bottom: 8px; }
  p { font-size: 0.7rem; color: ${theme.muted}; }
`;

const FormGrid = styled.div` display: flex; flex-direction: column; gap: 25px; `;

const InputGroup = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  label { font-size: 0.65rem; color: ${theme.muted}; font-weight: 900; letter-spacing: 1px; }
  input { 
    background: #000; border: 1px solid ${theme.border}; padding: 18px; color: #fff; 
    font-family: inherit; transition: all 0.2s;
    &:focus { border-color: ${theme.accent}; box-shadow: 0 0 15px rgba(255,255,255,0.05); outline: none; }
  }
  .pill-container { 
    display: flex; background: ${theme.border}; gap: 1px; border: 1px solid ${theme.border};
    overflow: hidden;
  }
`;

const Pill = styled.button`
  flex: 1; background: ${p => p.$active ? '#fff' : '#000'};
  color: ${p => p.$active ? '#000' : '#fff'};
  border: none; padding: 14px; font-size: 0.7rem; font-family: inherit; font-weight: 900; 
  cursor: pointer; transition: all 0.2s;
  &:hover { background: ${p => p.$active ? '#fff' : theme.surfaceLighter}; }
`;

const PrimaryButton = styled.button`
  background: #fff; color: #000; border: none; padding: 20px; font-weight: 900; 
  font-family: inherit; cursor: pointer; letter-spacing: 2px; font-size: 0.8rem;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  display: flex; align-items: center; justify-content: center; gap: 10px;

  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.5); background: #eee; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  .spinner { animation: ${spin} 1s linear infinite; }
`;

const ResultContainer = styled.div` width: 100%; max-width: 900px; z-index: 1; padding-bottom: 100px; `;

const ResultHeader = styled.div`
  display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px;
  @media (min-width: 768px) { flex-direction: row; justify-content: space-between; align-items: flex-end; }

  .title-area {
    .success-badge, .score-badge { 
      font-size: 0.75rem; font-weight: 900; color: ${theme.cyan}; margin-bottom: 12px;
      padding-left: 10px; border-left: 3px solid ${theme.cyan};
    }
    .high-alert { color: ${theme.success}; border-color: ${theme.success}; }
    h2 { font-size: 1.8rem; font-weight: 900; letter-spacing: -0.5px; }
  }
`;

const TimerWrapper = styled.div` 
  width: 100%; height: 4px; background: ${theme.border}; margin-bottom: 40px;
  border-radius: 10px; overflow: hidden;
`;
const TimerBarFill = styled.div` 
  height: 100%; width: ${p => p.progress}%; background: ${theme.accent}; 
  transition: width 1s linear; box-shadow: 0 0 10px ${theme.accent};
`;

const QuestionGrid = styled.div` display: flex; flex-direction: column; gap: 30px; `;

const QuestionCard = styled.div`
  background: ${theme.surface}; border: 1px solid ${theme.border}; padding: 30px;
  animation: ${fadeIn} 0.5s ease;

  .card-header {
    display: flex; justify-content: space-between; margin-bottom: 25px;
    padding-bottom: 15px; border-bottom: 1px solid ${theme.border};
    .q-num, .q-id { font-size: 0.65rem; color: ${theme.muted}; font-weight: 700; }
  }
  h3 { font-size: 1.2rem; line-height: 1.5; margin-bottom: 35px; color: ${theme.text}; font-weight: 500; }
  
  .options-list { 
    display: grid; grid-template-columns: 1fr; gap: 12px; 
    @media (min-width: 768px) { grid-template-columns: 1fr 1fr; }
  }
`;

const Option = styled.div`
  padding: 20px; border: 1px solid ${theme.border}; font-size: 0.85rem; cursor: pointer;
  display: flex; align-items: center; gap: 15px; transition: all 0.2s;
  background: #000; position: relative;

  .key { 
    font-size: 0.65rem; font-weight: 900; color: ${theme.muted}; 
    width: 24px; height: 24px; border: 1px solid ${theme.border};
    display: flex; align-items: center; justify-content: center;
  }

  &:hover { border-color: ${theme.muted}; background: ${theme.surfaceLighter}; }
  
  &.selected { border-color: ${theme.accent}; background: rgba(255,255,255,0.05); }
  
  &.correct { 
    border-color: ${theme.success}; color: ${theme.success}; 
    background: rgba(0, 255, 65, 0.05); font-weight: 900;
    .key { border-color: ${theme.success}; color: ${theme.success}; }
  }
  
  &.wrong { 
    border-color: ${theme.danger}; color: ${theme.danger};
    background: rgba(255, 68, 68, 0.05);
    .key { border-color: ${theme.danger}; color: ${theme.danger}; }
  }

  .status-icon { margin-left: auto; }
`;

const StickyFooter = styled.div`
  position: fixed; bottom: 0; left: 0; width: 100%; padding: 20px;
  background: linear-gradient(to top, #000 80%, transparent); 
  display: flex; justify-content: center; z-index: 10;
`;

const SubmitButton = styled(PrimaryButton)` 
  width: 100%; max-width: 500px;
  clip-path: polygon(0 0, 95% 0, 100% 30%, 100% 100%, 5% 100%, 0 70%);
`;

const GhostButton = styled.button`
  background: transparent; color: #fff; border: 1px solid ${theme.border}; padding: 12px 24px;
  font-family: inherit; font-size: 0.7rem; font-weight: 900; cursor: pointer; 
  display: flex; align-items: center; gap: 10px; transition: all 0.2s;
  &:hover { background: #fff; color: #000; }
`;

export default AIGenerator;
