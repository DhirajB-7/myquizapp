f"use client";
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Clock, AlertCircle, Plus, Loader2, Fingerprint, Eye, 
  HelpCircle, ChevronLeft, Edit3, Save, Trash2, Inbox, FileText, X, Trophy, Download,
  QrCode, Share2 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* --- QR MODAL COMPONENT --- */
const QRModal = ({ quizId, quizTitle, onClose }) => {
  const quizLink = `https://myquizapp-psi.vercel.app/play?id=${quizId}`;

  const shareToWhatsApp = () => {
    const text = `Join my quiz: *${quizTitle}*\nScan the QR or click the link below to start (Quiz ID: ${quizId}):\n${quizLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalContent initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div className="modal-header">
          <h3><QrCode size={20} color="#3b82f6" /> Share Quiz</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ background: 'white', padding: '20px', borderRadius: '15px', display: 'inline-block', marginBottom: '20px' }}>
          <QRCodeSVG value={quizLink} size={200} level="H" includeMargin={true} />
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px' }}>
          Students can scan this to join <b style={{color: 'white'}}>{quizTitle}</b>
        </p>
        <p style={{ color: '#3b82f6', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 'bold' }}>
          Quiz ID: {quizId} (Auto-fills on scan)
        </p>

        <WhatsAppBtn onClick={shareToWhatsApp}>
          <Share2 size={18} /> Share on WhatsApp
        </WhatsAppBtn>
      </ModalContent>
    </ModalOverlay>
  );
};

/* --- RESULT MODAL COMPONENT --- */
const ResultModal = ({ quizId, onClose }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/Result/${quizId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        if (response.ok) {
          const data = await response.json();
          setResults(Array.isArray(data) ? data : [data]);
        }
      } catch (err) {
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [quizId]);

  const downloadPDF = () => {
    if (results.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Quiz Results - ID: ${quizId}`, 14, 15);
    const tableColumn = ["Student Name", "Score", "Total", "Percentage"];
    const tableRows = results.map(res => [
      res.name,
      res.score,
      res.outOf,
      `${((res.score / res.outOf) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save(`Quiz_Result_${quizId}.pdf`);
  };

  return (
    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalContent initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="modal-header">
          <h3><Trophy size={20} color="#f59e0b" /> Student Results</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {results.length > 0 && (
              <DownloadBtn onClick={downloadPDF} title="Download PDF">
                <Download size={18} />
              </DownloadBtn>
            )}
            <button onClick={onClose}><X size={20} /></button>
          </div>
        </div>
        {loading ? (
          <div className="loading-center"><Loader2 className="spinner" /></div>
        ) : results.length === 0 ? (
          <p className="no-data">No results recorded yet.</p>
        ) : (
          <ResultTable>
            <thead>
              <tr><th>Name</th><th>Score</th><th>Total</th><th>Percentage</th></tr>
            </thead>
            <tbody>
              {results.map((res, i) => (
                <tr key={i}>
                  <td>{res.name}</td>
                  <td className="score-cell">{res.score}</td>
                  <td>{res.outOf}</td>
                  <td>{((res.score / res.outOf) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </ResultTable>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

/* --- EDIT MODULE --- */
const EditQuizModule = ({ quizId, onBack, primaryColor, userEmail }) => {
  const [quizInfo, setQuizInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalQnos, setOriginalQnos] = useState(new Set());
  const [deletedQnos, setDeletedQnos] = useState([]);

  useEffect(() => {
    if (!quizId) return;
    const fetchForEdit = async () => {
      try {
        const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/Preview/${quizId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        if (response.ok) {
          const data = await response.json();
          setQuizInfo({
            quizId: data.quizId,
            quizTitle: data.quizTitle,
            duration: data.duration,
            status: data.status,
            createdBy: data.createdBy
          });
          const qs = data.questions || [];
          setQuestions(qs);
          setOriginalQnos(new Set(qs.map(q => q.qno)));
          setDeletedQnos([]); 
        } else {
          toast.error("Quiz not found");
        }
      } catch (err) {
        toast.error("Network error fetching quiz data");
      } finally {
        setLoading(false);
      }
    };
    fetchForEdit();
  }, [quizId]);

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addNewQuestion = () => {
    const nextQNo = questions.length > 0 ? Math.max(...questions.map(q => q.qno)) + 1 : 1;
    const newBlankQuestion = {
      qno: nextQNo,
      question: "",
      opt1: "",
      opt2: "",
      opt3: "",
      opt4: "",
      correctOpt: "opt1",
      quizId: parseInt(quizId),
      isLocalOnly: true 
    };
    setQuestions([...questions, newBlankQuestion]);
    toast.success("New question block added!");
  };

  const handleDeleteQuestion = (qno, index) => {
    if(!window.confirm("Delete this question?")) return;
    if (!questions[index].isLocalOnly && originalQnos.has(qno)) {
        setDeletedQnos(prev => [...prev, qno]);
    }
    setQuestions(questions.filter((_, i) => i !== index));
    toast.success("Question removed (click Save to apply)");
  };

  const handleSave = async () => {
    if (!quizInfo?.quizTitle?.trim() || !quizInfo?.duration) {
      toast.error("Quiz title and duration are required");
      return;
    }

    const firstInvalidIndex = questions.findIndex(q => 
        !q.question?.trim() || !q.opt1?.trim() || !q.opt2?.trim() || !q.opt3?.trim() || !q.opt4?.trim()
    );

    if (firstInvalidIndex !== -1) {
        toast.error(`Question ${firstInvalidIndex + 1} has empty fields!`);
        return;
    }

    setSaving(true);
    const payload = { 
      quiz: {
          quiz: {
            quizId: parseInt(quizId),
            quizTitle: quizInfo.quizTitle,
            duration: parseInt(quizInfo.duration),
            status: String(quizInfo.status).toLowerCase() === "true", 
            createdBy: quizInfo.createdBy || userEmail
          }, 
          questions: questions.map(q => ({
            qno: q.isLocalOnly ? 0 : q.qno,
            question: q.question, 
            opt1: q.opt1,
            opt2: q.opt2,
            opt3: q.opt3,
            opt4: q.opt4,
            correctOpt: q.correctOpt,
            quizId: parseInt(quizId) 
          }))
      },
      questionNos: deletedQnos 
    };

    try {
      const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/Edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success("Quiz updated successfully!");
        onBack(); 
      } else {
        toast.error("Server error. Please check all fields.");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState><Loader2 className="spinner" size={40} color={primaryColor} /><p>Loading...</p></LoadingState>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <EditHeaderSection>
        <div className="left">
          <BackButton onClick={onBack}><ChevronLeft size={20} /> <span className="btn-text">Cancel</span></BackButton>
          <h2 className="edit-title">Edit: {quizInfo?.quizTitle}</h2>
        </div>
        <div className="action-btns">
          <AddQuestionBtn type="button" onClick={addNewQuestion}>
            <Plus size={18} /> <span className="btn-text">Add Question</span>
          </AddQuestionBtn>
          <SaveBtn onClick={handleSave} disabled={saving} $primary={primaryColor}>
            {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />} <span className="btn-text">Save All</span>
          </SaveBtn>
        </div>
      </EditHeaderSection>

      <EditLayout>
        <ConfigCard>
          <h3>Quiz Settings</h3>
          <div className="form-grid">
            <div className="field">
              <label>Quiz Title</label>
              <input value={quizInfo?.quizTitle || ''} onChange={(e) => setQuizInfo({...quizInfo, quizTitle: e.target.value})} />
            </div>
            <div className="field">
              <label>Duration (min)</label>
              <input type="number" value={quizInfo?.duration || ''} onChange={(e) => setQuizInfo({...quizInfo, duration: e.target.value})} />
            </div>
          </div>
        </ConfigCard>

        {questions.length === 0 ? (
          <EmptyState>
            <Inbox size={48} />
            <p>No questions found in this quiz.</p>
            <AddQuestionBtn onClick={addNewQuestion}><Plus size={18}/> Add your first question</AddQuestionBtn>
          </EmptyState>
        ) : (
          questions.map((q, idx) => (
            <QuestionEditBox key={idx}>
              <div className="q-top">
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span>Question {idx + 1}</span>
                  <DeleteSmallBtn onClick={() => handleDeleteQuestion(q.qno, idx)}><Trash2 size={16} /></DeleteSmallBtn>
                </div>
                <div className="correct-select">
                  <label>Correct:</label>
                  <select value={q.correctOpt} onChange={(e) => handleQuestionChange(idx, 'correctOpt', e.target.value)}>
                    <option value="opt1">A</option><option value="opt2">B</option><option value="opt3">C</option><option value="opt4">D</option>
                  </select>
                </div>
              </div>
              <textarea 
                className="q-input" 
                placeholder="Type your question here..."
                value={q.question} 
                onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)} 
              />
              <div className="options-grid-edit">
                {['opt1', 'opt2', 'opt3', 'opt4'].map((opt, i) => (
                  <div key={opt} className="opt-field">
                    <span className="opt-label">{String.fromCharCode(65+i)}</span>
                    <input 
                      value={q[opt]} 
                      onChange={(e) => handleQuestionChange(idx, opt, e.target.value)} 
                      placeholder={`Option ${String.fromCharCode(65+i)}`} 
                    />
                  </div>
                ))}
              </div>
            </QuestionEditBox>
          ))
        )}
      </EditLayout>
    </motion.div>
  );
};

/* --- PREVIEW COMPONENT --- */
const FullQuizPreview = ({ quizId, onBack, primaryColor }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/Preview/${quizId}`, {
          method: 'GET', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        if (response.ok) { const data = await response.json(); setQuestions(data.questions || []); }
      } finally { setLoading(false); }
    };
    fetchQuestions();
  }, [quizId]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <BackButton onClick={onBack}><ChevronLeft size={20} /> Back</BackButton>
      {loading ? <LoadingState><Loader2 className="spinner" size={40} /></LoadingState> : (
        <QuestionsContainer>
          <h2 className="preview-header">Quiz Preview</h2>
          {questions.length === 0 ? (
             <EmptyState>
                <Inbox size={48} />
                <p>No questions added to this quiz yet.</p>
             </EmptyState>
          ) : (
            questions.map((q, index) => (
                <FullQuestionItem key={index}>
                  <div className="q-label"><HelpCircle size={14} /> Question {index + 1}</div>
                  <p className="q-text">{q.question}</p>
                  <div className="options-grid">
                    <span className={q.correctOpt === 'opt1' ? 'correct' : ''}>A: {q.opt1}</span>
                    <span className={q.correctOpt === 'opt2' ? 'correct' : ''}>B: {q.opt2}</span>
                    <span className={q.correctOpt === 'opt3' ? 'correct' : ''}>C: {q.opt3}</span>
                    <span className={q.correctOpt === 'opt4' ? 'correct' : ''}>D: {q.opt4}</span>
                  </div>
                </FullQuestionItem>
            ))
          )}
        </QuestionsContainer>
      )}
    </motion.div>
  );
};

/* --- MAIN DASHBOARD --- */
const UserDashboard = () => {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [editQuizId, setEditQuizId] = useState(null);
  const [viewResultId, setViewResultId] = useState(null); 
  const [viewQRId, setViewQRId] = useState(null); 
  const [switchingStatusId, setSwitchingStatusId] = useState(null);
  const primaryColor = "#2563eb";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUserEmail(parsedUser.email);
      fetchUserQuizzes(parsedUser.email);
    }
  }, []);

  const fetchUserQuizzes = async (email) => {
    if (!email) return;
    setLoading(true);
    try {
      const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged?email=${email}`, {
        method: 'GET', 
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        cache: 'no-store' 
      });
      if (response.ok) setQuizzes(await response.json());
    } finally { setLoading(false); }
  };

  const handleToggleStatus = async (quizId) => {
    setSwitchingStatusId(quizId);
    try {
      const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/SwitchStatus/${quizId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
      });
  
      if (response.ok) {
        // 1. EXTRACT THE INTEGER FROM THE BACKEND RESPONSE
        const minutes = await response.json(); 
  
        // 2. Update the UI state (Toggle the active/inactive badge)
        setQuizzes(prev => prev.map(q => 
          q.quizId === quizId 
            ? { ...q, status: String(q.status) === "true" ? "false" : "true" } 
            : q
        ));
  
        if (minutes === 0) {
           toast.success("Quiz Deactivated!");
        } else if (minutes > 0) {
           toast.success(`Quiz Activated for ${minutes} Minutes`);
        }
      }
    } catch (err) {
      toast.error("Network error");
    } finally { 
      setSwitchingStatusId(null); 
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if(!window.confirm("Delete quiz?")) return;
    const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/Delete/${quizId}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
    });
    if (response.ok) setQuizzes(prev => prev.filter(q => q.quizId !== quizId));
  };

  const activeQRQuiz = quizzes.find(q => q.quizId === viewQRId);

  return (
    <DashboardWrapper>
      <Toaster position="bottom-right" />
      
      <AnimatePresence>
        {viewResultId && <ResultModal quizId={viewResultId} onClose={() => setViewResultId(null)} />}
        {viewQRId && (
          <QRModal 
            quizId={viewQRId} 
            quizTitle={activeQRQuiz?.quizTitle || "Untitled Quiz"} 
            onClose={() => setViewQRId(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {editQuizId ? (
          <EditQuizModule 
            quizId={editQuizId} 
            primaryColor={primaryColor} 
            userEmail={userEmail}
            onBack={() => { 
                setEditQuizId(null); 
                setTimeout(() => fetchUserQuizzes(userEmail), 1500);
            }} 
          />
        ) : selectedQuizId ? (
          <FullQuizPreview quizId={selectedQuizId} onBack={() => setSelectedQuizId(null)} primaryColor={primaryColor} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <header className="main-header">
              <div className="user-info">
                <h1>Admin Dashboard</h1>
                <p>Logged in as <span className="highlight">{userEmail}</span></p>
              </div>
              <CreateBtn onClick={() => router.push("/create")} $primary={primaryColor}>
                <Plus size={20} /> <span className="btn-text">New Quiz</span>
              </CreateBtn>
            </header>

            {loading ? <LoadingState><Loader2 className="spinner" size={40} /></LoadingState> : (
              quizzes.length === 0 ? (
                <EmptyState>
                  <Inbox size={48} />
                  <p>You haven't created any quizzes yet.</p>
                  <CreateBtn onClick={() => router.push("/create")} $primary={primaryColor}>
                    <Plus size={20} /> Create Your First Quiz
                  </CreateBtn>
                </EmptyState>
              ) : (
                <QuizGrid>
                  {quizzes.map((quiz) => (
                    <StyledCard key={quiz.quizId}>
                      <div className="card-header">
                        <div className="icon-bg"><BookOpen size={20} color={primaryColor} /></div>
                        <div style={{display:'flex', gap: '8px', alignItems: 'center'}}>
                          <StatusBadge onClick={() => handleToggleStatus(quiz.quizId)} $isActive={String(quiz.status) === "true"} disabled={switchingStatusId === quiz.quizId}>
                            {switchingStatusId === quiz.quizId ? <Loader2 size={12} className="spinner" /> : (String(quiz.status) === "true" ? "Active" : "Inactive")}
                          </StatusBadge>
                          <QRIconButton onClick={() => setViewQRId(quiz.quizId)} title="Show QR"><QrCode size={16} /></QRIconButton>
                          <EditIconButton onClick={() => setEditQuizId(quiz.quizId)} title="Edit Quiz"><Edit3 size={16} /></EditIconButton>
                          <ResultIconButton onClick={() => setViewResultId(quiz.quizId)} title="Show Results"><FileText size={16} /></ResultIconButton>
                          <DeleteIconButton onClick={() => handleDeleteQuiz(quiz.quizId)} title="Delete Quiz"><Trash2 size={16} /></DeleteIconButton>
                        </div>
                      </div>
                      <h3 className="quiz-title">{quiz.quizTitle || "Untitled"}</h3>
                      <DataGrid>
                        <div className="data-item"><Clock size={14} /> {quiz.duration}m</div>
                        <div className="data-item"><Fingerprint size={14} /> ID: {quiz.quizId}</div>
                      </DataGrid>
                      <SeeQuestionBtn onClick={() => setSelectedQuizId(quiz.quizId)} $primary={primaryColor}><Eye size={16} /> See Questions</SeeQuestionBtn>
                    </StyledCard>
                  ))}
                </QuizGrid>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardWrapper>
  );
};

/* --- STYLES --- */
const ModalOverlay = styled(motion.div)` position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; `;
const ModalContent = styled(motion.div)` background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; width: 100%; max-width: 600px; padding: 24px; position: relative; backdrop-filter: blur(16px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; h3 { display: flex; align-items: center; gap: 10px; margin: 0; } button { background: none; border: none; color: #94a3b8; cursor: pointer; } } .loading-center { display: flex; justify-content: center; padding: 40px; .spinner { animation: spin 1s linear infinite; } } .no-data { text-align: center; color: #94a3b8; padding: 20px; } `;
const ResultTable = styled.table` width: 100%; border-collapse: collapse; margin-top: 10px; th, td { text-align: left; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); } th { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; } .score-cell { color: #10b981; font-weight: 700; } `;
const DownloadBtn = styled.button` background: rgba(37, 99, 235, 0.1); border: none; color: #3b82f6; padding: 6px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: #3b82f6; color: white; } `;
const ResultIconButton = styled.button` background: rgba(255,255,255,0.05); border: none; color: #f59e0b; padding: 8px; border-radius: 8px; cursor: pointer; &:hover { background: #f59e0b; color: white; } `;
const QRIconButton = styled.button` background: rgba(255,255,255,0.05); border: none; color: #3b82f6; padding: 8px; border-radius: 8px; cursor: pointer; &:hover { background: #3b82f6; color: white; } `;
const WhatsAppBtn = styled.button` width: 100%; background: #25d366; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: transform 0.2s; &:hover { transform: scale(1.02); background: #22c35e; } `;
const DashboardWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #f8fafc;

  .main-header {
    display: flex;
    /* Changed: Forced row even on mobile */
    flex-direction: row; 
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    gap: 15px; /* Added gap for tight screens */

    h1 {
      font-size: 1.8rem;
      font-weight: 800;
    }
    
    .highlight {
      color: #3b82f6;
    }

    @media (max-width: 640px) {
      /* Ensuring they stay side-by-side */
      align-items: center; 
      
      h1 {
        font-size: 1.2rem; /* Scaled down slightly so both fit comfortably */
      }
      
      .user-info p {
        font-size: 0.8rem; /* Scaled down sub-text */
      }
    }
  }

  .btn-text {
    @media (max-width: 640px) {
      display: none; /* Keeps the button compact on mobile by showing only the plus icon */
    }
  }
`;
const QuizGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; @media (max-width: 640px) { grid-template-columns: 1fr; } `;
const StyledCard = styled(motion.div)` background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 20px; backdrop-filter: blur(10px); .card-header { display: flex; justify-content: space-between; margin-bottom: 15px; } .icon-bg { padding: 8px; background: rgba(37, 99, 235, 0.1); border-radius: 10px; } .quiz-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 15px; color: white; } `;

/* IMPROVED MOBILE EDIT SECTION */
const QuestionEditBox = styled.div` background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 18px; margin-bottom: 15px; @media (min-width: 640px) { padding: 20px; } .q-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 15px; color: #3b82f6; font-weight: 700; } .correct-select { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; select { background: #1e293b; color: white; border: 1px solid #334155; padding: 4px 8px; border-radius: 6px; outline: none; } } .q-input { width: 100%; background: rgba(15, 23, 42, 0.5); border: 1px solid #334155; padding: 12px; border-radius: 10px; color: white; margin-bottom: 15px; font-family: inherit; font-size: 0.95rem; min-height: 80px; resize: vertical; &:focus { border-color: #3b82f6; outline: none; } } .options-grid-edit { display: grid; grid-template-columns: 1fr; gap: 10px; @media (min-width: 640px) { grid-template-columns: 1fr 1fr; } .opt-field { display: flex; align-items: center; gap: 10px; background: rgba(15, 23, 42, 0.3); border: 1px solid #334155; padding: 10px; border-radius: 10px; .opt-label { color: #3b82f6; font-weight: 800; font-size: 0.8rem; } input { background: none; border: none; color: white; width: 100%; outline: none; font-size: 0.9rem; } &:focus-within { border-color: #3b82f6; } } } `;

const CreateBtn = styled(motion.button)` display: flex; align-items: center; gap: 10px; background: ${p => p.$primary}; padding: 10px 20px; border-radius: 12px; color: white; border: none; font-weight: 700; cursor: pointer; `;
const SaveBtn = styled.button` background: ${p => p.$primary}; color: white; padding: 10px 16px; border-radius: 12px; border: none; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: opacity 0.2s; &:disabled { opacity: 0.6; } `;
const AddQuestionBtn = styled.button` background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; color: #3b82f6; padding: 10px 16px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; &:hover { background: rgba(59, 130, 246, 0.2); } `;
const BackButton = styled.button` background: none; border: none; color: #3b82f6; cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 600; padding: 5px 0; `;
const DeleteSmallBtn = styled.button` background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; &:hover { background: #ef4444; color: white; } `;
const StatusBadge = styled.button` padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; border: none; font-weight: 700; background: ${p => p.$isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${p => p.$isActive ? '#10b981' : '#f87171'}; cursor: pointer; display: flex; align-items: center; gap: 4px; &:disabled { opacity: 0.8; cursor: not-allowed; } .spinner { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } } `;
const EditIconButton = styled.button` background: rgba(255,255,255,0.05); border: none; color: white; padding: 8px; border-radius: 8px; cursor: pointer; &:hover { background: #3b82f6; } `;
const DeleteIconButton = styled.button` background: rgba(255,255,255,0.05); border: none; color: #f87171; padding: 8px; border-radius: 8px; cursor: pointer; &:hover { background: #ef4444; color: white; } `;
const LoadingState = styled.div` display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; .spinner { animation: spin 1s linear infinite; } `;
const DataGrid = styled.div` display: flex; gap: 10px; margin-bottom: 15px; .data-item { font-size: 0.75rem; color: #94a3b8; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; } `;
const SeeQuestionBtn = styled.button` width: 100%; background: rgba(255,255,255,0.05); color: #94a3b8; padding: 10px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; &:hover { background: ${p => p.$primary}; color: white; } `;
const EditLayout = styled.div` max-width: 800px; margin: 0 auto; padding-bottom: 40px; `;
const ConfigCard = styled.div` background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 20px; margin-bottom: 20px; h3 { margin-bottom: 15px; font-size: 1rem; color: #94a3b8; } .form-grid { display: grid; grid-template-columns: 1fr; gap: 15px; @media (min-width: 640px) { grid-template-columns: 1fr 1fr; } .field { display: flex; flex-direction: column; gap: 8px; label { font-size: 0.85rem; color: #64748b; } input { background: rgba(15, 23, 42, 0.5); border: 1px solid #334155; padding: 12px; border-radius: 10px; color: white; &:focus { border-color: #3b82f6; outline: none; } } } } `;
const QuestionsContainer = styled.div` max-width: 800px; margin: 0 auto; .preview-header { margin-bottom: 20px; font-size: 1.5rem; } `;
const FullQuestionItem = styled.div` background: rgba(30, 41, 59, 0.5); padding: 20px; border-radius: 15px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.05); .q-label { color: #3b82f6; font-size: 0.8rem; font-weight: 700; margin-bottom: 10px; } .q-text { margin-bottom: 15px; font-weight: 500; } .options-grid { display: grid; grid-template-columns: 1fr; gap: 10px; @media (min-width: 640px) { grid-template-columns: 1fr 1fr; } span { padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.9rem; } .correct { border: 1px solid #10b981; color: #10b981; background: rgba(16, 185, 129, 0.05); } } `;

const EditHeaderSection = styled.div` display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px; @media (min-width: 640px) { flex-direction: row; justify-content: space-between; align-items: center; } .left { .edit-title { font-size: 1.3rem; margin-top: 5px; color: white; @media (min-width: 640px) { font-size: 1.8rem; } } } .action-btns { display: flex; gap: 10px; @media (max-width: 640px) { width: 100%; justify-content: flex-end; } } `;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  color: #94a3b8;
  gap: 20px;
  text-align: center;
  margin-top: 20px;
  
  p {
    font-size: 1rem;
    font-weight: 500;
  }
`;

export default UserDashboard;
