"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
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
  const quizLink = `http://10.134.120.46:3000/play?quizId=${quizId}`;

  const shareToWhatsApp = () => {
    const text = `Join my quiz: *${quizTitle}*\nScan the QR or click the link below to start (Quiz ID: ${quizId}):\n${quizLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalContent initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div className="modal-header">
          <h3><QrCode size={20} /> SHARE QUIZ</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ background: 'white', padding: '20px', border: '4px solid black', display: 'inline-block', marginBottom: '20px' }}>
          <QRCodeSVG value={quizLink} size={200} level="H" includeMargin={true} />
        </div>

        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>
          Students can scan this to join <b style={{ color: 'black' }}>{quizTitle}</b>
        </p>
        <p style={{ color: 'black', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 'bold' }}>
          Quiz ID: {quizId} (Auto-fills on scan)
        </p>

        <WhatsAppBtn onClick={shareToWhatsApp}>
          <Share2 size={18} /> SHARE ON WHATSAPP
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Logged/Result/${quizId}`, {
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
      headStyles: { fillColor: [0, 0, 0] }
    });
    doc.save(`Quiz_Result_${quizId}.pdf`);
  };

  return (
    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalContent initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="modal-header">
          <h3><Trophy size={20} /> STUDENT RESULTS</h3>
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
          <p className="no-data">NO RESULTS RECORDED YET.</p>
        ) : (
          <ResultTable>
            <thead>
              <tr><th>NAME</th><th>SCORE</th><th>TOTAL</th><th>PERCENTAGE</th></tr>
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Logged/Preview/${quizId}`, {
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
    const isPrivate = quizInfo.status === true || String(quizInfo.status).toLowerCase() === 'true';
    const payload = {
      quiz: {
        quiz: {
          quizId: parseInt(quizId),
          quizTitle: quizInfo.quizTitle,
          duration: parseInt(quizInfo.duration),
          status: isPrivate,
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Logged/Edit`, {
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

  if (loading) return <LoadingState><Loader2 className="spinner" size={40} /><p>LOADING...</p></LoadingState>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <EditHeaderSection>
        <div className="left">
          <BackButton onClick={onBack}><ChevronLeft size={20} /> <span className="btn-text">CANCEL</span></BackButton>
          <h2 className="edit-title">EDIT: {quizInfo?.quizTitle}</h2>
        </div>
        <div className="action-btns">
          <AddQuestionBtn type="button" onClick={addNewQuestion}>
            <Plus size={18} /> <span className="btn-text">ADD QUESTION</span>
          </AddQuestionBtn>
          <SaveBtn onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />} <span className="btn-text">SAVE ALL</span>
          </SaveBtn>
        </div>
      </EditHeaderSection>

      <EditLayout>
        <ConfigCard>
          <h3>QUIZ SETTINGS</h3>
          <div className="form-grid">
            <div className="field">
              <label>QUIZ TITLE</label>
              <input value={quizInfo?.quizTitle || ''} onChange={(e) => setQuizInfo({ ...quizInfo, quizTitle: e.target.value })} />
            </div>
            <div className="field">
              <label>DURATION (MIN)</label>
              <input type="number" value={quizInfo?.duration || ''} onChange={(e) => setQuizInfo({ ...quizInfo, duration: e.target.value })} />
            </div>
            <div className="field">
              <label>VISIBILITY</label>
              <select
                value={String(quizInfo?.status)}
                onChange={(e) => setQuizInfo({ ...quizInfo, status: e.target.value === "true" })}
              >
                <option value="true">Private</option>
                <option value="false">Public</option>
              </select>
            </div>
          </div>
        </ConfigCard>

        {questions.length === 0 ? (
          <EmptyState>
            <Inbox size={48} />
            <p>NO QUESTIONS FOUND IN THIS QUIZ.</p>
            <AddQuestionBtn onClick={addNewQuestion}><Plus size={18} /> ADD YOUR FIRST QUESTION</AddQuestionBtn>
          </EmptyState>
        ) : (
          questions.map((q, idx) => (
            <QuestionEditBox key={idx}>
              <div className="q-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>QUESTION {idx + 1}</span>
                  <DeleteSmallBtn onClick={() => handleDeleteQuestion(q.qno, idx)}><Trash2 size={16} /></DeleteSmallBtn>
                </div>
                <div className="correct-select">
                  <label>CORRECT:</label>
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Logged/Preview/${quizId}`, {
          method: 'GET', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        if (response.ok) { const data = await response.json(); setQuestions(data.questions || []); }
      } finally { setLoading(false); }
    };
    fetchQuestions();
  }, [quizId]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <BackButton onClick={onBack}><ChevronLeft size={20} /> BACK</BackButton>
      {loading ? <LoadingState><Loader2 className="spinner" size={40} /></LoadingState> : (
        <QuestionsContainer>
          <h2 className="preview-header">QUIZ PREVIEW</h2>
          {questions.length === 0 ? (
            <EmptyState>
              <Inbox size={48} />
              <p>NO QUESTIONS ADDED TO THIS QUIZ YET.</p>
            </EmptyState>
          ) : (
            questions.map((q, index) => (
              <QuestionPreviewCard key={index}>
                <div className="q-label"><HelpCircle size={14} /> QUESTION {index + 1}</div>
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
          placeholder="SEARCH BY QUIZ TITLE OR ID..."
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/LiveParticipants/${quizId}`, {
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
    const interval = setInterval(fetchLive, 1000);
    return () => clearInterval(interval);
  }, [quizId]);

  return (
    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalContent initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={20} className="spinner" style={{ animationDuration: '2s' }} />
            LIVE PARTICIPANTS
          </h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {loading && participants.length === 0 ? (
          <div className="loading-center"><Loader2 className="spinner" /></div>
        ) : participants.length === 0 ? (
          <p className="no-data">NO ONE IS CURRENTLY TAKING THIS QUIZ.</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <ResultTable>
              <thead>
                <tr>
                  <th>#</th>
                  <th>STUDENT NAME</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: '700' }}>{p.name}</td>
                    <td>
                      <span style={{
                        color: 'black',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: '700'
                      }}>
                        <div style={{ width: '8px', height: '8px', background: 'black' }} />
                        ONLINE
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
          style={{ maxWidth: '400px' }}
        >
          <div className="warning-icon">
            <AlertTriangle size={48} />
          </div>
          <h3>DELETE QUIZ?</h3>
          <p>
            ARE YOU SURE YOU WANT TO DELETE <strong>"{title}"</strong>?
            <br />THIS ACTION CANNOT BE UNDONE.
          </p>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onCancel}>CANCEL</button>
            <button className="confirm-btn" onClick={onConfirm}>DELETE QUIZ</button>
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

  const primaryColor = "#000000";

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Logged?email=${email}`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Logged/SwitchStatus/${quizId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
      });

      if (response.ok) {
        const minutes = await response.json();
        console.log(minutes);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Logged/Delete/${quizId}`, {
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
                <h1>ADMIN DASHBOARD</h1>
                <p>LOGGED IN AS <span className="highlight">{userEmail}</span></p>
              </div>
              <CreateBtn onClick={handleCreateNew} disabled={isCreating}>
                {isCreating ? <Loader2 size={20} className="spinner" /> : <Plus size={20} />}
                <span className="btn-text">{isCreating ? "LOADING..." : "NEW QUIZ"}</span>
              </CreateBtn>
            </header>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm("")}
            />

            {loading ? <LoadingState><Loader2 className="spinner" size={40} /><p>LOADING...</p></LoadingState> : (
              quizzes.length === 0 ? (
                <EmptyState>
                  <Inbox size={48} />
                  <p>YOU HAVEN'T CREATED ANY QUIZZES YET.</p>
                  <CreateBtn onClick={handleCreateNew} disabled={isCreating}>
                    {isCreating ? <Loader2 size={20} className="spinner" /> : <Plus size={20} />}
                    {isCreating ? "REDIRECTING..." : "CREATE YOUR FIRST QUIZ"}
                  </CreateBtn>
                </EmptyState>
              ) : (
                <QuizGrid>
                  {filteredQuizzes.map((quiz) => (
                    <StyledCard key={quiz.quizId} style={{ zIndex: activeMenuId === quiz.quizId ? 100 : 1 }}>
                      <div className="card-header">
                        <div className="icon-bg"><BookOpen size={20} /></div>

                        <ActionWrapper>
                          <div className={`status-pill ${quiz.isPrivate ? 'private' : 'public'}`}>
                            {quiz.isPrivate ? <Lock size={12} /> : <Globe size={12} />}
                            <span>{quiz.isPrivate ? 'PRIVATE' : 'PUBLIC'}</span>
                          </div>
                          <StatusBadge
                            onClick={() => handleToggleStatus(quiz.quizId)}
                            $isActive={String(quiz.status) === "true"}
                            disabled={switchingStatusId === quiz.quizId}
                          >
                            {switchingStatusId === quiz.quizId ? <Loader2 size={12} className="spinner" /> : (String(quiz.status) === "true" ? "DEACTIVATE" : "ACTIVATE")}
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
                                    <Radio size={16} /> LIVE PARTICIPANTS
                                  </MenuOption>
                                  <MenuOption onClick={() => setViewQRId(quiz.quizId)}>
                                    <QrCode size={16} /> SHOW QR CODE
                                  </MenuOption>
                                  <MenuOption onClick={() => setEditQuizId(quiz.quizId)}>
                                    <Edit3 size={16} /> EDIT DETAILS
                                  </MenuOption>
                                  <MenuOption onClick={() => setViewResultId(quiz.quizId)}>
                                    <FileText size={16} /> VIEW RESULTS
                                  </MenuOption>
                                  <Divider />
                                  <MenuOption onClick={() => setDeleteTarget(quiz)} className="delete">
                                    <Trash2 size={16} /> DELETE QUIZ
                                  </MenuOption>
                                </DropdownMenu>
                              )}
                            </AnimatePresence>
                          </div>
                        </ActionWrapper>
                      </div>

                      <h3 className="quiz-title">{quiz.quizTitle || "UNTITLED"}</h3>
                      <DataGrid>
                        <div className="data-item"><Clock size={14} /> {quiz.duration}M</div>
                        <div className="data-item"><Fingerprint size={14} /> ID: {quiz.quizId}</div>
                      </DataGrid>
                      <SeeQuestionBtn onClick={() => setSelectedQuizId(quiz.quizId)}>
                        <Eye size={16} /> SEE QUESTIONS
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

/* ==================== BRUTALIST MONOCHROME STYLES ==================== */

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const DashboardWrapper = styled.div`
  max-width: 1200px;
  padding: 40px 20px;
  color: #fff;  /* Already correct */
  margin: 0 auto;
  background: #000;  /* Already correct */
  font-family: 'Courier New', monospace;
  height: auto; 
  overflow: visible;

  .main-header {
    display: flex;
    flex-direction: row; 
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    gap: 15px; 
    border-bottom: 1px solid #fff;  /* Already correct */
    padding-bottom: 20px;
    
    h1 { 
      font-size: 2.5rem; 
      font-weight: 900;
      letter-spacing: -2px;
      text-transform: uppercase;
    }
    
    .highlight { 
      color: #fff;  /* CHANGE: was #000 */
      background: #000;  /* CHANGE: was #fff */
      padding: 2px 8px;
      border: 1px solid #fff;  /* CHANGE: was #000 */
    }
    
    @media (max-width: 640px) {
      h1 { font-size: 1.5rem; }
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

const QuizGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StyledCard = styled(motion.div)`
  background: #1E1E1E;  /* Already correct */
  border: 4px solid #fff;  /* Already correct */
  padding: 20px;
  position: relative;
  overflow: visible !important;
  box-shadow: 4px 4px 0 #fff;  /* Already correct */
  transition: transform 0.1s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 10px 10px 0 #fff;  /* CHANGE: was #000 */
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  
  .icon-bg {
    padding: 8px;
    background: #fff;  /* Already correct */
    color: #000;  /* Already correct */
  }
  
  .quiz-title {
    font-size: 1.3rem;
    font-weight: 900;
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: -1px;
    color: #fff;  /* ADD THIS */
  }
`;

const ActionWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .status-pill, ${() => StatusBadge} {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 12px;
    font-size: 0.7rem;
    font-weight: 900;
    height: 28px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-sizing: border-box;
    transition: all 0.1s ease;
  }

  .status-pill {
    &.public {
      background: #000;  /* CHANGE: was #fff */
      color: #fff;  /* CHANGE: was #000 */
      border: 2px solid #fff;  /* CHANGE: was #000 */
    }
    &.private {
      background: #fff;  /* CHANGE: was #000 */
      color: #000;  /* CHANGE: was #fff */
      border: 2px solid #fff;  /* CHANGE: was #000 */
    }
  }
`;

const StatusBadge = styled.button`
  cursor: pointer;
  background: ${props => props.$isActive ? '#dc3545' : '#28a745'}; #28a745 /* CHANGE: swap colors */
  color: ${props => props.$isActive ? '#fff' : '#fff'};  /* CHANGE: swap colors */
  border: 2px solid #fff;  /* CHANGE: was #000 */

  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 #fff;  /* CHANGE: was #000 */
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MoreBtn = styled.button`
  background: #000;  /* CHANGE: was #fff */
  border: 2px solid #fff;  /* CHANGE: was #000 */
  color: #fff;  /* CHANGE: was #000 */
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
  
  &:hover {
    background: #fff;  /* CHANGE: was #000 */
    color: #000;  /* CHANGE: was #fff */
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 40px;
  right: 0;
  background: #000;  /* CHANGE: was #fff */
  border: 4px solid #fff;  /* CHANGE: was #000 */
  box-shadow: 8px 8px 0 #fff;  /* CHANGE: was #000 */
  width: 210px;
  z-index: 9999;
  padding: 6px;
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
  font-weight: 700;
  color: #fff;  /* CHANGE: was #000 */
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.1s ease;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;

  &:hover {
    background: #fff;  /* CHANGE: was #000 */
    color: #000;  /* CHANGE: was #fff */
  }

  &.delete {
    color: #fff;  /* CHANGE: was #000 */
    &:hover {
      background: #fff;  /* CHANGE: was #000 */
      color: #000;  /* CHANGE: was #fff */
    }
  }
`;

const Divider = styled.div`
  height: 2px;
  background: #fff;  /* CHANGE: was #000 */
  margin: 6px 8px;
`;

const SearchWrapper = styled.div`
  margin-bottom: 30px;
  
  .search-inner {
    display: flex;
    align-items: center;
    background: #000;  /* CHANGE: was #fff */
    border: 0.5px solid #fff;  /* CHANGE: was #000 */
    padding: 6px 18px;
    gap: 12px;
    
    .search-icon { color: #fff; }  /* CHANGE: was #000 */
    
    input {
      background: transparent;
      border: none;
      color: #fff;  /* CHANGE: was #000 */
      width: 100%;
      outline: none;
      font-size: 1rem;
      padding: 12px 0;
      font-family: 'Courier New', monospace;
      font-weight: 700;
      
      &::placeholder {
        color: #888;  /* CHANGE: was #666 */
      }
    }
    
    .clear-btn {
      background: #fff;  /* CHANGE: was #000 */
      border: none;
      color: #000;  /* CHANGE: was #fff */
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: 0.1s;
      
      &:hover {
        background: #000;  /* CHANGE: was #fff */
        color: #fff;  /* CHANGE: was #000 */
        border: 2px solid #fff;  /* CHANGE: was #000 */
      }
    }
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);  /* CHANGE: was rgba(255, 255, 255, 0.95) */
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: #000;  /* CHANGE: was #fff */
  border: 4px solid #fff;  /* CHANGE: was #000 */
  width: 100%;
  max-width: 450px;
  padding: 32px;
  position: relative;
  box-shadow: 12px 12px 0 #fff;  /* CHANGE: was #000 */
  color: #fff;  /* ADD THIS */

  .warning-icon {
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
    color: #fff;  /* CHANGE: was #000 */
  }

  h3 {
    font-size: 1.5rem;
    margin-bottom: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -1px;
    color: #fff;  /* ADD THIS */
  }

  p {
    color: #ccc;  /* CHANGE: was #333 */
    line-height: 1.6;
    margin-bottom: 30px;
    strong { color: #fff; font-weight: 900; }  /* CHANGE: was #000 */
  }

  .modal-actions {
    display: flex;
    gap: 12px;

    button {
      flex: 1;
      padding: 14px;
      font-weight: 900;
      cursor: pointer;
      transition: all 0.1s;
      border: 2px solid #fff;  /* CHANGE: was #000 */
      text-transform: uppercase;
      font-family: 'Courier New', monospace;
    }

    .cancel-btn {
      background: #000;  /* CHANGE: was #fff */
      color: #fff;  /* CHANGE: was #000 */
      
      &:hover {
        background: #fff;  /* CHANGE: was #000 */
        color: #000;  /* CHANGE: was #fff */
      }
    }

    .confirm-btn {
      background: #fff;  /* CHANGE: was #000 */
      color: #000;  /* CHANGE: was #fff */
      
      &:hover {
        transform: translate(-2px, -2px);
        box-shadow: 4px 4px 0 #fff;  /* CHANGE: was #000 */
      }
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #fff;  /* CHANGE: was #000 */
    padding-bottom: 15px;
    
    button {
      background: none;
      border: none;
      color: #fff;  /* CHANGE: was #000 */
      cursor: pointer;
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }

  .loading-center {
    display: flex;
    justify-content: center;
    padding: 40px;
  }

  .no-data {
    text-align: center;
    color: #888;  /* CHANGE: was #666 */
    padding: 20px;
    font-weight: 700;
    text-transform: uppercase;
  }
`;

const ResultTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  
  th, td {
    text-align: left;
    padding: 12px;
    border: 2px solid #fff;  /* CHANGE: was #000 */
  }
  
  th {
    font-size: 0.8rem;
    font-weight: 900;
    text-transform: uppercase;
    background: #fff;  /* CHANGE: was #000 */
    color: #000;  /* CHANGE: was #fff */
  }
  
  td {
    color: #fff;  /* ADD THIS */
  }
  
  .score-cell {
    font-weight: 900;
    font-size: 1.2rem;
  }
`;

const DownloadBtn = styled.button`
  background: #000;  /* CHANGE: was #fff */
  border: 2px solid #fff;  /* CHANGE: was #000 */
  color: #fff;  /* CHANGE: was #000 */
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #fff;  /* CHANGE: was #000 */
    color: #000;  /* CHANGE: was #fff */
  }
`;

const WhatsAppBtn = styled.button`
  width: 100%;
  background: #fff;  /* CHANGE: was #000 */
  color: #000;  /* CHANGE: was #fff */
  border: none;
  padding: 14px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.1s;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  
  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 #fff;  /* CHANGE: was #000 */
  }
`;

const CreateBtn = styled.button`
  background: #fff;  /* CHANGE: was #000 */
  color: #000;  /* CHANGE: was #fff */
  border: 2px solid #fff;  /* CHANGE: was #000 */
  padding: 12px 24px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.1s;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;

  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 #fff;  /* CHANGE: was #000 */
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  font-weight: 900;
  text-transform: uppercase;
  color: #fff;  /* ADD THIS */
  
  .spinner {
    animation: spin 1s linear infinite;
  }
`;

const DataGrid = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  
  .data-item {
    font-size: 0.75rem;
    font-weight: 900;
    background: #000;  /* CHANGE: was #fff */
    border: 2px solid #fff;  /* CHANGE: was #000 */
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 4px;
    text-transform: uppercase;
    color: #fff;  /* ADD THIS */
  }
`;

const SeeQuestionBtn = styled.button`
  width: 100%;
  background: #000;  /* CHANGE: was #fff */
  color: #fff;  /* CHANGE: was #000 */
  padding: 12px;
  border: 2px solid #fff;  /* CHANGE: was #000 */
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.1s;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  
  &:hover {
    background: #fff;  /* CHANGE: was #000 */
    color: #000;  /* CHANGE: was #fff */
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #000;  /* CHANGE: was #fff */
  border: 4px dashed #fff;  /* CHANGE: was #000 */
  color: #fff;  /* CHANGE: was #000 */
  gap: 20px;
  text-align: center;
  margin-top: 20px;
  
  p {
    font-size: 1rem;
    font-weight: 900;
    text-transform: uppercase;
  }
`;

const EditLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 60px;
`;

const ConfigCard = styled.div`
  background: #000;  /* CHANGE: was #fff */
  border: 4px solid #fff;  /* CHANGE: was #000 */
  padding: 32px;
  box-shadow: 8px 8px 0 #fff;  /* CHANGE: was #000 */

  h3 {
    font-size: 1.1rem;
    font-weight: 900;
    margin-bottom: 24px;
    text-transform: uppercase;
    letter-spacing: -1px;
    border-bottom: 2px solid #fff;  /* CHANGE: was #000 */
    padding-bottom: 10px;
    color: #fff;  /* ADD THIS */
  }

  .form-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
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
        font-weight: 900;
        text-transform: uppercase;
        color: #fff;  /* ADD THIS */
      }

      input {
        background: #000;  /* CHANGE: was #fff */
        border: 2px solid #fff;  /* CHANGE: was #000 */
        padding: 14px 18px;
        color: #fff;  /* CHANGE: was #000 */
        font-size: 1rem;
        font-family: 'Courier New', monospace;
        font-weight: 700;

        &:focus {
          outline: none;
          box-shadow: 4px 4px 0 #fff;  /* CHANGE: was #000 */
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
  border-bottom: 4px solid #fff;  /* CHANGE: was #000 */
  margin-bottom: 30px;

  .left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .edit-title {
    font-size: 1.8rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -2px;
    color: #fff;  /* ADD THIS */
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

const SaveBtn = styled(motion.button)`
  background: #fff;  /* CHANGE: was #000 */
  color: #000;  /* CHANGE: was #fff */
  border: 2px solid #fff;  /* CHANGE: was #000 */
  padding: 14px 28px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;

  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 #fff;  /* CHANGE: was #000 */
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddQuestionBtn = styled.button`
  background: #000;  /* CHANGE: was #fff */
  border: 2px dashed #fff;  /* CHANGE: was #000 */
  color: #fff;  /* CHANGE: was #000 */
  padding: 14px 28px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;

  &:hover {
    background: #fff;  /* CHANGE: was #000 */
    color: #000;  /* CHANGE: was #fff */
    border-style: solid;
  }
`;

const BackButton = styled.button`
  background: #000;  /* CHANGE: was #fff */
  border: 2px solid #fff;  /* CHANGE: was #000 */
  color: #fff;  /* CHANGE: was #000 */
  padding: 10px 20px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: 0.1s;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;

  &:hover {
    background: #fff;  /* CHANGE: was #000 */
    color: #000;  /* CHANGE: was #fff */
  }
`;

const DeleteSmallBtn = styled.button`
  background: #000;  /* CHANGE: was #fff */
  border: 2px solid #fff;  /* CHANGE: was #000 */
  color: #fff;  /* CHANGE: was #000 */
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.1s;

  &:hover {
    background: #fff;  /* CHANGE: was #000 */
    color: #000;  /* CHANGE: was #fff */
    transform: rotate(90deg);
  }
`;

const QuestionsContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 0;
  
  .preview-header {
    font-size: 2rem;
    font-weight: 900;
    margin-bottom: 24px;
    text-transform: uppercase;
    letter-spacing: -2px;
    border-bottom: 4px solid #fff;  /* CHANGE: was #000 */
    padding-bottom: 15px;
    color: #fff;  /* ADD THIS */
  }
`;

const QuestionPreviewCard = styled.div`
  background: #000;  /* CHANGE: was #fff */
  border: 4px solid #fff;  /* CHANGE: was #000 */
  padding: 28px;
  margin-bottom: 20px;
  box-shadow: 6px 6px 0 #fff;  /* CHANGE: was #000 */

  .q-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 12px;
    background: #fff;  /* CHANGE: was #000 */
    color: #000;  /* CHANGE: was #fff */
    width: fit-content;
    padding: 6px 12px;
  }

  .q-text {
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1.6;
    margin-bottom: 24px;
    color: #fff;  /* ADD THIS */
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
      background: #000;  /* CHANGE: was #fff */
      border: 2px solid #fff;  /* CHANGE: was #000 */
      font-size: 0.95rem;
      font-weight: 700;
      transition: all 0.1s ease;
      color: #fff;  /* ADD THIS */

      &.correct {
        background: #fff;  /* CHANGE: was #000 */
        color: #000;  /* CHANGE: was #fff */
        font-weight: 900;
        
        &::after {
          content: '✓';
          position: absolute;
          right: 15px;
          font-weight: 900;
        }
      }
    }
  }
`;

const QuestionEditBox = styled.div`
  background: #000;  /* CHANGE: was #fff */
  border: 4px solid #fff;  /* CHANGE: was #000 */
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 6px 6px 0 #fff;  /* CHANGE: was #000 */

  .q-top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    font-weight: 900;
    text-transform: uppercase;
    color: #fff;  /* ADD THIS */
  }

  .correct-select {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: 900;
    
    select {
      background: #000;  /* CHANGE: was #fff */
      color: #fff;  /* CHANGE: was #000 */
      border: 2px solid #fff;  /* CHANGE: was #000 */
      padding: 4px 8px;
      font-weight: 900;
      font-family: 'Courier New', monospace;
      
      &:focus {
        outline: none;
      }
    }
  }

  .q-input {
    width: 100%;
    background: #000;  /* CHANGE: was #fff */
    border: 2px solid #fff;  /* CHANGE: was #000 */
    padding: 12px;
    color: #fff;  /* CHANGE: was #000 */
    margin-bottom: 15px;
    font-family: 'Courier New', monospace;
    font-size: 0.95rem;
    font-weight: 700;
    min-height: 80px;
    resize: vertical;
    
    &:focus {
      outline: none;
      box-shadow: 4px 4px 0 #fff;  /* CHANGE: was #000 */
    }
    
    &::placeholder {
      color: #888;  /* ADD THIS */
    }
  }

  .options-grid-edit {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    
    @media (min-width: 640px) {
      grid-template-columns: 1fr 1fr;
    }

    .opt-field {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #000;  /* CHANGE: was #fff */
      border: 2px solid #fff;  /* CHANGE: was #000 */
      padding: 10px;

      .opt-label {
        font-weight: 900;
        font-size: 0.9rem;
        min-width: 20px;
        color: #fff;  /* ADD THIS */
      }

      input {
        background: none;
        border: none;
        color: #fff;  /* CHANGE: was #000 */
        width: 100%;
        outline: none;
        font-size: 0.9rem;
        font-family: 'Courier New', monospace;
        font-weight: 700;
        
        &::placeholder {
          color: #888;  /* ADD THIS */
        }
      }

      &:focus-within {
        box-shadow: 4px 4px 0 #fff;  /* CHANGE: was #000 */
      }
    }
  }
`;

export default UserDashboard;