import { useEffect, useState } from 'react';
import { useNotebookStore } from '../stores/notebookStore';
import { useTopicStore } from '../stores/topicStore';
import ReactMarkdown from 'react-markdown';
import { openUrl } from '@tauri-apps/plugin-opener';

export default function Notebooks() {
  const { topics, fetchTopics } = useTopicStore();
  const { loadTopic, note, saveNote, editalText, chatHistory, sendMessage } = useNotebookStore();
  
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'edital' | 'chat'>('notes');
  const [noteDraft, setNoteDraft] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const { updateNotebookUrl } = useTopicStore();

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      loadTopic(selectedTopic);
      const t = topics.find(t => t.id === selectedTopic);
      setUrlDraft(t?.notebooklm_url || '');
    }
  }, [selectedTopic, topics]);

  useEffect(() => {
    if (note) {
      setNoteDraft(note.content);
    }
  }, [note]);

  const handleSaveNote = () => {
    saveNote(noteDraft);
  };

  const handleSendChat = () => {
    if (chatInput.trim()) {
      sendMessage(chatInput, 'ollama'); // Using local Ollama as default
      setChatInput('');
    }
  };

  // Group topics for sidebar
  const categories = topics.filter(t => t.level === 0);
  const subjects = topics.filter(t => t.level === 1);

  return (
    <div id="notebooks-page" style={{ display: 'flex', height: 'calc(100vh - var(--topbar-height))', margin: 'calc(var(--space-2xl) * -1)' }}>
      
      {/* Sidebar: Disciplines List */}
      <div style={{ width: 280, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-primary)', overflowY: 'auto' }}>
        <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-primary)', fontWeight: 600 }}>
          Cadernos
        </div>
        <div>
          {categories.map(cat => (
            <div key={cat.id}>
              <div style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginTop: 'var(--space-sm)' }}>
                {cat.title}
              </div>
              {subjects.filter(s => s.parent_id === cat.id).map(sub => (
                <div 
                  key={sub.id}
                  onClick={() => setSelectedTopic(sub.id)}
                  style={{
                    padding: 'var(--space-sm) var(--space-md) var(--space-sm) var(--space-lg)',
                    cursor: 'pointer',
                    background: selectedTopic === sub.id ? 'var(--accent-primary-bg)' : 'transparent',
                    color: selectedTopic === sub.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                    borderLeft: `3px solid ${selectedTopic === sub.id ? 'var(--accent-primary)' : 'transparent'}`,
                    fontSize: 'var(--font-size-sm)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}
                  title={sub.title}
                >
                  {sub.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedTopic ? (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <div className="empty-state__icon">📓</div>
            <div className="empty-state__title">Selecione uma matéria</div>
            <div className="empty-state__desc">Acesse suas anotações, texto do edital e converse com a IA sobre o assunto.</div>
          </div>
        ) : (
          <>
            <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>{topics.find(t => t.id === selectedTopic)?.title}</h2>
              <div className="flex gap-md items-center">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://notebooklm.google.com/..."
                  value={urlDraft}
                  onChange={e => setUrlDraft(e.target.value)}
                  style={{ width: '250px' }}
                />
                <button 
                  className="btn btn--sm btn--ghost" 
                  onClick={() => updateNotebookUrl(selectedTopic, urlDraft)}
                >
                  Salvar link
                </button>
                {topics.find(t => t.id === selectedTopic)?.notebooklm_url && (
                  <button 
                    className="btn btn--sm btn--primary" 
                    onClick={() => openUrl(topics.find(t => t.id === selectedTopic)!.notebooklm_url!)}
                  >
                    Abrir no NotebookLM
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ padding: 'var(--space-sm) var(--space-lg)', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-surface)' }}>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <button className={`tab ${activeTab === 'notes' ? 'tab--active' : ''}`} onClick={() => setActiveTab('notes')}>Markdown</button>
                <button className={`tab ${activeTab === 'edital' ? 'tab--active' : ''}`} onClick={() => setActiveTab('edital')}>Edital</button>
                <button className={`tab ${activeTab === 'chat' ? 'tab--active' : ''}`} onClick={() => setActiveTab('chat')}>Tutor IA</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-lg)' }}>
              
              {activeTab === 'notes' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', height: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="flex justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                      <span className="font-bold text-sm">Editor</span>
                      <button className="btn btn--sm btn--primary" onClick={handleSaveNote}>Salvar</button>
                    </div>
                    <textarea 
                      className="form-input" 
                      style={{ flex: 1, fontFamily: 'monospace', resize: 'none' }}
                      value={noteDraft}
                      onChange={e => setNoteDraft(e.target.value)}
                      placeholder="# Minhas anotações..."
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: 'var(--space-sm)' }}>
                      <span className="font-bold text-sm">Preview</span>
                    </div>
                    <div style={{ flex: 1, border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', overflowY: 'auto', background: 'var(--bg-surface)' }} className="markdown-body">
                      <ReactMarkdown>{noteDraft}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'edital' && (
                <div className="card" style={{ height: '100%' }}>
                  <h3 className="font-bold mb-md">Texto original do Edital TCE-MA</h3>
                  <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {editalText || 'Nenhum texto de edital cadastrado para esta matéria.'}
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', background: 'var(--bg-surface)' }}>
                    {chatHistory.length === 0 ? (
                      <div className="text-muted text-center" style={{ marginTop: 'var(--space-2xl)' }}>
                        O Tutor IA tem acesso às suas anotações e ao texto do edital desta matéria.<br/> Faça uma pergunta para começar.
                      </div>
                    ) : (
                      <div className="flex-col gap-md">
                        {chatHistory.map(msg => (
                          <div key={msg.id} style={{ 
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            background: msg.role === 'user' ? 'var(--accent-primary-bg)' : 'var(--bg-tertiary)',
                            color: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--text-primary)',
                            padding: 'var(--space-sm) var(--space-md)',
                            borderRadius: 'var(--radius-md)',
                            maxWidth: '80%'
                          }}>
                            {msg.role === 'assistant' && <div className="text-xs text-muted mb-xs">🤖 IA Tutor</div>}
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-sm">
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ flex: 1 }} 
                      placeholder="Faça uma pergunta sobre a matéria..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                    />
                    <button className="btn btn--primary" onClick={handleSendChat}>Enviar</button>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
