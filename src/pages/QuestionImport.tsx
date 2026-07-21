import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestionStore } from '../stores/questionStore';
import { useTopicStore } from '../stores/topicStore';

export default function QuestionImport() {
  const navigate = useNavigate();
  const { saveQuestion } = useQuestionStore();
  const { topics } = useTopicStore();
  
  const [importMode, setImportMode] = useState<'text' | 'csv'>('csv');
  const [inputText, setInputText] = useState('');
  const [topicId, setTopicId] = useState<number | ''>('');
  const [status, setStatus] = useState('');
  
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  const parseCSV = (text: string) => {
    // Simple CSV parser supporting quotes (basic)
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return;
    
    const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, '').toLowerCase());
    
    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Splitting by semicolon
      const cols = line.split(';');
      if (cols.length >= 7) { // Need at least statement, A, B, C, D, E, correct_answer
        const obj: any = {};
        headers.forEach((h, idx) => {
          if (cols[idx]) obj[h] = cols[idx].replace(/^"|"$/g, '').trim();
        });
        
        // Map to internal format
        parsed.push({
          statement: obj.enunciado || obj.statement || cols[0],
          alt_a: obj.a || obj.alt_a || cols[1],
          alt_b: obj.b || obj.alt_b || cols[2],
          alt_c: obj.c || obj.alt_c || cols[3],
          alt_d: obj.d || obj.alt_d || cols[4],
          alt_e: obj.e || obj.alt_e || cols[5],
          correct_answer: (obj.gabarito || obj.correct_answer || cols[6])?.toUpperCase(),
          banca: obj.banca || 'Manual',
        });
      }
    }
    setCsvPreview(parsed);
  };

  const handleTextChange = (val: string) => {
    setInputText(val);
    if (importMode === 'csv') {
      parseCSV(val);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setInputText(text);
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!topicId) {
      setStatus("Selecione um tópico de destino.");
      return;
    }

    try {
      if (importMode === 'csv' && csvPreview.length > 0) {
        let imported = 0;
        for (const q of csvPreview) {
          if (q.statement && q.correct_answer && ['A','B','C','D','E'].includes(q.correct_answer)) {
            await saveQuestion({
              topic_id: Number(topicId),
              statement: q.statement,
              alt_a: q.alt_a,
              alt_b: q.alt_b,
              alt_c: q.alt_c,
              alt_d: q.alt_d,
              alt_e: q.alt_e,
              correct_answer: q.correct_answer,
              banca: q.banca,
              source: 'csv_import'
            });
            imported++;
          }
        }
        setStatus(`${imported} questões importadas via CSV com sucesso!`);
        setInputText('');
        setCsvPreview([]);
      } else if (importMode === 'text') {
        const blocks = inputText.split(/\n\s*\n/).filter(b => b.trim().length > 0);
        let imported = 0;

        for (const block of blocks) {
          const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          
          let statement = '';
          let alt_a = '', alt_b = '', alt_c = '', alt_d = '', alt_e = '';
          let correct_answer: any = null;
          let currentCapture = 'statement';

          for (const line of lines) {
            const upperLine = line.toUpperCase();
            if (upperLine.startsWith('A)') || upperLine.startsWith('A -')) { currentCapture = 'A'; alt_a = line.substring(2).trim(); }
            else if (upperLine.startsWith('B)') || upperLine.startsWith('B -')) { currentCapture = 'B'; alt_b = line.substring(2).trim(); }
            else if (upperLine.startsWith('C)') || upperLine.startsWith('C -')) { currentCapture = 'C'; alt_c = line.substring(2).trim(); }
            else if (upperLine.startsWith('D)') || upperLine.startsWith('D -')) { currentCapture = 'D'; alt_d = line.substring(2).trim(); }
            else if (upperLine.startsWith('E)') || upperLine.startsWith('E -')) { currentCapture = 'E'; alt_e = line.substring(2).trim(); }
            else if (upperLine.startsWith('GABARITO:')) {
              const ans = upperLine.replace('GABARITO:', '').trim();
              if (['A','B','C','D','E'].includes(ans)) correct_answer = ans;
            } else {
              if (currentCapture === 'statement') statement += (statement ? '\n' : '') + line;
              if (currentCapture === 'A') alt_a += ' ' + line;
              if (currentCapture === 'B') alt_b += ' ' + line;
              if (currentCapture === 'C') alt_c += ' ' + line;
              if (currentCapture === 'D') alt_d += ' ' + line;
              if (currentCapture === 'E') alt_e += ' ' + line;
            }
          }

          if (statement && correct_answer) {
            await saveQuestion({
              topic_id: Number(topicId),
              statement,
              alt_a, alt_b, alt_c, alt_d, alt_e,
              correct_answer,
              source: 'text_import'
            });
            imported++;
          }
        }
        
        setStatus(`${imported} questões importadas (texto plano)!`);
        if (imported > 0) setInputText('');
      } else {
        setStatus('Nenhum dado válido para importar.');
      }
    } catch (e: any) {
      setStatus(`Erro na importação: ${e.message}`);
    }
  };

  return (
    <div id="question-import-page">
      <div className="section-header">
        <div>
          <button className="btn btn--ghost btn--sm" style={{ paddingLeft: 0 }} onClick={() => navigate(-1)}>
            ← Voltar
          </button>
          <h1 className="section-title" style={{ marginTop: 'var(--space-xs)' }}>Importar Questões</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
        <div className="tabs">
          <button 
            className={`tab ${importMode === 'csv' ? 'tab--active' : ''}`}
            onClick={() => setImportMode('csv')}
          >
            Arquivo CSV
          </button>
          <button 
            className={`tab ${importMode === 'text' ? 'tab--active' : ''}`}
            onClick={() => setImportMode('text')}
          >
            Texto Livre
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Tópico de Destino</label>
          <select 
            className="form-input form-select"
            value={topicId}
            onChange={e => setTopicId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Selecione a disciplina...</option>
            {topics.filter(t => t.level === 1).map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {importMode === 'csv' && (
          <div className="form-group">
            <label className="form-label">Upload de Arquivo (.csv)</label>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="form-input" style={{ padding: 'var(--space-xs)' }} />
            <div className="text-xs text-muted mt-sm">
              Formato esperado (separador ponto-e-vírgula): <br/>
              <code>Enunciado;A;B;C;D;E;Gabarito;Banca</code>
            </div>
          </div>
        )}

        {importMode === 'text' && (
          <div className="alert alert--info mb-md">
            Cole as questões no formato padrão com alternativas começando por A), B), C)... e finalize o bloco com <strong>Gabarito: A</strong>. Separe as questões por uma linha em branco.
          </div>
        )}

        {(importMode === 'text' || (importMode === 'csv' && !csvPreview.length)) && (
          <div className="form-group">
            <textarea
              className="form-input"
              rows={15}
              placeholder={importMode === 'text' ? "Enunciado...\nA) Opção A\nB) Opção B\n\nGabarito: B" : 'Ou cole o conteúdo CSV aqui...'}
              value={inputText}
              onChange={e => handleTextChange(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        )}

        {importMode === 'csv' && csvPreview.length > 0 && (
          <div className="mb-md">
            <h3 className="font-bold mb-sm">Preview ({csvPreview.length} questões identificadas)</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Enunciado</th>
                    <th>Gabarito</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(0, 5).map((q, idx) => (
                    <tr key={idx}>
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{q.statement}</td>
                      <td>{q.correct_answer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvPreview.length > 5 && <div className="text-xs text-muted mt-sm">Mostrando as 5 primeiras questões...</div>}
          </div>
        )}

        <div className="flex items-center gap-md">
          <button className="btn btn--primary" onClick={handleImport} disabled={!topicId}>
            Processar Importação
          </button>
          {status && <span className={`text-sm ${status.includes('Erro') || status.includes('Nenhum') ? 'text-error' : 'text-success'}`} style={{ color: status.includes('Erro') || status.includes('Nenhum') ? 'var(--status-error)' : 'var(--status-success)' }}>{status}</span>}
        </div>
      </div>
    </div>
  );
}
