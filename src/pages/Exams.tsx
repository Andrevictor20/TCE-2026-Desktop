import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../stores/examStore';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Exams() {
  const navigate = useNavigate();
  const { history, fetchHistory, startExam } = useExamStore();
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  useEffect(() => {
    fetchHistory();
    import('../lib/db').then(({ query }) => {
      query<{ c: number }>('SELECT COUNT(*) as c FROM questions WHERE archived = 0')
        .then(res => setQuestionCount(res[0].c));
    });
  }, []);

  const handleStartFull = async () => {
    if (confirm('Iniciar um Simulado Completo? Você terá 5 horas para 100 questões (40 CG, 60 CE).')) {
      setLoading(true);
      const examId = await startExam('full', 300, 100);
      setLoading(false);
      if (examId) navigate(`/exams/${examId}`);
      else alert('Erro ao criar simulado. Adicione mais questões ao banco primeiro.');
    }
  };

  const handleStartQuick = async () => {
    const qCount = prompt('Quantas questões deseja resolver?', '20');
    if (qCount && !isNaN(Number(qCount))) {
      setLoading(true);
      const examId = await startExam('quick', Number(qCount) * 3, Number(qCount)); // 3 mins per question avg
      setLoading(false);
      if (examId) navigate(`/exams/${examId}`);
      else alert('Erro ao criar simulado.');
    }
  };

  return (
    <div id="exams-page">
      <div className="section-header">
        <h1 className="section-title">Simulados</h1>
        <div className="flex gap-sm">
          {loading && <span className="text-sm text-muted">Gerando prova...</span>}
        </div>
      </div>

      {questionCount === 0 && (
        <div className="alert alert--warning mb-lg">
          <strong>Atenção:</strong> Você ainda não tem questões cadastradas. Vá para o Banco de Questões para importar ou cadastrar antes de iniciar um simulado.
          <br/><button className="btn btn--sm mt-sm" onClick={() => navigate('/questions/import')}>Importar Questões</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        <div className={`card ${questionCount === 0 ? '' : 'card--clickable'}`} style={{ opacity: questionCount === 0 ? 0.5 : 1 }} onClick={() => questionCount !== 0 && handleStartFull()}>
          <div className="card__title" style={{ fontSize: 'var(--font-size-md)' }}>📝 Prova Completa</div>
          <div className="card__subtitle">
            100 questões • 5 horas • 160 pts
          </div>
          <div className="text-xs text-muted" style={{ marginTop: 'var(--space-sm)' }}>
            Simulação real da prova objetiva (Cargo 15)
          </div>
        </div>

        <div className={`card ${questionCount === 0 ? '' : 'card--clickable'}`} style={{ opacity: questionCount === 0 ? 0.5 : 1 }} onClick={() => questionCount !== 0 && handleStartQuick()}>
          <div className="card__title" style={{ fontSize: 'var(--font-size-md)' }}>⚡ Simulado Rápido</div>
          <div className="card__subtitle">
            Escolha o nº de questões
          </div>
          <div className="text-xs text-muted" style={{ marginTop: 'var(--space-sm)' }}>
            Questões aleatórias (3 min/questão)
          </div>
        </div>

        <div className="card" style={{ opacity: 0.6 }}>
          <div className="card__title" style={{ fontSize: 'var(--font-size-md)' }}>✍️ Prova Discursiva</div>
          <div className="card__subtitle">
            Em breve
          </div>
          <div className="text-xs text-muted" style={{ marginTop: 'var(--space-sm)' }}>
            Editor com contador de linhas e cronômetro
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Histórico de Simulados</h2>
        </div>
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📊</div>
            <div className="empty-state__title">Nenhum simulado realizado</div>
            <div className="empty-state__desc">
              Seus resultados aparecerão aqui. A nota de corte alvo é 64,00 pontos (40%).
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Nota CG</th>
                  <th>Nota CE</th>
                  <th>Nota Total</th>
                  <th>Situação</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.map(exam => (
                  <tr key={exam.id}>
                    <td>
                      <div>{format(new Date(exam.started_at), 'dd/MM/yyyy HH:mm')}</div>
                      <div className="text-xs text-muted">{formatDistanceToNow(new Date(exam.started_at), { addSuffix: true, locale: ptBR })}</div>
                    </td>
                    <td>
                      <span className={`badge ${exam.exam_type === 'full' ? 'badge--review' : 'badge--studying'}`}>
                        {exam.exam_type === 'full' ? 'Completo' : 'Rápido'}
                      </span>
                    </td>
                    <td>{exam.score_cg} pts</td>
                    <td>{exam.score_ce} pts</td>
                    <td style={{ fontWeight: 600 }}>{exam.score_total} pts</td>
                    <td>
                      {exam.finished_at ? (
                        exam.is_eliminated === 1 ? (
                          <span className="text-error" style={{ color: 'var(--status-error)' }}>Eliminado (&lt; 64 pts)</span>
                        ) : (
                          <span className="text-success" style={{ color: 'var(--status-success)' }}>Classificado</span>
                        )
                      ) : (
                        <span className="text-warning" style={{ color: 'var(--status-warning)' }}>Em andamento</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn--sm btn--ghost"
                        onClick={() => navigate(exam.finished_at ? `/exams/${exam.id}/results` : `/exams/${exam.id}`)}
                      >
                        {exam.finished_at ? 'Resultados' : 'Continuar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
