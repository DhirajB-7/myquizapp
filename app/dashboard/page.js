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
  const quizLink = `https://quizkrida.vercel.app/play?quizId=${quizId}`;

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
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResults = useMemo(() => {
    return results.filter(r =>
      (r.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.studentClass || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.division || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.rollNo || "").includes(searchTerm)
    );
  }, [results, searchTerm]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Logged/Result/${quizId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true',
            'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY
          }
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

  const downloadPDF = async () => {
    if (results.length === 0) return;

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(`Quiz Results - ID: ${quizId}`, 14, 15);

    const tableColumn = ["#", "Student Name", "Class", "Division", "Roll No", "Score", "Total", "Percentage"];
    const tableRows = results.map((res, idx) => [
      idx + 1,
      res.name || "-",
      res.studentClass || "-",
      res.division || "-",
      res.rollNo != null ? res.rollNo : "-",
      res.score != null ? res.score : "-",
      res.outOf != null ? res.outOf : "-",
      res.outOf && res.score != null
        ? `${((res.score / res.outOf) * 100).toFixed(1)}%`
        : "-"
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 22,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    doc.save(`Quiz_Result_${quizId}.pdf`);
  };

  const handleDeleteResults = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Delete/Result/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY
        }
      });

      if (response.ok) {
        setResults([]);
        toast.success("Server records cleared.");
      } else {
        setResults([]);
        toast.error("Server failed to clear data.");
      }
    } catch (err) {
      console.error("Cleanup error:", err);
      setResults([]);
    }
  };

  return (
    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalContent
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ maxWidth: '900px', width: '95vw' }}
      >
        <div className="modal-header">
          <h3><Trophy size={20} /> STUDENT RESULTS</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {results.length > 0 && (
              <DownloadBtn onClick={downloadPDF} title="Download Result PDF">
                <Download size={18} />
              </DownloadBtn>
            )}
            {results.length > 0 && (
              <DeleteResultsBtn onClick={handleDeleteResults} title="Delete All Results">
                <Trash2 size={18} />
              </DeleteResultsBtn>
            )}
            <button onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><Loader2 className="spinner" /></div>
        ) : results.length === 0 ? (
          <p className="no-data">NO RESULTS RECORDED YET.</p>
        ) : (
          <>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm("")}
            />
            <div style={{ overflowX: 'auto', maxHeight: '460px', overflowY: 'auto' }}>
              <ResultTable>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>NAME</th>
                    <th>CLASS</th>
                    <th>DIV</th>
                    <th>ROLL NO</th>
                    <th>SCORE</th>
                    <th>TOTAL</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((res, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 700 }}>{res.name || "-"}</td>
                      <td>{res.studentClass || "-"}</td>
                      <td style={{ textAlign: 'center' }}>{res.division || "-"}</td>
                      <td style={{ textAlign: 'center' }}>{res.rollNo != null ? res.rollNo : "-"}</td>
                      <td className="score-cell">{res.score != null ? res.score : "-"}</td>
                      <td>{res.outOf != null ? res.outOf : "-"}</td>
                      <td>
                        {res.outOf && res.score != null
                          ? `${((res.score / res.outOf) * 100).toFixed(1)}%`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ResultTable>
            </div>
          </>
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
          headers: {
            'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true',
            'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY
          }
        });
        if (response.ok) {
          const data = await response.json();
          setQuizInfo({
            quizId: data.quizId,
            quizTitle: data.quizTitle,
            duration: data.duration,
            status: data.status,
            isPrivate: data.isPrivate,
            createdBy: data.createdBy,
            authorName: data.author || data.authorName || '',
            timeLimit: typeof data.timer !== 'undefined' ? Boolean(data.timer) : Boolean(data.timeLimit),
            timePerQ: data.timePerQ
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
    if (!quizInfo?.quizTitle?.trim()) { toast.error("Quiz title is required"); return; }
    if (!quizInfo?.authorName?.trim()) { toast.error("Author name is required"); return; }

    const firstInvalidIndex = questions.findIndex(q =>
      !q.question?.trim() || !q.opt1?.trim() || !q.opt2?.trim() || !q.opt3?.trim() || !q.opt4?.trim()
    );
    if (firstInvalidIndex !== -1) { toast.error(`Question ${firstInvalidIndex + 1} has empty fields!`); return; }

    setSaving(true);
    const isPrivate = quizInfo.status === true || String(quizInfo.status).toLowerCase() === 'true';
    if (quizInfo.timeLimit) {
      const t = parseInt(quizInfo.timePerQ);
      if (isNaN(t) || t <= 0) { toast.error("Minutes per question must be a positive number"); setSaving(false); return; }
    }

    const payload = {
      quiz: {
        quiz: {
          quizId: parseInt(quizId),
          quizTitle: quizInfo.quizTitle,
          isPrivate: quizInfo.isPrivate || isPrivate,
          createdBy: quizInfo.createdBy || userEmail,
          author: quizInfo.authorName || quizInfo.createdBy || userEmail,
          timer: Boolean(quizInfo.timeLimit),
          timePerQ: parseInt(quizInfo.timePerQ) || 0,
          showInstantScore: Boolean(quizInfo.showInstantScore),
          timePerStudent: quizInfo.timeLimit ? 0 : parseInt(quizInfo.timePerStudent) || 0
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
        headers: {
          'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true',
          'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) { toast.success("Quiz updated successfully!"); onBack(); }
      else { toast.error("Server error. Please check all fields or quiz is active."); }
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
              <label>AUTHOR NAME</label>
              <input value={quizInfo?.authorName || ''} onChange={(e) => setQuizInfo({ ...quizInfo, authorName: e.target.value })} />
            </div>
            <div className="field">
              <label>TIME LIMIT</label>
              <select value={String(quizInfo?.timeLimit || false)} onChange={(e) => setQuizInfo({ ...quizInfo, timeLimit: e.target.value === 'true' })}>
                <option value="false">Window Open For Student</option>
                <option value="true">Minutes Per Question</option>
              </select>
            </div>
            <div className="field">
              <label>INSTANT SCORE</label>
              <select value={String(quizInfo?.showInstantScore || false)} onChange={(e) => setQuizInfo({ ...quizInfo, showInstantScore: e.target.value === 'true' })}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            {quizInfo?.timeLimit ? (
              <div className="field">
                <label>MINUTES PER QUESTION</label>
                <input type="number" value={quizInfo?.timePerQ || ''} onChange={(e) => setQuizInfo({ ...quizInfo, timePerQ: e.target.value })} />
              </div>
            ) : (
              <div className="field">
                <label>WINDOW OPEN (MINUTES)</label>
                <input type="number" value={quizInfo?.timePerStudent || ''} onChange={(e) => setQuizInfo({ ...quizInfo, timePerStudent: e.target.value })} min="1" max="2880" step="1" placeholder="Enter minutes" />
              </div>
            )}
            <div className="field">
              <label>VISIBILITY</label>
              <select value={String(quizInfo?.isPrivate || quizInfo?.status || false)} onChange={(e) => setQuizInfo({ ...quizInfo, isPrivate: e.target.value === "true" })}>
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
              <textarea className="q-input" placeholder="Type your question here..." value={q.question} onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)} />
              <div className="options-grid-edit">
                {['opt1', 'opt2', 'opt3', 'opt4'].map((opt, i) => (
                  <div key={opt} className="opt-field">
                    <span className="opt-label">{String.fromCharCode(65 + i)}</span>
                    <input value={q[opt]} onChange={(e) => handleQuestionChange(idx, opt, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
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
          method: 'GET', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY }
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
            <EmptyState><Inbox size={48} /><p>NO QUESTIONS ADDED TO THIS QUIZ YET.</p></EmptyState>
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
const SearchBar = ({ value, onChange, onClear }) => (
  <SearchWrapper>
    <div className="search-inner">
      <Search size={20} className="search-icon" />
      <input type="text" placeholder="SEARCH BY NAME, QUIZ TITLE, ID..." value={value} onChange={(e) => onChange(e.target.value)} />
      <AnimatePresence>
        {value && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={onClear} className="clear-btn">
            <X size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  </SearchWrapper>
);

/* --- LIVE PARTICIPANTS MODAL --- */
const LiveParticipantsModal = ({ quizId, onClose }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Helper to format the attendTime (e.g., "10:34 PM")
  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => 
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [participants, searchTerm]);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/LiveParticipants/${quizId}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json', 
            'ngrok-skip-browser-warning': 'true', 
            'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY 
          }
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
    const interval = setInterval(fetchLive, 2000); // Polling every 2s is usually enough
    return () => clearInterval(interval);
  }, [quizId]);

return (
    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalContent initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ maxWidth: '650px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Radio size={18} className="spinner" style={{ color: '#22c55e' }} /> 
              LIVE DATA
            </h3>
            {/* --- TOTAL COUNT BADGE --- */}
            <div style={{ 
              backgroundColor: '#22c55e', 
              color: '#000', 
              padding: '2px 8px', 
              borderRadius: '4px', 
              fontSize: '0.75rem', 
              fontWeight: '900',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.3)'
            }}>
              {participants.length} TOTAL
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {loading && participants.length === 0 ? (
          <div className="loading-center"><Loader2 className="spinner" /></div>
        ) : participants.length === 0 ? (
          <p className="no-data" style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>NO ONE IS CURRENTLY TAKING THIS QUIZ.</p>
        ) : (
          <div>
            <div style={{ marginTop: '20px' }}>
                <SearchBar 
                placeholder="SEARCH BY NAME OR EMAIL..."
                value={searchTerm} 
                onChange={setSearchTerm} 
                onClear={() => setSearchTerm("")} 
                />
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '15px' }}>
              <ResultTable>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>NAME</th>
                    <th>EMAIL ADDRESS</th>
                    <th>JOINED</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((p, i) => (
                    <tr key={p.email || i}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: '700', textTransform: 'uppercase' }}>{p.name}</td>
                      <td style={{ fontSize: '0.8rem', opacity: 0.6, fontStyle: 'italic' }}>{p.email}</td>
                      <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{p.attendTime}</td>
                      <td>
                        <span style={{ color: '#22c55e', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800' }}>
                          <div style={{ width: '6px', height: '6px', backgroundColor: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }} />
                          ONLINE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ResultTable>
            </div>
          </div>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

const DeleteConfirmationModal = ({ isOpen, onConfirm, onCancel, title }) => (
  <AnimatePresence>
    {isOpen && (
      <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
        <ModalContent initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
          <div className="warning-icon"><AlertTriangle size={48} /></div>
          <h3>DELETE QUIZ?</h3>
          <p>ARE YOU SURE YOU WANT TO DELETE <strong>"{title}"</strong>?<br />THIS ACTION CANNOT BE UNDONE.</p>
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
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY },
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
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY }
      });
      if (response.ok) {
        const minutes = await response.json();
        setQuizzes(prev => prev.map(q => q.quizId === quizId ? { ...q, status: String(q.status) === "true" ? "false" : "true" } : q));
        if (minutes === 0) toast.success("Quiz Deactivated!");
        else if (minutes > 0) toast.success(`Quiz Activated for ${minutes} Minutes`);
      }
    } catch (err) { toast.error("Network error"); }
    finally { setSwitchingStatusId(null); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const quizId = deleteTarget.quizId;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Logged/Delete/${quizId}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY }
      });
      if (response.ok) { setQuizzes(prev => prev.filter(q => q.quizId !== quizId)); toast.success("Quiz deleted"); }
    } catch (e) { toast.error("Delete failed"); }
    finally { setDeleteTarget(null); }
  };

  const handleCreateNew = () => { setIsCreating(true); router.push("/create"); };
  const activeQRQuiz = quizzes.find(q => q.quizId === viewQRId);

  return (
    <DashboardWrapper>
      <Toaster position="bottom-right" />

      <DeleteConfirmationModal isOpen={!!deleteTarget} title={deleteTarget?.quizTitle} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />

      <AnimatePresence>
        {viewResultId && <ResultModal quizId={viewResultId} onClose={() => setViewResultId(null)} />}
        {viewQRId && <QRModal quizId={viewQRId} quizTitle={activeQRQuiz?.quizTitle || "Untitled Quiz"} onClose={() => setViewQRId(null)} />}
        {viewLiveId && <LiveParticipantsModal quizId={viewLiveId} onClose={() => setViewLiveId(null)} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {editQuizId ? (
          <EditQuizModule quizId={editQuizId} primaryColor={primaryColor} userEmail={userEmail} onBack={() => { setEditQuizId(null); setTimeout(() => fetchUserQuizzes(userEmail), 1500); }} />
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

            <SearchBar value={searchTerm} onChange={setSearchTerm} onClear={() => setSearchTerm("")} />

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
                          <StatusBadge onClick={() => handleToggleStatus(quiz.quizId)} $isActive={String(quiz.status) === "true"} disabled={switchingStatusId === quiz.quizId}>
                            {switchingStatusId === quiz.quizId ? <Loader2 size={12} className="spinner" /> : (String(quiz.status) === "true" ? "DEACTIVATE" : "ACTIVATE")}
                          </StatusBadge>
                          <div style={{ position: 'relative' }}>
                            <MoreBtn onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === quiz.quizId ? null : quiz.quizId); }}>
                              <MoreVertical size={20} />
                            </MoreBtn>
                            <AnimatePresence>
                              {activeMenuId === quiz.quizId && (
                                <DropdownMenu initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} onClick={(e) => e.stopPropagation()}>
                                  <MenuOption onClick={() => setViewLiveId(quiz.quizId)}><Radio size={16} /> LIVE PARTICIPANTS</MenuOption>
                                  <MenuOption onClick={() => setViewQRId(quiz.quizId)}><QrCode size={16} /> SHOW QR CODE</MenuOption>
                                  <MenuOption onClick={() => setEditQuizId(quiz.quizId)}><Edit3 size={16} /> EDIT DETAILS</MenuOption>
                                  <MenuOption onClick={() => setViewResultId(quiz.quizId)}><FileText size={16} /> VIEW RESULTS</MenuOption>
                                  <Divider />
                                  <MenuOption onClick={() => setDeleteTarget(quiz)} className="delete"><Trash2 size={16} /> DELETE QUIZ</MenuOption>
                                </DropdownMenu>
                              )}
                            </AnimatePresence>
                          </div>
                        </ActionWrapper>
                      </div>

                      <h3 className="quiz-title"> {quiz.quizTitle || "UNTITLED"}</h3><br />
                      <DataGrid>
                        <div className="data-item">
                          {quiz.timeLimit ? <span>N/A</span> : (
                            <><Clock size={14} />{quiz.timePerStudent ? `${Math.floor(quiz.timePerStudent / 60)}h ${quiz.timePerStudent % 60}m` : "none"}</>
                          )}
                        </div>
                        <div className="data-item"><Fingerprint size={14} /> ID: {quiz.quizId}</div>
                        <div className="data-item"><Trophy size={14} /><span> Score: {quiz.showInstantScore ? "Yes" : "No"}</span></div>
                        <div className="data-item" title={`raw:${quiz.timePerQ}`}>
                          <Clock size={14} />
                          <span>TPQ: {quiz.timeLimit ? (quiz.timePerQ && Number(quiz.timePerQ) > 0 ? `${quiz.timePerQ}m/q` : "24HR") : (quiz.timePerQ && Number(quiz.timePerQ) > 0 ? `${quiz.timePerQ}m/q` : "N/A")}</span>
                        </div>
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

/* ==================== STYLES ==================== */

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

const DashboardWrapper = styled.div`
  max-width: 1200px;
  padding: 40px 20px;
  color: #fff;
  margin: 0 auto;
  background: #000;
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
    border-bottom: 1px solid #fff;
    padding-bottom: 20px;
    h1 { font-size: 2.5rem; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; }
    .highlight { color: #fff; background: #000; padding: 2px 8px; border: 1px solid #fff; }
    @media (max-width: 640px) { h1 { font-size: 1.5rem; } .user-info p { font-size: 0.8rem; } }
  }

  .btn-text { @media (max-width: 640px) { display: none; } }
  .spinner { animation: ${spin} 1s linear infinite; }
`;

const QuizGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const StyledCard = styled(motion.div)`
  background: #1e1e1e;
  border: 4px solid #fff;
  padding: clamp(15px, 4vw, 25px);
  position: relative;
  overflow: visible !important;
  box-shadow: 4px 4px 0 #fff;
  display: flex;
  flex-direction: column;
  min-height: 260px;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);

  &:hover { transform: translate(-4px, -4px); box-shadow: 12px 12px 0 #fff; }

  .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; width: 100%; }
  .icon-bg { padding: 8px; background: #fff; color: #000; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .quiz-title { font-size: clamp(1.1rem, 5vw, 1.4rem); font-weight: 950; margin-bottom: auto; text-transform: uppercase; letter-spacing: -0.5px; color: #fff; line-height: 1.2; word-break: break-word; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

  @media (max-width: 480px) {
    border-width: 3px;
    min-height: 200px;
    padding: 15px;
    &:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #fff; }
  }
`;

const ActionWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .status-pill {
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
    &.public { background: #000; color: #fff; border: 2px solid #fff; }
    &.private { background: #fff; color: #000; border: 2px solid #fff; }
  }
`;

const pulse = keyframes`0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; }`;

const StatusBadge = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0px 12px;
  height: 28px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-family: 'JetBrains Mono', monospace;
  background: ${props => props.$isActive ? 'rgba(255, 0, 51, 0.05)' : 'rgba(0, 255, 65, 0.05)'};
  color: ${props => props.$isActive ? '#ff0033' : '#00ff41'};
  border: 1px solid ${props => props.$isActive ? 'rgba(255, 0, 51, 0.3)' : 'rgba(0, 255, 65, 0.3)'};

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    background: ${props => props.$isActive ? 'rgba(255, 0, 51, 0.1)' : 'rgba(0, 255, 65, 0.1)'};
    border-color: ${props => props.$isActive ? '#ff0033' : '#00ff41'};
    box-shadow: 0 10px 20px rgba(0,0,0,0.4);
  }
  &:disabled { opacity: 1; cursor: not-allowed; filter: grayscale(1); }
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$isActive ? '#ff0033' : '#00ff41'};
    box-shadow: 0 0 12px ${props => props.$isActive ? '#ff0033' : '#00ff41'};
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const MoreBtn = styled.button`
  background: #000;
  border: 2px solid #fff;
  color: #fff;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
  &:hover { background: #fff; color: #000; }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 40px;
  right: 0;
  background: #000;
  border: 4px solid #fff;
  box-shadow: 8px 8px 0 #fff;
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
  color: #fff;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.1s ease;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  &:hover { background: #fff; color: #000; }
  &.delete { color: #fff; &:hover { background: #fff; color: #000; } }
`;

const Divider = styled.div`height: 2px; background: #fff; margin: 6px 8px;`;

const SearchWrapper = styled.div`
  margin-bottom: 30px;
  .search-inner {
    display: flex;
    align-items: center;
    background: #000;
    border: 0.5px solid #fff;
    padding: 6px 18px;
    gap: 12px;
    .search-icon { color: #fff; }
    input {
      background: transparent;
      border: none;
      color: #fff;
      width: 100%;
      outline: none;
      font-size: 1rem;
      padding: 12px 0;
      font-family: 'Courier New', monospace;
      font-weight: 700;
      &::placeholder { color: #888; }
    }
    .clear-btn {
      background: #fff;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #888;
      transition: all 0.3s;
      &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); border-color: #fff; color: #fff; transform: rotate(90deg); }
      &:disabled { opacity: 0.3; cursor: not-allowed; }
    }
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: #000;
  border: 4px solid #fff;
  width: 100%;
  max-width: 450px;
  padding: 32px;
  position: relative;
  box-shadow: 12px 12px 0 #fff;
  color: #fff;

  .warning-icon { margin-bottom: 20px; display: flex; justify-content: center; color: #fff; }
  h3 { font-size: 1.5rem; margin-bottom: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; color: #fff; }
  p { color: #ccc; line-height: 1.6; margin-bottom: 30px; strong { color: #fff; font-weight: 900; } }

  .modal-actions {
    display: flex;
    gap: 12px;
    button { flex: 1; padding: 14px; font-weight: 900; cursor: pointer; transition: all 0.1s; border: 2px solid #fff; text-transform: uppercase; font-family: 'Courier New', monospace; }
    .cancel-btn { background: #000; color: #fff; &:hover { background: #fff; color: #000; } }
    .confirm-btn { background: #fff; color: #000; &:hover { transform: translate(-2px, -2px); box-shadow: 4px 4px 0 #fff; } }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #fff;
    padding-bottom: 15px;
    button { background: none; border: none; color: #fff; cursor: pointer; &:hover { transform: scale(1.1); } }
  }

  .loading-center { display: flex; justify-content: center; padding: 40px; }
  .no-data { text-align: center; color: #888; padding: 20px; font-weight: 700; text-transform: uppercase; }

  @media (max-width: 400px) {
    max-width: 95vw;
    padding: 16px;
    border: 3px solid #fff;
    box-shadow: 6px 6px 0 #fff;
    h3 { font-size: 1.1rem; margin-bottom: 10px; letter-spacing: 0px; }
    p { font-size: 0.85rem; margin-bottom: 20px; }
    .modal-actions { gap: 8px; flex-wrap: wrap; button { padding: 10px 12px; font-size: 0.7rem; } }
    .modal-header { margin-bottom: 14px; padding-bottom: 10px; }
    .loading-center { padding: 24px; }
  }
`;

const ResultTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;

  th, td {
    text-align: left;
    padding: 10px 12px;
    border: 2px solid #fff;
    white-space: nowrap;
  }

  th {
    font-size: 0.75rem;
    font-weight: 900;
    text-transform: uppercase;
    background: #fff;
    color: #000;
  }

  td { color: #fff; font-size: 0.85rem; }

  .score-cell { font-weight: 900; font-size: 1.1rem; }

  @media (max-width: 450px) {
    th, td { padding: 6px 4px; font-size: 0.7rem; }
    th { font-size: 0.65rem; }
    .score-cell { font-size: 0.9rem; }
  }
`;

const DownloadBtn = styled.button`
  background: #000;
  border: 2px solid #fff;
  color: #fff;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: #fff; color: #000; }
`;

const DeleteResultsBtn = styled.button`
  background: transparent;
  border: 2px solid #ff4d4f;
  color: #ff4d4f;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: #ff4d4f; color: #fff; }
`;

const WhatsAppBtn = styled.button`
  width: 100%;
  background: #fff;
  color: #000;
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
  &:hover { transform: translate(-2px, -2px); box-shadow: 4px 4px 0 #fff; }
`;

const CreateBtn = styled.button`
  background: #fff;
  color: #000;
  border: 2px solid #fff;
  padding: 12px 24px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.1s;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  &:hover:not(:disabled) { transform: translate(-2px, -2px); box-shadow: 4px 4px 0 #fff; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  font-weight: 900;
  text-transform: uppercase;
  color: #fff;
  .spinner { animation: spin 1s linear infinite; }
`;

const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 15px;

  .data-item {
    font-size: 0.75rem;
    font-weight: 900;
    background: #000;
    border: 2px solid #fff;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    text-transform: uppercase;
    color: #fff;
    width: 100%;
    height: 50px;
    box-sizing: border-box;
    flex-direction: row;
    text-align: center;
    flex-wrap: wrap;
  }

  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const SeeQuestionBtn = styled.button`
  width: 100%;
  background: #000;
  color: #fff;
  padding: 12px;
  border: 2px solid #fff;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.1s;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  &:hover { background: #fff; color: #000; }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #000;
  border: 4px dashed #fff;
  color: #fff;
  gap: 20px;
  text-align: center;
  margin-top: 20px;
  p { font-size: 1rem; font-weight: 900; text-transform: uppercase; }
`;

const EditLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 60px;
  @media (max-width: 400px) { gap: 20px; padding: 0 12px 40px; }
`;

const ConfigCard = styled.div`
  background: #000;
  border: 4px solid #fff;
  padding: 32px;
  box-shadow: 8px 8px 0 #fff;

  h3 { font-size: 1.1rem; font-weight: 900; margin-bottom: 24px; text-transform: uppercase; letter-spacing: -1px; border-bottom: 2px solid #fff; padding-bottom: 10px; color: #fff; }

  .form-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
    @media (max-width: 768px) { grid-template-columns: 1fr; }
    @media (max-width: 400px) { gap: 16px; }

    .field {
      display: flex;
      flex-direction: column;
      gap: 10px;
      label { font-size: 0.85rem; font-weight: 900; text-transform: uppercase; color: #fff; }
      input, select {
        background: #000;
        border: 2px solid #fff;
        padding: 14px 18px;
        color: #fff;
        font-size: 1rem;
        font-family: 'Courier New', monospace;
        font-weight: 700;
        @media (max-width: 400px) { padding: 10px 8px; font-size: 0.85rem; }
        &:focus { outline: none; box-shadow: 4px 4px 0 #fff; }
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
  border-bottom: 4px solid #fff;
  margin-bottom: 30px;

  .left { display: flex; align-items: center; gap: 20px; }
  .edit-title { font-size: 1.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: -2px; color: #fff; }
  .action-btns { display: flex; gap: 12px; }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    .action-btns { width: 100%; justify-content: space-between; }
  }

  @media (max-width: 400px) {
    padding: 12px 10px;
    gap: 8px;
    margin-bottom: 16px;
    flex-direction: column;
    .left { gap: 10px; width: 100%; flex-direction: column-reverse; }
    .edit-title { font-size: 1rem; letter-spacing: 0px; word-break: break-word; }
    .action-btns { width: 100%; gap: 6px; flex-wrap: wrap; }
  }
`;

const SaveBtn = styled(motion.button)`
  background: #fff;
  color: #000;
  border: 2px solid #fff;
  padding: 14px 28px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  &:hover:not(:disabled) { transform: translate(-2px, -2px); box-shadow: 4px 4px 0 #fff; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  @media (max-width: 400px) { padding: 10px 12px; font-size: 0.7rem; gap: 6px; &:hover:not(:disabled) { transform: none; box-shadow: none; } }
`;

const AddQuestionBtn = styled.button`
  background: #000;
  border: 2px dashed #fff;
  color: #fff;
  padding: 14px 28px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  &:hover { background: #fff; color: #000; border-style: solid; }
  @media (max-width: 400px) { padding: 10px 12px; font-size: 0.7rem; gap: 6px; }
`;

const BackButton = styled.button`
  background: #000;
  border: 2px solid #fff;
  color: #fff;
  padding: 10px 20px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: 0.1s;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  &:hover { background: #fff; color: #000; }
  @media (max-width: 400px) { padding: 8px 12px; font-size: 0.7rem; gap: 4px; }
`;

const DeleteSmallBtn = styled.button`
  background: #000;
  border: 2px solid #fff;
  color: #fff;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.1s;
  &:hover { background: #fff; color: #000; transform: rotate(90deg); }
  @media (max-width: 400px) { width: 28px; height: 28px; font-size: 0.8rem; }
`;

const QuestionsContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 0;
  .preview-header { font-size: 2rem; font-weight: 900; margin-bottom: 24px; text-transform: uppercase; letter-spacing: -2px; border-bottom: 4px solid #fff; padding-bottom: 15px; color: #fff; }
`;

const QuestionPreviewCard = styled.div`
  background: #000;
  border: 4px solid #fff;
  padding: 28px;
  margin-bottom: 20px;
  box-shadow: 6px 6px 0 #fff;

  .q-label { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; background: #fff; color: #000; width: fit-content; padding: 6px 12px; }
  .q-text { font-size: 1.2rem; font-weight: 700; line-height: 1.6; margin-bottom: 24px; color: #fff; }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    @media (max-width: 768px) { grid-template-columns: 1fr; }

    span {
      display: flex;
      align-items: center;
      padding: 14px 18px;
      background: #000;
      border: 2px solid #fff;
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      &.correct { background: #fff; color: #000; font-weight: 900; }
    }
  }
`;

const QuestionEditBox = styled.div`
  background: #000;
  border: 4px solid #fff;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 6px 6px 0 #fff;

  .q-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 15px; font-weight: 900; text-transform: uppercase; color: #fff; }

  .correct-select {
    display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 900;
    select { background: #000; color: #fff; border: 2px solid #fff; padding: 4px 8px; font-weight: 900; font-family: 'Courier New', monospace; &:focus { outline: none; } }
  }

  .q-input {
    width: 100%; background: #000; border: 2px solid #fff; padding: 12px; color: #fff; margin-bottom: 15px; font-family: 'Courier New', monospace; font-size: 0.95rem; font-weight: 700; min-height: 80px; resize: vertical;
    &:focus { outline: none; box-shadow: 4px 4px 0 #fff; }
    &::placeholder { color: #888; }
  }

  .options-grid-edit {
    display: grid; grid-template-columns: 1fr; gap: 10px;
    @media (min-width: 640px) { grid-template-columns: 1fr 1fr; }

    .opt-field {
      display: flex; align-items: center; gap: 10px; background: #000; border: 2px solid #fff; padding: 10px;
      .opt-label { font-weight: 900; font-size: 0.9rem; min-width: 20px; color: #fff; }
      input { background: none; border: none; color: #fff; width: 100%; outline: none; font-size: 0.9rem; font-family: 'Courier New', monospace; font-weight: 700; &::placeholder { color: #888; } }
      &:focus-within { box-shadow: 4px 4px 0 #fff; }
    }
  }

  @media (max-width: 400px) {
    padding: 12px;
    border: 3px solid #fff;
    box-shadow: 4px 4px 0 #fff;
    margin-bottom: 12px;
    .q-top { flex-direction: column; align-items: flex-start; gap: 8px; margin-bottom: 12px; font-size: 0.85rem; }
    .correct-select { width: 100%; gap: 6px; font-size: 0.8rem; select { padding: 4px 6px; font-size: 0.8rem; } }
    .q-input { padding: 10px 8px; font-size: 0.85rem; min-height: 70px; margin-bottom: 12px; }
    .options-grid-edit {
      gap: 8px;
      .opt-field { gap: 6px; padding: 8px; flex-direction: column; align-items: flex-start; .opt-label { font-size: 0.78rem; } input { font-size: 0.8rem; } }
    }
  }
`;

export default UserDashboard;