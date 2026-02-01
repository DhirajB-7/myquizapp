"use client";
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, User, Mail, Clock, Share2, QrCode, X, PlusCircle, Ghost } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';

const PublicQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null);

  const fetchQuizzes = async (isInitial = false) => {
    try {
      const response = await fetch('https://noneditorial-professionally-serena.ngrok-free.dev/Public', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await response.json();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (error) {
      if (isInitial) toast.error("Failed to sync live feed");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes(true);
    const interval = setInterval(() => fetchQuizzes(false), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleShareWhatsApp = (quizId, title) => {
    const url = `https://myquizapp-psi.vercel.app/play?id=${quizId}`;
    const text = `🔥 Challenge! Play this quiz: "${title}" here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <LoadingWrapper>🌌 Syncing with the Arena...</LoadingWrapper>;

  return (
    <PageContainer>
      <Toaster position="bottom-right" />
      
      <LiveStatus>
        <span className="pulse-dot" /> LIVE FEED
      </LiveStatus>

      <AnimatePresence mode="popLayout">
        {quizzes.length > 0 ? (
          <GridContainer>
            {quizzes.map((quiz) => (
              <QuizCard 
                key={quiz.quizId}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <CardHeader>
                  <div className="title-group">
                    <h3>{quiz.quizTitle}</h3>
                    <span className="quiz-id">#{quiz.quizId}</span>
                  </div>
                  <QRTrigger onClick={() => setSelectedQR(quiz)}>
                    <QrCode size={18} />
                  </QRTrigger>
                </CardHeader>

                <CardBody>
                  <InfoRow><User size={16} className="icon" /> <span>{quiz.author || "Guest"}</span></InfoRow>
                  <InfoRow><Clock size={16} className="icon" /> <span>{quiz.duration} Mins Limit</span></InfoRow>
                </CardBody>

                <ButtonGroup>
                  <PlayBtn onClick={() => window.location.href = `/play?id=${quiz.quizId}`}>
                    <Play size={16} fill="currentColor" /> Play
                  </PlayBtn>
                  <ShareBtn onClick={() => handleShareWhatsApp(quiz.quizId, quiz.quizTitle)}>
                    <Share2 size={18} />
                  </ShareBtn>
                </ButtonGroup>
              </QuizCard>
            ))}
          </GridContainer>
        ) : (
          <EmptyStateContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Ghost size={60} color="#334155" />
            <h2>Arena is Quiet</h2>
            <CreateNewBtn onClick={() => window.location.href = '/create'}>
              <PlusCircle size={20} /> Create New
            </CreateNewBtn>
          </EmptyStateContainer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedQR && (
          <ModalOverlay onClick={() => setSelectedQR(null)}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <CloseBtn onClick={() => setSelectedQR(null)}><X size={20}/></CloseBtn>
              <h4>Instant Entry</h4>
              <QRWrapper>
                <QRCodeSVG 
                    value={`https://myquizapp-psi.vercel.app/play?id=${selectedQR.quizId}`} 
                    size={200}
                    bgColor="transparent"
                    fgColor="#3b82f6"
                />
              </QRWrapper>
              <div className="id-badge">ID: {selectedQR.quizId}</div>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

// --- Animations ---
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
`;

// --- Styled Components ---
const PageContainer = styled.div`
margin-top: -60px;
  padding: 40px 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LiveStatus = styled.div`
  color: #3b82f6;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 2px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.5);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(59, 130, 246, 0.2);

  .pulse-dot {
    width: 6px; height: 6px;
    background: #3b82f6;
    border-radius: 50%;
    animation: ${pulse} 2s infinite;
  }
`;

const QuizCard = styled(motion.div)`
  position: relative;
  border-radius: 28px;
  padding: 24px;
  background: rgba(15, 23, 42, 0.6); /* Removed white milky bg */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(59, 130, 246, 0.1); /* Blue tint instead of white */
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute; inset: 0;
    border-radius: 28px;
    padding: 1.5px; 
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), transparent 50%, rgba(30, 41, 59, 0.5));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &:hover {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(59, 130, 246, 0.4);
    transition: all 0.3s ease;
  }
`;

const ModalContent = styled(motion.div)`
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 2px solid rgba(59, 130, 246, 0.2);
  padding: 40px; border-radius: 32px; text-align: center;
  position: relative; max-width: 400px; width: 90%;
  color: white;

  &::before {
    content: ""; position: absolute; inset: 0;
    border-radius: 32px; padding: 2px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), transparent);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
  }
`;

const QRWrapper = styled.div`

  padding: 15px;
  background: white; /* Extremely subtle for scanning contrast */
  border-radius: 20px;
  display: inline-block;
  margin: 20px 0;
  border: 1px solid rgba(59, 130, 246, 0.2);
`;

const CardHeader = styled.div`
  display: flex; justify-content: space-between; margin-bottom: 20px;
  h3 { color: #f8fafc; font-size: 1.2rem; margin: 0; }
  .quiz-id { color: #3b82f6; font-size: 0.7rem; font-weight: 800; background: rgba(59, 130, 246, 0.1); padding: 2px 8px; border-radius: 6px; }
`;

const GridContainer = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px; width: 100%; max-width: 1200px;
`;

const InfoRow = styled.div`
  display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 0.9rem; margin-bottom: 8px;
  .icon { color: #3b82f6; }
`;

const ButtonGroup = styled.div`
  display: flex; gap: 10px; margin-top: 20px;
`;

const PlayBtn = styled.button`
  flex: 1; background: #3b82f6; color: white; border: none; padding: 12px;
  border-radius: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
`;

const ShareBtn = styled.button`
  background: rgba(30, 41, 59, 0.5); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 12px; border-radius: 14px; cursor: pointer;
  &:hover { background: #25d366; color: white; }
`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
`;

const QRTrigger = styled.button`
  background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #64748b;
  padding: 8px; border-radius: 10px; cursor: pointer;
  &:hover { color: #3b82f6; border-color: #3b82f6; }
`;

const LoadingWrapper = styled.div`
  height: 100vh; display: flex; align-items: center; justify-content: center;
   color: #3b82f6; font-weight: 700;
`;

const CloseBtn = styled.button`
  position: absolute; top: 15px; right: 15px; background: transparent; border: none; color: #64748b; cursor: pointer;
`;

const EmptyStateContainer = styled(motion.div)`
  text-align: center; margin-top: 100px;
  h2 { color: #f8fafc; }
`;

const CreateNewBtn = styled.button`
  background: transparent; border: 1px solid #3b82f6; color: #3b82f6; padding: 12px 24px;
  border-radius: 12px; margin-top: 20px; cursor: pointer; font-weight: 700;
  display: flex; align-items: center; gap: 8px;
`;

const CardBody = styled.div` margin-bottom: 10px; `;

export default PublicQuizzes;