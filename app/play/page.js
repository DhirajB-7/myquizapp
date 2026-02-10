"use client";
import React, { useState, useEffect, Suspense } from 'react'; // Added Suspense
import styled, { keyframes, css, createGlobalStyle } from 'styled-components';
import { Zap, Loader2,EyeOff,MonitorSmartphone, Trophy, RefreshCcw, User, Hash, CheckCircle2,AlertTriangle, XCircle, Timer, ChevronRight, ShieldAlert } from 'lucide-react';
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
        const isLastQuestion = currentQuestionIdx === quizData.questions.length - 1;
        if (isLastQuestion) handleSubmitExam();
        else {
            setCurrentQuestionIdx(prev => prev + 1);
            if (quizData.quiz?.timer) setTimeLeft(secondsPerQuestion);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // --- JOIN QUIZ & FULLSCREEN ---
    const handleJoinQuiz = async () => {
        if (!joinData.participantName || !joinData.quizId) {
            toast.error("CREDENTIALS REQUIRED");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Play/${joinData.quizId}/${joinData.participantName}`, {
                method: 'GET',
                headers: { 'ngrok-skip-browser-warning': '69420' },
            });

            if (!response.ok) throw new Error(`ACCESS DENIED: Quiz inactive.`);
            const data = await response.json();

            if (!data.questions || data.questions.length === 0) {
                toast.error("ERROR: THIS QUIZ HAS NO QUESTIONS");
                setIsLoading(false);
                return;
            }

            // TRIGGER FULLSCREEN (Must be inside user click event)
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {
                    console.log("Fullscreen blocked by browser policy");
                });
            }

            if (data.quiz?.timePerQ !== undefined) {
                const convertedSeconds = parseInt(data.quiz.timePerQ) * 60;
                setSecondsPerQuestion(convertedSeconds);
                setTimeLeft(convertedSeconds);
            }

            setQuizData(data);
            toast.success(`CONNECTION ESTABLISHED`);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectOption = (questionIdx, optionText) => {
        if (isSubmitted) return;
        setUserAnswers(prev => ({ ...prev, [questionIdx]: optionText }));
    };

    const handleSubmitExam = async () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }

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
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '69420' },
                body: JSON.stringify(finalSubmission)
            });

            if (response.ok) {
                setScore(currentScore);
                setIsSubmitted(true);
                toast.success("DATA SYNCED");
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
                            <div className="rule-header"><Zap size={14}/> Anti-Cheat</div>
                            <div className="rule-desc">Tab switching or window resizing triggers immediate disqualification.</div>
                        </RuleItem>

                        <RuleItem>
                            <div className="rule-header"><EyeOff size={14}/> Surveillance</div>
                            <div className="rule-desc">Active monitoring of cursor movements and focus state is enabled.</div>
                        </RuleItem>

                        <RuleItem>
                            <div className="rule-header"><MonitorSmartphone size={14}/> Display</div>
                            <div className="rule-desc">System forces Fullscreen Mode. Exiting will terminate the arena.</div>
                        </RuleItem>

                        <RuleItem>
                            <div className="rule-header"><Timer size={14}/> Timing</div>
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
                                <h2>ARENA ACCESS</h2>
                                <p>INITIALIZE YOUR SESSION</p>
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
                                <label>SESSION ID</label>
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
                                <div className={isSubmitted ? "status-pill score" : "status-pill timer"}>
                                    {isSubmitted ? <Trophy size={14} /> : <Timer size={14} />}
                                    {isSubmitted ? `SCORE: ${score}/${quizData.questions.length}` : `${timeLeft}s`}
                                </div>
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
                        {quizData.questions.map((q, idx) => {
                            if (!isSubmitted && idx !== currentQuestionIdx) return null;
                            return (
                                <QuestionCard key={idx} $isSubmitted={isSubmitted}>
                                    <div className="q-label">SYSTEM_QUERY_{idx + 1}</div>
                                    <h3>{q.question}</h3>
                                    <OptionsGrid>
                                        {["opt1", "opt2", "opt3", "opt4"].map((optKey) => {
                                            const optValue = q[optKey];
                                            const isSelected = userAnswers[idx] === optValue;
                                            const isCorrect = optValue === q[q.correctOpt];
                                            let variant = "default";
                                            if (isSubmitted) {
                                                if (isCorrect) variant = "correct";
                                                else if (isSelected) variant = "wrong";
                                            } else if (isSelected) variant = "selected";

                                            return (
                                                <OptionButton
                                                    key={optKey}
                                                    variant={variant}
                                                    onClick={() => handleSelectOption(idx, optValue)}
                                                >
                                                    <span className="opt-indicator" />
                                                    <span className="opt-text">{optValue}</span>
                                                    {isSubmitted && isCorrect && <CheckCircle2 size={18} className="res-icon" />}
                                                    {isSubmitted && isSelected && !isCorrect && <XCircle size={18} className="res-icon" />}
                                                </OptionButton>
                                            );
                                        })}
                                    </OptionsGrid>
                                </QuestionCard>
                            );
                        })}
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
    background: #1E1E1E;
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
    background: #000;
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
    margin-bottom: 30px;
    .top-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        .q-count { font-size: 11px; font-weight: 800; color: #555; letter-spacing: 1px; }
        .status-pill {
            display: flex; align-items: center; gap: 8px;
            padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
            &.timer { border: 1px solid #222; color: #fff; }
            &.score { background: #fff; color: #000; }
        }
    }
    h2 { font-size: 1.5rem; font-weight: 900; margin: 0; line-height: 1.2; text-transform: uppercase; }
`;

const ProgressBarContainer = styled.div` width: 100%; height: 4px; background: #111; margin-bottom: 40px; `;
const ProgressFill = styled.div` height: 100%; width: ${props => props.progress}%; background: #fff; transition: width 1s linear; `;

const ContentArea = styled.div` margin-bottom: 40px; `;

const QuestionCard = styled.div`
    .q-label { font-size: 10px; font-weight: 800; color: #444; margin-bottom: 12px; }
    h3 { font-size: 1.25rem; font-weight: 700; line-height: 1.5; margin-bottom: 30px; color: #efefef; }
    border: ${props => props.$isSubmitted ? '1px solid #333' : '1px solid #222'};
    ${props => props.isSubmitted && css`
        margin-bottom: 60px;
        border-bottom: 1px solid #111;
        padding-bottom: 40px;
        opacity: 0.9;
    `}
`;

const OptionsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    @media (min-width: 600px) { grid-template-columns: 1fr 1fr; }
`;

const OptionButton = styled.div`
    padding: 20px;
    background: #0a0a0a;
    border: 1px solid #1a1a1a;
    display: flex;
    align-items: center;
    gap: 15px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    .opt-indicator { width: 10px; height: 10px; border: 1px solid #333; transition: 0.2s; }
    .opt-text { font-size: 14px; font-weight: 500; color: #888; flex: 1; }

    &:hover { border-color: #333; background: #0f0f0f; }

    ${props => props.variant === "selected" && css`
        border-color: #fff; background: #111;
        .opt-indicator { background: #fff; border-color: #fff; }
        .opt-text { color: #fff; }
    `}

    ${props => props.variant === "correct" && css`
        border-color: #fff; background: #000;
        .opt-indicator { background: #fff; border-color: #fff; }
        .opt-text { color: #fff; font-weight: 700; }
        .res-icon { color: #fff; }
    `}

    ${props => props.variant === "wrong" && css`
        border-color: #331111; opacity: 0.6;
        .opt-text { color: #555; }
        .res-icon { color: #ff4444; }
    `}
`;

const FooterActions = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 20px;
`;

const PrimaryButton = styled.button`
    width: 100%;
    background: #fff;
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
    transition: 0.3s;
    &:hover { background: #e0e0e0; transform: translateY(-2px); }
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