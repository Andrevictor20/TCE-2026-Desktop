import { create } from 'zustand';
import { query, execute } from '../lib/db';
import { Question } from './questionStore';

export interface Exam {
  id: number;
  exam_type: 'full' | 'quick' | 'discursive';
  started_at: string;
  finished_at: string | null;
  time_limit_minutes: number;
  total_questions: number;
  score_cg: number;
  score_ce: number;
  score_total: number;
  is_eliminated: number;
}

export interface ExamAnswer {
  id: number;
  exam_id: number;
  question_id: number;
  selected_answer: string | null;
  is_correct: number | null;
}

export interface DiscursiveAnswer {
  id: number;
  exam_id: number;
  question_type: 'peca_tecnica' | 'questao_discursiva';
  question_index: number;
  content: string;
  line_count: number;
  max_lines: number;
  self_eval_notes?: string;
}

interface ExamStore {
  activeExam: Exam | null;
  activeQuestions: Question[]; // for objective
  activeAnswers: Record<number, string>; // for objective
  activeDiscursiveAnswers: DiscursiveAnswer[]; // for discursive
  history: Exam[];
  
  fetchHistory: () => Promise<void>;
  startExam: (type: 'full' | 'quick' | 'discursive', limitMins: number, questionCount?: number) => Promise<number | null>;
  resumeExam: (examId: number) => Promise<void>;
  answerQuestion: (questionId: number, answer: string) => Promise<void>;
  answerDiscursive: (answerId: number, content: string, lineCount: number) => Promise<void>;
  finishExam: () => Promise<number | null>;
  getExamResults: (examId: number) => Promise<{ exam: Exam, answers: (ExamAnswer & { question: Question })[], discursiveAnswers: DiscursiveAnswer[] } | null>;
}

export const useExamStore = create<ExamStore>((set, get) => ({
  activeExam: null,
  activeQuestions: [],
  activeAnswers: {},
  activeDiscursiveAnswers: [],
  history: [],

  fetchHistory: async () => {
    const exams = await query<Exam>('SELECT * FROM exams ORDER BY id DESC');
    set({ history: exams });
  },

  startExam: async (type, limitMins, questionCount = 100) => {
    try {
      // Create exam record
      const res = await execute(
        `INSERT INTO exams (exam_type, started_at, time_limit_minutes, total_questions) VALUES ($1, datetime('now'), $2, $3)`,
        [type, limitMins, type === 'discursive' ? 3 : questionCount]
      );
      
      const examId = res.lastInsertId;
      if (!examId) return null;

      if (type === 'discursive') {
        // Create 3 discursive answer placeholders
        await execute(`INSERT INTO discursive_answers (exam_id, question_type, question_index, max_lines) VALUES ($1, 'peca_tecnica', 1, 60)`, [examId]);
        await execute(`INSERT INTO discursive_answers (exam_id, question_type, question_index, max_lines) VALUES ($1, 'questao_discursiva', 1, 30)`, [examId]);
        await execute(`INSERT INTO discursive_answers (exam_id, question_type, question_index, max_lines) VALUES ($1, 'questao_discursiva', 2, 30)`, [examId]);
      } else {
        // Select random objective questions
        const qs = await query<Question>(
          `SELECT * FROM questions WHERE archived = 0 ORDER BY RANDOM() LIMIT $1`,
          [questionCount]
        );

        // Create answer placeholders
        for (const q of qs) {
          await execute(
            `INSERT INTO exam_answers (exam_id, question_id) VALUES ($1, $2)`,
            [examId, q.id]
          );
        }
      }

      await get().resumeExam(examId);
      return examId;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  resumeExam: async (examId) => {
    const exams = await query<Exam>('SELECT * FROM exams WHERE id = $1', [examId]);
    if (exams.length === 0) return;

    if (exams[0].exam_type === 'discursive') {
      const discursiveList = await query<DiscursiveAnswer>(
        `SELECT * FROM discursive_answers WHERE exam_id = $1 ORDER BY id ASC`,
        [examId]
      );
      set({ activeExam: exams[0], activeQuestions: [], activeAnswers: {}, activeDiscursiveAnswers: discursiveList });
    } else {
      const qs = await query<Question>(
        `SELECT q.* FROM questions q 
         JOIN exam_answers ea ON q.id = ea.question_id 
         WHERE ea.exam_id = $1 ORDER BY ea.id ASC`,
        [examId]
      );

      const answersList = await query<ExamAnswer>(
        `SELECT * FROM exam_answers WHERE exam_id = $1`,
        [examId]
      );

      const activeAnswers: Record<number, string> = {};
      for (const a of answersList) {
        if (a.selected_answer) activeAnswers[a.question_id] = a.selected_answer;
      }

      set({ activeExam: exams[0], activeQuestions: qs, activeAnswers, activeDiscursiveAnswers: [] });
    }
  },

  answerQuestion: async (questionId, answer) => {
    const exam = get().activeExam;
    if (!exam) return;

    await execute(
      `UPDATE exam_answers SET selected_answer = $1, answered_at = datetime('now') WHERE exam_id = $2 AND question_id = $3`,
      [answer, exam.id, questionId]
    );

    set((state) => ({
      activeAnswers: { ...state.activeAnswers, [questionId]: answer }
    }));
  },

  answerDiscursive: async (answerId, content, lineCount) => {
    const exam = get().activeExam;
    if (!exam) return;

    await execute(
      `UPDATE discursive_answers SET content = $1, line_count = $2, updated_at = datetime('now') WHERE id = $3`,
      [content, lineCount, answerId]
    );

    set((state) => ({
      activeDiscursiveAnswers: state.activeDiscursiveAnswers.map(ans => 
        ans.id === answerId ? { ...ans, content, line_count: lineCount } : ans
      )
    }));
  },

  finishExam: async () => {
    const exam = get().activeExam;
    if (!exam) return null;

    // Calculate score
    // TCE-MA config: CG = 40 questions (1 pt each), CE = 60 questions (2 pt each). Cut-off: 64 pts (40%).
    // NOTE: This assumes Cebraspe Certo/Errado or multiple choice? Edital cargo 15 is Multiple Choice (A-E).
    // Multiple choice standard scoring: just +1/+2 for correct, 0 for wrong.
    // Let's dynamically check topic category to assign weights (CG=1, CE=2).
    
    let scoreCg = 0;
    let scoreCe = 0;

    const answersList = await query<{ selected_answer: string, correct_answer: string, category: string, question_id: number }>(
      `SELECT ea.selected_answer, ea.question_id, q.correct_answer, t.category 
       FROM exam_answers ea 
       JOIN questions q ON ea.question_id = q.id 
       LEFT JOIN topics t ON q.topic_id = t.id 
       WHERE ea.exam_id = $1`,
      [exam.id]
    );

    for (const a of answersList) {
      let isCorrect = 0;
      if (a.selected_answer && a.selected_answer === a.correct_answer) {
        isCorrect = 1;
        const weight = a.category === 'gerais' ? 1 : (a.category === 'especificos' ? 2 : 1); // default 1
        if (a.category === 'gerais') scoreCg += weight;
        else scoreCe += weight;
      }
      
      await execute(`UPDATE exam_answers SET is_correct = $1 WHERE exam_id = $2 AND question_id = $3`, [isCorrect, exam.id, a.question_id]);
    }

    const total = scoreCg + scoreCe;
    const eliminated = total < 64 ? 1 : 0;

    await execute(
      `UPDATE exams SET finished_at = datetime('now'), score_cg = $1, score_ce = $2, score_total = $3, is_eliminated = $4 WHERE id = $5`,
      [scoreCg, scoreCe, total, eliminated, exam.id]
    );

    // Add wrong answers to notes? Or just keep in exam history. We'll add wrong answers to notebook later if needed.

    set({ activeExam: null, activeQuestions: [], activeAnswers: {}, activeDiscursiveAnswers: [] });
    await get().fetchHistory();
    return exam.id;
  },

  getExamResults: async (examId) => {
    const exams = await query<Exam>('SELECT * FROM exams WHERE id = $1', [examId]);
    if (exams.length === 0) return null;

    const answersList = await query<ExamAnswer & Question>(
      `SELECT ea.*, q.statement, q.alt_a, q.alt_b, q.alt_c, q.alt_d, q.alt_e, q.correct_answer, q.explanation, t.title as topic_title
       FROM exam_answers ea 
       JOIN questions q ON ea.question_id = q.id 
       LEFT JOIN topics t ON q.topic_id = t.id
       WHERE ea.exam_id = $1 ORDER BY ea.id ASC`,
      [examId]
    );

    const mappedAnswers = answersList.map(a => ({
      id: a.id,
      exam_id: a.exam_id,
      question_id: a.question_id,
      selected_answer: a.selected_answer,
      is_correct: a.is_correct,
      question: {
        id: a.question_id,
        statement: a.statement,
        alt_a: a.alt_a,
        alt_b: a.alt_b,
        alt_c: a.alt_c,
        alt_d: a.alt_d,
        alt_e: a.alt_e,
        correct_answer: a.correct_answer,
        explanation: a.explanation,
        topic_title: (a as any).topic_title
      } as Question
    }));

    const discursiveAnswers = await query<DiscursiveAnswer>(
      `SELECT * FROM discursive_answers WHERE exam_id = $1 ORDER BY id ASC`,
      [examId]
    );

    return { exam: exams[0], answers: mappedAnswers, discursiveAnswers };
  }
}));
