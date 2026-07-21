import { create } from 'zustand';
import { query } from '../lib/db';
import { generateWeeklyPlan, completeSessionBlock } from '../lib/plannerEngine';
import { format } from 'date-fns';

export interface SessionBlock {
  id: number;
  session_id: number;
  topic_id: number | null;
  topic_title?: string;
  block_type: string;
  duration_minutes: number;
  sort_order: number;
  status: string;
}

export interface DailySession {
  id: number;
  session_date: string;
  planned_hours: number;
  actual_hours: number;
  status: string;
  blocks: SessionBlock[];
}

interface PlannerStore {
  todaySession: DailySession | null;
  loading: boolean;
  fetchTodaySession: () => Promise<void>;
  generatePlan: () => Promise<void>;
  completeBlock: (blockId: number, duration: number, quality: number) => Promise<void>;
  weeklyPlan: DailySession[];
  fetchWeeklyPlan: () => Promise<void>;
  adherenceData: any[];
  fetchAdherence: () => Promise<void>;
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  todaySession: null,
  loading: false,
  weeklyPlan: [],
  adherenceData: [],

  fetchTodaySession: async () => {
    set({ loading: true });
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const sessions = await query<DailySession>('SELECT * FROM daily_sessions WHERE session_date = $1', [todayStr]);
      
      if (sessions.length > 0) {
        const session = sessions[0];
        const blocks = await query<SessionBlock>(
          `SELECT sb.*, t.title as topic_title 
           FROM session_blocks sb 
           LEFT JOIN topics t ON sb.topic_id = t.id 
           WHERE sb.session_id = $1 
           ORDER BY sb.sort_order`,
          [session.id]
        );
        session.blocks = blocks;
        set({ todaySession: session, loading: false });
      } else {
        set({ todaySession: null, loading: false });
      }
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  fetchWeeklyPlan: async () => {
    set({ loading: true });
    try {
      const sessions = await query<DailySession>('SELECT * FROM daily_sessions ORDER BY session_date DESC LIMIT 7');
      for (const session of sessions) {
        const blocks = await query<SessionBlock>(
          `SELECT sb.*, t.title as topic_title FROM session_blocks sb LEFT JOIN topics t ON sb.topic_id = t.id WHERE sb.session_id = $1 ORDER BY sb.sort_order`,
          [session.id]
        );
        session.blocks = blocks;
      }
      set({ weeklyPlan: sessions.reverse(), loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  fetchAdherence: async () => {
    try {
      // Group by week or just show last 7 days
      const data = await query<{ session_date: string, planned_hours: number, actual_hours: number }>(
        'SELECT session_date, planned_hours, actual_hours FROM daily_sessions ORDER BY session_date ASC LIMIT 30'
      );
      set({ adherenceData: data });
    } catch (e) {
      console.error(e);
    }
  },

  generatePlan: async () => {
    set({ loading: true });
    try {
      await generateWeeklyPlan(new Date());
      await get().fetchTodaySession();
      await get().fetchWeeklyPlan();
      await get().fetchAdherence();
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  completeBlock: async (blockId, duration, quality) => {
    await completeSessionBlock(blockId, duration, quality);
    await get().fetchTodaySession();
    await get().fetchWeeklyPlan();
    await get().fetchAdherence();
  }
}));
