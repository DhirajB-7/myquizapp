"use client";
import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, User, Clock, Share2, QrCode, X, Ghost, Loader2, Plus, Zap, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
const PublicQuizzes = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQR, setSelectedQR] = useState(null);
    const router = useRouter();
    const fetchQuizzes = async (isInitial = false) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Public`, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            const data = await response.json();
            setQuizzes(Array.isArray(data) ? data : []);
        } catch (error) {
            if (isInitial) toast.error("CONNECTION INTERRUPTED");
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes(true);
        const interval = setInterval(() => fetchQuizzes(false), 5000);
        return () => clearInterval(interval);
    }, []);

    const handleShareWhatsApp = (quizId, title) => {
        const url = `https://quizkrida.vercel.app/play?quizId=${quizId}`;
        const text = `⚡ CHALLENGE: Play "${title}" in the Arena: ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    if (loading) return (
        <LoadingWrapper>
            <div className="glitch-box">
                <Zap size={40} className="bolt" />
            </div>
            <p>SYNCING ARENA DATA...</p>
        </LoadingWrapper>
    );

    return (
        <PageContainer>
            <Toaster toastOptions={{ style: { background: '#0a0a0a', color: '#fff', border: '1px solid #222' } }} />
            
            <NavBar>
                <div className="brand">
                    <Zap size={20} fill="#fff" />
                    <span>ARENA.v1</span>
                </div>
                <ActionGroup>
                    <LiveIndicator>
                        <span className="dot" /> <span>{quizzes.length} LIVE</span>
                    </LiveIndicator>
                    <HeaderCreateBtn onClick={() => window.location.href = '/create'}>
                        <Plus size={16} /> <span className="hide-mobile">CREATE</span>
                    </HeaderCreateBtn>
                </ActionGroup>
            </NavBar>

            <HeroSection>
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                >
                    PUBLIC DEPLOYMENTS
                </motion.h1>
                <p>Select a session to begin real-time evaluation.</p>
            </HeroSection>

            <AnimatePresence mode="popLayout">
                {quizzes.length > 0 ? (
                    <GridContainer>
                        {quizzes.map((quiz, idx) => (
                            <QuizCard 
                                key={quiz.quizId}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <CardTop>
                                    <div className="id-tag">ID_00{quiz.quizId}</div>
                                    <QRTrigger onClick={() => setSelectedQR(quiz)}>
                                        <QrCode size={18} />
                                    </QRTrigger>
                                </CardTop>

                                <CardMain>
                                    <h3>{quiz.quizTitle}</h3>
                                    <MetaGrid>
                                        <div className="meta-item">
                                            <User size={12} /> <span>{quiz.author || "ROOT"}</span>
                                        </div>
                                        <div className="meta-item">
                                            <Clock size={12} /> <span>{quiz.duration}M</span>
                                        </div>
                                        <div className="meta-item status">
                                            <ShieldCheck size={12} /> <span>ACTIVE</span>
                                        </div>
                                    </MetaGrid>
                                </CardMain>

                                <CardActions>
                                    <PlayBtn onClick={() => router.push(`/play?quizId=${quiz.quizId}`)}>
                                        INITIALIZE <ArrowRight size={16} />
                                    </PlayBtn>
                                    <ShareBtn onClick={() => handleShareWhatsApp(quiz.quizId, quiz.quizTitle)}>
                                        <Share2 size={18} />
                                    </ShareBtn>
                                </CardActions>
                            </QuizCard>
                        ))}
                    </GridContainer>
                ) : (
                    <EmptyStateContainer 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                    >
                        <div className="icon-circle">
                            <Ghost size={48} strokeWidth={1} />
                        </div>
                        <h2>SYSTEM_IDLE</h2>
                        <p>No active sessions detected in current sector.</p>
                        <PrimaryBtn onClick={() => window.location.href = '/create'}>
                            DEPLOY FIRST QUIZ
                        </PrimaryBtn>
                    </EmptyStateContainer>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedQR && (
                    <ModalOverlay 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={() => setSelectedQR(null)}
                    >
                        <ModalContent 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <CloseBtn onClick={() => setSelectedQR(null)}><X size={24}/></CloseBtn>
                            <ModalBody>
                                <div className="qr-header">
                                    <h4>ARENA ACCESS CODE</h4>
                                    <p>Scan to join session #{selectedQR.quizId}</p>
                                </div>
                                <QRBox>
                                    <QRCodeSVG 
                                        value={`https://quizkrida.vercel.app/play?quizId=${selectedQR.quizId}`} 
                                        size={220} bgColor="#fff" fgColor="#000"
                                        includeMargin={true}
                                    />
                                </QRBox>
                                <div className="modal-footer">
                                    <span>ENCRYPTED_LINK_ACTIVE</span>
                                </div>
                            </ModalBody>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>
        </PageContainer>
    );
};

// --- Animations ---
const pulse = keyframes` 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } `;
const spin = keyframes` from { transform: rotate(0deg); } to { transform: rotate(360deg); } `;

// --- Styled Components ---
const PageContainer = styled.div`
    min-height: 100vh;
    color: #fff;
    font-family: 'Inter', sans-serif;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;

    @media (min-width: 768px) {
        padding: 40px;
    }
`;

const NavBar = styled.nav`
    width: 100%;
    max-width: 1200px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 60px;
    
    .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 900;
        letter-spacing: 2px;
        font-size: 14px;
    }
`;

const ActionGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const LiveIndicator = styled.div`
    background: #0a0a0a;
    border: 1px solid #1a1a1a;
    padding: 8px 12px;
    font-size: 10px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 8px;
    .dot { width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: ${pulse} 2s infinite; }
`;

const HeaderCreateBtn = styled.button`
    background: #fff;
    color: #000;
    border: none;
    padding: 8px 16px;
    font-weight: 900;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    &:hover { background: #ccc; }
    
    @media (max-width: 600px) {
        .hide-mobile { display: none; }
        padding: 8px;
    }
`;

const HeroSection = styled.div`
    text-align: center;
    margin-bottom: 60px;
    h1 { font-size: clamp(1.5rem, 8vw, 2.5rem); font-weight: 900; letter-spacing: -2px; margin-bottom: 10px; }
    p { color: #666; font-size: 0.9rem; font-weight: 500; }
`;

const GridContainer = styled.div`
    width: 100%;
    max-width: 1200px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    
    @media (min-width: 768px) {
        gap: 30px;
    }
`;

const QuizCard = styled(motion.div)`
    background: #080808;
    border: 1px solid #151515;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: all 0.3s ease;
    
    &:hover {
        border-color: #333;
        background: #0c0c0c;
        transform: translateY(-5px);
    }
`;

const CardTop = styled.div`
    padding: 20px 20px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .id-tag { font-size: 10px; font-weight: 800; color: #444; letter-spacing: 1px; }
`;

const QRTrigger = styled.button`
    background: none; border: none; color: #444; cursor: pointer;
    padding: 5px;
    &:hover { color: #fff; }
`;

const CardMain = styled.div`
    padding: 20px;
    flex-grow: 1;
    h3 { font-size: 1.25rem; font-weight: 800; margin-bottom: 16px; text-transform: uppercase; line-height: 1.2; }
`;

const MetaGrid = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    .meta-item {
        display: flex; align-items: center; gap: 6px;
        font-size: 11px; font-weight: 700; color: #666;
        &.status { color: #fff; }
    }
`;

const CardActions = styled.div`
    display: flex;
    border-top: 1px solid #151515;
`;

const PlayBtn = styled.button`
    flex: 1;
    background: transparent;
    color: #fff;
    border: none;
    padding: 18px;
    font-weight: 900;
    font-size: 12px;
    letter-spacing: 1px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: 0.2s;
    &:hover { background: #fff; color: #000; }
`;

const ShareBtn = styled.button`
    width: 60px;
    background: #000;
    color: #444;
    border: none;
    border-left: 1px solid #151515;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
    &:hover { color: #25D366; background: #0a0a0a; }
`;

const ModalOverlay = styled(motion.div)`
    position: fixed; inset: 0; background: rgba(0,0,0,0.9);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
`;

const ModalContent = styled(motion.div)`
    background: #1E1E1E;
    border: 1px solid #222;
    width: 100%;
    max-width: 400px;
    position: relative;
`;

const ModalBody = styled.div`
    padding: 40px;
    text-align: center;
    .qr-header {
        margin-bottom: 30px;
        h4 { font-weight: 900; letter-spacing: 2px; font-size: 14px; margin-bottom: 8px; }
        p { font-size: 11px; color: #666; font-weight: 600; }
    }
    .modal-footer {
        margin-top: 30px;
        span { font-size: 10px; font-weight: 800; color: #333; letter-spacing: 1px; }
    }
`;

const QRBox = styled.div`
    background: #fff;
    padding: 15px;
    display: inline-block;
    border-radius: 4px;
`;

const CloseBtn = styled.button`
    position: absolute; top: 15px; right: 15px;
    background: none; border: none; color: #444; cursor: pointer;
    &:hover { color: #fff; }
`;

const LoadingWrapper = styled.div`
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    background: #000;
    p { font-size: 10px; font-weight: 800; color: #444; letter-spacing: 3px; }
    .glitch-box {
        width: 80px; height: 80px; border: 1px solid #222;
        display: flex; align-items: center; justify-content: center;
        .bolt { animation: ${pulse} 1.5s infinite; }
    }
`;

const EmptyStateContainer = styled(motion.div)`
    text-align: center;
    padding: 100px 20px;
    .icon-circle {
        width: 100px; height: 100px; border: 1px solid #111; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; margin: 0 auto 30px;
    }
    h2 { font-weight: 900; letter-spacing: 2px; margin-bottom: 10px; }
    p { color: #666; font-size: 13px; margin-bottom: 30px; }
`;

const PrimaryBtn = styled.button`
    background: #fff; color: #000; border: none; padding: 16px 32px;
    font-weight: 900; letter-spacing: 1px; cursor: pointer;
    &:hover { background: #ccc; }
`;

export default PublicQuizzes;