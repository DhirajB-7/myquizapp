"use client";
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronLeft, ChevronRight, Save, Layout, Clock, Mail, CheckCircle, ArrowRight, Loader2, Wand2, PencilRuler, User, Eye, EyeOff, Timer } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const CreatePage = () => {
  const [phase, setPhase] = useState(0);
  const [loading, setLoading] = useState(false);

  const [quizInfo, setQuizInfo] = useState({
    quizId: null,
    duration: 0, // Now strictly a default sender
    email: "",
    quizTitle: "",
    authorName: "", 
    isPrivate: false, 
    status: "active",
    timeLimit: false,
    questionPerMin: "" // New field for per-question timer
  });

  const [questions, setQuestions] = useState([
    {
      quizId: null,
      question: "",
      a: "",
      b: "",
      c: "",
      d: "",
      correct: "a"
    }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const primaryColor = "#3b82f6";
  const accentGradient = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";

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
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  const handleInfoChange = (field, value) => {
    setQuizInfo({ ...quizInfo, [field]: value });
  };

const validateAndProceed = async () => {
  const title = quizInfo.quizTitle?.trim();
  const author = quizInfo.authorName?.trim();
  const email = quizInfo.email?.trim();

  if (!title || !author || !email) {
    toast.error("Please fill all required fields");
    return;
  }

  if (quizInfo.timeLimit && (!quizInfo.questionPerMin || quizInfo.questionPerMin <= 0)) {
    toast.error("Please set Seconds Per Question");
    return;
  }

  setLoading(true);

  // Payload strictly formatted for Spring Boot/Java backend types
  const step1Payload = {
    duration: 0, 
    createdBy: email,
    quizTitle: title,
    author: author,
    status: true,                         // FIXED: Changed from "active" to true (Boolean)
    timer: Boolean(quizInfo.timeLimit),   
    private: Boolean(quizInfo.isPrivate), 
    isPrivate: Boolean(quizInfo.isPrivate),
    timePerQ: quizInfo.timeLimit ? parseInt(quizInfo.questionPerMin) : 0 
  };

  console.log("Outgoing Payload:", step1Payload);

  try {
    const response = await fetch('https://noneditorial-professionally-serena.ngrok-free.dev/Create', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' 
      },
      body: JSON.stringify(step1Payload)
    });

    if (response.ok) {
      const savedQuizFromServer = await response.json();
      setQuizInfo(prev => ({ ...prev, quizId: savedQuizFromServer }));
      setQuestions(prevQuestions =>
        prevQuestions.map(q => ({ ...q, quizId: savedQuizFromServer }))
      );
      toast.success(`Quiz Registered!`);
      setPhase(1);
    } else {
      const errorText = await response.text();
      console.error("Server 400 Error Detail:", errorText);
      toast.error(`Server Error: Check Console for Type Mismatch`);
    }
  } catch (error) {
    console.error("Network Error:", error);
    toast.error("Connection failed.");
  } finally {
    setLoading(false);
  }
};

  const handlePublish = async () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim() || !q.a.trim() || !q.b.trim() || !q.c.trim() || !q.d.trim()) {
        setCurrentSlide(i);
        toast.error(`Please fill all fields for Question ${i + 1}`);
        return;
      }
    }

    setLoading(true);
    const payload = questions.map((q) => ({
      quizId: quizInfo.quizId,
      question: q.question,
      opt1: q.a,
      opt2: q.b,
      opt3: q.c,
      opt4: q.d,
      correctOpt: `opt${q.correct.toLowerCase() === 'a' ? '1' : q.correct.toLowerCase() === 'b' ? '2' : q.correct.toLowerCase() === 'c' ? '3' : '4'}`
    }));

    try {
      const response = await fetch('https://noneditorial-professionally-serena.ngrok-free.dev/Questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("All questions saved!");
        window.location.href = "/dashboard";
      } else {
        toast.error(`Failed: ${response.status}`);
      }
    } catch (error) {
      toast.error("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const addSlide = () => {
    setQuestions([...questions, { quizId: quizInfo.quizId, question: "", a: "", b: "", c: "", d: "", correct: "a" }]);
    setCurrentSlide(questions.length);
    toast.success("New slide added!");
  };

  const removeSlide = (index) => {
    if (questions.length === 1) {
      toast.error("You need at least one question!");
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    setCurrentSlide(Math.max(0, index - 1));
  };

  const updateQuestion = (field, value) => {
    const newQuestions = [...questions];
    newQuestions[currentSlide][field] = value;
    setQuestions(newQuestions);
  };

  return (
    <PageWrapper $primary={primaryColor}>
      <Toaster position="top-center" />

      <ContentHeader initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} $primary={primaryColor}>
        <div className="header-content">
          <div className="icon-badge"><PencilRuler size={20} /></div>
          <h2>{phase === 0 ? "Create New Quiz" : `Add Quiz Content`}</h2>
          {phase === 1 && (
            <div className="mini-badge">
              <span className="id-tag">ID: {quizInfo.quizId}</span>
              <span className="title-tag">{quizInfo.quizTitle}</span>
            </div>
          )}
        </div>

        {phase === 1 && (
          <div className="progress-section">
            <div className="progress-stats">Question <span>{currentSlide + 1}</span> of {questions.length}</div>
            <ProgressBar $primary={primaryColor}>
              <motion.div 
                className="fill" 
                initial={{ width: 0 }}
                animate={{ width: `${((currentSlide + 1) / questions.length) * 100}%` }} 
              />
            </ProgressBar>
          </div>
        )}
      </ContentHeader>

      <MainContainer>
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <SlideCard key="info-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
              <div className="card-inner">
                <FormGroup $primary={primaryColor}>
                  <label><Layout size={14} /> Quiz Title</label>
                  <input
                    type="text"
                    className="modern-input"
                    placeholder="Enter an engaging title..."
                    value={quizInfo.quizTitle}
                    onChange={(e) => handleInfoChange('quizTitle', e.target.value)}
                  />
                </FormGroup>

                <FormGroup $primary={primaryColor}>
                  <label><User size={14} /> Author Name</label>
                  <input
                    type="text"
                    className="modern-input"
                    placeholder="Your name or display name"
                    value={quizInfo.authorName}
                    onChange={(e) => handleInfoChange('authorName', e.target.value)}
                  />
                </FormGroup>

                <div className="grid-2">
                  <FormGroup $primary={primaryColor}>
                    <label><Timer size={14} /> Time Limit Per Question</label>
                    <VisibilityToggle>
                      <button className={quizInfo.timeLimit ? "active" : ""} onClick={() => handleInfoChange('timeLimit', true)}>Yes</button>
                      <button className={!quizInfo.timeLimit ? "active" : ""} onClick={() => handleInfoChange('timeLimit', false)}>No</button>
                    </VisibilityToggle>
                  </FormGroup>

                  {/* Dynamic Field: Appears only if Time Limit is Yes */}
                  {quizInfo.timeLimit && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <FormGroup $primary={primaryColor}>
                        <label><Clock size={14} /> Minute Per Question</label>
                        <input
                          type="number"
                          className="modern-input"
                          value={quizInfo.questionPerMin}
                          onChange={(e) => handleInfoChange('questionPerMin', e.target.value)}
                          placeholder="e.g. 30"
                        />
                      </FormGroup>
                    </motion.div>
                  )}
                </div>

                <div className="grid-2">
                  <FormGroup $primary={primaryColor}>
                    <label>{quizInfo.isPrivate ? <EyeOff size={14} /> : <Eye size={14} />} Visibility</label>
                    <VisibilityToggle>
                      <button className={!quizInfo.isPrivate ? "active" : ""} onClick={() => handleInfoChange('isPrivate', false)}>Public</button>
                      <button className={quizInfo.isPrivate ? "active" : ""} onClick={() => handleInfoChange('isPrivate', true)}>Private</button>
                    </VisibilityToggle>
                  </FormGroup>
                </div>

                <ActionArea>
                  <PrimaryBtn $primary={primaryColor} $gradient={accentGradient} onClick={validateAndProceed} disabled={loading} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    {loading ? <Loader2 className="spinner" size={20} /> : <>Continue <ArrowRight size={20} /></>}
                  </PrimaryBtn>
                </ActionArea>
              </div>
            </SlideCard>
          )}

          {phase === 1 && (
            <div key="questions-wrapper">
              <NavHeader>
                <NavBtn onClick={() => setPhase(0)} disabled={loading} className="back-btn"><ChevronLeft size={18} /> Back</NavBtn>
                <div className="step-nav">
                  <NavBtn onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0 || loading}><ChevronLeft size={18} /></NavBtn>
                  <span className="slide-counter">{currentSlide + 1}</span>
                  <NavBtn onClick={() => setCurrentSlide(Math.min(questions.length - 1, currentSlide + 1))} disabled={currentSlide === questions.length - 1 || loading}><ChevronRight size={18} /></NavBtn>
                </div>
              </NavHeader>

              <SlideCard initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DeleteBtn onClick={() => removeSlide(currentSlide)} disabled={loading} whileHover={{ scale: 1.1 }}><Trash2 size={18} /></DeleteBtn>
                <FormGroup $primary={primaryColor}>
                  <label>Question Content</label>
                  <textarea
                    className="modern-textarea"
                    disabled={loading}
                    value={questions[currentSlide].question}
                    onChange={(e) => updateQuestion('question', e.target.value)}
                    placeholder="Ask something interesting..."
                  />
                </FormGroup>

                <div className="options-grid">
                  {['a', 'b', 'c', 'd'].map((letter) => {
                    const currentVal = questions[currentSlide][letter] || "";
                    const isSelected = questions[currentSlide].correct === letter;
                    return (
                      <OptionWrapper key={letter}>
                        <ModernOption $primary={primaryColor} $isSelected={isSelected}>
                          <div className="option-label">{letter.toUpperCase()}</div>
                          <textarea
                            disabled={loading}
                            rows="1"
                            value={currentVal}
                            onChange={(e) => {
                              if (e.target.value.length <= 255) {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                                updateQuestion(letter, e.target.value);
                              }
                            }}
                            placeholder="Option text..."
                          />
                          <input type="radio" name={`correct-${currentSlide}`} checked={isSelected} onChange={() => updateQuestion('correct', letter)} />
                        </ModernOption>
                        <div className="char-limit">{currentVal.length}/255</div>
                      </OptionWrapper>
                    );
                  })}
                </div>
              </SlideCard>

              <ActionArea>
                <SecondaryBtn $primary={primaryColor} onClick={addSlide} disabled={loading}><Plus size={20} /> Add Slide</SecondaryBtn>
                <PrimaryBtn $primary={primaryColor} $gradient={accentGradient} onClick={handlePublish} disabled={loading} whileHover={{ y: -2 }}>
                  {loading ? <Loader2 className="spinner" size={20} /> : <><Save size={20} /> Finish & Publish</>}
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

const VisibilityToggle = styled.div`
  display: flex;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 12px;
  padding: 4px;
  border: 1px solid rgba(255,255,255,0.1);
  height: 50px;

  button {
    flex: 1;
    border: none;
    background: transparent;
    color: #94a3b8;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    border-radius: 8px;
    transition: 0.2s;

    &.active {
      background: #3b82f6;
      color: white;
      box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
    }
  }
`;

const PageWrapper = styled.div`
  min-height: 80vh;
  padding: 60px 20px;
  margin-top: -60px;
  color: white;
  font-family: 'Inter', sans-serif;
  .spinner { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const ContentHeader = styled(motion.div)`
  max-width: 700px;
  margin: 0 auto 30px;
  text-align: center;
  .icon-badge {
    width: 42px; height: 42px; background: rgba(59, 130, 246, 0.1);
    border-radius: 12px; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 15px; color: ${props => props.$primary};
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
  h2 { font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 12px; }
  .mini-badge {
    display: flex; gap: 8px; justify-content: center;
    .id-tag { background: #3b82f6; color: white; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
    .title-tag { background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; color: #94a3b8; }
  }
  .progress-section {
    margin-top: 30px;
    .progress-stats { font-size: 0.85rem; color: #94a3b8; margin-bottom: 10px; span { color: white; font-weight: 700; } }
  }
`;

const ProgressBar = styled.div`
  width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden;
  .fill { height: 100%; background: ${props => props.$primary}; border-radius: 20px; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
`;

const MainContainer = styled.div` max-width: 740px; margin: 0 auto; `;

const NavHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;
  .step-nav { display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.03); padding: 5px; border-radius: 12px; }
  .slide-counter { font-weight: 800; font-size: 0.9rem; color: #3b82f6; width: 20px; text-align: center; }
`;

const SlideCard = styled(motion.div)`
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 40px;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 25px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 650px) { 
    padding: 25px;
    .options-grid, .grid-2 { grid-template-columns: 1fr; } 
  }
`;

const FormGroup = styled.div`
  margin-bottom: 25px;
  label { display: flex; align-items: center; gap: 8px; color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
  .modern-input, .modern-textarea {
    width: 100%; background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; padding: 14px 18px; color: white; font-size: 1rem; transition: 0.2s;
    &::placeholder { color: #475569; }
    &:focus { outline: none; border-color: #3b82f6; background: rgba(15, 23, 42, 0.6); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
  }
  .modern-textarea { min-height: 100px; resize: none; line-height: 1.6; }
  .disabled { opacity: 0.5; cursor: not-allowed; background: rgba(255,255,255,0.02); }
`;

const ModernOption = styled.div`
  display: flex; align-items: center; gap: 12px;
  background: ${props => props.$isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.4)'};
  border: 1px solid ${props => props.$isSelected ? props.$primary : 'rgba(255,255,255,0.1)'};
  border-radius: 12px; padding: 12px 16px; transition: 0.2s;
  .option-label { color: ${props => props.$primary}; font-weight: 800; font-size: 0.85rem; }
  textarea {
    flex: 1; background: transparent; border: none; color: white;
    resize: none; outline: none; font-size: 0.9rem; line-height: 1.4;
    &::placeholder { color: #475569; }
  }
  input[type="radio"] { accent-color: #3b82f6; cursor: pointer; transform: scale(1.2); }
`;

const ActionArea = styled.div` margin-top: 25px; display: flex; gap: 15px; `;

const PrimaryBtn = styled(motion.button)`
  flex: 1.5; padding: 16px; background: ${props => props.$gradient}; border: none;
  color: white; border-radius: 14px; cursor: pointer; font-weight: 800;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
  &:disabled { opacity: 0.5; }
`;

const SecondaryBtn = styled.button`
  flex: 1; padding: 16px; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.2);
  color: #94a3b8; border-radius: 14px; cursor: pointer; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: 0.2s;
  &:hover { background: rgba(255,255,255,0.06); border-color: #3b82f6; color: white; }
`;

const NavBtn = styled.button`
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); 
  color: #94a3b8; width: 40px; height: 40px; border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: 0.2s;
  &:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: white; }
  &:disabled { opacity: 0.2; cursor: not-allowed; }
  &.back-btn { width: auto; padding: 0 15px; font-size: 0.85rem; font-weight: 600; }
`;

const DeleteBtn = styled(motion.button)`
  position: absolute; top: -10px; right: -10px;
  background: #ef4444; border: none; color: white;
  width: 32px; height: 32px; border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
`;

const OptionWrapper = styled.div`
  .char-limit { font-size: 0.65rem; color: #475569; text-align: right; margin-top: 4px; }
`;

export default CreatePage;