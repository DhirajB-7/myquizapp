"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styled, {keyframes} from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Clock, AlertCircle, Plus, Loader2, Fingerprint, Eye,
  HelpCircle, ChevronLeft, Edit3, Save, Trash2, Inbox, FileText, X, Trophy, Download,
  QrCode, Share2, Search, Radio, MoreVertical, Lock, Globe, AlertTriangle
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
          Students can scan this to join <b style={{ color: 'white' }}>{quizTitle}</b>
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
        const response = await fetch(`https://quiz-krida.onrender.com/Logged/Result/${quizId}`, {
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
        const response = await fetch(`https://quiz-krida.onrender.com/Logged/Preview/${quizId}`, {
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
    if (!window.confirm("Delete this question?")) return;
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
      const response = await fetch(`https://quiz-krida.onrender.com/Logged/Edit`, {
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
              <input value={quizInfo?.quizTitle || ''} onChange={(e) => setQuizInfo({ ...quizInfo, quizTitle: e.target.value })} />
            </div>
            <div className="field">
              <label>Duration (min)</label>
              <input type="number" value={quizInfo?.duration || ''} onChange={(e) => setQuizInfo({ ...quizInfo, duration: e.target.value })} />
            </div>
          </div>
        </ConfigCard>

        {questions.length === 0 ? (
          <EmptyState>
            <Inbox size={48} />
            <p>No questions found in this quiz.</p>
            <AddQuestionBtn onClick={addNewQuestion}><Plus size={18} /> Add your first question</AddQuestionBtn>
          </EmptyState>
        ) : (
          questions.map((q, idx) => (
            <QuestionEditBox key={idx}>
              <div className="q-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    <span className="opt-label">{String.fromCharCode(65 + i)}</span>
                    <input
                      value={q[opt]}
                      onChange={(e) => handleQuestionChange(idx, opt, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
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
        const response = await fetch(`https://quiz-krida.onrender.com/Logged/Preview/${quizId}`, {
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
              <QuestionPreviewCard key={index}>
                <div className="q-label"><HelpCircle size={14} /> Question {index + 1}</div>
                <p className="q-text">{q.question}</p>
                <div className="options-grid">
                  <span className={q.correctOpt === 'opt1' ? 'correct' : ''}>A: {q.opt1}</span>
                  <span className={q.correctOpt === 'opt2' ? 'correct' : ''}>B: {q.opt2}</span>
                  <span className={q.correctOpt === 'opt3' ? 'correct' : ''}>C: {q.opt3}</span>
                  <span className={q.correctOpt === 'opt4' ? 'correct' : ''}>D: {q.opt4}</span>
                </div>
              </QuestionPreviewCard>
            ))
          )}
        </QuestionsContainer>
      )}
    </motion.div>
  );
};
/* --- SEARCH BAR COMPONENT --- */
const SearchBar = ({ value, onChange, onClear }) => {
  return (
    <SearchWrapper>
      <div className="search-inner">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search by quiz title or ID..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onClear}
              className="clear-btn"
            >
              <X size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </SearchWrapper>
  );
};
/* --- LIVE PARTICIPANTS MODAL --- */
const LiveParticipantsModal = ({ quizId, onClose }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const response = await fetch(`https://quiz-krida.onrender.com/LiveParticipants/${quizId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        if (response.ok) {
          const data = await response.json();
          setParticipants(data);
        }
      } catch (err) {
        console.error("Failed to fetch live participants");
      } finally {
        setLoading(false);
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 1000); // Refresh every 1s
    return () => clearInterval(interval);
  }, [quizId]);

  return (
    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalContent initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={20} color="#ef4444" className="spinner" style={{ animationDuration: '2s' }} />
            Live Participants
          </h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {loading && participants.length === 0 ? (
          <div className="loading-center"><Loader2 className="spinner" /></div>
        ) : participants.length === 0 ? (
          <p className="no-data">No one is currently taking this quiz.</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <ResultTable>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: '500' }}>{p.name}</td>
                    <td>
                      <span style={{
                        color: '#10b981',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                        Online
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResultTable>
          </div>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};
const DeleteConfirmationModal = ({ isOpen, onConfirm, onCancel, title }) => (
  <AnimatePresence>
    {isOpen && (
      <ModalOverlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <ModalContent
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '400px' }} // Force narrower width for dialog
        >
          <div className="warning-icon">
            <AlertTriangle size={48} />
          </div>
          <h3>Delete Quiz?</h3>
          <p>
            Are you sure you want to delete <strong>"{title}"</strong>? 
            <br />This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button className="confirm-btn" onClick={onConfirm}>Delete Quiz</button>
          </div>
        </ModalContent>
      </ModalOverlay>
    )}
  </AnimatePresence>
);

/* --- MAIN DASHBOARD --- */
const UserDashboard = () => {
  const [viewLiveId, setViewLiveId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [editQuizId, setEditQuizId] = useState(null);
  const [viewResultId, setViewResultId] = useState(null);
  const [viewQRId, setViewQRId] = useState(null);
  const [switchingStatusId, setSwitchingStatusId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); 
  
  const primaryColor = "#2563eb";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUserEmail(parsedUser.email);
      fetchUserQuizzes(parsedUser.email);
    }
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const fetchUserQuizzes = async (email) => {
    if (!email) return;
    setLoading(true);
    try {
      const response = await fetch(`https://quiz-krida.onrender.com/Logged?email=${email}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        cache: 'no-store'
      });
      if (response.ok) setQuizzes(await response.json());
    } finally { setLoading(false); }
  };

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q =>
      (q.quizTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (String(q.quizId)).includes(searchTerm)
    );
  }, [quizzes, searchTerm]);

  const handleToggleStatus = async (quizId) => {
    setSwitchingStatusId(quizId);
    try {
      const response = await fetch(`https://quiz-krida.onrender.com/Logged/SwitchStatus/${quizId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
      });

      if (response.ok) {
        const minutes = await response.json();
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const quizId = deleteTarget.quizId;
    
    try {
      const response = await fetch(`https://quiz-krida.onrender.com/Logged/Delete/${quizId}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.ok) {
        setQuizzes(prev => prev.filter(q => q.quizId !== quizId));
        toast.success("Quiz deleted");
      }
    } catch (e) {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    router.push("/create");
  };

  const activeQRQuiz = quizzes.find(q => q.quizId === viewQRId);

  return (
    <DashboardWrapper>
      <Toaster position="bottom-right" />
      
      <DeleteConfirmationModal 
        isOpen={!!deleteTarget}
        title={deleteTarget?.quizTitle}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <AnimatePresence>
        {viewResultId && <ResultModal quizId={viewResultId} onClose={() => setViewResultId(null)} />}
        {viewQRId && (
          <QRModal
            quizId={viewQRId}
            quizTitle={activeQRQuiz?.quizTitle || "Untitled Quiz"}
            onClose={() => setViewQRId(null)}
          />
        )}
        {viewLiveId && <LiveParticipantsModal quizId={viewLiveId} onClose={() => setViewLiveId(null)} />}
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
              <CreateBtn onClick={handleCreateNew} $primary={primaryColor} disabled={isCreating}>
                {isCreating ? <Loader2 size={20} className="spinner" /> : <Plus size={20} />} 
                <span className="btn-text">{isCreating ? "Loading..." : "New Quiz"}</span>
              </CreateBtn>
            </header>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm("")}
            />

            {loading ? <LoadingState><Loader2 className="spinner" size={40} /></LoadingState> : (
              quizzes.length === 0 ? (
                <EmptyState>
                  <Inbox size={48} />
                  <p>You haven't created any quizzes yet.</p>
                  <CreateBtn onClick={handleCreateNew} $primary={primaryColor} disabled={isCreating}>
                    {isCreating ? <Loader2 size={20} className="spinner" /> : <Plus size={20} />} 
                    {isCreating ? "Redirecting..." : "Create Your First Quiz"}
                  </CreateBtn>
                </EmptyState>
              ) : (
                <QuizGrid>
                  {filteredQuizzes.map((quiz) => (
                    <StyledCard
                      key={quiz.quizId}
                      style={{ zIndex: activeMenuId === quiz.quizId ? 100 : 1 }}
                    >
                      <div className="card-header">
                        <div className="icon-bg"><BookOpen size={20} color={primaryColor} /></div>

                        <ActionWrapper>
                          <div className={`status-pill ${quiz.isPrivate ? 'private' : 'public'}`}>
                            {quiz.isPrivate ? <Lock size={12} /> : <Globe size={12} />}
                            <span>{quiz.isPrivate ? 'Private' : 'Public'}</span>
                          </div>
                          <StatusBadge
                            onClick={() => handleToggleStatus(quiz.quizId)}
                            $isActive={String(quiz.status) === "true"}
                            disabled={switchingStatusId === quiz.quizId}
                          >
                            {switchingStatusId === quiz.quizId ? <Loader2 size={12} className="spinner" /> : (String(quiz.status) === "true" ? "END" : "START")}
                          </StatusBadge>

                          <div style={{ position: 'relative' }}>
                            <MoreBtn onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === quiz.quizId ? null : quiz.quizId);
                            }}>
                              <MoreVertical size={20} />
                            </MoreBtn>

                            <AnimatePresence>
                              {activeMenuId === quiz.quizId && (
                                <DropdownMenu
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MenuOption onClick={() => setViewLiveId(quiz.quizId)}>
                                    <Radio size={16} /> Live Participants
                                  </MenuOption>
                                  <MenuOption onClick={() => setViewQRId(quiz.quizId)}>
                                    <QrCode size={16} /> Show QR Code
                                  </MenuOption>
                                  <MenuOption onClick={() => setEditQuizId(quiz.quizId)}>
                                    <Edit3 size={16} /> Edit Details
                                  </MenuOption>
                                  <MenuOption onClick={() => setViewResultId(quiz.quizId)}>
                                    <FileText size={16} /> View Results
                                  </MenuOption>
                                  <Divider />
                                  <MenuOption onClick={() => setDeleteTarget(quiz)} className="delete">
                                    <Trash2 size={16} /> Delete Quiz
                                  </MenuOption>
                                </DropdownMenu>
                              )}
                            </AnimatePresence>
                          </div>
                        </ActionWrapper>
                      </div>

                      <h3 className="quiz-title">{quiz.quizTitle || "Untitled"}</h3>
                      <DataGrid>
                        <div className="data-item"><Clock size={14} /> {quiz.duration}m</div>
                        <div className="data-item"><Fingerprint size={14} /> ID: {quiz.quizId}</div>
                      </DataGrid>
                      <SeeQuestionBtn onClick={() => setSelectedQuizId(quiz.quizId)} $primary={primaryColor}>
                        <Eye size={16} /> See Questions
                      </SeeQuestionBtn>
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
/* --- EDIT MODULE STYLES --- */
/* --- FULL WIDTH REFINED EDIT MODULE --- */

const EditLayout = styled.div`
  display: flex;
  flex-direction: column; /* Stack settings on top of questions */
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 60px;
`;

const ConfigCard = styled.div`
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);

  h3 {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 24px;
    color: #3b82f6;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 2fr 1fr; /* Title takes more space than Duration */
    gap: 24px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 10px;

      label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #94a3b8;
        margin-left: 4px;
      }

      input {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 14px 18px;
        border-radius: 16px;
        color: white;
        font-size: 1rem;
        transition: all 0.3s ease;

        &:focus {
          border-color: #3b82f6;
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
          outline: none;
        }
      }
    }
  }
`;



const EditHeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 20px;
  gap: 20px;

  .left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .edit-title {
    font-size: 1.8rem;
    font-weight: 900;
    color: white;
    background: linear-gradient(to right, #ffffff, #64748b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .action-btns {
    display: flex;
    gap: 12px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    .action-btns { width: 100%; justify-content: space-between; }
  }
`;

/* --- BUTTONS & ACTIONS --- */

/* --- SHARED BUTTON BASE WITH SHINE EFFECT --- */

const ActionButtonBase = `
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: 0.6s;
  }

  &:hover {
    transform: translateY(-2px);
    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SaveBtn = styled(motion.button)`
  ${ActionButtonBase}
  background: rgba(59, 130, 246, 0.15); 
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.4);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

  &:hover {
    background: rgba(59, 130, 246, 0.25);
    border-color: #3b82f6;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    color: white;
  }
`;

const AddQuestionBtn = styled.button`
  ${ActionButtonBase}
  background: rgba(59, 130, 246, 0.05);
  border: 2px dashed rgba(59, 130, 246, 0.3);
  color: #3b82f6;
  margin-top: 10px;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-style: solid; /* Switches from dashed to solid on hover */
    border-color: #3b82f6;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
  }
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 10px 20px;
  border-radius: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: 0.2s;

  &:hover { background: rgba(255, 255, 255, 0.08); color: white; }
`;

const DeleteSmallBtn = styled.button`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.15);
  color: #ef4444;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;

  &:hover { background: #ef4444; color: white; transform: rotate(90deg); }
`;

/* --- PREVIEW STYLES --- */

/* --- ENHANCED PREVIEW STYLES --- */

const QuestionsContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 0;
  
  .preview-header {
    font-size: 1.8rem;
    font-weight: 800;
    margin-bottom: 24px;
    color: white;
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

const QuestionPreviewCard = styled.div`
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  padding: 28px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
  }

  .q-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #3b82f6;
    margin-bottom: 12px;
    background: rgba(59, 130, 246, 0.1);
    width: fit-content;
    padding: 4px 12px;
    border-radius: 20px;
  }

  .q-text {
    font-size: 1.2rem;
    font-weight: 600;
    color: #f1f5f9;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    span {
      display: flex;
      align-items: center;
      padding: 14px 18px;
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 14px;
      color: #94a3b8;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      position: relative;

      &.correct {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.4);
        color: #10b981;
        font-weight: 600;
        
        &::after {
          content: '✓';
          position: absolute;
          right: 15px;
          font-weight: 800;
        }
      }
    }
  }
`;

const ActionWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px; /* Slightly tighter gap for smaller elements */
 

  /* Shared base style for both Pill and Button */
  .status-pill, ${() => StatusBadge} {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 12px; /* Reduced padding */
    border-radius: 8px; /* Slightly tighter corners for smaller size */
    font-size: 0.7rem; /* Smaller font */
    font-weight: 700;
    height: 28px; /* Fixed smaller height */
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-sizing: border-box;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .status-pill {
    &.public {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    &.private {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
  }
`;

const StatusBadge = styled.button`
  cursor: pointer;
  background: ${props => props.$isActive 
    ? 'rgba(239, 68, 68, 0.1)' 
    : 'rgba(16, 185, 129, 0.1)'};
  
  color: ${props => props.$isActive ? '#ef4444' : '#10b981'};
  
  border: 1px solid ${props => props.$isActive 
    ? 'rgba(239, 68, 68, 0.4)' 
    : 'rgba(16, 185, 129, 0.4)'};

  &:hover:not(:disabled) {
    background: ${props => props.$isActive 
      ? 'rgba(239, 68, 68, 0.2)' 
      : 'rgba(16, 185, 129, 0.2)'};
    border-color: ${props => props.$isActive ? '#ef4444' : '#10b981'};
    transform: translateY(-1px);
    box-shadow: 0 4px 10px ${props => props.$isActive 
      ? 'rgba(239, 68, 68, 0.15)' 
      : 'rgba(16, 185, 129, 0.15)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
const MoreBtn = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.3);
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 40px;
  right: 0;
  background: rgba(30, 41, 59, 0.98); /* Solid enough to cover content */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  width: 210px;
  z-index: 9999;
  padding: 6px;
  
  /* ADD THIS: Prevents the menu from 'stretching' the parent card's height */
  height: max-content;
  pointer-events: auto;
`;

const MenuOption = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #e2e8f0;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    transform: translateX(4px);
  }

  &.delete {
    color: #f87171;
    &:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
  }
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  margin: 6px 8px;
`;

const SearchWrapper = styled.div`
  margin-bottom: 30px;
  .search-inner {
    display: flex; 
    align-items: center; 
    background: rgba(255, 255, 255, 0.03); 
    border: 1px solid rgba(255, 255, 255, 0.1); 
    padding: 6px 18px; 
    border-radius: 18px; 
    gap: 12px; 
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    &:focus-within { 
      border-color: #3b82f6; 
      background: rgba(30, 41, 59, 0.6); 
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); 
    }
    .search-icon { color: #64748b; }
    input { 
      background: transparent; 
      border: none; 
      color: white; 
      width: 100%; 
      outline: none; 
      font-size: 1rem; 
      padding: 12px 0;
      &::placeholder { color: #64748b; }
    }
    .clear-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #94a3b8;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: 0.2s;
      &:hover { background: #ef4444; color: white; }
    }
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed; 
  inset: 0; 
  background: rgba(0, 0, 0, 0.7); 
  backdrop-filter: blur(8px); 
  z-index: 9999; /* Higher z-index to stay on top */
  display: flex; 
  align-items: center; 
  justify-content: center; 
  padding: 20px;
`;
const ModalContent = styled(motion.div)`
  background: rgba(30, 41, 59, 0.95); 
  border: 1px solid rgba(255, 255, 255, 0.1); 
  border-radius: 24px; 
  width: 100%; 
  max-width: 600px; 
  padding: 32px; 
  position: relative; 
  backdrop-filter: blur(20px); 
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  text-align: center;

  .warning-icon {
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
    color: #ef4444;
  }

  h3 { 
    font-size: 1.5rem; 
    margin-bottom: 12px; 
    color: #fff;
    font-weight: 700;
  }

  p { 
    color: #94a3b8; 
    line-height: 1.6; 
    margin-bottom: 30px; 
    strong { color: #f8fafc; }
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    button {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .cancel-btn {
      background: rgba(255, 255, 255, 0.05);
      color: #f8fafc;
      border: 1px solid rgba(255, 255, 255, 0.1);
      &:hover { background: rgba(255, 255, 255, 0.1); }
    }
    .confirm-btn {
      background: #ef4444;
      color: white;
      &:hover { background: #dc2626; transform: translateY(-1px); }
    }
  }
`;
const ResultTable = styled.table` width: 100%; border-collapse: collapse; margin-top: 10px; th, td { text-align: left; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); } th { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; } .score-cell { color: #10b981; font-weight: 700; } `;
const DownloadBtn = styled.button` background: rgba(37, 99, 235, 0.1); border: none; color: #3b82f6; padding: 6px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: #3b82f6; color: white; } `;
const WhatsAppBtn = styled.button` width: 100%; background: #25d366; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: transform 0.2s; &:hover { transform: scale(1.02); background: #22c35e; } `;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const DashboardWrapper = styled.div`
  max-width: 1200px;
  padding: 40px 20px;
  color: #f8fafc;
  margin: 0 auto;
  height: auto; 
  overflow: visible;

  .main-header {
    display: flex;
    flex-direction: row; 
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    gap: 15px; 
    h1 { font-size: 1.8rem; font-weight: 800; }
    .highlight { color: #3b82f6; }
    
    @media (max-width: 640px) {
      h1 { font-size: 1.2rem; }
      .user-info p { font-size: 0.8rem; }
    }
  }

  .btn-text { 
    @media (max-width: 640px) { display: none; } 
  }

  .spinner {
    animation: ${spin} 1s linear infinite;
  }
`;

const QuizGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; @media (max-width: 640px) { grid-template-columns: 1fr; } `;

const StyledCard = styled(motion.div)`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(10px);
  position: relative;
  /* CHANGE: This ensures the dropdown doesn't trigger internal scrollbars */
  overflow: visible !important; 
  transition: transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
  }

  .card-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
  .icon-bg { padding: 8px; background: rgba(37, 99, 235, 0.1); border-radius: 10px; }
  .quiz-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 15px; color: white; }
`;

const QuestionEditBox = styled.div` background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 18px; margin-bottom: 15px; @media (min-width: 640px) { padding: 20px; } .q-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 15px; color: #3b82f6; font-weight: 700; } .correct-select { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; select { background: #1e293b; color: white; border: 1px solid #334155; padding: 4px 8px; border-radius: 6px; outline: none; } } .q-input { width: 100%; background: rgba(15, 23, 42, 0.5); border: 1px solid #334155; padding: 12px; border-radius: 10px; color: white; margin-bottom: 15px; font-family: inherit; font-size: 0.95rem; min-height: 80px; resize: vertical; &:focus { border-color: #3b82f6; outline: none; } } .options-grid-edit { display: grid; grid-template-columns: 1fr; gap: 10px; @media (min-width: 640px) { grid-template-columns: 1fr 1fr; } .opt-field { display: flex; align-items: center; gap: 10px; background: rgba(15, 23, 42, 0.3); border: 1px solid #334155; padding: 10px; border-radius: 10px; .opt-label { color: #3b82f6; font-weight: 800; font-size: 0.8rem; } input { background: none; border: none; color: white; width: 100%; outline: none; font-size: 0.9rem; } &:focus-within { border-color: #3b82f6; } } } `;

const CreateBtn = styled.button`
  background: ${props => props.$primary};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
const LoadingState = styled.div` display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; .spinner { animation: spin 1s linear infinite; } `;
const DataGrid = styled.div` display: flex; gap: 10px; margin-bottom: 15px; .data-item { font-size: 0.75rem; color: #94a3b8; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; } `;
const SeeQuestionBtn = styled.button` width: 100%; background: rgba(255,255,255,0.05); color: #94a3b8; padding: 10px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; &:hover { background: ${p => p.$primary}; color: white; } `;
const EmptyState = styled.div` display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.02); border: 2px dashed rgba(255, 255, 255, 0.1); border-radius: 24px; color: #94a3b8; gap: 20px; text-align: center; margin-top: 20px; p { font-size: 1rem; font-weight: 500; } `;

export default UserDashboard;