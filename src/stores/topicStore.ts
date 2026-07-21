import { create } from 'zustand';
import { query, execute } from '../lib/db';

export interface Topic {
  id: number;
  parent_id: number | null;
  category: 'gerais' | 'especificos';
  title: string;
  level: number;
  sort_order: number;
  status: 'not_started' | 'studying' | 'review' | 'mastered';
  weight_manual: number;
  edital_text: string | null;
  notebooklm_url: string | null;
  children?: Topic[];
}

interface TopicStore {
  topics: Topic[];
  selectedTopicId: number | null;
  loading: boolean;
  error: string | null;
  fetchTopics: () => Promise<void>;
  selectTopic: (id: number | null) => void;
  updateTopicStatus: (id: number, status: Topic['status']) => Promise<void>;
  updateTopicWeight: (id: number, weight: number) => Promise<void>;
  updateNotebookUrl: (id: number, url: string) => Promise<void>;
  getTopicTree: (category?: 'gerais' | 'especificos') => Topic[];
  getTopicById: (id: number) => Topic | undefined;
  getDisciplines: () => Topic[];
  getProgressByCategory: (category: 'gerais' | 'especificos') => { total: number; studied: number; percent: number };
}

function buildTree(topics: Topic[], parentId: number | null = null): Topic[] {
  return topics
    .filter(t => t.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(t => ({
      ...t,
      children: buildTree(topics, t.id),
    }));
}

export const useTopicStore = create<TopicStore>((set, get) => ({
  topics: [],
  selectedTopicId: null,
  loading: false,
  error: null,

  fetchTopics: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await query<Topic>(
        'SELECT id, parent_id, category, title, level, sort_order, status, weight_manual, edital_text, notebooklm_url FROM topics ORDER BY sort_order'
      );
      set({ topics: rows, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  selectTopic: (id) => set({ selectedTopicId: id }),

  updateTopicStatus: async (id, status) => {
    await execute('UPDATE topics SET status = $1, updated_at = datetime("now") WHERE id = $2', [status, id]);
    const topics = get().topics.map(t => t.id === id ? { ...t, status } : t);
    set({ topics });
  },

  updateTopicWeight: async (id, weight) => {
    await execute('UPDATE topics SET weight_manual = $1, updated_at = datetime("now") WHERE id = $2', [weight, id]);
    const topics = get().topics.map(t => t.id === id ? { ...t, weight_manual: weight } : t);
    set({ topics });
  },

  updateNotebookUrl: async (id, url) => {
    await execute('UPDATE topics SET notebooklm_url = $1, updated_at = datetime("now") WHERE id = $2', [url, id]);
    const topics = get().topics.map(t => t.id === id ? { ...t, notebooklm_url: url } : t);
    set({ topics });
  },

  getTopicTree: (category) => {
    const { topics } = get();
    const filtered = category ? topics.filter(t => t.category === category) : topics;
    return buildTree(filtered);
  },

  getTopicById: (id) => get().topics.find(t => t.id === id),

  getDisciplines: () => get().topics.filter(t => t.level === 0).sort((a, b) => {
    if (a.category === b.category) return a.sort_order - b.sort_order;
    return a.category === 'gerais' ? -1 : 1;
  }),

  getProgressByCategory: (category) => {
    const { topics } = get();
    const categoryTopics = topics.filter(t => t.category === category && t.level > 0);
    const total = categoryTopics.length;
    const studied = categoryTopics.filter(t => t.status !== 'not_started').length;
    return { total, studied, percent: total > 0 ? Math.round((studied / total) * 100) : 0 };
  },
}));
