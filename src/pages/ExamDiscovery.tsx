import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface DiscoveredExam {
  title: string;
  date: string;
  link: string;
}

export default function ExamDiscovery() {
  const [keywords, setKeywords] = useState('');
  const [yearStart, setYearStart] = useState(2020);
  const [yearEnd, setYearEnd] = useState(2026);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exams, setExams] = useState<DiscoveredExam[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await invoke<DiscoveredExam[]>('discover_and_download_cebraspe_exams', {
        keywords,
        yearStart,
        yearEnd
      });
      setExams(res);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-md" style={{ padding: 'var(--space-md)' }}>
      <h1 className="section-title mb-md" style={{ marginBottom: 'var(--space-md)' }}>Busca Automática (Cebraspe)</h1>
      
      <div className="card mb-md" style={{ maxWidth: 800 }}>
        <div className="flex gap-md items-end" style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Palavras-chave (Ex: TCU Auditor)</label>
            <input 
              className="form-input" 
              value={keywords} 
              onChange={e => setKeywords(e.target.value)} 
              placeholder="Tribunal de Contas..." 
            />
          </div>
          <div>
            <label className="form-label">Ano Inicial</label>
            <input 
              type="number" 
              className="form-input" 
              style={{ width: 100 }}
              value={yearStart} 
              onChange={e => setYearStart(Number(e.target.value))} 
            />
          </div>
          <div>
            <label className="form-label">Ano Final</label>
            <input 
              type="number" 
              className="form-input" 
              style={{ width: 100 }}
              value={yearEnd} 
              onChange={e => setYearEnd(Number(e.target.value))} 
            />
          </div>
          <button 
            className="btn btn--primary" 
            onClick={handleSearch} 
            disabled={loading || !keywords}
          >
            {loading ? 'Buscando...' : 'Buscar Provas'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert--error mb-md" style={{ maxWidth: 800 }}>
          {error}
        </div>
      )}

      {exams.length > 0 && (
        <div className="card" style={{ maxWidth: 800 }}>
          <h2 className="font-bold mb-sm">Provas Encontradas</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <th style={{ padding: 'var(--space-sm)' }}>Título</th>
                <th style={{ padding: 'var(--space-sm)' }}>Data</th>
                <th style={{ padding: 'var(--space-sm)' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((ex, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: 'var(--space-sm)' }}>{ex.title}</td>
                  <td style={{ padding: 'var(--space-sm)' }}>{ex.date}</td>
                  <td style={{ padding: 'var(--space-sm)' }}>
                    <button className="btn btn--sm">Baixar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
