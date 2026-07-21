import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestionStore, Question } from '../stores/questionStore';
import { useTopicStore } from '../stores/topicStore';

export default function QuestionBank() {
  const navigate = useNavigate();
  const { questions, fetchQuestions, deleteQuestion, saveQuestion } = useQuestionStore();
  const { topics, fetchTopics } = useTopicStore();
  
  const [search, setSearch] = useState('');
  const [filterTopic, setFilterTopic] = useState<number | ''>('');
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);

  useEffect(() => {
    fetchTopics();
    fetchQuestions();
  }, []);

  const handleSearch = () => {
    fetchQuestions({ 
      search: search || undefined, 
      topic_id: filterTopic ? Number(filterTopic) : undefined 
    });
  };

  const openEditor = (q?: Question) => {
    if (q) {
      setEditingQuestion({ ...q });
    } else {
      setEditingQuestion({
        statement: '', alt_a: '', alt_b: '', alt_c: '', alt_d: '', alt_e: '',
        correct_answer: 'A', source: 'manual', banca: 'Cebraspe', year: new Date().getFullYear()
      });
    }
  };

  const handleSave = async () => {
    if (editingQuestion && editingQuestion.statement && editingQuestion.correct_answer) {
      await saveQuestion(editingQuestion);
      setEditingQuestion(null);
    } else {
      alert("Enunciado e resposta correta são obrigatórios.");
    }
  };

  const getSubtopics = () => topics.filter(t => t.level > 0);

  return (
    <div id="questions-page">
      <div className="section-header">
        <h1 className="section-title">Banco de Questões</h1>
        <div className="flex gap-sm">
          <button className="btn btn--secondary btn--sm" onClick={() => navigate('/questions/import')}>
            📥 Importar CSV/Texto
          </button>
          <button className="btn btn--primary btn--sm" onClick={() => openEditor()}>
            + Nova Questão
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="flex gap-md">
          <div style={{ flex: 1 }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar no enunciado..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <select 
              className="form-input form-select" 
              value={filterTopic} 
              onChange={e => setFilterTopic(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Todas as matérias</option>
              {topics.filter(t => t.level === 1).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <button className="btn btn--secondary" onClick={handleSearch}>
            🔍 Filtrar
          </button>
          <div className="flex gap-sm">
            <button className="btn btn--secondary" onClick={() => navigate('/questions/import')}>
              Importar CSV
            </button>
            <button className="btn btn--primary" onClick={() => openEditor()}>
              Nova Questão
            </button>
          </div>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">❓</div>
            <div className="empty-state__title">Nenhuma questão encontrada</div>
            <div className="empty-state__desc">
              Importe questões de provas anteriores do Cebraspe ou adicione manualmente.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-col gap-md">
          {questions.map(q => (
            <div key={q.id} className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <div className="flex gap-sm items-center">
                  <span className="badge badge--not-started">{q.banca || 'N/A'} {q.year}</span>
                  <span className="badge badge--studying">{q.topic_title || 'Sem tópico'}</span>
                </div>
                <div className="flex gap-sm">
                  <button className="btn btn--ghost btn--sm" onClick={() => openEditor(q)}>✏️ Editar</button>
                  <button className="btn btn--ghost btn--sm" onClick={() => {
                    if (confirm('Arquivar esta questão?')) deleteQuestion(q.id);
                  }} style={{ color: 'var(--status-error)' }}>🗑️</button>
                </div>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'pre-wrap', marginBottom: 'var(--space-md)' }}>
                {q.statement}
              </div>
              <div className="flex-col gap-xs text-sm">
                {['A', 'B', 'C', 'D', 'E'].map(letter => {
                  const isCorrect = q.correct_answer === letter;
                  const text = (q as any)[`alt_${letter.toLowerCase()}`];
                  if (!text) return null;
                  return (
                    <div key={letter} style={{ 
                      padding: 'var(--space-xs) var(--space-sm)', 
                      borderRadius: 'var(--radius-sm)',
                      background: isCorrect ? 'var(--status-success-bg)' : 'transparent',
                      color: isCorrect ? 'var(--status-success)' : 'inherit',
                      fontWeight: isCorrect ? 600 : 400
                    }}>
                      {letter}) {text}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {editingQuestion && (
        <div className="modal-overlay" onClick={() => setEditingQuestion(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{editingQuestion.id ? 'Editar Questão' : 'Nova Questão'}</h2>
              <button className="btn btn--ghost" onClick={() => setEditingQuestion(null)}>✕</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Tópico/Disciplina</label>
              <select 
                className="form-input form-select"
                value={editingQuestion.topic_id || ''}
                onChange={e => setEditingQuestion({...editingQuestion, topic_id: Number(e.target.value)})}
              >
                <option value="">Selecione...</option>
                {getSubtopics().map(t => (
                  <option key={t.id} value={t.id}>
                    {t.level === 1 ? '' : '— '} {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Enunciado</label>
              <textarea 
                className="form-input" 
                rows={4}
                value={editingQuestion.statement || ''}
                onChange={e => setEditingQuestion({...editingQuestion, statement: e.target.value})}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              {['A', 'B', 'C', 'D', 'E'].map(letter => {
                const field = `alt_${letter.toLowerCase()}`;
                return (
                  <div key={letter} className="form-group">
                    <label className="form-label">Alternativa {letter}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={(editingQuestion as any)[field] || ''}
                      onChange={e => setEditingQuestion({...editingQuestion, [field]: e.target.value})}
                    />
                  </div>
                );
              })}
            </div>

            <div className="form-group">
              <label className="form-label">Resposta Correta</label>
              <select 
                className="form-input form-select"
                value={editingQuestion.correct_answer}
                onChange={e => setEditingQuestion({...editingQuestion, correct_answer: e.target.value as any})}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>

            <div className="flex gap-md" style={{ marginTop: 'var(--space-lg)' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Banca</label>
                <input type="text" className="form-input" value={editingQuestion.banca || ''} onChange={e => setEditingQuestion({...editingQuestion, banca: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Ano</label>
                <input type="number" className="form-input" value={editingQuestion.year || ''} onChange={e => setEditingQuestion({...editingQuestion, year: Number(e.target.value)})} />
              </div>
            </div>

            <div className="flex justify-end gap-sm" style={{ marginTop: 'var(--space-xl)' }}>
              <button className="btn btn--ghost" onClick={() => setEditingQuestion(null)}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSave}>Salvar Questão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
