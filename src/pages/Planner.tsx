import { useEffect, useState } from 'react';
import { usePlannerStore } from '../stores/plannerStore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Planner() {
  const [activeTab, setActiveTab] = useState<'hoje' | 'semana' | 'calendario' | 'aderencia'>('hoje');
  const { todaySession, loading, fetchTodaySession, generatePlan, completeBlock, weeklyPlan, fetchWeeklyPlan, adherenceData, fetchAdherence } = usePlannerStore();
  const [quality, setQuality] = useState<number>(3); 

  useEffect(() => {
    fetchTodaySession();
    fetchWeeklyPlan();
    fetchAdherence();
  }, []);

  const renderHoje = () => {
    if (loading) return <div className="text-muted">Carregando planner...</div>;

    if (!todaySession) {
      return (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">📅</div>
            <div className="empty-state__title">Planner não configurado</div>
            <div className="empty-state__desc">Não há sessão gerada para hoje. Clique no botão abaixo para gerar o plano da semana.</div>
            <button className="btn btn--primary" style={{ marginTop: 'var(--space-md)' }} onClick={generatePlan}>
              Gerar Plano
            </button>
          </div>
        </div>
      );
    }

    if (todaySession.status === 'skipped') {
      return (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">🛋️</div>
            <div className="empty-state__title">Dia de Descanso</div>
            <div className="empty-state__desc">De acordo com seu perfil de disponibilidade, hoje é dia de descanso.</div>
          </div>
        </div>
      );
    }

    const completedHours = todaySession.actual_hours;
    const progressPercent = Math.min(100, Math.round((completedHours / todaySession.planned_hours) * 100));

    return (
      <div className="flex-col gap-lg">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">
              Sessão de Hoje
              <span className="text-sm text-muted" style={{ marginLeft: 'var(--space-sm)' }}>
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
            </h2>
            <span className="text-sm text-muted">{completedHours.toFixed(1)}h / {todaySession.planned_hours.toFixed(1)}h</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill progress-bar__fill--success" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="checklist">
          {todaySession.blocks.map(block => (
            <div key={block.id} className={`checklist-item ${block.status === 'completed' ? 'checklist-item--completed' : ''}`}>
              <div 
                className={`checklist-item__check ${block.status === 'completed' ? 'checklist-item__check--done' : ''}`}
                onClick={() => { if (block.status !== 'completed') completeBlock(block.id, block.duration_minutes, quality); }}
              >
                {block.status === 'completed' && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
              </div>
              <div className="checklist-item__content">
                <div className="flex items-center gap-sm" style={{ marginBottom: 4 }}>
                  <span className={`checklist-item__type checklist-item__type--${block.block_type}`}>
                    {block.block_type === 'theory' ? 'Teoria' : block.block_type === 'practice' ? 'Prática' : block.block_type === 'spaced_review' ? 'Revisão' : block.block_type}
                  </span>
                  {block.status !== 'completed' && block.block_type === 'spaced_review' && (
                    <select 
                      className="form-input form-select" 
                      style={{ padding: '2px 24px 2px 8px', fontSize: 12, height: 'auto', width: 'auto' }}
                      value={quality}
                      onChange={e => setQuality(Number(e.target.value))}
                    >
                      <option value="5">Perfeito (Fácil)</option>
                      <option value="4">Bom (Hesitei)</option>
                      <option value="3">Suficiente (Difícil)</option>
                      <option value="2">Ruim (Lembrei com ajuda)</option>
                      <option value="1">Falha (Não lembrei)</option>
                    </select>
                  )}
                </div>
                <div className="checklist-item__title">{block.topic_title || 'Tópico Geral'}</div>
              </div>
              <div className="checklist-item__duration">{block.duration_minutes} min</div>
            </div>
          ))}
          {todaySession.blocks.length === 0 && (
            <div className="text-muted text-sm" style={{ textAlign: 'center', padding: 'var(--space-md)' }}>Nenhum bloco planejado para hoje.</div>
          )}
        </div>
      </div>
    );
  };

  const renderSemana = () => {
    return (
      <div className="flex-col gap-md">
        <div className="flex justify-between items-center mb-sm">
          <h2 className="font-bold text-lg">Plano da Semana</h2>
          <button className="btn btn--secondary btn--sm" onClick={generatePlan}>
            Recalcular semana
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--space-sm)' }}>
          {weeklyPlan.map(session => (
            <div key={session.id} className="card" style={{ padding: 'var(--space-sm)', minHeight: 300 }}>
              <div className="font-bold text-center text-sm" style={{ marginBottom: 'var(--space-sm)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-xs)' }}>
                {format(parseISO(session.session_date), 'EEE, dd/MM', { locale: ptBR })}
              </div>
              {session.status === 'skipped' ? (
                <div className="text-xs text-muted text-center" style={{ marginTop: 'var(--space-md)' }}>Descanso</div>
              ) : (
                <div className="flex-col gap-xs">
                  {session.blocks.map(b => (
                    <div key={b.id} style={{ 
                      fontSize: 10, padding: 4, borderRadius: 4, 
                      background: b.status === 'completed' ? 'var(--status-success-bg)' : 'var(--bg-tertiary)',
                      color: b.status === 'completed' ? 'var(--status-success)' : 'var(--text-primary)',
                      borderLeft: `2px solid var(--accent-primary)`,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }} title={b.topic_title}>
                      {b.topic_title || b.block_type}
                    </div>
                  ))}
                  <div className="text-xs font-bold text-center mt-sm">
                    {session.actual_hours.toFixed(1)}h / {session.planned_hours.toFixed(1)}h
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendario = () => {
    return (
      <div className="card">
        <div className="flex justify-between items-center mb-lg">
          <h2 className="font-bold text-lg">Visão Macro até a Prova</h2>
          <span className="badge badge--warning">Prova: 29/11/2026</span>
        </div>
        <div className="alert alert--info mb-md">
          <strong>Eventos Especiais:</strong> O planner agendará simulados completos em sábados estratégicos a cada 3-4 semanas, e a frequência dobrará nos últimos 2 meses.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center', opacity: 0.7 }}>
              Mês {i} (Visão simplificada)
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAderencia = () => {
    if (adherenceData.length === 0) return <div className="text-center text-muted p-xl">Sem dados de aderência suficientes.</div>;

    const chartData = adherenceData.map(d => ({
      name: format(parseISO(d.session_date), 'dd/MM'),
      Planejado: Number(d.planned_hours.toFixed(1)),
      Realizado: Number(d.actual_hours.toFixed(1)),
    }));

    return (
      <div className="card">
        <h2 className="font-bold text-lg mb-lg">Relatório de Aderência (Últimos 30 dias)</h2>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)', borderRadius: 8, color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend />
              <Bar dataKey="Planejado" fill="var(--bg-tertiary)" radius={[4,4,0,0]} />
              <Bar dataKey="Realizado" fill="var(--accent-primary)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div id="planner-page">
      <div className="section-header">
        <h1 className="section-title">Planner de Estudos</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'hoje' ? 'tab--active' : ''}`} onClick={() => setActiveTab('hoje')}>Hoje</button>
        <button className={`tab ${activeTab === 'semana' ? 'tab--active' : ''}`} onClick={() => setActiveTab('semana')}>Semana</button>
        <button className={`tab ${activeTab === 'calendario' ? 'tab--active' : ''}`} onClick={() => setActiveTab('calendario')}>Calendário</button>
        <button className={`tab ${activeTab === 'aderencia' ? 'tab--active' : ''}`} onClick={() => setActiveTab('aderencia')}>Aderência</button>
      </div>

      {activeTab === 'hoje' && renderHoje()}
      {activeTab === 'semana' && renderSemana()}
      {activeTab === 'calendario' && renderCalendario()}
      {activeTab === 'aderencia' && renderAderencia()}
    </div>
  );
}
