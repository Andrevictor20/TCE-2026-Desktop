import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTopicStore } from '../stores/topicStore';
import { useSettingsStore } from '../stores/settingsStore';
import { differenceInDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePlannerStore } from '../stores/plannerStore';
import { rebalanceRemainingWeek } from '../lib/plannerEngine';

interface CountdownInfo {
  days_total: number;
  weekdays_remaining: number;
  exam_date: string;
  today: string;
}

interface AvailableHours {
  weekdays_remaining: number;
  total_hours: number;
  review_block_hours: number;
  study_hours: number;
  review_block_days: number;
}

export default function Dashboard() {
  const [countdown, setCountdown] = useState<CountdownInfo | null>(null);
  const [availableHours, setAvailableHours] = useState<AvailableHours | null>(null);
  const { topics, fetchTopics, getDisciplines, getProgressByCategory } = useTopicStore();
  const { availability, fetchAvailability, fetchSettings, settings } = useSettingsStore();
  const { todaySession, fetchTodaySession } = usePlannerStore();

  useEffect(() => {
    fetchTopics();
    fetchSettings();
    fetchAvailability();
    fetchTodaySession();

    invoke<CountdownInfo>('get_countdown').then(setCountdown).catch(console.error);
  }, []);

  useEffect(() => {
    if (availability.length === 7) {
      const hoursPerDay = availability.map(a => a.enabled ? a.hours : 0);
      invoke<AvailableHours>('calculate_available_hours', {
        hoursPerDay,
        reviewBlockDays: settings.review_block_days,
      }).then(setAvailableHours).catch(console.error);
    }
  }, [availability, settings.review_block_days]);

  const disciplines = getDisciplines();
  const progressCG = getProgressByCategory('gerais');
  const progressCE = getProgressByCategory('especificos');

  const getSubtopicProgress = (disciplineId: number) => {
    const children = topics.filter(t => t.parent_id === disciplineId);
    const total = children.length;
    if (total === 0) return { total: 0, studied: 0, percent: 0 };
    const studied = children.filter(t => t.status !== 'not_started').length;
    return { total, studied, percent: Math.round((studied / total) * 100) };
  };

  const examDate = new Date('2026-11-29');
  const today = new Date();
  const daysLeft = differenceInDays(examDate, today);

  return (
    <div id="dashboard-page">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="text-sm text-muted" style={{ marginTop: 'var(--space-xs)' }}>
            {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Countdown + Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stat-card">
          <div className="countdown">
            <span className="countdown__number">{daysLeft}</span>
            <span className="countdown__label">dias para a prova</span>
          </div>
          <div className="countdown__detail">
            Prova objetiva + discursiva: 29/11/2026
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__value stat-card__accent">
            {countdown?.weekdays_remaining ?? '—'}
          </div>
          <div className="stat-card__label">Dias úteis restantes</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__value">
            {availableHours ? `${Math.round(availableHours.total_hours)}h` : '—'}
          </div>
          <div className="stat-card__label">Horas disponíveis até a prova</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--status-success)' }}>
            {availableHours ? `${Math.round(availableHours.study_hours)}h` : '—'}
          </div>
          <div className="stat-card__label">
            Horas de estudo (excl. revisão final de {availableHours?.review_block_days ?? settings.review_block_days} dias)
          </div>
        </div>
      </div>

      {/* Sessão de Hoje */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card__header">
          <h2 className="card__title">📋 Sessão de Hoje</h2>
          {todaySession && (
            <span className="text-sm text-muted">
              {todaySession.actual_hours.toFixed(1)}h / {(todaySession as any).capacity_override ?? todaySession.planned_hours.toFixed(1)}h
            </span>
          )}
        </div>
        
        {todaySession ? (
          <div className="padding-md flex-col gap-md" style={{ padding: 'var(--space-md)' }}>
            <div className="flex justify-between items-center">
              <span className="font-bold">Capacidade de Hoje:</span>
              <span className="text-accent">{(todaySession as any).capacity_override ?? todaySession.planned_hours}h</span>
            </div>
            <input 
              type="range" 
              min="0" max="10" step="0.5" 
              defaultValue={(todaySession as any).capacity_override ?? todaySession.planned_hours}
              onMouseUp={async (e) => {
                const val = Number((e.target as HTMLInputElement).value);
                await rebalanceRemainingWeek(parseISO(todaySession.session_date), val);
                await fetchTodaySession();
              }}
              style={{ width: '100%' }}
            />
            <div className="text-xs text-muted text-center" style={{ marginTop: 'var(--space-xs)' }}>
              Se você reduzir a capacidade, as horas restantes serão redistribuídas na semana.
            </div>
            <div className="flex-col gap-sm" style={{ marginTop: 'var(--space-md)' }}>
              {todaySession.blocks.map(b => (
                 <div key={b.id} className="flex justify-between items-center" style={{ padding: 'var(--space-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)' }}>
                   <span className="text-sm font-bold">{b.topic_title || b.block_type}</span>
                   <span className="text-muted text-sm">{b.duration_minutes} min</span>
                 </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
            <div className="empty-state__icon">📅</div>
            <div className="empty-state__title">Planner ainda não configurado</div>
            <div className="empty-state__desc">
              Configure seu perfil de disponibilidade nas Configurações e o motor do Planner gerará sua sessão diária automaticamente.
            </div>
          </div>
        )}
      </div>

      {/* Progresso por Categoria */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        {/* Conhecimentos Gerais */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Conhecimentos Gerais</h3>
            <span className="text-sm text-muted">
              {progressCG.studied}/{progressCG.total} tópicos • {progressCG.percent}%
            </span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 'var(--space-md)' }}>
            <div
              className="progress-bar__fill"
              style={{ width: `${progressCG.percent}%` }}
            />
          </div>
          <div className="discipline-list">
            {disciplines
              .filter(d => d.category === 'gerais')
              .map(d => {
                const prog = getSubtopicProgress(d.id);
                return (
                  <div key={d.id} className="discipline-item">
                    <span className="discipline-item__name">{d.title}</span>
                    <div className="discipline-item__progress">
                      <div className="progress-bar">
                        <div
                          className={`progress-bar__fill ${prog.percent >= 70 ? 'progress-bar__fill--success' : ''}`}
                          style={{ width: `${prog.percent}%` }}
                        />
                      </div>
                    </div>
                    <span className="discipline-item__percent">{prog.percent}%</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Conhecimentos Específicos */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Conhecimentos Específicos</h3>
            <span className="text-sm text-muted">
              {progressCE.studied}/{progressCE.total} tópicos • {progressCE.percent}%
            </span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 'var(--space-md)' }}>
            <div
              className="progress-bar__fill progress-bar__fill--success"
              style={{ width: `${progressCE.percent}%` }}
            />
          </div>
          <div className="discipline-list">
            {disciplines
              .filter(d => d.category === 'especificos')
              .map(d => {
                const prog = getSubtopicProgress(d.id);
                return (
                  <div key={d.id} className="discipline-item">
                    <span className="discipline-item__name">{d.title}</span>
                    <div className="discipline-item__progress">
                      <div className="progress-bar">
                        <div
                          className={`progress-bar__fill ${prog.percent >= 70 ? 'progress-bar__fill--success' : ''}`}
                          style={{ width: `${prog.percent}%` }}
                        />
                      </div>
                    </div>
                    <span className="discipline-item__percent">{prog.percent}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Info do Concurso */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">ℹ️ Informações do Concurso</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>CARGO</div>
            <div className="text-sm">Auditor TI (Cargo 15)</div>
          </div>
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>REMUNERAÇÃO</div>
            <div className="text-sm font-bold" style={{ color: 'var(--status-success)' }}>R$ 20.112,20</div>
          </div>
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>VAGAS</div>
            <div className="text-sm">4 (AC: 3, PP: 1)</div>
          </div>
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>BANCA</div>
            <div className="text-sm">Cebraspe</div>
          </div>
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>PROVA OBJETIVA</div>
            <div className="text-sm">100 questões • 160 pts • 5h</div>
          </div>
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>NOTA DE CORTE</div>
            <div className="text-sm" style={{ color: 'var(--status-warning)' }}>64,00 pts (40%)</div>
          </div>
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>PROVA DISCURSIVA</div>
            <div className="text-sm">40 pts • 4h</div>
          </div>
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>CLASSIFICADOS P/ DISCURSIVA</div>
            <div className="text-sm">AC: 75, PcD: 10, PP: 25</div>
          </div>
        </div>
      </div>
    </div>
  );
}
