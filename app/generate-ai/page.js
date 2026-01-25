"use client";
import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Sparkles, Zap, Layers, Globe, Cpu, Loader2, CheckCircle2 } from 'lucide-react';

const AIGenerator = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    
    const [formData, setFormData] = useState({
        topic: '',
        count: 10,
        difficulty: 'moderate',
        language: 'english'
    });

    const handleGenerate = async () => {
        if (!formData.topic) return;
        setIsLoading(true);

        try {
            const response = await fetch('https://noneditorial-professionally-serena.ngrok-free.dev/Generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            // Log the array to the console as requested
            console.log("Quiz Data Array Received:", data);
            
            setQuizData(data);
            setIsLoading(false);

        } catch (error) {
            console.error("Detailed Error:", error);
            setIsLoading(false);
            alert(`Failed: ${error.message}`);
        }
    };

    return (
        <PageContainer>
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            
            {!quizData ? (
                <GlassCard>
                    <Header>
                        <div className="icon-badge"><Cpu size={24} /></div>
                        <div>
                            <h2>AI Quiz Architect</h2>
                            <p>Define parameters. Generate intelligence.</p>
                        </div>
                    </Header>

                    <FormGrid>
                        <InputGroup>
                            <label><Sparkles size={14} /> Topic</label>
                            <input 
                                type="text" 
                                placeholder="Quantum Mechanics, Economics..." 
                                value={formData.topic}
                                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                            />
                        </InputGroup>

                        <InputGroup>
                            <label><Zap size={14} /> Difficulty</label>
                            <div className="pill-container">
                                {['easy', 'moderate', 'hard'].map((level) => (
                                    <Pill 
                                        key={level}
                                        $active={formData.difficulty === level}
                                        onClick={() => setFormData({...formData, difficulty: level})}
                                    >
                                        {level}
                                    </Pill>
                                ))}
                            </div>
                        </InputGroup>

                      

                        <InputGroup>
                            <label><Globe size={14} /> Language</label>
                            <div className="pill-container">
                                {['english', 'hindi', 'marathi'].map((lang) => (
                                    <Pill 
                                        key={lang}
                                        $active={formData.language === lang}
                                        onClick={() => setFormData({...formData, language: lang})}
                                    >
                                        {lang}
                                    </Pill>
                                ))}
                            </div>
                        </InputGroup>

                        <PrimaryButton onClick={handleGenerate} disabled={isLoading || !formData.topic}>
                            {isLoading ? (
                                <><Loader2 size={20} className="spinner" /> Synthesizing...</>
                            ) : "Generate Quiz"}
                        </PrimaryButton>
                    </FormGrid>
                </GlassCard>
            ) : (
                <ResultContainer>
                    <ResultHeader>
                        <div className="title-area">
                            <div className="success-badge"><CheckCircle2 size={20} /> Ready</div>
                            <h2>Generation Complete</h2>
                            <p>{quizData.length} modules synthesized for "{formData.topic}"</p>
                        </div>
                        <button className="reset-btn" onClick={() => setQuizData(null)}>New Blueprint</button>
                    </ResultHeader>
                    
                    <QuestionGrid>
                        {quizData.map((q, idx) => (
                            <QuestionCard key={idx} style={{ animationDelay: `${idx * 0.1}s` }}>
                                <div className="q-num">Module {q.qno}</div>
                                <h3>{q.question}</h3>
                                <div className="options-list">
                                    {[q.opt1, q.opt2, q.opt3, q.opt4].map((opt, i) => (
                                        <div key={i} className={`opt ${opt === q.correctOpt ? 'correct' : ''}`}>
                                            <span className="bullet" /> {opt}
                                        </div>
                                    ))}
                                </div>
                            </QuestionCard>
                        ))}
                    </QuestionGrid>
                </ResultContainer>
            )}
        </PageContainer>
    );
};

// --- Modern Animations ---

const float = keyframes`
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(30px, -50px); }
    66% { transform: translate(-20px, 20px); }
`;

const spin = keyframes` from { transform: rotate(0deg); } to { transform: rotate(360deg); } `;

const springUp = keyframes`
    from { opacity: 0; transform: translateY(40px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
`;

// --- Styled Components ---

const PageContainer = styled.div`
    min-height: 100vh;
    padding: 40px 16px;
    display: flex;
    justify-content: center;
    color: #e2e2e2;
    font-family: 'Inter', system-ui, sans-serif;
    overflow-x: hidden;
    position: relative;

    .orb {
        position: fixed;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        filter: blur(80px);
        z-index: 0;
        opacity: 0.15;
        animation: ${float} 20s infinite linear;
    }
    .orb-1 { background: #9b59b6; top: -100px; left: -100px; }
    .orb-2 { background: #2d8cf0; bottom: -100px; right: -100px; }

    @media (max-width: 768px) {
        padding: 20px 12px;
    }
`;

const GlassCard = styled.div`
    width: 100%;
    max-width: 480px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 32px;
    padding: 32px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
    animation: ${springUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    height: fit-content;
    z-index: 1;

    @media (max-width: 480px) {
        padding: 24px 20px;
        border-radius: 24px;
    }
`;

const Header = styled.div`
    display: flex;
    gap: 16px;
    margin-bottom: 32px;
    .icon-badge {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        background: rgba(155, 89, 182, 0.15);
        border: 1px solid rgba(155, 89, 182, 0.3);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #bf81da;
    }
    h2 { margin: 0; font-size: 1.4rem; font-weight: 700; color: #fff; }
    p { margin: 4px 0 0; color: #888; font-size: 0.85rem; }
`;

const FormGrid = styled.div` display: flex; flex-direction: column; gap: 24px; `;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    label { color: #aaa; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    input { 
        background: rgba(0, 0, 0, 0.4); 
        border: 1px solid rgba(255, 255, 255, 0.1); 
        border-radius: 12px; 
        padding: 14px; 
        color: #fff; 
        font-size: 1rem;
        width: 100%;
        &:focus { outline: none; border-color: #9b59b6; background: rgba(0, 0, 0, 0.6); }
    }
    .pill-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px; }
`;

const Pill = styled.button`
    padding: 10px 4px; 
    border-radius: 10px; 
    cursor: pointer; 
    font-size: 0.85rem; 
    font-weight: 500;
    transition: all 0.3s;
    background: ${props => props.$active ? 'rgba(155, 89, 182, 0.25)' : 'rgba(255, 255, 255, 0.03)'};
    border: 1px solid ${props => props.$active ? '#9b59b6' : 'rgba(255, 255, 255, 0.08)'};
    color: ${props => props.$active ? '#fff' : '#777'};
    text-transform: capitalize;
`;

const PrimaryButton = styled.button`
    background: linear-gradient(135deg, #6366f1 0%, #9b59b6 100%);
    color: white; border: none; padding: 16px; border-radius: 14px; 
    font-size: 1rem; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    margin-top: 8px;
    &:disabled { opacity: 0.5; }
    .spinner { animation: ${spin} 1s linear infinite; }
`;

const ResultContainer = styled.div`
    width: 100%; max-width: 1100px; z-index: 1; 
`;

const ResultHeader = styled.div`
    display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; gap: 20px;
    @media (max-width: 768px) { 
        flex-direction: column; align-items: flex-start; 
        .reset-btn { width: 100%; }
    }
    
    .success-badge { 
        background: rgba(46, 204, 113, 0.1); color: #2ecc71; padding: 6px 14px; 
        border-radius: 100px; font-size: 0.7rem; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;
    }
    h2 { margin: 12px 0 0; font-size: 1.8rem; font-weight: 800; }
    p { color: #888; margin: 4px 0 0; font-size: 1rem; }
    
    .reset-btn { 
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); 
        color: #fff; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600;
    }
`;

const QuestionGrid = styled.div`
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); 
    gap: 20px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const QuestionCard = styled.div`
    background: rgba(20, 20, 20, 0.4);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 24px; border-radius: 20px;
    opacity: 0;
    animation: ${springUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;

    .q-num { color: #9b59b6; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; }
    h3 { font-size: 1.15rem; margin-bottom: 20px; line-height: 1.4; color: #fff; }
    .options-list { display: flex; flex-direction: column; gap: 10px; }
    .opt { 
        padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
        font-size: 0.9rem; color: #999; display: flex; align-items: center; gap: 10px;
        &.correct { border-color: #2ecc71; color: #2ecc71; background: rgba(46, 204, 113, 0.05); }
    }
    .bullet { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
`;

export default AIGenerator;