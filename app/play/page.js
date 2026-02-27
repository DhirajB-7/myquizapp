"use client";
import React, { useState, useEffect, Suspense, useRef } from 'react';
import styled, { keyframes, css, createGlobalStyle, ThemeProvider } from 'styled-components';
import { Zap, Loader2, EyeOff, MonitorSmartphone, Trophy, RefreshCcw, User, Hash, CheckCircle2, AlertTriangle, XCircle, Timer, ChevronRight, ShieldAlert, GraduationCap, Layers, BookOpen, ChevronLeft, Sun, Moon, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import CryptoJS from 'crypto-js';

const QUESTIONS_PER_PAGE = 20;

// --- THEMES ---
const darkTheme = {
    bg: '#0a0a0a', bgCard: '#1E1E1E', bgInput: '#0a0a0a',
    bgOption: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
    bgOptionHover: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
    bgOptionSelected: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    bgRule: '#0a0a0a', bgModal: '#111', bgModalStat: '#0a0a0a',
    border: '#1a1a1a', borderOption: '#222', borderSelected: '#fff', borderHover: '#666',
    text: '#fff', textMuted: '#555', textDim: '#666', textOption: '#999', textOptionHover: '#bbb',
    btnBg: '#fff', btnText: '#000', btnBgHover: '#dcdcdc',
    indicatorBg: '#111', indicatorBorder: '#555', isDark: true,
    paginationBg: '#111', paginationActiveBg: '#fff', paginationActiveText: '#000',
};

const lightTheme = {
    bg: '#f0f0f0', bgCard: '#ffffff', bgInput: '#f5f5f5',
    bgOption: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
    bgOptionHover: 'linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%)',
    bgOptionSelected: 'linear-gradient(135deg, #e8e8e8 0%, #dcdcdc 100%)',
    bgRule: '#f5f5f5', bgModal: '#ffffff', bgModalStat: '#f5f5f5',
    border: '#ddd', borderOption: '#ddd', borderSelected: '#000', borderHover: '#999',
    text: '#000', textMuted: '#888', textDim: '#666', textOption: '#444', textOptionHover: '#111',
    btnBg: '#000', btnText: '#fff', btnBgHover: '#222',
    indicatorBg: '#f0f0f0', indicatorBorder: '#aaa', isDark: false,
    paginationBg: '#e8e8e8', paginationActiveBg: '#000', paginationActiveText: '#fff',
};

const secretKey = CryptoJS.enc.Utf8.parse("jon-snow-is-here");
const decrypt = (encryptedData) => {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, secretKey, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) { return encryptedData; }
};

const GlobalSecurity = createGlobalStyle`
  * { -webkit-user-select: none; -ms-user-select: none; user-select: none; -webkit-touch-callout: none; }
  @media print { body { display: none !important; } }
`;

const CLASS_OPTIONS = ["BSC CS TY", "BSC DS TY", "BSC CM TY", "BSC IT TY", "BSC NT TY", "BSC SD TY", "BSC SE TY", "BSC AIML TY", "BCA TY", "B.Voc PSSD TY"];
const DIVISION_OPTIONS = ["A", "B", "C", "D", "E", "F"];

// --- THEME TOGGLE ---
const ThemeToggleBtn = styled.button`
    position: fixed; top: 16px; right: 16px; z-index: 10000;
    width: 44px; height: 44px; border-radius: 50%;
    border: 2px solid ${({ theme }) => theme.border};
    background: ${({ theme }) => theme.bgCard}; color: ${({ theme }) => theme.text};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    &:hover { transform: scale(1.12) rotate(20deg); border-color: ${({ theme }) => theme.text}; }
    @media (min-width: 768px) { top: 24px; right: 24px; width: 48px; height: 48px; }
`;

// --- CONFIRMATION MODAL with clickable unanswered ---
const ConfirmModal = ({ isOpen, onConfirm, onCancel, questions, userAnswers, onGoToQuestion }) => {
    if (!isOpen) return null;
    const total = questions.length;
    const answeredCount = Object.keys(userAnswers).length;
    const unanswered = total - answeredCount;

    // Build list of unanswered question indices
    const unansweredIndices = questions
        .map((_, idx) => idx)
        .filter(idx => !userAnswers[idx]);

    return (
        <ModalOverlay>
            <ModalBox>
                <ModalIconBox><AlertTriangle size={28} color="orange" /></ModalIconBox>
                <ModalTitle>SUBMIT EXAM?</ModalTitle>
                <ModalBody>
                    <div className="stat-row">
                        <span className="label">Total Questions</span>
                        <span className="value">{total}</span>
                    </div>
                    <div className="stat-row">
                        <span className="label">Answered</span>
                        <span className="value answered">{answeredCount}</span>
                    </div>
                    {unanswered > 0 && (
                        <div className="stat-row">
                            <span className="label">Unanswered</span>
                            <span className="value warn">{unanswered}</span>
                        </div>
                    )}
                    <p className="warn-text">
                        {unanswered > 0
                            ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Click any to jump to it.`
                            : "All questions answered. Once submitted, you cannot make changes."}
                    </p>

                    {unansweredIndices.length > 0 && (
                        <div className="unanswered-grid">
                            <div className="grid-label">UNANSWERED — CLICK TO JUMP:</div>
                            <div className="q-chips">
                                {unansweredIndices.map(idx => (
                                    <button
                                        key={idx}
                                        className="q-chip"
                                        onClick={() => { onGoToQuestion(idx); onCancel(); }}
                                    >
                                        Q{idx + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalActions>
                    <ModalCancelBtn onClick={onCancel}>NO, GO BACK</ModalCancelBtn>
                    <ModalConfirmBtn onClick={onConfirm}>YES, SUBMIT</ModalConfirmBtn>
                </ModalActions>
            </ModalBox>
        </ModalOverlay>
    );
};

const PlayQuizContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const contentRef = useRef(null);

    const [isDark, setIsDark] = useState(false);
    const theme = isDark ? darkTheme : lightTheme;

    const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [currentPage, setCurrentPage] = useState(0); // 0-indexed page
    const [secondsPerQuestion, setSecondsPerQuestion] = useState(60);
    const [timeLeft, setTimeLeft] = useState(60);
    const [warningCount, setWarningCount] = useState(0);
    const [screenBlocked, setScreenBlocked] = useState(false);
    const [showInstantScore, setShowInstantScore] = useState(false);
    const [accessExpires, setAccessExpires] = useState(null);
    const [now, setNow] = useState(Date.now());
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    // For highlighting a specific question after jumping from modal
    const [highlightedQ, setHighlightedQ] = useState(null);
    const questionRefs = useRef({});

    const [joinData, setJoinData] = useState({
        participantName: '', quizId: '', email: '',
        studentClass: '', division: '', rollNumber: ''
    });

    // Derived pagination values
    const totalPages = quizData ? Math.ceil(quizData.questions.length / QUESTIONS_PER_PAGE) : 0;
    const pageStart = currentPage * QUESTIONS_PER_PAGE;
    const pageEnd = pageStart + QUESTIONS_PER_PAGE;
    const currentPageQuestions = quizData ? quizData.questions.slice(pageStart, pageEnd) : [];

    useEffect(() => {
        const qId = searchParams.get('quizId');
        if (qId) { setJoinData(prev => ({ ...prev, quizId: qId })); toast.success("ID Captured from URL: " + qId); }
    }, [searchParams]);

    // Security layer
    useEffect(() => {
        if (!quizData || isSubmitted) return;

        const handleSecurityAlert = () => {
            setScreenBlocked(true);
            toast.error("SECURITY PROTOCOL: SCREEN BLOCKED", { id: 'security-toast' });
            setTimeout(() => window.location.reload(), 1500);
        };
        const handleSecurityClear = () => setScreenBlocked(false);

        // Instead of auto-blocking on blur, show confirm dialog
        const handleBlur = () => {
            const confirmed = window.confirm("⚠️ QUIZ ALERT: Leaving this tab will terminate your session. Do you want to exit the quiz?");
            if (confirmed) {
                window.location.reload();
            }
            // If No — do nothing, user stays
        };

        const handleMouseLeave = (e) => {
            // Only trigger when cursor leaves through the top (new tab / address bar)
            if (e.clientY <= 0) {
                const confirmed = window.confirm("⚠️ QUIZ ALERT: Your cursor left the exam window. Do you want to exit the quiz?");
                if (confirmed) {
                    window.location.reload();
                }
            }
        };

        window.addEventListener('blur', handleBlur);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleSecurityClear);

        const handleKeyDown = (e) => {
            if (e.key === 'PrintScreen' || e.key === 'Snapshot' || (e.ctrlKey && e.key === 'p') || (e.metaKey && e.shiftKey && (e.key === 's' || e.key === '4'))) {
                e.preventDefault(); handleSecurityAlert();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleSecurityClear);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [quizData, isSubmitted]);

    // Tab switch warning
    useEffect(() => {
        if (!quizData || isSubmitted) return;
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                const nextWarning = warningCount + 1;
                setWarningCount(nextWarning);
                if (nextWarning === 1) toast.error("WARNING 1/2: TAB SWITCHING DETECTED!");
                else if (nextWarning >= 2) { toast.error("FINAL WARNING: TERMINATING."); setTimeout(() => window.location.reload(), 1500); }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [quizData, isSubmitted, warningCount]);

    // Timer per page (if timer enabled, counts per page visit)
    useEffect(() => {
        if (!quizData || isSubmitted || !quizData.quiz?.timer) return;
        if (timeLeft === 0) { handleNextSection(true); return; }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, quizData, isSubmitted]);

    // Access window
    useEffect(() => {
        if (!accessExpires) return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [accessExpires]);

    useEffect(() => {
        if (accessExpires && now >= accessExpires && !isSubmitted) {
            toast.error("Access window expired - submitting exam");
            handleSubmitExam();
        }
    }, [now, accessExpires, isSubmitted]);

    // Jump to a specific question global index
    const goToQuestion = (globalIdx) => {
        const targetPage = Math.floor(globalIdx / QUESTIONS_PER_PAGE);
        setCurrentPage(targetPage);
        setHighlightedQ(globalIdx);
        // Scroll after render
        setTimeout(() => {
            const el = questionRefs.current[globalIdx];
            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            setTimeout(() => setHighlightedQ(null), 2000);
        }, 100);
    };

    const handleNextSection = (force = false) => {
        if (!force) {
            // Check if current page has unanswered (optional warning, not blocking)
            const unansweredOnPage = currentPageQuestions.filter((_, i) => !userAnswers[pageStart + i]);
            if (unansweredOnPage.length > 0) {
                toast(`${unansweredOnPage.length} question${unansweredOnPage.length > 1 ? 's' : ''} unanswered on this page`, { icon: '⚠️' });
            }
        }
        if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1);
            if (quizData?.quiz?.timer) setTimeLeft(secondsPerQuestion);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Last page - check all answered before showing modal
            const totalUnanswered = quizData.questions.filter((_, idx) => !userAnswers[idx]).length;
            if (totalUnanswered > 0) {
                toast.error(`Answer all questions before submitting. ${totalUnanswered} remaining.`);
                return;
            }
            setShowConfirmModal(true);
        }
    };

    const handlePrevSection = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
            if (quizData?.quiz?.timer) setTimeLeft(secondsPerQuestion);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleConfirmSubmit = () => { setShowConfirmModal(false); handleSubmitExam(); };
    const handleCancelSubmit = () => { setShowConfirmModal(false); };

    const getDeviceFingerprint = () => {
        if (typeof window === 'undefined') return 'server';
        const { userAgent, language } = window.navigator;
        const { width, height } = window.screen;
        return btoa(`${userAgent}|${language}|${width}x${height}`).slice(0, 32);
    };

    const handleJoinQuiz = async () => {
        if (!joinData.participantName || !joinData.quizId) { toast.error("CREDENTIALS REQUIRED"); return; }
        if (!joinData.email) { toast.error("PLEASE ENTER YOUR EMAIL"); return; }
        if (!joinData.studentClass) { toast.error("PLEASE SELECT YOUR CLASS"); return; }
        if (!joinData.division) { toast.error("PLEASE SELECT YOUR DIVISION"); return; }
        if (!joinData.rollNumber || joinData.rollNumber.toString().trim() === '') { toast.error("ROLL NUMBER IS REQUIRED"); return; }
        const fingerprint = getDeviceFingerprint();
        const lockKey = `quiz_lock_${joinData.quizId}_${fingerprint}`;
        if (localStorage.getItem(lockKey) === "SUBMITTED") { toast.error("ACCESS DENIED: You have already submitted this exam."); return; }
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Play/${joinData.quizId}/${joinData.participantName}/${joinData.email}`, {
                method: 'GET', headers: { 'ngrok-skip-browser-warning': '69420', 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY },
            });
            if (!response.ok) throw new Error(`ACCESS DENIED: Quiz inactive.`);
            const data = await response.json();
            if (!data.questions || data.questions.length === 0) { toast.error("ERROR: THIS QUIZ HAS NO QUESTIONS"); setIsLoading(false); return; }
            if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { });
            if (data.quiz?.timePerQ !== undefined) {
                const convertedSeconds = parseInt(data.quiz.timePerQ) * 60;
                setSecondsPerQuestion(convertedSeconds); setTimeLeft(convertedSeconds);
            }
            if (data.quiz?.showInstantScore !== undefined) setShowInstantScore(Boolean(data.quiz.showInstantScore));
            try {
                const minutes = parseInt(data.quiz?.timePerStudent || 0);
                if (minutes > 0) {
                    const accessKey = `quiz_access_${joinData.quizId}_${fingerprint}`;
                    const expires = Date.now() + minutes * 60 * 1000;
                    localStorage.setItem(accessKey, JSON.stringify({ expires }));
                    setAccessExpires(expires);
                }
            } catch (e) { console.error('access window set failed', e); }
            setQuizData(data);
            toast.success(`CONNECTION ESTABLISHED`);
        } catch (error) { toast.error(error.message); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        const handleSecurityBreach = () => { if (!document.fullscreenElement && quizData) { } };
        document.addEventListener('fullscreenchange', handleSecurityBreach);
        return () => document.removeEventListener('fullscreenchange', handleSecurityBreach);
    }, [quizData]);

    const handleSelectOption = (questionIdx, optionText) => {
        if (isSubmitted) return;
        setUserAnswers(prev => ({ ...prev, [questionIdx]: optionText }));
    };

    const handleSubmitExam = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(joinData.email)) { toast.error("Invalid email format."); return; }
        const questions = quizData.questions;
        let currentScore = 0;
        questions.forEach((q, idx) => {
            const correctOpt = q.correctOpt.startsWith('U2F') || q.correctOpt.includes('=') ? decrypt(q.correctOpt) : q.correctOpt;
            if (userAnswers[idx] === q[correctOpt]) currentScore++;
        });
        const finalSubmission = {
            quizId: parseInt(joinData.quizId), participantName: joinData.participantName,
            score: currentScore.toString(), outOf: questions.length.toString(),
            email: joinData.email, studentClass: joinData.studentClass,
            division: joinData.division, rollNo: joinData.rollNumber.toString()
        };
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Play/Submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '69420', 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY },
                body: JSON.stringify(finalSubmission)
            });
            console.log("Final Submission Data:", finalSubmission);
            if (response.ok) {
                const fingerprint = getDeviceFingerprint();
                localStorage.setItem(`quiz_lock_${joinData.quizId}_${fingerprint}`, "SUBMITTED");
                setScore(currentScore); setIsSubmitted(true);
                toast.success("Quiz Submitted Successfully!");
                if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || "SUBMISSION FAILED");
            }
        } catch (error) { console.error('Submission error:', error); toast.error(error.message); }
        finally { setIsLoading(false); }
    };

    // ---- RULES PAGE ----
    if (!hasAcceptedRules) {
        return (
            <ThemeProvider theme={theme}>
                <PageContainer>
                    <GlobalSecurity />
                    <Toaster toastOptions={{ style: { background: theme.bgCard, color: theme.text, border: `1px solid ${theme.border}` } }} />
                    <ThemeToggleBtn onClick={() => setIsDark(d => !d)} title="Toggle theme">
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </ThemeToggleBtn>
                    <EntryWrapper style={{ maxWidth: '700px' }}>
                        <StatusTag><ShieldAlert size={12} /> PROTOCOL INITIALIZATION</StatusTag>
                        <ZolviEntryCard>
                            <Header>
                                <div className="icon-box"><AlertTriangle size={24} color="orange" /></div>
                                <div><h2>RULES OF ENGAGEMENT</h2><p>STRICT ENFORCEMENT ACTIVE</p></div>
                            </Header>
                            <RulesList>
                                <RuleItem><div className="rule-header"><Zap size={14} /> Anti-Cheat</div><div className="rule-desc">Tab switching or window resizing triggers immediate disqualification.</div></RuleItem>
                                <RuleItem><div className="rule-header"><EyeOff size={14} /> Surveillance</div><div className="rule-desc">Active monitoring of cursor movements and focus state is enabled.</div></RuleItem>
                                <RuleItem><div className="rule-header"><MonitorSmartphone size={14} /> Display</div><div className="rule-desc">System forces Fullscreen Mode. Exiting will terminate the arena.</div></RuleItem>
                                <RuleItem><div className="rule-header"><Timer size={14} /> Timing</div><div className="rule-desc">Fixed duration per section. No manual submission required for time-out.</div></RuleItem>
                                <RuleItem>
                                    <div className="rule-header"><MonitorSmartphone size={14} /> Phone Calls</div>
                                    <div className="rule-desc">Keep your phone on silent. Receiving or making calls during the exam is strictly prohibited.</div>
                                </RuleItem>
                                <RuleItem>
                                    <div className="rule-header"><ShieldAlert size={14} /> Integrity</div>
                                    <div className="rule-desc">Any form of assistance, discussion, or resource lookup during the exam is considered academic dishonesty and will result in disqualification.</div>
                                </RuleItem>
                            </RulesList>
                            <EntryButton onClick={() => setHasAcceptedRules(true)} style={{ width: '100%' }}>INITIALIZE ARENA SESSION</EntryButton>
                        </ZolviEntryCard>
                    </EntryWrapper>
                </PageContainer>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <PageContainer $isBlocked={screenBlocked}>
                <GlobalSecurity />
                <Toaster toastOptions={{ style: { background: theme.bgCard, color: theme.text, border: `1px solid ${theme.border}` } }} />

                <ThemeToggleBtn onClick={() => setIsDark(d => !d)} title="Toggle theme">
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </ThemeToggleBtn>

                {quizData && (
                    <ConfirmModal
                        isOpen={showConfirmModal}
                        onConfirm={handleConfirmSubmit}
                        onCancel={handleCancelSubmit}
                        questions={quizData.questions}
                        userAnswers={userAnswers}
                        onGoToQuestion={goToQuestion}
                    />
                )}

                {!quizData ? (
                    // ---- LOGIN FORM ----
                    <EntryWrapper style={{ maxWidth: '520px' }}>
                        <StatusTag><ShieldAlert size={12} /> ENCRYPTED SESSION</StatusTag>
                        <ZolviEntryCard>
                            <Header>
                                <div className="icon-box"><Zap size={24} fill="currentColor" /></div>
                                <div><h2>PLAY QUIZ</h2><p>ENTER YOUR DETAILS TO BEGIN</p></div>
                            </Header>
                            <FormGrid>
                                <InputGroup>
                                    <label>PARTICIPANT NAME <RequiredStar>*</RequiredStar></label>
                                    <div className="input-wrapper"><User size={16} className="input-icon" />
                                        <input type="text" placeholder="Enter full name..." value={joinData.participantName} onChange={(e) => setJoinData({ ...joinData, participantName: e.target.value })} />
                                    </div>
                                </InputGroup>
                                <InputGroup>
                                    <label>ENTER EMAIL <RequiredStar>*</RequiredStar></label>
                                    <div className="input-wrapper"><User size={16} className="input-icon" />
                                        <input type="email" placeholder="example@email.com" value={joinData.email} required onChange={(e) => setJoinData({ ...joinData, email: e.target.value })} pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$" />
                                    </div>
                                    {joinData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(joinData.email) && (
                                        <small style={{ color: '#ff4d4d', fontSize: '10px', marginTop: '5px' }}>Please enter a valid email format.</small>
                                    )}
                                </InputGroup>
                                <InputGroup>
                                    <label>QUIZ ID <RequiredStar>*</RequiredStar></label>
                                    <div className="input-wrapper"><Hash size={16} className="input-icon" />
                                        <input type="number" placeholder="000000" value={joinData.quizId} onChange={(e) => setJoinData({ ...joinData, quizId: e.target.value })} />
                                    </div>
                                </InputGroup>
                                <InputGroup>
                                    <label>CLASS <RequiredStar>*</RequiredStar></label>
                                    <div className="input-wrapper"><GraduationCap size={16} className="input-icon" />
                                        <SelectField value={joinData.studentClass} $hasValue={!!joinData.studentClass} onChange={(e) => setJoinData({ ...joinData, studentClass: e.target.value })}>
                                            <option value="" disabled>Select your class...</option>
                                            {CLASS_OPTIONS.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                                        </SelectField>
                                    </div>
                                </InputGroup>
                                <InputGroup>
                                    <label>DIVISION <RequiredStar>*</RequiredStar></label>
                                    <div className="input-wrapper"><Layers size={16} className="input-icon" />
                                        <SelectField value={joinData.division} $hasValue={!!joinData.division} onChange={(e) => setJoinData({ ...joinData, division: e.target.value })}>
                                            <option value="" disabled>Select division...</option>
                                            {DIVISION_OPTIONS.map((div) => <option key={div} value={div}>Division {div}</option>)}
                                        </SelectField>
                                    </div>
                                </InputGroup>
                                <InputGroup>
                                    <label>ROLL NUMBER <RequiredStar>*</RequiredStar></label>
                                    <div className="input-wrapper"><BookOpen size={16} className="input-icon" />
                                        <input type="number" placeholder="Enter roll number..." value={joinData.rollNumber} onChange={(e) => setJoinData({ ...joinData, rollNumber: e.target.value })} />
                                    </div>
                                </InputGroup>
                                <EntryButton onClick={handleJoinQuiz} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="spinner" /> : "ENTER ARENA"}
                                </EntryButton>
                            </FormGrid>
                        </ZolviEntryCard>
                    </EntryWrapper>
                ) : (
                    // ---- QUIZ AREA ----
                    <QuizWrapper>
                        {/* STICKY HEADER */}
                        <QuizHeader>
                            <div className="top-meta">
                                <div className="meta-left">
                                    <span className="q-count">
                                        {isSubmitted
                                            ? `${quizData.questions.length} QUESTIONS`
                                            : `PAGE ${currentPage + 1} / ${totalPages} · Q${pageStart + 1}–${Math.min(pageEnd, quizData.questions.length)} of ${quizData.questions.length}`}
                                    </span>
                                </div>

                            </div>
                            <h2 className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 w-full border-b border-white/10 pb-4 mb-6">
                                {/* Title Section */}
                                <span className="text-lg md:text-xl font-bold tracking-tight uppercase truncate">
                                    {isSubmitted ? "POST-SESSION ANALYSIS" : quizData.quiz.quizTitle}
                                </span>

                                {/* Timers Container */}
                                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                    {!isSubmitted && quizData.quiz?.timer && (
                                        <div className="status-pill timer"><Timer size={14} />{timeLeft}s</div>
                                    )}

                                    {/* Session/Access Timer */}
                                    {!isSubmitted && accessExpires && Date.now() < accessExpires && (() => {
                                        const remaining = accessExpires - now;
                                        const hrs = Math.floor(remaining / (1000 * 60 * 60));
                                        const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                                        const secs = Math.floor((remaining % (1000 * 60)) / 1000);
                                        const pad = n => String(n).padStart(2, '0');

                                        return (
                                            <div className="status-pill timer flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs md:text-sm font-mono whitespace-nowrap" title="Access window">
                                                <Timer size={12} className="text-white/60" />
                                                <span>{pad(hrs)}:{pad(mins)}:{pad(secs)}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </h2>

                            {/* Progress dots bar */}
                            {!isSubmitted && totalPages > 1 && (
                                <PageDotsRow>
                                    {Array.from({ length: totalPages }, (_, i) => {
                                        const pageAnswered = quizData.questions.slice(i * QUESTIONS_PER_PAGE, (i + 1) * QUESTIONS_PER_PAGE).filter((_, qi) => userAnswers[i * QUESTIONS_PER_PAGE + qi]).length;
                                        const pageTotal = Math.min(QUESTIONS_PER_PAGE, quizData.questions.length - i * QUESTIONS_PER_PAGE);
                                        return (
                                            <PageDot
                                                key={i}
                                                $active={i === currentPage}
                                                $complete={pageAnswered === pageTotal}
                                                onClick={() => { setCurrentPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                title={`Section ${i + 1}: ${pageAnswered}/${pageTotal} answered`}
                                            >
                                                {i + 1}
                                            </PageDot>
                                        );
                                    })}
                                </PageDotsRow>
                            )}
                        </QuizHeader>



                        {/* ANSWERED PROGRESS BAR */}
                        {!isSubmitted && (
                            <AnsweredBar>
                                <div className="bar-label">
                                    <span>{Object.keys(userAnswers).length} answered</span>
                                    <span>{quizData.questions.length - Object.keys(userAnswers).length} remaining</span>
                                </div>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ width: `${(Object.keys(userAnswers).length / quizData.questions.length) * 100}%` }} />
                                </div>
                            </AnsweredBar>
                        )}

                        <ContentArea ref={contentRef}>
                            {isSubmitted && !showInstantScore ? (
                                <ZolviEntryCard style={{ textAlign: 'center', padding: '40px' }}>
                                    <Header style={{ marginBottom: '16px' }}>
                                        <div className="icon-box"><Trophy size={28} /></div>
                                        <div><h2>THANK YOU</h2><p>Submission received for <strong>{joinData.participantName}</strong></p></div>
                                    </Header>
                                    <div style={{ marginTop: 12, color: theme.textDim }}>
                                        Your submission has been recorded. The instructor will release results when available.
                                    </div>
                                </ZolviEntryCard>
                            ) : (
                                <>
                                    {/* RENDER CURRENT PAGE QUESTIONS (or all if submitted) */}
                                    {(isSubmitted ? quizData.questions : currentPageQuestions).map((q, localIdx) => {
                                        const globalIdx = isSubmitted ? localIdx : pageStart + localIdx;
                                        const isSelected = userAnswers[globalIdx];
                                        const correctOpt = q.correctOpt.startsWith('U2F') || q.correctOpt.includes('=') ? decrypt(q.correctOpt) : q.correctOpt;
                                        const isHighlighted = highlightedQ === globalIdx;

                                        return (
                                            <QuestionCard
                                                key={globalIdx}
                                                $isSubmitted={isSubmitted}
                                                $highlighted={isHighlighted}
                                                ref={el => { questionRefs.current[globalIdx] = el; }}
                                            >
                                                <div className="q-header-row">
                                                    <div className="q-label">Q No.{globalIdx + 1}</div>
                                                    {!isSubmitted && (
                                                        <div className={`q-status ${userAnswers[globalIdx] ? 'answered' : 'unanswered'}`}>
                                                            {userAnswers[globalIdx] ? '✓ Answered' : '○ Not answered'}
                                                        </div>
                                                    )}
                                                </div>
                                                <h3>{q.question}</h3>
                                                <OptionsGrid>
                                                    {["opt1", "opt2", "opt3", "opt4"].map((optKey) => {
                                                        const optValue = q[optKey];
                                                        const isOptSelected = userAnswers[globalIdx] === optValue;
                                                        const isCorrect = optValue === q[correctOpt];
                                                        let variant = "default";
                                                        if (isSubmitted) {
                                                            if (showInstantScore) {
                                                                if (isCorrect) variant = "correct";
                                                                else if (isOptSelected) variant = "wrong";
                                                            } else {
                                                                if (isOptSelected) variant = "selected";
                                                            }
                                                        } else if (isOptSelected) variant = "selected";
                                                        return (
                                                            <OptionButton key={optKey} variant={variant} onClick={() => handleSelectOption(globalIdx, optValue)}>
                                                                <span className="opt-indicator" />
                                                                <span className="opt-text">{optValue}</span>
                                                                {isSubmitted && showInstantScore && isCorrect && <CheckCircle2 size={18} className="res-icon" />}
                                                                {isSubmitted && showInstantScore && isOptSelected && !isCorrect && <XCircle size={18} className="res-icon" />}
                                                            </OptionButton>
                                                        );
                                                    })}
                                                </OptionsGrid>
                                            </QuestionCard>
                                        );
                                    })}
                                </>
                            )}
                        </ContentArea>

                        {/* FOOTER NAVIGATION */}
                        <FooterActions>
                            {!isSubmitted ? (
                                <NavButtonGroup>
                                    {currentPage > 0 && (
                                        <BackButton onClick={handlePrevSection} disabled={isLoading}>
                                            <ChevronLeft size={20} /> PREV SECTION
                                        </BackButton>
                                    )}
                                    <PrimaryButton onClick={() => handleNextSection(false)} disabled={isLoading} style={{ flex: 1 }}>
                                        {isLoading ? (
                                            <><Loader2 className="spinner" size={20} /><span>SUBMITTING...</span></>
                                        ) : currentPage < totalPages - 1 ? (
                                            <>NEXT SECTION <ChevronRight size={20} /></>
                                        ) : (
                                            <>FINISH & SUBMIT <ChevronRight size={20} /></>
                                        )}
                                    </PrimaryButton>
                                </NavButtonGroup>
                            ) : (
                                <SecondaryButton onClick={() => window.location.reload()}>
                                    <RefreshCcw size={18} /> EXIT ARENA
                                </SecondaryButton>
                            )}
                        </FooterActions>
                    </QuizWrapper>
                )}
            </PageContainer>
        </ThemeProvider>
    );
};

const PlayQuiz = () => (
    <Suspense fallback={<div>Initializing Arena...</div>}>
        <PlayQuizContent />
    </Suspense>
);

// --- Animations ---
const spin = keyframes` from { transform: rotate(0deg); } to { transform: rotate(360deg); } `;
const fadeIn = keyframes` from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } `;
const modalFadeIn = keyframes` from { opacity: 0; transform: scale(0.92) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } `;
const highlight = keyframes` 0%,100% { box-shadow: 0 0 0 0 transparent; } 50% { box-shadow: 0 0 0 4px #f59e0b; } `;

// --- Styled Components ---
const PageContainer = styled.div`
    min-height: 100vh; background: ${({ theme }) => theme.bg}; color: ${({ theme }) => theme.text};
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    display: flex; flex-direction: column; align-items: center;
    padding: 20px; user-select: none; position: relative;
    transition: background 0.3s ease, color 0.3s ease, filter 0.2s ease;
    ${props => props.$isBlocked && css` filter: blur(40px) brightness(0.2); opacity: 0.5; pointer-events: none; `}
    @media (min-width: 768px) { padding: 60px 40px; }
`;

const RulesList = styled.div`
    display: grid; grid-template-columns: 1fr; gap: 16px; margin: 30px 0;
    @media (min-width: 768px) { grid-template-columns: 1fr 1fr; gap: 20px; }
`;

const RuleItem = styled.div`
    display: flex; flex-direction: column; gap: 8px; padding: 16px;
    background: ${({ theme }) => theme.bgRule}; border: 1px solid ${({ theme }) => theme.border};
    transition: all 0.3s ease;
    &:hover { border-color: ${({ theme }) => theme.borderHover}; transform: translateY(-2px); }
    .rule-header { display: flex; align-items: center; gap: 10px; color: ${({ theme }) => theme.text}; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; svg { color: ${({ theme }) => theme.text}; } }
    .rule-desc { font-size: 12px; color: ${({ theme }) => theme.textDim}; line-height: 1.5; }
`;

const EntryWrapper = styled.div`
    width: 100%; max-width: 440px; animation: ${fadeIn} 0.6s ease-out; margin-top: -10px;
`;

const StatusTag = styled.div`
    font-size: 10px; font-weight: 800; letter-spacing: 2px; color: ${({ theme }) => theme.textMuted};
    margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
`;

const ZolviEntryCard = styled.div`
    background: ${({ theme }) => theme.bgCard}; border: 1px solid ${({ theme }) => theme.border};
    padding: 24px; width: 100%; transition: background 0.3s ease, border-color 0.3s ease;
    @media (min-width: 768px) { padding: 40px; max-width: 700px; }
`;

const Header = styled.div`
    display: flex; align-items: center; gap: 20px; margin-bottom: 40px;
    .icon-box { width: 50px; height: 50px; border: 1px solid ${({ theme }) => theme.text}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    h2 { font-size: 1.25rem; font-weight: 900; letter-spacing: 1px; margin: 0; color: ${({ theme }) => theme.text}; }
    p { font-size: 0.7rem; color: ${({ theme }) => theme.textMuted}; margin: 4px 0 0; font-weight: 600; }
`;

const FormGrid = styled.div`display: flex; flex-direction: column; gap: 24px;`;
const RequiredStar = styled.span`color: #ff5555; margin-left: 2px;`;

const InputGroup = styled.div`
    display: flex; flex-direction: column; gap: 10px;
    label { font-size: 10px; font-weight: 800; color: ${({ theme }) => theme.textMuted}; letter-spacing: 1px; display: flex; align-items: center; }
    .input-wrapper {
        position: relative; display: flex; align-items: center;
        .input-icon { position: absolute; left: 16px; color: ${({ theme }) => theme.textMuted}; z-index: 1; pointer-events: none; }
        input { width: 100%; background: ${({ theme }) => theme.bgInput}; border: 1px solid ${({ theme }) => theme.border}; padding: 16px 16px 16px 48px; color: ${({ theme }) => theme.text}; font-size: 14px; transition: all 0.3s ease; &:focus { outline: none; border-color: ${({ theme }) => theme.text}; } &::placeholder { color: ${({ theme }) => theme.textMuted}; } }
    }
`;

const SelectField = styled.select`
    width: 100%; background: ${({ theme }) => theme.bgInput}; border: 1px solid ${({ theme }) => theme.border};
    padding: 16px 16px 16px 48px; color: ${props => props.$hasValue ? props.theme.text : props.theme.textMuted};
    font-size: 14px; font-family: 'Inter', system-ui, -apple-system, sans-serif; font-weight: 500;
    transition: all 0.3s ease; cursor: pointer; appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 16px center;
    &:focus { outline: none; border-color: ${({ theme }) => theme.text}; color: ${({ theme }) => theme.text}; }
    option { background: ${({ theme }) => theme.bgCard}; color: ${({ theme }) => theme.text}; }
    option:disabled { color: ${({ theme }) => theme.textMuted}; }
`;

const EntryButton = styled.button`
    background: ${({ theme }) => theme.btnBg}; color: ${({ theme }) => theme.btnText};
    border: none; padding: 20px; font-weight: 900; font-size: 13px; letter-spacing: 2px;
    cursor: pointer; transition: 0.3s; margin-top: 10px;
    &:hover:not(:disabled) { background: ${({ theme }) => theme.btnBgHover}; transform: translateY(-2px); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner { animation: ${spin} 1s linear infinite; }
`;

const QuizWrapper = styled.div`width: 100%; max-width: 860px; animation: ${fadeIn} 0.5s ease-out;`;

const QuizHeader = styled.div`
    position: sticky; top: 0; z-index: 100;
    background: ${({ theme }) => theme.bg}; padding: 16px 0 16px;
    margin-bottom: 20px; border-bottom: 1px solid ${({ theme }) => theme.border};
    transition: background 0.3s ease;
    margin-left: -20px; margin-right: -20px; padding-left: 20px; padding-right: 20px;
    @media (min-width: 768px) { margin-left: -40px; margin-right: -40px; padding-left: 40px; padding-right: 40px; }

    .top-meta {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 12px;
        .meta-left .q-count { font-size: 11px; font-weight: 800; color: ${({ theme }) => theme.textDim}; letter-spacing: 1.5px; text-transform: uppercase; }
        .meta-right { display: flex; align-items: center; gap: 8px; }
        .status-pill { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; transition: all 0.3s ease; &.timer { border: 2px solid ${({ theme }) => theme.text}; color: ${({ theme }) => theme.text}; background: transparent; } }
    }
    h2 { font-size: 1.3rem; font-weight: 900; margin: 0 0 10px; line-height: 1.3; text-transform: uppercase; letter-spacing: 0.5px; color: ${({ theme }) => theme.text}; }
`;

const PageDotsRow = styled.div`
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 8px;
`;

const PageDot = styled.button`
    width: 32px; height: 32px; border-radius: 6px; font-size: 11px; font-weight: 800;
    cursor: pointer; transition: all 0.2s ease; border: 2px solid ${({ theme }) => theme.border};
    background: ${props => props.$active ? props.theme.paginationActiveBg : props.$complete ? (props.theme.isDark ? '#1a3a1a' : '#e8f5e9') : props.theme.paginationBg};
    color: ${props => props.$active ? props.theme.paginationActiveText : props.theme.text};
    border-color: ${props => props.$active ? props.theme.paginationActiveBg : props.$complete ? '#4ade80' : props.theme.border};
    &:hover { transform: translateY(-2px); border-color: ${({ theme }) => theme.text}; }
`;

const AnsweredBar = styled.div`
    margin-bottom: 24px;
    .bar-label { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.textDim}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
    .bar-track { width: 100%; height: 4px; background: ${({ theme }) => theme.border}; border-radius: 2px; overflow: hidden; }
    .bar-fill { height: 100%; background: #4ade80; transition: width 0.5s ease; border-radius: 2px; }
`;

const ProgressBarContainer = styled.div`
    width: 100%; height: 6px; background: ${({ theme }) => theme.border}; margin-bottom: 16px; border-radius: 3px; overflow: hidden;
`;
const ProgressFill = styled.div`
    height: 100%; width: ${props => props.progress}%; background: ${({ theme }) => theme.btnBg}; transition: width 1s linear;
`;

const ContentArea = styled.div`margin-bottom: 40px; animation: ${fadeIn} 0.4s ease-out;`;

const QuestionCard = styled.div`
    .q-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .q-label { font-size: 10px; font-weight: 800; color: ${({ theme }) => theme.textDim}; text-transform: uppercase; letter-spacing: 1px; }
    .q-status { font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
        &.answered { color: #4ade80; }
        &.unanswered { color: ${({ theme }) => theme.textMuted}; }
    }
    h3 { font-size: 1rem; font-weight: 500; line-height: 1.6; margin-bottom: 20px; color: ${({ theme }) => theme.text}; }
    padding: 28px; background: ${({ theme }) => theme.bgCard}; border: 1px solid ${({ theme }) => theme.border};
    border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); transition: all 0.3s ease;
    margin-bottom: 20px;
    ${props => props.$highlighted && css` animation: ${highlight} 1.5s ease 2; border-color: #f59e0b; `}
    ${props => props.$isSubmitted && css` opacity: 0.9; `}
`;

const OptionsGrid = styled.div`
    display: grid; grid-template-columns: 1fr; gap: 12px;
    @media (min-width: 600px) { grid-template-columns: 1fr 1fr; }
`;

const OptionButton = styled.div`
    padding: 16px 16px 16px 20px;
    background: ${({ theme }) => theme.bgOption}; border: 2px solid ${({ theme }) => theme.borderOption};
    display: flex; align-items: center; gap: 14px; cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    .opt-indicator { width: 20px; height: 20px; border: 2px solid ${({ theme }) => theme.indicatorBorder}; border-radius: 50%; transition: all 0.3s ease; flex-shrink: 0; background: ${({ theme }) => theme.indicatorBg}; display: flex; align-items: center; justify-content: center; &::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: transparent; transition: all 0.2s ease; } }
    .opt-text { font-size: 14px; font-weight: 500; color: ${({ theme }) => theme.textOption}; flex: 1; letter-spacing: 0.3px; }
    &:hover { border-color: ${({ theme }) => theme.borderHover}; background: ${({ theme }) => theme.bgOptionHover}; transform: translateY(-2px); .opt-indicator { border-color: ${({ theme }) => theme.text}; } .opt-text { color: ${({ theme }) => theme.textOptionHover}; } }
    ${props => props.variant === "selected" && css` border-color: ${({ theme }) => theme.borderSelected}; background: ${({ theme }) => theme.bgOptionSelected}; .opt-indicator { border-color: ${({ theme }) => theme.borderSelected}; &::after { background: ${({ theme }) => theme.borderSelected}; } } .opt-text { color: ${({ theme }) => theme.text}; font-weight: 600; } `}
    ${props => props.variant === "correct" && css` border-color: #4ade80; background: linear-gradient(135deg, #0f3f0f 0%, #1a5a1a 100%); .opt-indicator { border-color: #4ade80; &::after { background: #4ade80; } } .opt-text { color: #fff; font-weight: 700; } .res-icon { color: #4ade80; } `}
    ${props => props.variant === "wrong" && css` border-color: #ff5555; opacity: 0.7; background: linear-gradient(135deg, #3f0f0f 0%, #5a1a1a 100%); .opt-text { color: #f0a0a0; } .res-icon { color: #ff6666; } `}
`;

const FooterActions = styled.div`display: flex; justify-content: center; padding-top: 24px; animation: ${fadeIn} 0.5s ease-out;`;
const NavButtonGroup = styled.div`display: flex; gap: 12px; width: 100%; align-items: stretch;`;

const BackButton = styled.button`
    background: transparent; border: 2px solid ${({ theme }) => theme.border}; color: ${({ theme }) => theme.textDim};
    padding: 18px 24px; font-weight: 900; font-size: 12px; letter-spacing: 2px;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.3s ease; border-radius: 8px; flex-shrink: 0;
    &:hover:not(:disabled) { border-color: ${({ theme }) => theme.text}; color: ${({ theme }) => theme.text}; transform: translateY(-2px); }
    &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const PrimaryButton = styled.button`
    background: ${({ theme }) => theme.btnBg}; color: ${({ theme }) => theme.btnText};
    border: none; padding: 18px 40px; font-weight: 900; letter-spacing: 2px;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px;
    transition: all 0.3s ease; border-radius: 8px; width: 100%;
    &:hover { background: ${({ theme }) => theme.btnBgHover}; transform: translateY(-3px); }
    &:active { transform: translateY(-1px); }
    .spinner { animation: ${spin} 1s linear infinite; }
`;

const SecondaryButton = styled.button`
    background: transparent; border: 1px solid ${({ theme }) => theme.border}; color: ${({ theme }) => theme.textDim};
    padding: 12px 24px; font-size: 12px; font-weight: 800; cursor: pointer;
    display: flex; align-items: center; gap: 10px; transition: 0.2s;
    &:hover { border-color: ${({ theme }) => theme.text}; color: ${({ theme }) => theme.text}; }
`;

// --- MODAL ---
const ModalOverlay = styled.div`
    position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
    z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: ${fadeIn} 0.2s ease-out;
`;

const ModalBox = styled.div`
    background: ${({ theme }) => theme.bgModal}; border: 1px solid ${({ theme }) => theme.border};
    border-radius: 16px; padding: 36px 32px; width: 100%; max-width: 480px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.8);
    animation: ${modalFadeIn} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); text-align: center;
    max-height: 90vh; overflow-y: auto;
`;

const ModalIconBox = styled.div`
    width: 64px; height: 64px; border: 1px solid ${({ theme }) => theme.border}; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; background: ${({ theme }) => theme.bgCard};
`;

const ModalTitle = styled.h3`
    font-size: 1.2rem; font-weight: 900; letter-spacing: 2px; color: ${({ theme }) => theme.text};
    margin: 0 0 24px; text-transform: uppercase;
`;

const ModalBody = styled.div`
    margin-bottom: 28px;
    .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-radius: 6px; margin-bottom: 8px; background: ${({ theme }) => theme.bgModalStat}; border: 1px solid ${({ theme }) => theme.border}; .label { font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.textMuted}; letter-spacing: 1px; text-transform: uppercase; } .value { font-size: 14px; font-weight: 800; color: ${({ theme }) => theme.text}; } .value.warn { color: #ff5555; } .value.answered { color: #4ade80; } }
    .warn-text { font-size: 12px; color: ${({ theme }) => theme.textDim}; line-height: 1.6; margin-top: 12px; padding: 10px 14px; border: 1px solid ${({ theme }) => theme.border}; border-radius: 6px; background: ${({ theme }) => theme.bgModalStat}; text-align: left; }
    .unanswered-grid { margin-top: 16px; text-align: left; }
    .grid-label { font-size: 10px; font-weight: 800; color: ${({ theme }) => theme.textMuted}; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
    .q-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .q-chip { background: ${({ theme }) => theme.bgModalStat}; border: 2px solid #ff5555; color: #ff5555; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.2s ease; letter-spacing: 0.5px;
        &:hover { background: #ff5555; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,85,85,0.3); }
    }
`;

const ModalActions = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 12px;`;

const ModalCancelBtn = styled.button`
    background: transparent; border: 2px solid ${({ theme }) => theme.border}; color: ${({ theme }) => theme.textDim};
    padding: 14px 20px; font-size: 11px; font-weight: 900; letter-spacing: 1.5px;
    cursor: pointer; border-radius: 8px; transition: all 0.2s ease; text-transform: uppercase;
    &:hover { border-color: ${({ theme }) => theme.text}; color: ${({ theme }) => theme.text}; }
`;

const ModalConfirmBtn = styled.button`
    background: ${({ theme }) => theme.btnBg}; color: ${({ theme }) => theme.btnText};
    border: none; padding: 14px 20px; font-size: 11px; font-weight: 900; letter-spacing: 1.5px;
    cursor: pointer; border-radius: 8px; transition: all 0.3s ease; text-transform: uppercase;
    &:hover { background: ${({ theme }) => theme.btnBgHover}; transform: translateY(-2px); }
`;

export default PlayQuiz;