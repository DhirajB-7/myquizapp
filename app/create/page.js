"use client";
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
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
        questionPerMin: ""
    });

    const [questions, setQuestions] = useState([
        { quizId: null, question: "", a: "", b: "", c: "", d: "", correct: "" }
    ]);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const userData = localStorage.getItem("user");
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

        setLoading(true);
        const step1Payload = {
            duration: 0,
            createdBy: quizInfo.email,
            quizTitle: title,
            author: quizInfo.authorName,
            status: false,
            timer: Boolean(quizInfo.timeLimit),
            isPrivate: Boolean(quizInfo.isPrivate),
            timePerQ: quizInfo.timeLimit ? parseInt(quizInfo.questionPerMin) : 0
        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': '69420'
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
            const response = await fetch('https://quizbyaiservice-production.up.railway.app/Generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                const previousCount = questions.length;
                setQuestions(prev => [...prev, ...newAIQuestions]);
                setCurrentSlide(previousCount); // Jump to the first newly added question
                toast.success(`Added 10 more questions!`, { id: toastId });
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success("Quiz Published Successfully!");
                window.location.href = "/dashboard";
            }
        } catch (error) {
            toast.error("Error saving questions");
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
                                <FormGroup>
                                    <label><Timer size={12} /> TIME LIMIT</label>
                                    <BinaryToggle>
                                        <button className={quizInfo.timeLimit ? "active" : ""} onClick={() => handleInfoChange('timeLimit', true)}>ENABLED</button>
                                        <button className={!quizInfo.timeLimit ? "active" : ""} onClick={() => handleInfoChange('timeLimit', false)}>DISABLED</button>
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

                            {quizInfo.timeLimit && (
                                <FormGroup>
                                    <label><Clock size={12} /> SECONDS PER QUESTION</label>
                                    <input type="number" className="zolvi-input" value={quizInfo.questionPerMin} onChange={(e) => handleInfoChange('questionPerMin', e.target.value)} placeholder="e.g. 30" />
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
                                    <span>{isSynthesizing ? "GENERATING..." : "RE-GENERATE ALL WITH AI"}</span>
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
const spin = keyframes` from { transform: rotate(0deg); } to { transform: rotate(360deg); } `;
const PageWrapper = styled.div` min-height: 100vh; background: ${theme.bg}; color: ${theme.text}; padding: 40px 20px; font-family: ${theme.font}; `;
const ContentHeader = styled.div` max-width: 600px; margin: 0 auto 30px; .status-tag { font-size: 10px; color: ${theme.muted}; letter-spacing: 2px; } h2 { font-size: 1.2rem; margin-top: 5px; letter-spacing: 1px; } `;
const MainContainer = styled.div` max-width: 600px; margin: 0 auto; `;
const SlideCard = styled(motion.div)` background: ${theme.surface}; border: 1px solid ${theme.border}; padding: 25px; display: flex; flex-direction: column; gap: 20px; `;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 8px; label { font-size: 10px; color: ${theme.muted}; display: flex; align-items: center; gap: 6px; } .zolvi-input, .zolvi-textarea { background: ${theme.bg}; border: 1px solid ${theme.border}; color: ${theme.text}; padding: 12px; font-size: 13px; &:focus { border-color: ${theme.borderActive}; outline: none; } } .zolvi-textarea { min-height: 100px; resize: none; } `;
const AIControlBar = styled.div` 
    display: flex; 
    gap: 10px; 
    margin-bottom: 15px; 
    .ai-btn { 
        flex: 1;
        background: ${theme.bg}; 
        border: 1px dashed ${theme.border}; 
        color: ${theme.text}; 
        padding: 12px; 
        font-size: 9px; 
        font-weight: 900; 
        letter-spacing: 1px; 
        cursor: pointer; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        gap: 8px; 
        transition: 0.2s;
        &:hover { border-color: ${theme.success}; color: ${theme.success}; } 
        &.load-more:hover { border-color: ${theme.accent}; color: ${theme.accent}; }
        .spin { animation: ${spin} 1s linear infinite; } 
    } 
`;
const NavHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; .nav-icon-btn { background: transparent; border: 1px solid ${theme.border}; color: ${theme.muted}; padding: 8px; cursor: pointer; &:hover { color: ${theme.text}; border-color: ${theme.borderActive}; } } .slide-nav { display: flex; align-items: center; gap: 10px; .counter { font-size: 12px; font-weight: 900; } button { background: none; border: none; color: ${theme.text}; cursor: pointer; } } `;
const OptionsMatrix = styled.div` display: flex; flex-direction: column; gap: 10px; `;
const OptionNode = styled.div` display: flex; align-items: center; gap: 10px; background: ${theme.bg}; border: 1px solid ${theme.border}; padding: 10px; .node-prefix { font-size: 12px; font-weight: 900; color: ${theme.muted}; width: 20px; } .opt-input { flex: 1; background: none; border: none; color: ${theme.text}; font-size: 12px; outline: none; font-family: inherit; } `;
const BinaryToggle = styled.div` display: flex; gap: 5px; button { flex: 1; background: ${theme.bg}; border: 1px solid ${theme.border}; color: ${theme.muted}; padding: 8px; font-size: 10px; cursor: pointer; &.active { background: ${theme.text}; color: ${theme.bg}; border-color: ${theme.text}; } } `;
const PrimaryBtn = styled.button` width: 100%; padding: 15px; background: ${theme.accent}; color: ${theme.bg}; border: none; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; &:disabled { opacity: 0.5; } .spin { animation: ${spin} 1s linear infinite; } `;
const SecondaryBtn = styled.button` width: 100%; padding: 15px; background: transparent; border: 1px solid ${theme.border}; color: ${theme.text}; font-size: 12px; cursor: pointer; &:hover { background: #111; } `;
const ActionArea = styled.div` display: flex; gap: 10px; margin-top: 20px; flex-direction: column; `;
const DualGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 15px; `;

export default CreatePage;