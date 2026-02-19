"use client";
import React, { useState, useEffect, Suspense } from 'react'; // Added Suspense
import styled, { keyframes, css, createGlobalStyle } from 'styled-components';
import { Zap, Loader2, EyeOff, MonitorSmartphone, Trophy, RefreshCcw, User, Hash, CheckCircle2, AlertTriangle, XCircle, Timer, ChevronRight, ShieldAlert } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';

// 1. GLOBAL PROTECTION STYLES
const GlobalSecurity = createGlobalStyle`
  * {
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }
  @media print {
    body { display: none !important; }
  }
`;

const PlayQuizContent = () => { // Renamed internal component
    const searchParams = useSearchParams();
    const router = useRouter();

    const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [secondsPerQuestion, setSecondsPerQuestion] = useState(60);
    const [timeLeft, setTimeLeft] = useState(60);
    const [warningCount, setWarningCount] = useState(0);
    const [screenBlocked, setScreenBlocked] = useState(false);
    const [showInstantScore, setShowInstantScore] = useState(false);
    const [accessExpires, setAccessExpires] = useState(null);
    const [now, setNow] = useState(Date.now());

    // --- FIX: Initialize state with URL param directly ---
    const [joinData, setJoinData] = useState({
        participantName: '',
        quizId: ''
    });

    // --- FIX: Sync state if URL changes after mount ---
    useEffect(() => {
        const qId = searchParams.get('quizId');
        if (qId) {
            // We use the functional update to ensure we don't wipe participantName
            setJoinData(prev => ({
                ...prev,
                quizId: qId
            }));
            toast.success("ID Captured from URL: " + qId); // Debugging
        }
    }, [searchParams]);

    // --- SECURITY LAYER ---
    useEffect(() => {
        if (!quizData || isSubmitted) return;
        const handleSecurityAlert = () => {
            setScreenBlocked(true);
            toast.error("SECURITY PROTOCOL: SCREEN BLOCKED", { id: 'security-toast' });
            setTimeout(() => window.location.reload(), 1500);
        };
        const handleSecurityClear = () => setScreenBlocked(false);

        window.addEventListener('blur', handleSecurityAlert);
        window.addEventListener('focus', handleSecurityClear);
        document.addEventListener('mouseleave', handleSecurityAlert);
        document.addEventListener('mouseenter', handleSecurityClear);

        const handleKeyDown = (e) => {
            if (e.key === 'PrintScreen' || e.key === 'Snapshot' || (e.ctrlKey && e.key === 'p') || (e.metaKey && e.shiftKey && (e.key === 's' || e.key === '4'))) {
                e.preventDefault();
                handleSecurityAlert();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('blur', handleSecurityAlert);
            window.removeEventListener('focus', handleSecurityClear);
            document.removeEventListener('mouseleave', handleSecurityAlert);
            document.removeEventListener('mouseenter', handleSecurityClear);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [quizData, isSubmitted]);

    // --- TAB SWITCH WARNING ---
    useEffect(() => {
        if (!quizData || isSubmitted) return;
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                const nextWarning = warningCount + 1;
                setWarningCount(nextWarning);
                if (nextWarning === 1) toast.error("WARNING 1/2: TAB SWITCHING DETECTED!");
                else if (nextWarning >= 2) {
                    toast.error("FINAL WARNING: TERMINATING.");
                    setTimeout(() => window.location.reload(), 1500);
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [quizData, isSubmitted, warningCount]);

    // --- TIMER LOGIC ---
    useEffect(() => {
        if (!quizData || isSubmitted || !quizData.quiz?.timer) return;
        if (timeLeft === 0) {
            handleNextQuestion();
            return;
        }
        const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, quizData, isSubmitted]);

    const handleNextQuestion = () => {
        // ensure current question has an answer
        if (!userAnswers[currentQuestionIdx]) {
            toast.error("Please select an answer before proceeding");
            return;
        }

        const isLastQuestion = currentQuestionIdx === quizData.questions.length - 1;
        if (isLastQuestion) handleSubmitExam();
        else {
            setCurrentQuestionIdx(prev => prev + 1);
            if (quizData.quiz?.timer) setTimeLeft(secondsPerQuestion);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const getDeviceFingerprint = () => {
    if (typeof window === 'undefined') return 'server'; // Safety for Next.js
    const { userAgent, language } = window.navigator;
    const { width, height } = window.screen;
    const id = `${userAgent}|${language}|${width}x${height}`;
    return btoa(id).slice(0, 32); 
};

    // --- JOIN QUIZ & FULLSCREEN ---
   const handleJoinQuiz = async () => {
    if (!joinData.participantName || !joinData.quizId) {
        toast.error("CREDENTIALS REQUIRED");
        return;
    }

    // --- SECURITY CHECK: ONLY PREVENT IF ALREADY FINISHED ---
    const fingerprint = getDeviceFingerprint();
    const lockKey = `quiz_lock_${joinData.quizId}_${fingerprint}`;
    const isLocked = localStorage.getItem(lockKey);

    if (isLocked === "SUBMITTED") {
        toast.error("ACCESS DENIED: You have already submitted this exam.");
        return;
    }
    // -------------------------------------------------------

    setIsLoading(true);
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Play/${joinData.quizId}/${joinData.participantName}`, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': '69420',
                'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY
            },
        });

        if (!response.ok) throw new Error(`ACCESS DENIED: Quiz inactive.`);
        const data = await response.json();

        if (!data.questions || data.questions.length === 0) {
            toast.error("ERROR: THIS QUIZ HAS NO QUESTIONS");
            setIsLoading(false);
            return;
        }

        // TRIGGER FULLSCREEN
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {
                console.log("Fullscreen blocked");
            });
        }

        if (data.quiz?.timePerQ !== undefined) {
            const convertedSeconds = parseInt(data.quiz.timePerQ) * 60;
            setSecondsPerQuestion(convertedSeconds);
            setTimeLeft(convertedSeconds);
        }
        
        // Respect server-side configuration whether to show instant score to students
        if (data.quiz?.showInstantScore !== undefined) {
            setShowInstantScore(Boolean(data.quiz.showInstantScore));
        }

        // Enforce per-attender access window (hours) if configured by creator
        try {
            const hours = parseInt(data.quiz?.timePerStudent || 0);
            if (hours > 0) {
                const accessKey = `quiz_access_${joinData.quizId}_${fingerprint}`;
                const existing = localStorage.getItem(accessKey);
                let allow = true;
                if (existing) {
                    try {
                        const obj = JSON.parse(existing);
                        if (obj.expires && Date.now() > obj.expires) {
                            // expired -> overwrite
                            allow = true;
                        } else {
                            // still within window -> allow
                            allow = true;
                        }
                    } catch (e) { allow = true; }
                }
                if (allow) {
                    const expires = Date.now() + hours * 3600 * 1000;
                    localStorage.setItem(accessKey, JSON.stringify({ expires }));
                    setAccessExpires(expires);
                } else if (existing) {
                    try {
                        const obj = JSON.parse(existing);
                        if (obj.expires) setAccessExpires(obj.expires);
                    } catch (e) { /* ignore */ }
                }
            }
        } catch (e) { console.error('access window set failed', e); }

        setQuizData(data);
        toast.success(`CONNECTION ESTABLISHED`);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsLoading(false);
    }
};
    useEffect(() => {
        const handleSecurityBreach = () => {
            if (!document.fullscreenElement && quizData) {
                //toast.error("SECURITY BREACH: Fullscreen exited. Submitting quiz...");
                handleSubmitExam(); // Force submit the quiz
            }
        };

        document.addEventListener('fullscreenchange', handleSecurityBreach);
        return () => document.removeEventListener('fullscreenchange', handleSecurityBreach);
    }, [quizData]);

    // keep a ticking `now` so remaining time display updates
    useEffect(() => {
        if (!accessExpires) return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [accessExpires]);

    const handleSelectOption = (questionIdx, optionText) => {
        if (isSubmitted) return;
        setUserAnswers(prev => ({ ...prev, [questionIdx]: optionText }));
    };

   const handleSubmitExam = async () => {
    const questions = quizData.questions;
    let currentScore = 0;
    questions.forEach((q, idx) => {
        if (userAnswers[idx] === q[q.correctOpt]) currentScore++;
    });

    const finalSubmission = {
        quizId: parseInt(joinData.quizId),
        participantName: joinData.participantName,
        score: currentScore.toString(),
        outOf: questions.length.toString()
    };

    setIsLoading(true);
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Play/Submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 
                'ngrok-skip-browser-warning': '69420',
                'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY
            },
            body: JSON.stringify(finalSubmission)
        });

        if (response.ok) {
            // --- LOCK THE USER NOW THAT THEY HAVE SUBMITTED ---
            const fingerprint = getDeviceFingerprint();
            const lockKey = `quiz_lock_${joinData.quizId}_${fingerprint}`;
            localStorage.setItem(lockKey, "SUBMITTED");
            // -------------------------------------------------

            setScore(currentScore);
            setIsSubmitted(true);
            toast.success("Quiz Submitted Successfully!");
            
            // Exit fullscreen automatically on finish
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else throw new Error("SUBMISSION FAILED");
    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsLoading(false);
    }
};
    if (!hasAcceptedRules) {
        return (
            <PageContainer>
                <EntryWrapper style={{ maxWidth: '700px' }}> {/* Wider wrapper for rules */}
                    <StatusTag><ShieldAlert size={12} /> PROTOCOL INITIALIZATION</StatusTag>
                    <ZolviEntryCard>
                        <Header>
                            <div className="icon-box"><AlertTriangle size={24} color="orange" /></div>
                            <div>
                                <h2>RULES OF ENGAGEMENT</h2>
                                <p>STRICT ENFORCEMENT ACTIVE</p>
                            </div>
                        </Header>

                        <RulesList>
                            <RuleItem>
                                <div className="rule-header"><Zap size={14} /> Anti-Cheat</div>
                                <div className="rule-desc">Tab switching or window resizing triggers immediate disqualification.</div>
                            </RuleItem>

                            <RuleItem>
                                <div className="rule-header"><EyeOff size={14} /> Surveillance</div>
                                <div className="rule-desc">Active monitoring of cursor movements and focus state is enabled.</div>
                            </RuleItem>

                            <RuleItem>
                                <div className="rule-header"><MonitorSmartphone size={14} /> Display</div>
                                <div className="rule-desc">System forces Fullscreen Mode. Exiting will terminate the arena.</div>
                            </RuleItem>

                            <RuleItem>
                                <div className="rule-header"><Timer size={14} /> Timing</div>
                                <div className="rule-desc">Fixed duration per question. No manual submission required for time-out.</div>
                            </RuleItem>
                        </RulesList>

                        <EntryButton onClick={() => setHasAcceptedRules(true)} style={{ width: '100%' }}>
                            INITIALIZE ARENA SESSION
                        </EntryButton>
                    </ZolviEntryCard>
                </EntryWrapper>
            </PageContainer>
        );
    }

    return (
        <PageContainer $isBlocked={screenBlocked}>
            <GlobalSecurity />
            <Toaster toastOptions={{ style: { background: '#0a0a0a', color: '#fff', border: '1px solid #222' } }} />

            {!quizData ? (
                <EntryWrapper>
                    <StatusTag><ShieldAlert size={12} /> ENCRYPTED SESSION</StatusTag>
                    <ZolviEntryCard>
                        <Header>
                            <div className="icon-box"><Zap size={24} fill="currentColor" /></div>
                            <div>
                                <h2>PLAY QUIZ</h2>
                                <p>ENTER YOUR DETAILS TO BEGIN</p>
                            </div>
                        </Header>

                        <FormGrid>
                            <InputGroup>
                                <label>PARTICIPANT NAME</label>
                                <div className="input-wrapper">
                                    <User size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Enter full name..."
                                        value={joinData.participantName}
                                        onChange={(e) => setJoinData({ ...joinData, participantName: e.target.value })}
                                    />
                                </div>
                            </InputGroup>

                            <InputGroup>
                                <label>QUIZ ID</label>
                                <div className="input-wrapper">
                                    <Hash size={16} className="input-icon" />
                                    <input
                                        type="number"
                                        placeholder="000000"
                                        value={joinData.quizId}
                                        onChange={(e) => setJoinData({ ...joinData, quizId: e.target.value })}
                                    />
                                </div>
                            </InputGroup>

                            <EntryButton onClick={handleJoinQuiz} disabled={isLoading}>
                                {isLoading ? <Loader2 className="spinner" /> : "ENTER ARENA"}
                            </EntryButton>
                        </FormGrid>
                    </ZolviEntryCard>
                </EntryWrapper>
            ) : (
                <QuizWrapper>
                    <QuizHeader>
                        <div className="top-meta">
                            <span className="q-count">QUESTION {currentQuestionIdx + 1}/{quizData.questions.length}</span>
                            {(quizData.quiz?.timer || isSubmitted) && (
                                <div className={isSubmitted ? (showInstantScore ? "status-pill score" : "status-pill submitted") : "status-pill timer"}>
                                    {isSubmitted ? <Trophy size={14} /> : <Timer size={14} />}
                                    {isSubmitted ? (showInstantScore ? `SCORE: ${score}/${quizData.questions.length}` : `SUBMITTED`) : `${timeLeft}s`}
                                </div>
                            )}
                            {accessExpires && Date.now() < accessExpires && (
                                (() => {
                                    const remaining = accessExpires - now;
                                    const hrs = Math.floor(remaining / (1000 * 60 * 60));
                                    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                                    return (
                                        <div style={{ marginLeft: 12 }} className="status-pill" title="Access window remaining">
                                            <Timer size={12} /> ACCESS: {hrs}h {mins}m
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                        <h2>{isSubmitted ? "POST-SESSION ANALYSIS" : quizData.quiz.quizTitle}</h2>
                    </QuizHeader>

                    {!isSubmitted && quizData.quiz?.timer && (
                        <ProgressBarContainer>
                            <ProgressFill progress={(timeLeft / secondsPerQuestion) * 100} />
                        </ProgressBarContainer>
                    )}

                    <ContentArea>
                        {isSubmitted && !showInstantScore ? (
                            <ZolviEntryCard style={{ textAlign: 'center', padding: '40px' }}>
                                <Header style={{ marginBottom: '16px' }}>
                                    <div className="icon-box"><Trophy size={28} /></div>
                                    <div>
                                        <h2>THANK YOU</h2>
                                        <p>Submission received for <strong>{joinData.participantName}</strong></p>
                                    </div>
                                </Header>
                                <div style={{ marginTop: 12, color: '#bbb' }}>
                                    Your submission has been recorded. The instructor will release results when available.
                                </div>
                            </ZolviEntryCard>
                        ) : (
                            quizData.questions.map((q, idx) => {
                                if (!isSubmitted && idx !== currentQuestionIdx) return null;
                                return (
                                    <QuestionCard key={idx} $isSubmitted={isSubmitted}>
                                        <div className="q-label">Q No.{idx + 1}</div>
                                        <h3>{q.question}</h3>
                                        <OptionsGrid>
                                            {["opt1", "opt2", "opt3", "opt4"].map((optKey) => {
                                                const optValue = q[optKey];
                                                const isSelected = userAnswers[idx] === optValue;
                                                const isCorrect = optValue === q[q.correctOpt];
                                                let variant = "default";
                                                if (isSubmitted) {
                                                    if (showInstantScore) {
                                                        if (isCorrect) variant = "correct";
                                                        else if (isSelected) variant = "wrong";
                                                    } else {
                                                        // don't reveal correct/wrong when instant score disabled
                                                        if (isSelected) variant = "selected";
                                                    }
                                                } else if (isSelected) variant = "selected";

                                                return (
                                                    <OptionButton
                                                        key={optKey}
                                                        variant={variant}
                                                        onClick={() => handleSelectOption(idx, optValue)}
                                                    >
                                                        <span className="opt-indicator" />
                                                        <span className="opt-text">{optValue}</span>
                                                        {isSubmitted && showInstantScore && isCorrect && <CheckCircle2 size={18} className="res-icon" />}
                                                        {isSubmitted && showInstantScore && isSelected && !isCorrect && <XCircle size={18} className="res-icon" />}
                                                    </OptionButton>
                                                );
                                            })}
                                        </OptionsGrid>
                                    </QuestionCard>
                                );
                            })
                        )}
                    </ContentArea>

                    <FooterActions>
                        {!isSubmitted ? (
                            <PrimaryButton onClick={handleNextQuestion} disabled={isLoading}>
                                {currentQuestionIdx === quizData.questions.length - 1 ? "FINISH" : "NEXT"}
                                <ChevronRight size={20} />
                            </PrimaryButton>
                        ) : (
                            <SecondaryButton onClick={() => window.location.reload()}>
                                <RefreshCcw size={18} /> EXIT ARENA
                            </SecondaryButton>
                        )}
                    </FooterActions>
                </QuizWrapper>
            )}
        </PageContainer>
    );
};

// --- FINAL EXPORT WRAPPED IN SUSPENSE ---
const PlayQuiz = () => (
    <Suspense fallback={<div>Initializing Arena...</div>}>
        <PlayQuizContent />
    </Suspense>
);
// --- Animations ---
const spin = keyframes` from { transform: rotate(0deg); } to { transform: rotate(360deg); } `;
const fadeIn = keyframes` from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } `;

// --- Responsive Styled Components ---
const PageContainer = styled.div`
    min-height: 100vh;
    color: #fff;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    user-select: none;
    position: relative;
    transition: filter 0.2s ease, opacity 0.2s ease;
    
    ${props => props.$isBlocked && css`
        filter: blur(40px) brightness(0.2); /* Makes screenshot content unreadable */
        opacity: 0.5;
        pointer-events: none;
    `}

    @media (min-width: 768px) {
        padding: 60px 40px;
    }
`;
const RulesList = styled.div`
    display: grid;
    grid-template-columns: 1fr; /* Default mobile: 1 column */
    gap: 16px;
    margin: 30px 0;
    
    /* Desktop: 2 columns */
    @media (min-width: 768px) {
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }
`;

const RuleItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: #0a0a0a;
    border: 1px solid #1a1a1a;
    transition: all 0.3s ease;

    &:hover {
        border-color: #333;
        background: #0f0f0f;
        transform: translateY(-2px);
    }

    .rule-header {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #fff;
        font-weight: 700;
        font-size: 13px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        
        svg {
            color: #fff;
        }
    }

    .rule-desc {
        font-size: 12px;
        color: #666;
        line-height: 1.5;
    }
`;
const EntryWrapper = styled.div`
    width: 100%;
    max-width: 440px;
    margin-top: 10vh;
    animation: ${fadeIn} 0.6s ease-out;
    margin-top:-10px;
`;

const StatusTag = styled.div`
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #444;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const ZolviEntryCard = styled.div`
    background: #1E1E1E;
    border: 1px solid #1a1a1a;
    padding: 24px;
    width: 100%;
    /* Desktop adjustments */
    @media (min-width: 768px) { 
        padding: 40px; 
        max-width: 700px; /* Wider to accommodate two columns */
    }
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 40px;
    .icon-box { 
        width: 50px; height: 50px; border: 1px solid #fff; 
        display: flex; align-items: center; justify-content: center;
    }
    h2 { font-size: 1.25rem; font-weight: 900; letter-spacing: 1px; margin: 0; }
    p { font-size: 0.7rem; color: #555; margin: 4px 0 0; font-weight: 600; }
`;

const FormGrid = styled.div` display: flex; flex-direction: column; gap: 24px; `;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    label { font-size: 10px; font-weight: 800; color: #555; letter-spacing: 1px; }
    .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        .input-icon { position: absolute; left: 16px; color: #333; }
        input {
            width: 100%;
            background: #0a0a0a;
            border: 1px solid #1a1a1a;
            padding: 16px 16px 16px 48px;
            color: #fff;
            font-size: 14px;
            transition: all 0.3s ease;
            &:focus { outline: none; border-color: #fff; background: #000; }
        }
    }
`;

const EntryButton = styled.button`
    background: #fff;
    color: #000;
    border: none;
    padding: 20px;
    font-weight: 900;
    font-size: 13px;
    letter-spacing: 2px;
    cursor: pointer;
    transition: 0.3s;
    margin-top: 10px;
    &:hover:not(:disabled) { background: #dcdcdc; transform: translateY(-2px); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner { animation: ${spin} 1s linear infinite; }
`;

const QuizWrapper = styled.div`
    width: 100%;
    max-width: 800px;
    animation: ${fadeIn} 0.5s ease-out;
`;

const QuizHeader = styled.div`
    margin-bottom: 40px;
    .top-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        gap: 12px;
        .q-count { 
            font-size: 11px; 
            font-weight: 800; 
            color: #666; 
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }
        .status-pill {
            display: flex; 
            align-items: center; 
            gap: 8px;
            padding: 8px 16px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: 700;
            transition: all 0.3s ease;
            &.timer { 
                border: 2px solid #fff;
                color: #fff;
                background: transparent;
                box-shadow: 0 0 12px rgba(255, 255, 255, 0.1);
            }
            &.score { 
                background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
                color: #000;
                box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
            }
        }
    }
    h2 { 
        font-size: 1.6rem; 
        font-weight: 900; 
        margin: 0; 
        line-height: 1.3; 
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
`;

const ProgressBarContainer = styled.div`
    width: 100%;
    height: 6px;
    background: #1a1a1a;
    margin-bottom: 40px;
    border-radius: 3px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
`;
const ProgressFill = styled.div`
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(90deg, #fff 0%, #e0e0e0 100%);
    transition: width 1s linear;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
`;

const ContentArea = styled.div`
    margin-bottom: 40px;
    animation: ${fadeIn} 0.4s ease-out;
`;

const QuestionCard = styled.div`
    .q-label { 
        font-size: 10px; 
        font-weight: 800; 
        color: #666; 
        margin-bottom: 16px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    h3 { 
        font-size: 1.4rem; 
        font-weight: 700; 
        line-height: 1.6; 
        margin-bottom: 40px; 
        color: #fff;
    }
    padding: 32px;
    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
    border: 1px solid #222;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    transition: all 0.3s ease;
    ${props => props.$isSubmitted && css`
        margin-bottom: 60px;
        border-bottom: 1px solid #111;
        padding-bottom: 40px;
        opacity: 0.9;
    `}
`;

const OptionsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    @media (min-width: 600px) { grid-template-columns: 1fr 1fr; }
`;

const OptionButton = styled.div`
    padding: 20px 20px 20px 24px;
    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
    border: 2px solid #222;
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    .opt-indicator { 
        width: 16px; 
        height: 16px; 
        border: 2px solid #444;
        border-radius: 50%;
        transition: all 0.3s ease;
        flex-shrink: 0;
    }
    .opt-text { 
        font-size: 15px; 
        font-weight: 500; 
        color: #999; 
        flex: 1; 
        letter-spacing: 0.3px;
    }

    &:hover { 
        border-color: #666;
        background: linear-gradient(135deg, #1a1a1a 0%, #252525 100%);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
        transform: translateY(-3px);
        .opt-indicator { border-color: #888; box-shadow: 0 0 8px rgba(255, 255, 255, 0.1); }
        .opt-text { color: #bbb; }
    }

    ${props => props.variant === "selected" && css`
        border-color: #fff;
        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        box-shadow: 0 8px 24px rgba(255, 255, 255, 0.15);
        .opt-indicator { 
            background: #fff; 
            border-color: #fff;
            box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
        }
        .opt-text { color: #fff; font-weight: 600; }
    `}

    ${props => props.variant === "correct" && css`
        border-color: #4ade80;
        background: linear-gradient(135deg, #0f3f0f 0%, #1a5a1a 100%);
        .opt-indicator { 
            background: #4ade80;
            border-color: #4ade80;
            box-shadow: 0 0 12px rgba(74, 222, 128, 0.3);
        }
        .opt-text { color: #fff; font-weight: 700; }
        .res-icon { color: #4ade80; }
    `}

    ${props => props.variant === "wrong" && css`
        border-color: #ff5555;
        opacity: 0.7;
        background: linear-gradient(135deg, #3f0f0f 0%, #5a1a1a 100%);
        .opt-text { color: #f0a0a0; }
        .res-icon { color: #ff6666; }
    `}
`;

const FooterActions = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 30px;
    animation: ${fadeIn} 0.5s ease-out;
`;

const PrimaryButton = styled.button`
    width: 100%;
    background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
    color: #000;
    border: none;
    padding: 18px 40px;
    font-weight: 900;
    letter-spacing: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(255, 255, 255, 0.15);
    &:hover { 
        background: linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%);
        transform: translateY(-3px);
        box-shadow: 0 12px 28px rgba(255, 255, 255, 0.2);
    }
    &:active { transform: translateY(-1px); }
`;

const SecondaryButton = styled.button`
    background: transparent;
    border: 1px solid #222;
    color: #666;
    padding: 12px 24px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: 0.2s;
    &:hover { border-color: #fff; color: #fff; }
`;

export default PlayQuiz;