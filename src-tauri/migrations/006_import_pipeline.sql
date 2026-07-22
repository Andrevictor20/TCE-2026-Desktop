-- Adiciona colunas à tabela questions
ALTER TABLE questions ADD COLUMN source_file TEXT;
ALTER TABLE questions ADD COLUMN external_id TEXT;
ALTER TABLE questions ADD COLUMN content_hash TEXT;
ALTER TABLE questions ADD COLUMN imported_at TEXT;

-- Cria índice único para evitar duplicatas exatas pelo hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_content_hash ON questions(content_hash);

-- Histórico de lotes de importação
CREATE TABLE IF NOT EXISTS import_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('pdf_cebraspe', 'csv_generic', 'text_manual')),
  banca TEXT,
  orgao TEXT,
  ano INTEGER,
  total_found INTEGER NOT NULL DEFAULT 0,
  total_imported INTEGER NOT NULL DEFAULT 0,
  total_duplicated INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Registros de PDFs encontrados no Cebraspe
CREATE TABLE IF NOT EXISTS discovered_exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orgao TEXT NOT NULL,
  ano INTEGER,
  cargo TEXT,
  url_prova TEXT NOT NULL,
  url_gabarito TEXT NOT NULL,
  local_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK(status IN ('pending', 'downloading', 'downloaded', 'parsed', 'error')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
