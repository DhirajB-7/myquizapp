"use client";
import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2, ChevronLeft, ChevronRight, Save, Layout,
    Clock, CheckCircle, ArrowRight, Loader2, User, Timer, Cpu, Globe, Plus
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const theme = {
    bg: "#000000",
    surface: "#050505",
    border: "#111111",
    borderActive: "#ffffff",
    text: "#ffffff",
    muted: "#555555",
    accent: "#ffffff",
    success: "#00ff41",
    font: "'Courier New', Courier, monospace"
};



// Helper to convert minutes back to "HH:MM" for the input value
const minutesToTime = (totalMinutes) => {
    if (!totalMinutes) return "00:00";
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const mins = (totalMinutes % 60).toString().padStart(2, '0');
    return `${hours}:${mins}`;
};

const timeToMinutes = (h, m) => (parseInt(h) * 60) + parseInt(m);

const minutesToHHMM = (totalMinutes) => {
    const h = Math.floor((totalMinutes || 0) / 60);
    const m = (totalMinutes || 0) % 60;
    return { h, m };
};

const CreatePage = () => {
    const [phase, setPhase] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isSynthesizing, setIsSynthesizing] = useState(false);

    const [quizInfo, setQuizInfo] = useState({
        quizId: null,
        duration: 0,
        email: "",
        quizTitle: "",
        authorName: "",
        isPrivate: false,
        status: false,
        timeLimit: false,
        questionPerMin: "",
        timePerStudent: "",
        showInstantScore: false
    });

    const [questions, setQuestions] = useState([
        { quizId: null, question: "", a: "", b: "", c: "", d: "", correct: "" }
    ]);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        // Check if user is logged in, redirect to login if not
        if (!userData || !token) {
            window.location.href = '/login';
            return;
        }

        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setQuizInfo(prev => ({
                    ...prev,
                    email: parsedUser?.email || "",
                    authorName: parsedUser?.name || ""
                }));
            } catch (e) { console.error("Error parsing user data:", e); }
        }
    }, []);

    const handleInfoChange = (field, value) => {
        setQuizInfo({ ...quizInfo, [field]: value });
    };

    // Helper logic to map AI response to our 'a, b, c, d' format
    const mapAIResponse = (data) => {
        return data.map((q) => {
            let detectedCorrect = "";
            if (q.correctOpt === q.opt1) detectedCorrect = "a";
            else if (q.correctOpt === q.opt2) detectedCorrect = "b";
            else if (q.correctOpt === q.opt3) detectedCorrect = "c";
            else if (q.correctOpt === q.opt4) detectedCorrect = "d";

            if (!detectedCorrect) {
                const rawCorrect = String(q.correctOpt).toLowerCase();
                const letters = ['a', 'b', 'c', 'd'];
                if (rawCorrect.includes('opt')) {
                    const num = rawCorrect.replace(/\D/g, '');
                    detectedCorrect = letters[parseInt(num) - 1];
                } else if (!isNaN(rawCorrect) && rawCorrect !== "") {
                    detectedCorrect = letters[parseInt(rawCorrect) - 1];
                }
            }

            return {
                quizId: quizInfo.quizId,
                question: q.question,
                a: q.opt1,
                b: q.opt2,
                c: q.opt3,
                d: q.opt4,
                correct: detectedCorrect || "a"
            };
        });
    };

    const validateAndProceed = async () => {
        const title = quizInfo.quizTitle?.trim();
        if (!title || !quizInfo.authorName || !quizInfo.email) {
            return toast.error("Please fill in all fields");
        }

        if (quizInfo.timeLimit) {
            const timeVal = parseInt(quizInfo.questionPerMin);
            if (!quizInfo.questionPerMin || isNaN(timeVal) || timeVal <= 0) {
                return toast.error("Please specify Minute per question for the timer");
            }
        }

        setLoading(true);
        const step1Payload = {
            duration: 0,
            createdBy: quizInfo.email,
            quizTitle: title,
            author: quizInfo.authorName,
            status: false,
            timer: Boolean(quizInfo.timeLimit),
            isPrivate: Boolean(quizInfo.isPrivate),
            timePerQ: quizInfo.timeLimit ? parseInt(quizInfo.questionPerMin) : 0,
            timePerStudent: quizInfo.timePerStudent ? parseInt(quizInfo.timePerStudent) : 0,
            showInstantScore: Boolean(quizInfo.showInstantScore)
        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': '69420',
                    'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY
                }, body: JSON.stringify(step1Payload)
            });

            if (response.ok) {
                const savedQuizId = await response.json();
                setQuizInfo(prev => ({ ...prev, quizId: savedQuizId }));
                setQuestions(prev => prev.map(q => ({ ...q, quizId: savedQuizId })));
                toast.success(`Quiz Initialized! ID: ${savedQuizId}`);
                setPhase(1);
            } else {
                toast.error(`Server error. Try again.`);
            }
        } catch (error) {
            toast.error("Network failure");
        } finally {
            setLoading(false);
        }
    };

    const handleAISynthesis = async (isLoadMore = false) => {
        if (!quizInfo.quizTitle) return toast.error("Title required for AI generation");
        setIsSynthesizing(true);
        const toastId = toast.loading(isLoadMore ? "Fetching more questions..." : "AI is generating questions...");

        try {
            const response = await fetch(` https://quizbyapi-42ai.onrender.com/api/v1/Generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY
                },
                body: JSON.stringify({
                    topic: quizInfo.quizTitle,
                    count: 10,
                    difficulty: 'Moderate',
                    language: 'English'
                })
            });

            const data = await response.json();
            const newAIQuestions = mapAIResponse(data);

            if (isLoadMore) {
                // Create a Set of existing question texts (normalized for comparison)
                const existingQuestions = new Set(
                    questions.map(q => q.question.toLowerCase().trim())
                );

                // Filter out duplicates
                const uniqueNewQuestions = newAIQuestions.filter(newQ => {
                    const normalizedQuestion = newQ.question.toLowerCase().trim();
                    return !existingQuestions.has(normalizedQuestion);
                });

                if (uniqueNewQuestions.length === 0) {
                    toast.error("All generated questions are duplicates. Try again.", { id: toastId });
                    return;
                }

                const previousCount = questions.length;
                setQuestions(prev => [...prev, ...uniqueNewQuestions]);
                setCurrentSlide(previousCount);
                toast.success(`Added ${uniqueNewQuestions.length} unique questions!`, { id: toastId });
            } else {
                setQuestions(newAIQuestions);
                setCurrentSlide(0);
                toast.success("AI Generation Complete!", { id: toastId });
            }
        } catch (error) {
            toast.error("AI Service Unavailable", { id: toastId });
        } finally {
            setIsSynthesizing(false);
        }
    };

    const handlePublish = async () => {
        if (questions.some(q => !q.question || !q.correct)) {
            return toast.error("Ensure all questions have text and a correct option assigned");
        }

        setLoading(true);
        const payload = questions.map((q) => ({
            quizId: quizInfo.quizId,
            question: q.question,
            opt1: q.a,
            opt2: q.b,
            opt3: q.c,
            opt4: q.d,
            correctOpt: `opt${q.correct === 'a' ? '1' : q.correct === 'b' ? '2' : q.correct === 'c' ? '3' : '4'}`
        }));

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // 1. Success path
                toast.success("Quiz Published Successfully!");
                // We use router.replace to avoid back-button loops
                window.location.href = `/dashboard`;
            } else {
                // 2. Handle server errors (e.g., 400, 500)
                const errorData = await response.json().catch(() => ({}));
                toast.error(errorData.message || "Failed to publish quiz");
            }
        } catch (error) {
            // 3. Handle network/crash errors
            // Only show this if the response wasn't already handled
            console.error("Publishing error:", error);
            toast.error("Network error: Could not connect to server");
        } finally {
            setLoading(false);
        }
    };

    const updateQuestion = (field, value) => {
        const newQuestions = [...questions];
        newQuestions[currentSlide][field] = value;
        setQuestions(newQuestions);
    };

    return (
        <PageWrapper>
            <Toaster position="bottom-right" />
            <ContentHeader>
                <div className="status-tag">STEP {phase + 1} // {phase === 0 ? "SETUP" : "QUESTIONS"}</div>
                <h2>{phase === 0 ? "CREATE NEW QUIZ" : quizInfo.quizTitle.toUpperCase()}</h2>
            </ContentHeader>

            <MainContainer>
                <AnimatePresence mode="wait">
                    {phase === 0 ? (
                        <SlideCard key="p0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <FormGroup>
                                <label><Layout size={12} /> QUIZ TITLE</label>
                                <input className="zolvi-input" value={quizInfo.quizTitle} onChange={(e) => handleInfoChange('quizTitle', e.target.value)} placeholder="e.g. Science Trivia..." />
                            </FormGroup>

                            <FormGroup>
                                <label><User size={12} /> AUTHOR NAME</label>
                                <input className="zolvi-input" value={quizInfo.authorName} onChange={(e) => handleInfoChange('authorName', e.target.value)} placeholder="Your Name" />
                            </FormGroup>

                            <DualGrid>
                                {/* <FormGroup>
                                    <label><Timer size={12} /> TIMER </label>
                                    <BinaryToggle>
                                        <button className={quizInfo.timeLimit ? "active" : ""} onClick={() => handleInfoChange('timeLimit', true)}>ENABLED</button>
                                        <button className={!quizInfo.timeLimit ? "active" : ""} onClick={() => handleInfoChange('timeLimit', false)}>DISABLED</button>
                                    </BinaryToggle>
                                </FormGroup> */}
                                <FormGroup>
                                    <label><CheckCircle size={12} /> INSTANT SCORE DISPLAY</label>
                                    <BinaryToggle>
                                        <button className={quizInfo.showInstantScore ? "active" : ""} onClick={() => handleInfoChange('showInstantScore', true)}>YES</button>
                                        <button className={!quizInfo.showInstantScore ? "active" : ""} onClick={() => handleInfoChange('showInstantScore', false)}>NO</button>
                                    </BinaryToggle>
                                </FormGroup>
                                <FormGroup>
                                    <label><Globe size={12} /> VISIBILITY</label>
                                    <BinaryToggle>
                                        <button className={!quizInfo.isPrivate ? "active" : ""} onClick={() => handleInfoChange('isPrivate', false)}>PUBLIC</button>
                                        <button className={quizInfo.isPrivate ? "active" : ""} onClick={() => handleInfoChange('isPrivate', true)}>PRIVATE</button>
                                    </BinaryToggle>
                                </FormGroup>
                            </DualGrid>

                            <DualGrid>

                            </DualGrid>

                            {quizInfo.timeLimit ? (
                                <FormGroup>
                                    <label><Clock size={12} /> MINUTES PER QUESTION</label>
                                    <input type="number" className="zolvi-input" value={quizInfo.questionPerMin} onChange={(e) => handleInfoChange('questionPerMin', e.target.value)} placeholder="e.g. 1 Min" />
                                </FormGroup>
                            ) : (
                                <FormGroup>
                                    <label><Clock size={12} /> WINDOW OPEN FOR STUDENT (HH : MM)</label>
                                    <PickerContainer>
                                        {/* HOURS BLOCK */}
                                        <ScrollBlock>
                                            <span className="unit-label">HRS</span>
                                            <select
                                                value={minutesToHHMM(quizInfo.timePerStudent).h}
                                                onChange={(e) => {
                                                    const { m } = minutesToHHMM(quizInfo.timePerStudent);
                                                    handleInfoChange('timePerStudent', timeToMinutes(e.target.value, m));
                                                }}
                                            >
                                                {Array.from({ length: 25 }, (_, i) => (
                                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </ScrollBlock>

                                        <div className="separator">:</div>

                                        {/* MINUTES BLOCK */}
                                        <ScrollBlock>
                                            <span className="unit-label">MIN</span>
                                            <select
                                                value={minutesToHHMM(quizInfo.timePerStudent).m}
                                                onChange={(e) => {
                                                    const { h } = minutesToHHMM(quizInfo.timePerStudent);
                                                    handleInfoChange('timePerStudent', timeToMinutes(h, e.target.value));
                                                }}
                                            >
                                                {Array.from({ length: 60 }, (_, i) => (
                                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </ScrollBlock>
                                    </PickerContainer>
                                    <small style={{ fontSize: '9px', color: theme.muted, marginTop: '5px' }}>
                                        System Value: {quizInfo.timePerStudent || 0} total minutes
                                    </small>
                                </FormGroup>
                            )}

                            <PrimaryBtn onClick={validateAndProceed} disabled={loading}>
                                {loading ? <Loader2 className="spin" /> : <>START CREATING <ArrowRight size={18} /></>}
                            </PrimaryBtn>
                        </SlideCard>
                    ) : (
                        <div key="p1">
                            <AIControlBar>
                                <button className="ai-btn" onClick={() => handleAISynthesis(false)} disabled={isSynthesizing}>
                                    {isSynthesizing ? <Loader2 className="spin" size={14} /> : <Cpu size={14} />}
                                    <span>{isSynthesizing ? "GENERATING..." : "GENERATE ALL WITH AI"}</span>
                                </button>
                                <button className="ai-btn load-more" onClick={() => handleAISynthesis(true)} disabled={isSynthesizing}>
                                    {isSynthesizing ? <Loader2 className="spin" size={14} /> : <Plus size={14} />}
                                    <span>LOAD MORE FROM AI</span>
                                </button>
                            </AIControlBar>

                            <NavHeader>
                                <button onClick={() => setPhase(0)} className="nav-icon-btn"><ChevronLeft size={20} /></button>
                                <div className="slide-nav">
                                    <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}><ChevronLeft size={16} /></button>
                                    <span className="counter">{currentSlide + 1} / {questions.length}</span>
                                    <button onClick={() => setCurrentSlide(Math.min(questions.length - 1, currentSlide + 1))} disabled={currentSlide === questions.length - 1}><ChevronRight size={16} /></button>
                                </div>
                                <button onClick={() => {
                                    if (questions.length === 1) return toast.error("Minimum 1 question required");
                                    const newQ = questions.filter((_, i) => i !== currentSlide);
                                    setQuestions(newQ);
                                    setCurrentSlide(Math.max(0, currentSlide - 1));
                                }} className="nav-icon-btn delete"><Trash2 size={18} /></button>
                            </NavHeader>

                            <SlideCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <FormGroup>
                                    <label>QUESTION TEXT</label>
                                    <textarea className="zolvi-textarea" value={questions[currentSlide].question} onChange={(e) => updateQuestion('question', e.target.value)} placeholder="Type question..." />
                                </FormGroup>

                                <OptionsMatrix>
                                    {['a', 'b', 'c', 'd'].map((letter) => (
                                        <OptionNode key={letter}>
                                            <div className="node-prefix">{letter.toUpperCase()}</div>
                                            <input
                                                type="text"
                                                className="opt-input"
                                                value={questions[currentSlide][letter]}
                                                onChange={(e) => updateQuestion(letter, e.target.value)}
                                                placeholder={`Option ${letter.toUpperCase()}...`}
                                            />
                                        </OptionNode>
                                    ))}
                                </OptionsMatrix>

                                <FormGroup style={{ marginTop: '10px', borderTop: `1px solid ${theme.border}`, paddingTop: '15px' }}>
                                    <label><CheckCircle size={12} color={theme.success} /> ASSIGNED CORRECT OPTION</label>
                                    <select
                                        className="zolvi-input"
                                        value={questions[currentSlide].correct}
                                        onChange={(e) => updateQuestion('correct', e.target.value)}
                                        style={{ color: theme.success, fontWeight: 'bold' }}
                                    >
                                        <option value="">Select Correct Answer</option>
                                        <option value="a">OPTION A</option>
                                        <option value="b">OPTION B</option>
                                        <option value="c">OPTION C</option>
                                        <option value="d">OPTION D</option>
                                    </select>
                                </FormGroup>
                            </SlideCard>

                            <ActionArea>
                                <SecondaryBtn onClick={() => setQuestions([...questions, { quizId: quizInfo.quizId, question: "", a: "", b: "", c: "", d: "", correct: "" }])}>+ ADD NEW MANUAL QUESTION</SecondaryBtn>
                                <PrimaryBtn onClick={handlePublish} disabled={loading}>
                                    {loading ? <Loader2 className="spin" /> : <>SAVE & PUBLISH <Save size={18} /></>}
                                </PrimaryBtn>
                            </ActionArea>
                        </div>
                    )}
                </AnimatePresence>
            </MainContainer>
        </PageWrapper>
    );
};

/* --- STYLES --- */
const PickerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #0a0a0a; /* Slightly lighter than pure black */
  padding: 15px;
  border: 1px solid ${theme.border};
  width: 100%;
  border-radius: 4px;

  .separator {
    font-size: 24px;
    font-weight: 900;
    color: ${theme.muted};
    margin-top: 15px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const ScrollBlock = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 5px;

  .unit-label {
    font-size: 9px;
    color: ${theme.muted};
    font-weight: 900;
    letter-spacing: 2px;
    text-align: center;
  }

  .select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  /* We keep the select for functionality but hide its ugliness */
  select {
    width: 100%;
    background: #111;
    color: ${theme.text};
    border: 1px solid ${theme.border};
    padding: 15px 10px;
    font-size: 1.5rem; /* Large, readable numbers */
    font-family: ${theme.font};
    font-weight: 900;
    text-align: center;
    cursor: pointer;
    appearance: none;
    outline: none;
    transition: all 0.2s ease;
    border-radius: 2px;

    &:hover {
      background: #151515;
      border-color: ${theme.muted};
    }

    &:focus {
      border-color: ${theme.accent};
      background: #1a1a1a;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
    }

    option {
      background: #000;
      color: #fff;
      font-size: 1rem;
    }
  }

  /* Custom arrow for the select */
  .select-wrapper::after {
    content: '▼';
    font-size: 8px;
    position: absolute;
    right: 15px;
    color: ${theme.muted};
    pointer-events: none;
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const ripple = keyframes`
  to {
    transform: scale(4);
    opacity: 0;
  }
`;
const cardHover = css`
  &:hover {
    transform: translateY(-5px);
    border-color: #fff;
    box-shadow: 8px 8px 0 rgba(255, 255, 255, 0.1);
    &::after { left: 100%; }
  }
`;
const spin = keyframes` from { transform: rotate(0deg); } to { transform: rotate(360deg); } `;
const PageWrapper = styled.div` 
  min-height: 100vh; 
  background: ${props => props.theme.bg || '#000'}; 
  color: ${props => props.theme.text || '#fff'}; 
  padding: 40px 20px; 
  font-family: ${props => props.theme.font || 'sans-serif'}; 
`;
const ContentHeader = styled.div` max-width: 600px; margin: 0 auto 30px; .status-tag { font-size: 10px; color: ${theme.muted}; letter-spacing: 2px; } h2 { font-size: 1.2rem; margin-top: 5px; letter-spacing: 1px; } `;
const MainContainer = styled.div` max-width: 600px; margin: 0 auto; `;
const SlideCard = styled(motion.div)` 
  background: #1E1E1E;  
  border: 1px solid ${props => props.theme.border || '#333'}; 
  padding: 25px; 
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);

  /* Shimmer Glass Effect */
  &::after {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
    transition: left 0.7s ease;
  }

  ${cardHover}
`;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 8px; label { font-size: 10px; color: ${theme.muted}; display: flex; align-items: center; gap: 6px; } .zolvi-input, .zolvi-textarea { background: ${theme.bg}; border: 1px solid ${theme.border}; color: ${theme.text}; padding: 12px; font-size: 13px; &:focus { border-color: ${theme.borderActive}; outline: none; } } .zolvi-textarea { min-height: 100px; resize: none; } `;
const AIControlBar = styled.div` 
    display: flex; 
    gap: 10px; 
    margin-bottom: 15px; 
    .ai-btn { 
        flex: 1;
        background: ${props => props.theme.bg || '#000'}; 
        border: 1px dashed ${props => props.theme.border || '#444'}; 
        color: ${props => props.theme.text || '#fff'}; 
        padding: 12px; 
        font-size: 9px; 
        font-weight: 900; 
        letter-spacing: 1px; 
        cursor: pointer; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        gap: 8px; 
        transition: 0.3s;
        text-transform: uppercase;

        &:hover { 
          border: 1px solid ${props => props.theme.success || '#00ff64'}; 
          color: ${props => props.theme.success || '#00ff64'}; 
          background: rgba(0, 255, 100, 0.05);
          box-shadow: 0 0 15px rgba(0, 255, 100, 0.1);
        } 
    } 
`;
const NavHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; .nav-icon-btn { background: transparent; border: 1px solid ${theme.border}; color: ${theme.muted}; padding: 8px; cursor: pointer; &:hover { color: ${theme.text}; border-color: ${theme.borderActive}; } } .slide-nav { display: flex; align-items: center; gap: 10px; .counter { font-size: 12px; font-weight: 900; } button { background: none; border: none; color: ${theme.text}; cursor: pointer; } } `;
const OptionsMatrix = styled.div` display: flex; flex-direction: column; gap: 10px; `;
const OptionNode = styled.div` 
  display: flex; 
  align-items: center; 
  gap: 10px; 
  background: ${props => props.theme.bg || '#111'}; 
  border: 1px solid ${props => props.theme.border || '#333'}; 
  padding: 10px; 
  transition: 0.3s;

  &:hover {
    border-color: ${props => props.theme.borderActive || '#fff'};
    background: #1a1a1a;
  }

  .node-prefix { 
    font-size: 12px; 
    font-weight: 900; 
    color: ${props => props.theme.muted || '#666'}; 
    width: 20px; 
  } 

  .opt-input { 
    flex: 1; 
    background: none; 
    border: none; 
    color: ${props => props.theme.text || '#fff'}; 
    font-size: 12px; 
    outline: none; 
    font-family: inherit; 
  } 
`;
const BinaryToggle = styled.div` display: flex; gap: 5px; button { flex: 1; background: ${theme.bg}; border: 1px solid ${theme.border}; color: ${theme.muted}; padding: 8px; font-size: 10px; cursor: pointer; &.active { background: ${theme.text}; color: ${theme.bg}; border-color: ${theme.text}; } } `;
const PrimaryBtn = styled.button` 
  width: 100%; 
  padding: 15px; 
  background: ${props => props.theme.accent || '#fff'}; 
  color: ${props => props.theme.bg || '#000'}; 
  border: 2px solid transparent; 
  font-weight: 900; 
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 10px; 
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: #000;
    color: #fff;
    border-color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.4);
  }

  /* Ripple/Pulse effect on click */
  &:active:after {
    content: "";
    position: absolute;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: scale(0);
    animation: ${ripple} 0.6s linear;
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; } 
  .spin { animation: ${spin} 1s linear infinite; } 
`;
const SecondaryBtn = styled.button` width: 100%; padding: 15px; background: transparent; border: 1px solid ${theme.border}; color: ${theme.text}; font-size: 12px; cursor: pointer; &:hover { background: #111; } `;
const ActionArea = styled.div` display: flex; gap: 10px; margin-top: 20px; flex-direction: column; `;
const DualGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 15px; `;



export default CreatePage;