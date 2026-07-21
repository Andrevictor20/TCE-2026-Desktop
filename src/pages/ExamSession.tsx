import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../stores/examStore';
import { differenceInSeconds } from 'date-fns';

export default function ExamSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeExam, activeQuestions, activeAnswers, activeDiscursiveAnswers, resumeExam, answerQuestion, answerDiscursive, finishExam } = useExamStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (id) {
      resumeExam(Number(id));
    }
  }, [id]);

  useEffect(() => {
    if (activeExam) {
      // Calculate remaining time
      const limit = activeExam.time_limit_minutes * 60;
      const elapsed = differenceInSeconds(new Date(), new Date(activeExam.started_at));
      const remaining = Math.max(0, limit - elapsed);
      setTimeLeft(remaining);

      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeExam]);

  // Keyboard navigation
  useEffect(() => {
    const isDiscursive = activeExam?.exam_type === 'discursive';
    const totalItems = isDiscursive ? activeDiscursiveAnswers.length : activeQuestions.length;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept arrows if typing in a textarea
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => Math.min(prev + 1, totalItems - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      } else if (!isDiscursive && ['a','b','c','d','e'].includes(e.key.toLowerCase())) {
        const q = activeQuestions[currentIndex];
        if (q) {
          answerQuestion(q.id, e.key.toUpperCase());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeQuestions, activeDiscursiveAnswers, activeExam]);

  const handleFinish = async () => {
    if (confirm('Finalizar simulado e enviar respostas?')) {
      const examId = await finishExam();
      if (examId) navigate(`/exams/${examId}/results`);
    }
  };

  const isDiscursive = activeExam?.exam_type === 'discursive';
  const totalItems = isDiscursive ? activeDiscursiveAnswers.length : activeQuestions.length;

  if (!activeExam || totalItems === 0) {
    return <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Carregando sessão...</div>;
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const question = isDiscursive ? null : activeQuestions[currentIndex];
  const currentAnswer = question ? activeAnswers[question.id] : null;
  const currentDiscursive = isDiscursive ? activeDiscursiveAnswers[currentIndex] : null;

  return (
    <div id="exam-session-page" style={{ height: 'calc(100vh - var(--topbar-height))', display: 'flex', flexDirection: 'column' }}>
      {/* Header fixo */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: 'var(--space-md) var(--space-lg)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-primary)'
      }}>
        <div className="flex gap-md items-center">
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/exams')}>
            ⏸️ Pausar
          </button>
          <div className="text-sm">
            Questão <strong>{currentIndex + 1}</strong> de <strong>{totalItems}</strong>
          </div>
        </div>
        <div style={{ 
          fontSize: 'var(--font-size-xl)', fontWeight: 700, fontFamily: 'monospace',
          color: timeLeft < 300 ? 'var(--status-error)' : 'var(--accent-cyan)'
        }}>
          {formatTime(timeLeft)}
        </div>
        <button className="btn btn--primary" onClick={handleFinish}>
          🏁 Entregar Simulado
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Painel Central (Questão) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2xl)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="flex justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
              <span className="badge badge--studying text-xs">
                {isDiscursive ? 
                  (currentDiscursive?.question_type === 'peca_tecnica' ? 'Peça Técnica' : `Questão Discursiva ${currentDiscursive?.question_index}`) 
                  : `Questão ${currentIndex + 1}`}
              </span>
            </div>

            <div style={{ fontSize: 'var(--font-size-lg)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 'var(--space-xl)' }}>
              {isDiscursive ? `[Enunciado da ${currentDiscursive?.question_type === 'peca_tecnica' ? 'Peça Técnica' : 'Questão Discursiva'} aparecerá aqui]` : question?.statement}
            </div>

            <div className="flex-col gap-sm">
              {isDiscursive && currentDiscursive ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <textarea 
                    value={currentDiscursive.content || ''}
                    onChange={(e) => {
                      const text = e.target.value;
                      const lines = text ? text.split('\\n').length : 0;
                      answerDiscursive(currentDiscursive.id, text, lines);
                    }}
                    style={{ 
                      width: '100%', minHeight: 300, padding: 'var(--space-md)', 
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', 
                      background: 'var(--bg-surface)', fontFamily: 'inherit', resize: 'vertical'
                    }}
                    placeholder="Digite sua resposta aqui..."
                  />
                  <div style={{ 
                    textAlign: 'right', fontSize: 'var(--font-size-sm)', 
                    color: currentDiscursive.line_count > currentDiscursive.max_lines ? 'var(--status-error)' : 'var(--text-secondary)' 
                  }}>
                    Linhas: {currentDiscursive.line_count} / {currentDiscursive.max_lines}
                  </div>
                </div>
              ) : (
                ['A', 'B', 'C', 'D', 'E'].map(letter => {
                  const text = (question as any)[`alt_${letter.toLowerCase()}`];
                  if (!text) return null;
                  const isSelected = currentAnswer === letter;
                  
                  return (
                    <div 
                      key={letter}
                      onClick={() => answerQuestion(question!.id, letter)}
                      style={{
                        padding: 'var(--space-md)',
                        background: isSelected ? 'var(--accent-primary-bg)' : 'var(--bg-surface)',
                        border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 'var(--space-md)',
                        transition: 'all 0.1s'
                      }}
                    >
                      <div style={{ 
                        width: 24, height: 24, borderRadius: 12, border: '1px solid',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                        background: isSelected ? 'var(--accent-primary)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: 12, flexShrink: 0
                      }}>
                        {letter}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-md)' }}>
                        {text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-between" style={{ marginTop: 'var(--space-xl)' }}>
              <button 
                className="btn btn--secondary" 
                onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
                disabled={currentIndex === 0}
              >
                ← Anterior
              </button>
              <button 
                className="btn btn--secondary"
                onClick={() => setCurrentIndex(prev => Math.min(prev + 1, totalItems - 1))}
                disabled={currentIndex === totalItems - 1}
              >
                Próxima →
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Direita (Gabarito / Navegação) */}
        <div style={{ 
          width: 300, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-primary)',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-primary)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
            Navegação
          </div>
          <div style={{ padding: 'var(--space-md)', overflowY: 'auto', flex: 1 }}>
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-sm)'
            }}>
              {isDiscursive ? activeDiscursiveAnswers.map((ans, idx) => {
                const hasAnswer = ans.content && ans.content.trim().length > 0;
                const isActive = idx === currentIndex;
                
                return (
                  <button
                    key={ans.id}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 'var(--radius-sm)',
                      background: hasAnswer ? (isActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)') : (isActive ? 'var(--bg-tertiary)' : 'transparent'),
                      border: `1px solid ${isActive ? 'var(--accent-primary)' : (hasAnswer ? 'var(--border-secondary)' : 'var(--border-primary)')}`,
                      color: isActive ? (hasAnswer ? 'white' : 'var(--text-primary)') : 'var(--text-secondary)',
                      fontSize: 'var(--font-size-xs)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2
                    }}
                  >
                    {idx + 1}
                    {hasAnswer && <span style={{ fontSize: 9, fontWeight: 700 }}>✓</span>}
                  </button>
                );
              }) : activeQuestions.map((q, idx) => {
                const ans = activeAnswers[q.id];
                const isActive = idx === currentIndex;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 'var(--radius-sm)',
                      background: ans ? (isActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)') : (isActive ? 'var(--bg-tertiary)' : 'transparent'),
                      border: `1px solid ${isActive ? 'var(--accent-primary)' : (ans ? 'var(--border-secondary)' : 'var(--border-primary)')}`,
                      color: isActive ? (ans ? 'white' : 'var(--text-primary)') : 'var(--text-secondary)',
                      fontSize: 'var(--font-size-xs)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2
                    }}
                  >
                    {idx + 1}
                    {ans && <span style={{ fontSize: 9, fontWeight: 700 }}>{ans}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
