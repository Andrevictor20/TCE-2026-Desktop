import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTopicStore } from '../stores/topicStore';
import { parseGenericCsv } from '../lib/importers/genericCsvParser';
import { parseCebraspePdf, PartialQuestion } from '../lib/importers/cebraspePdfParser';
import { autoTagTopic } from '../lib/importers/topicAutoTagger';
import { invoke } from '@tauri-apps/api/core';

export default function QuestionImport() {
  const navigate = useNavigate();
  const { topics, fetchTopics } = useTopicStore();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importMode, setImportMode] = useState<'csv' | 'pdf'>('csv');
  
  // Step 1 states
  const [csvText, setCsvText] = useState('');
  const [provaPdfPath, setProvaPdfPath] = useState('');
  const [gabaritoPdfPath, setGabaritoPdfPath] = useState('');
  
  // Step 2 states
  const [previewQuestions, setPreviewQuestions] = useState<(PartialQuestion & { _selected?: boolean; _confidence?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 3 states
  const [importResult, setImportResult] = useState<{ imported: number, duplicated: number, batch_id: number } | null>(null);

  useEffect(() => {
    if (topics.length === 0) fetchTopics();
  }, [topics.length, fetchTopics]);

  const level1Topics = topics.filter(t => t.level === 1).map(t => ({ id: t.id, title: t.title }));

  const processFiles = async () => {
    setIsLoading(true);
    let parsed: PartialQuestion[] = [];
    
    if (importMode === 'csv') {
      parsed = parseGenericCsv(csvText);
    } else if (importMode === 'pdf') {
      if (provaPdfPath && gabaritoPdfPath) {
        try {
          const provaText = await invoke<string>('extract_pdf_text', { path: provaPdfPath });
          const gabaritoText = await invoke<string>('extract_pdf_text', { path: gabaritoPdfPath });
          parsed = parseCebraspePdf(provaText, gabaritoText);
        } catch (e) {
          console.error("Failed to parse PDF", e);
          alert("Erro ao extrair PDF: " + String(e));
        }
      } else {
        alert("Forneça os caminhos dos PDFs da prova e do gabarito.");
      }
    }
    
    // Auto-tagging
    const tagged = parsed.map(q => {
      const tag = autoTagTopic(q.statement, level1Topics);
      return {
        ...q,
        topic_id: tag ? tag.topic_id : undefined,
        _confidence: tag ? tag.confidence : 0,
        _selected: true
      };
    });

    setPreviewQuestions(tagged);
    setIsLoading(false);
    setStep(2);
  };

  const executeImport = async () => {
    setIsLoading(true);
    const toImport = previewQuestions.filter(q => q._selected);
    
    // clean internal properties before sending to rust
    const cleanQuestions = toImport.map(q => {
      const { _selected, _confidence, ...rest } = q;
      return rest;
    });

    try {
      const res = await invoke<{ imported: number, duplicated: number, batch_id: number }>('import_questions_batch', {
        batchName: `Importação ${new Date().toLocaleString()}`,
        sourceType: importMode === 'csv' ? 'csv_generic' : 'pdf_cebraspe',
        banca: importMode === 'csv' ? 'Manual' : 'Cebraspe',
        orgao: null,
        ano: new Date().getFullYear(),
        questions: cleanQuestions
      });
      setImportResult(res);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Erro na importação: " + String(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="question-import-page" style={{ padding: 'var(--space-md)' }}>
      <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div>
          <button className="btn btn--ghost btn--sm" style={{ paddingLeft: 0 }} onClick={() => navigate(-1)}>
            ← Voltar
          </button>
          <h1 className="section-title" style={{ marginTop: 'var(--space-xs)' }}>Assistente de Importação</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 1000 }}>
        {/* Wizard Header */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <div style={{ fontWeight: step >= 1 ? 'bold' : 'normal', color: step === 1 ? 'var(--primary-500)' : 'inherit' }}>1. Seleção</div>
          <div>&gt;</div>
          <div style={{ fontWeight: step >= 2 ? 'bold' : 'normal', color: step === 2 ? 'var(--primary-500)' : 'inherit' }}>2. Revisão</div>
          <div>&gt;</div>
          <div style={{ fontWeight: step >= 3 ? 'bold' : 'normal', color: step === 3 ? 'var(--primary-500)' : 'inherit' }}>3. Confirmação</div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div className="tabs mb-md">
              <button 
                className={`tab ${importMode === 'csv' ? 'tab--active' : ''}`}
                onClick={() => setImportMode('csv')}
              >
                Arquivo CSV Livre
              </button>
              <button 
                className={`tab ${importMode === 'pdf' ? 'tab--active' : ''}`}
                onClick={() => setImportMode('pdf')}
              >
                PDF Cebraspe
              </button>
            </div>

            {importMode === 'csv' ? (
              <div className="form-group">
                <label className="form-label">Cole o conteúdo do CSV (separado por ;)</label>
                <textarea 
                  className="form-input" 
                  rows={10} 
                  value={csvText} 
                  onChange={e => setCsvText(e.target.value)}
                  placeholder="Enunciado;A;B;C;D;E;Gabarito;Banca"
                />
              </div>
            ) : (
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div className="alert alert--info">
                  No modo Cebraspe PDF, os arquivos devem estar acessíveis no disco local. Como as web APIs não expõem o caminho absoluto do arquivo para o Rust, cole o caminho completo do arquivo.
                </div>
                <div>
                  <label className="form-label">Caminho Absoluto do PDF da Prova</label>
                  <input type="text" className="form-input" value={provaPdfPath} onChange={e => setProvaPdfPath(e.target.value)} placeholder="/home/user/downloads/prova.pdf" />
                </div>
                <div>
                  <label className="form-label">Caminho Absoluto do PDF do Gabarito</label>
                  <input type="text" className="form-input" value={gabaritoPdfPath} onChange={e => setGabaritoPdfPath(e.target.value)} placeholder="/home/user/downloads/gabarito.pdf" />
                </div>
              </div>
            )}

            <button className="btn btn--primary mt-md" onClick={processFiles} disabled={isLoading || (importMode === 'csv' && !csvText) || (importMode === 'pdf' && (!provaPdfPath || !gabaritoPdfPath))}>
              {isLoading ? 'Processando...' : 'Avançar para Revisão'}
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h3 className="font-bold mb-md">Foram detectadas {previewQuestions.length} questões.</h3>
            
            <div style={{ maxHeight: 500, overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-50)' }}>
                  <tr>
                    <th style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--border-primary)' }}>
                      <input type="checkbox" checked={previewQuestions.every(q => q._selected)} onChange={e => setPreviewQuestions(prev => prev.map(q => ({ ...q, _selected: e.target.checked })))} />
                    </th>
                    <th style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--border-primary)' }}>Enunciado</th>
                    <th style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--border-primary)' }}>Gabarito</th>
                    <th style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--border-primary)' }}>Disciplina Sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {previewQuestions.map((q, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <td style={{ padding: 'var(--space-sm)' }}>
                        <input type="checkbox" checked={q._selected} onChange={e => {
                          const newQ = [...previewQuestions];
                          newQ[idx]._selected = e.target.checked;
                          setPreviewQuestions(newQ);
                        }} />
                      </td>
                      <td style={{ padding: 'var(--space-sm)', fontSize: '0.9em', maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {q.statement}
                      </td>
                      <td style={{ padding: 'var(--space-sm)' }}>{q.correct_answer}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>
                        <select 
                          className="form-input form-select" 
                          style={{ padding: '4px', fontSize: '0.85em', borderLeft: `4px solid ${q._confidence! > 0.6 ? 'var(--status-success)' : q._confidence! > 0.3 ? 'var(--status-warning)' : 'var(--status-error)'}` }}
                          value={q.topic_id || ''}
                          onChange={e => {
                            const newQ = [...previewQuestions];
                            newQ[idx].topic_id = e.target.value ? Number(e.target.value) : undefined;
                            setPreviewQuestions(newQ);
                          }}
                        >
                          <option value="">(Nenhuma)</option>
                          {level1Topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-md mt-md">
              <button className="btn btn--ghost" onClick={() => setStep(1)} disabled={isLoading}>Voltar</button>
              <button className="btn btn--primary" onClick={executeImport} disabled={isLoading || previewQuestions.filter(q => q._selected).length === 0}>
                {isLoading ? 'Importando...' : `Importar ${previewQuestions.filter(q => q._selected).length} questões`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && importResult && (
          <div className="text-center p-xl">
            <h2 className="text-2xl font-bold mb-md" style={{ color: 'var(--status-success)' }}>Importação Concluída!</h2>
            <div className="mb-lg text-lg">
              <p>Foram inseridas com sucesso: <strong>{importResult.imported}</strong> questões.</p>
              {importResult.duplicated > 0 && (
                <p className="text-warning">Foram ignoradas <strong>{importResult.duplicated}</strong> questões já existentes no banco.</p>
              )}
            </div>
            <button className="btn btn--primary" onClick={() => navigate('/questions')}>
              Ir para o Banco de Questões
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
