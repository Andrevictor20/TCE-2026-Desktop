-- ============================================================
-- TCE-MA 2026 — Cargo 15 — Schema Inicial
-- ============================================================

-- Metadados do concurso
CREATE TABLE IF NOT EXISTS contest_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Árvore do edital (categorias → matérias → subtópicos)
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('gerais', 'especificos')),
  title TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK(status IN ('not_started', 'studying', 'review', 'mastered')),
  weight_manual INTEGER NOT NULL DEFAULT 3 CHECK(weight_manual BETWEEN 1 AND 5),
  edital_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Notas/anotações do usuário por tópico
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  note_type TEXT NOT NULL DEFAULT 'user_note'
    CHECK(note_type IN ('user_note', 'summary', 'wrong_questions')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Banco de questões
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  statement TEXT NOT NULL,
  alt_a TEXT NOT NULL,
  alt_b TEXT NOT NULL,
  alt_c TEXT NOT NULL,
  alt_d TEXT NOT NULL,
  alt_e TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK(correct_answer IN ('A','B','C','D','E')),
  explanation TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  banca TEXT,
  year INTEGER,
  orgao TEXT,
  tags TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Simulados realizados
CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_type TEXT NOT NULL CHECK(exam_type IN ('full', 'quick', 'discursive')),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  time_limit_minutes INTEGER,
  total_questions INTEGER,
  score_cg REAL DEFAULT 0,
  score_ce REAL DEFAULT 0,
  score_total REAL DEFAULT 0,
  is_eliminated INTEGER DEFAULT 0,
  config_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Respostas do simulado
CREATE TABLE IF NOT EXISTS exam_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT CHECK(selected_answer IN ('A','B','C','D','E')),
  is_correct INTEGER,
  answered_at TEXT
);

-- Configurações do usuário
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Perfil de disponibilidade (horas por dia da semana)
CREATE TABLE IF NOT EXISTS availability (
  day_of_week INTEGER PRIMARY KEY CHECK(day_of_week BETWEEN 0 AND 6),
  enabled INTEGER NOT NULL DEFAULT 0,
  hours REAL NOT NULL DEFAULT 5.0
);

-- Sessões diárias geradas pelo planner
CREATE TABLE IF NOT EXISTS daily_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_date TEXT NOT NULL UNIQUE,
  planned_hours REAL NOT NULL,
  actual_hours REAL DEFAULT 0,
  capacity_override REAL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'in_progress', 'completed', 'skipped')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Blocos individuais de uma sessão diária
CREATE TABLE IF NOT EXISTS session_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES daily_sessions(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  block_type TEXT NOT NULL
    CHECK(block_type IN ('spaced_review', 'theory', 'practice', 'quick_sim', 'full_sim')),
  duration_minutes INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'in_progress', 'completed', 'skipped', 'deferred')),
  notes TEXT,
  completed_at TEXT
);

-- Revisão espaçada (SM-2 simplificado)
CREATE TABLE IF NOT EXISTS spaced_review (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetition INTEGER NOT NULL DEFAULT 0,
  next_review_date TEXT NOT NULL,
  last_review_date TEXT,
  quality INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Eventos especiais agendados (simulados completos)
CREATE TABLE IF NOT EXISTS scheduled_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_date TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK(event_type IN ('full_sim_objective', 'full_sim_discursive', 'full_sim_both', 'review_block')),
  description TEXT,
  duration_hours REAL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Histórico de chat por disciplina (notebook)
CREATE TABLE IF NOT EXISTS chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  model_used TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_exam ON exam_answers(exam_id);
CREATE INDEX IF NOT EXISTS idx_session_blocks_session ON session_blocks(session_id);
CREATE INDEX IF NOT EXISTS idx_spaced_review_next ON spaced_review(next_review_date);
CREATE INDEX IF NOT EXISTS idx_daily_sessions_date ON daily_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_chat_history_topic ON chat_history(topic_id);
CREATE INDEX IF NOT EXISTS idx_notes_topic ON notes(topic_id);
