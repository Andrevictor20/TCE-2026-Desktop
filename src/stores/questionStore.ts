import { create } from 'zustand';
import { query, execute } from '../lib/db';

export interface Question {
  id: number;
  topic_id: number | null;
  topic_title?: string; // joined
  statement: string;
  alt_a: string;
  alt_b: string;
  alt_c: string;
  alt_d: string;
  alt_e: string;
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string | null;
  source: string;
  banca: string | null;
  year: number | null;
  orgao: string | null;
  tags: string | null;
  archived: number;
}

interface QuestionStore {
  questions: Question[];
  loading: boolean;
  fetchQuestions: (filters?: { topic_id?: number; search?: string }) => Promise<void>;
  saveQuestion: (q: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: number) => Promise<void>;
}

export const useQuestionStore = create<QuestionStore>((set, get) => ({
  questions: [],
  loading: false,

  fetchQuestions: async (filters) => {
    set({ loading: true });
    try {
      let sql = `
        SELECT q.*, t.title as topic_title 
        FROM questions q 
        LEFT JOIN topics t ON q.topic_id = t.id 
        WHERE q.archived = 0
      `;
      const binds: unknown[] = [];
      
      if (filters?.topic_id) {
        binds.push(filters.topic_id);
        sql += ` AND q.topic_id = $${binds.length}`;
      }
      if (filters?.search) {
        binds.push(`%${filters.search}%`);
        sql += ` AND q.statement LIKE $${binds.length}`;
      }
      
      sql += ` ORDER BY q.id DESC LIMIT 200`;

      const rows = await query<Question>(sql, binds);
      set({ questions: rows, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  saveQuestion: async (q) => {
    if (q.id) {
      // Update
      await execute(
        `UPDATE questions SET 
          topic_id = $1, statement = $2, alt_a = $3, alt_b = $4, alt_c = $5, alt_d = $6, alt_e = $7, 
          correct_answer = $8, explanation = $9, source = $10, banca = $11, year = $12, orgao = $13 
         WHERE id = $14`,
        [
          q.topic_id, q.statement, q.alt_a, q.alt_b, q.alt_c, q.alt_d, q.alt_e,
          q.correct_answer, q.explanation, q.source || 'manual', q.banca, q.year, q.orgao, q.id
        ]
      );
    } else {
      // Insert
      await execute(
        `INSERT INTO questions 
          (topic_id, statement, alt_a, alt_b, alt_c, alt_d, alt_e, correct_answer, explanation, source, banca, year, orgao) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          q.topic_id, q.statement, q.alt_a, q.alt_b, q.alt_c, q.alt_d, q.alt_e,
          q.correct_answer, q.explanation, q.source || 'manual', q.banca, q.year, q.orgao
        ]
      );
    }
    await get().fetchQuestions();
  },

  deleteQuestion: async (id) => {
    await execute('UPDATE questions SET archived = 1 WHERE id = $1', [id]);
    set((state) => ({ questions: state.questions.filter(q => q.id !== id) }));
  }
}));
