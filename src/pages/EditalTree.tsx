import { useEffect, useState } from 'react';
import { useTopicStore, Topic } from '../stores/topicStore';

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Não iniciado',
  studying: 'Estudando',
  review: 'Revisão',
  mastered: 'Dominado',
};

const STATUS_OPTIONS: Topic['status'][] = ['not_started', 'studying', 'review', 'mastered'];

function TreeNode({
  topic,
  depth = 0,
  selectedId,
  onSelect,
}: {
  topic: Topic;
  depth?: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = topic.children && topic.children.length > 0;

  return (
    <div className="tree-node">
      <div
        className={`tree-node__row ${selectedId === topic.id ? 'tree-node__row--selected' : ''}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onSelect(topic.id)}
      >
        {hasChildren ? (
          <span
            className={`tree-node__toggle ${expanded ? 'tree-node__toggle--expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            ▶
          </span>
        ) : (
          <span style={{ width: 16 }} />
        )}
        <span className="tree-node__title">{topic.title}</span>
        <span className={`badge badge--${topic.status}`}>
          {STATUS_LABELS[topic.status]}
        </span>
        {topic.level === 0 && (
          <span className="text-xs text-muted" style={{ marginLeft: 4 }}>
            {'★'.repeat(topic.weight_manual)}{'☆'.repeat(5 - topic.weight_manual)}
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="tree-node__children">
          {topic.children!.map(child => (
            <TreeNode
              key={child.id}
              topic={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicDetail({ topic }: { topic: Topic }) {
  const { updateTopicStatus, updateTopicWeight, topics } = useTopicStore();
  const children = topics.filter(t => t.parent_id === topic.id);
  const studied = children.filter(t => t.status !== 'not_started').length;

  return (
    <div className="card" style={{ height: '100%', overflow: 'auto' }}>
      <div className="card__header">
        <h2 className="card__title">{topic.title}</h2>
        <span className={`badge badge--${topic.category === 'gerais' ? 'studying' : 'review'}`}>
          {topic.category === 'gerais' ? 'Conhecimentos Gerais' : 'Conhecimentos Específicos'}
        </span>
      </div>

      {/* Status */}
      <div className="form-group">
        <label className="form-label">Status</label>
        <div className="flex gap-sm">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              className={`btn btn--sm ${topic.status === s ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => updateTopicStatus(topic.id, s)}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Peso manual (apenas para disciplinas nível 0) */}
      {topic.level === 0 && (
        <div className="form-group">
          <label className="form-label">Peso manual (1-5)</label>
          <div className="flex gap-sm">
            {[1, 2, 3, 4, 5].map(w => (
              <button
                key={w}
                className={`btn btn--sm ${topic.weight_manual === w ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => updateTopicWeight(topic.id, w)}
                style={{ minWidth: 36 }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtópicos */}
      {children.length > 0 && (
        <div className="form-group">
          <label className="form-label">
            Subtópicos ({studied}/{children.length} iniciados)
          </label>
          <div className="progress-bar" style={{ marginBottom: 'var(--space-sm)' }}>
            <div
              className="progress-bar__fill progress-bar__fill--success"
              style={{ width: `${children.length > 0 ? Math.round((studied / children.length) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Texto do edital */}
      {topic.edital_text && (
        <div className="form-group">
          <label className="form-label">Conteúdo programático (edital)</label>
          <div
            style={{
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {topic.edital_text}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-sm" style={{ marginTop: 'var(--space-lg)' }}>
        <button
          className="btn btn--secondary"
          onClick={() => {
            const text = `${topic.title}\n\n${topic.edital_text ?? ''}\n\nSubtópicos:\n${children.map(c => `• ${c.title}`).join('\n')}`;
            navigator.clipboard.writeText(text);
          }}
        >
          📋 Copiar como fonte
        </button>
        {topic.level === 0 && (
          <button className="btn btn--secondary">
            📓 Abrir Notebook
          </button>
        )}
      </div>
    </div>
  );
}

export default function EditalTree() {
  const { fetchTopics, getTopicTree, selectedTopicId, selectTopic, getTopicById } = useTopicStore();
  const [filter, setFilter] = useState<'all' | 'gerais' | 'especificos'>('all');

  useEffect(() => {
    fetchTopics();
  }, []);

  const tree = filter === 'all'
    ? [...getTopicTree('gerais'), ...getTopicTree('especificos')]
    : getTopicTree(filter);

  const selectedTopic = selectedTopicId ? getTopicById(selectedTopicId) : null;

  return (
    <div id="edital-page">
      <div className="section-header">
        <h1 className="section-title">Edital Estruturado</h1>
        <div className="flex gap-sm">
          <button
            className={`btn btn--sm ${filter === 'all' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            className={`btn btn--sm ${filter === 'gerais' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setFilter('gerais')}
          >
            Gerais (9)
          </button>
          <button
            className={`btn btn--sm ${filter === 'especificos' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setFilter('especificos')}
          >
            Específicos (10)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', height: 'calc(100vh - 140px)' }}>
        {/* Tree */}
        <div className="card" style={{ overflow: 'auto', padding: 'var(--space-md)' }}>
          <div className="tree">
            {tree.map(topic => (
              <TreeNode
                key={topic.id}
                topic={topic}
                selectedId={selectedTopicId}
                onSelect={selectTopic}
              />
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedTopic ? (
          <TopicDetail topic={selectedTopic} />
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state">
              <div className="empty-state__icon">📋</div>
              <div className="empty-state__title">Selecione um tópico</div>
              <div className="empty-state__desc">
                Clique em um item da árvore para ver detalhes, alterar status e acessar o notebook da disciplina.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
