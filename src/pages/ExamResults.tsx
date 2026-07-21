import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore, Exam, ExamAnswer, DiscursiveAnswer } from '../stores/examStore';
import { Question } from '../stores/questionStore';

export default function ExamResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getExamResults } = useExamStore();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<(ExamAnswer & { question: Question })[]>([]);
  const [discursiveAnswers, setDiscursiveAnswers] = useState<DiscursiveAnswer[]>([]);

  useEffect(() => {
    if (id) {
      getExamResults(Number(id)).then(res => {
        if (res) {
          setExam(res.exam);
          setAnswers(res.answers);
          if (res.discursiveAnswers) setDiscursiveAnswers(res.discursiveAnswers);
        }
      });
    }
  }, [id]);

  if (!exam) return <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Carregando resultados...</div>;

  const totalCorrect = answers.filter(a => a.is_correct === 1).length;
  const totalWrong = answers.filter(a => a.is_correct === 0 && a.selected_answer).length;
  const totalBlank = answers.filter(a => !a.selected_answer).length;

  return (
    <div id="exam-results-page">
      <div className="section-header">
        <div>
          <button className="btn btn--ghost btn--sm" style={{ paddingLeft: 0 }} onClick={() => navigate('/exams')}>
            ← Voltar para Simulados
          </button>
          <h1 className="section-title" style={{ marginTop: 'var(--space-xs)' }}>Resultado do Simulado</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        
        {/* Placar Final */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Placar Final</h2>
          </div>
          <div style={{ textAlign: 'center', margin: 'var(--space-xl) 0' }}>
            <div style={{ 
              fontSize: '4rem', fontWeight: 800, lineHeight: 1,
              color: exam.is_eliminated ? 'var(--status-error)' : 'var(--status-success)' 
            }}>
              {exam.score_total}
            </div>
            <div className="text-muted" style={{ marginTop: 'var(--space-xs)', textTransform: 'uppercase', letterSpacing: 1, fontSize: 'var(--font-size-sm)' }}>
              Pontos Totais
            </div>
          </div>

          {exam.exam_type === 'full' && (
            <div className={`alert ${exam.is_eliminated ? 'alert--warning' : 'alert--success'}`} style={{ marginBottom: 'var(--space-lg)' }}>
              {exam.is_eliminated 
                ? 'Eliminado: A nota de corte mínima é 64,00 pontos.' 
                : 'Classificado! Você atingiu a nota mínima (64,00 pts).'}
            </div>
          )}

          <div className="flex-col gap-sm">
            <div className="flex justify-between items-center padding-sm" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 8 }}>
              <span className="text-muted">Conhecimentos Gerais (Peso 1)</span>
              <span className="font-bold">{exam.score_cg} pts</span>
            </div>
            <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 8 }}>
              <span className="text-muted">Conhecimentos Espec. (Peso 2)</span>
              <span className="font-bold">{exam.score_ce} pts</span>
            </div>
          </div>
        </div>

        {/* Estatísticas e Questões Erradas */}
        {exam.exam_type === 'discursive' ? (
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Textos Produzidos</h2>
            </div>
            <div className="flex-col gap-md padding-md" style={{ padding: 'var(--space-lg)' }}>
              {discursiveAnswers.map(da => (
                <div key={da.id} style={{ 
                  border: '1px solid var(--border-primary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' 
                }}>
                  <div className="font-bold" style={{ marginBottom: 'var(--space-sm)' }}>
                    {da.question_type === 'peca_tecnica' ? 'Peça Técnica' : `Questão Discursiva ${da.question_index}`}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', background: 'var(--bg-surface)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
                    {da.content || 'Nenhuma resposta inserida.'}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: 'var(--space-sm)', textAlign: 'right' }}>
                    Linhas utilizadas: {da.line_count} / {da.max_lines}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Desempenho</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
              <div style={{ padding: 'var(--space-md)', background: 'var(--status-success-bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: 'var(--status-success)', fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{totalCorrect}</div>
                <div style={{ color: 'var(--status-success)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase' }}>Acertos</div>
              </div>
              <div style={{ padding: 'var(--space-md)', background: 'var(--status-error-bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: 'var(--status-error)', fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{totalWrong}</div>
                <div style={{ color: 'var(--status-error)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase' }}>Erros</div>
              </div>
              <div style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{totalBlank}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase' }}>Em Branco</div>
              </div>
            </div>

            <h3 className="text-sm font-bold" style={{ marginBottom: 'var(--space-md)' }}>Resumo das Questões Erradas/Branco</h3>
            <div className="flex-col gap-md">
              {answers.filter(a => a.is_correct !== 1).map(ans => (
                <div key={ans.id} style={{ 
                  border: '1px solid var(--border-primary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)'
                }}>
                  <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-sm)' }}>
                    <span className="badge badge--not-started">{ans.question.topic_title || 'Sem tópico'}</span>
                    <span style={{ color: ans.is_correct === 0 ? 'var(--status-error)' : 'var(--text-muted)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                      {ans.is_correct === 0 ? `Marcou: ${ans.selected_answer}` : 'Em Branco'}
                    </span>
                  </div>
                  <div className="text-sm" style={{ marginBottom: 'var(--space-sm)' }}>
                    {ans.question.statement.length > 150 ? ans.question.statement.substring(0, 150) + '...' : ans.question.statement}
                  </div>
                  <div className="text-sm" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                    Gabarito Correto: <strong>{ans.question.correct_answer}</strong>
                  </div>
                </div>
              ))}
              {totalWrong === 0 && totalBlank === 0 && (
                <div className="text-muted text-sm text-center">Gabaritou! Nenhuma questão para revisar.</div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
