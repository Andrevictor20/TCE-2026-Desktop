CREATE TABLE discursive_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL REFERENCES exams(id),
  question_type TEXT NOT NULL CHECK(question_type IN ('peca_tecnica', 'questao_discursiva')),
  question_index INTEGER NOT NULL,          -- 1 para peça técnica; 1 ou 2 para questões discursivas
  content TEXT NOT NULL DEFAULT '',
  line_count INTEGER NOT NULL DEFAULT 0,
  max_lines INTEGER NOT NULL,               -- 60 para peça técnica, 30 para questão discursiva
  self_eval_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_discursive_answers_exam ON discursive_answers(exam_id);
