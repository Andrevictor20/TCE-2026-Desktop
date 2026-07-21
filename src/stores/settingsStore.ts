import { create } from 'zustand';
import { query, execute } from '../lib/db';

export interface AvailabilityDay {
  day_of_week: number;
  enabled: boolean;
  hours: number;
}

export interface Settings {
  theme: string;
  split_cg_percent: number;
  split_ce_percent: number;
  review_block_days: number;
  full_sim_frequency_weeks: number;
  block_duration_minutes: number;
  block_break_minutes: number;
  language: string;
  llm_provider: string;
  ollama_url: string;
}

interface SettingsStore {
  settings: Settings;
  availability: AvailabilityDay[];
  loading: boolean;
  fetchSettings: () => Promise<void>;
  fetchAvailability: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  updateAvailability: (day: number, enabled: boolean, hours: number) => Promise<void>;
}

const defaultSettings: Settings = {
  theme: 'system',
  split_cg_percent: 35,
  split_ce_percent: 65,
  review_block_days: 10,
  full_sim_frequency_weeks: 3,
  block_duration_minutes: 60,
  block_break_minutes: 5,
  language: 'pt-BR',
  llm_provider: 'none',
  ollama_url: 'http://localhost:11434',
};

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export { DAY_NAMES };

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: { ...defaultSettings },
  availability: [],
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const rows = await query<{ key: string; value: string }>('SELECT key, value FROM settings');
      const s = { ...defaultSettings };
      for (const row of rows) {
        if (row.key in s) {
          const k = row.key as keyof Settings;
          if (typeof s[k] === 'number') {
            (s as Record<string, unknown>)[k] = Number(row.value);
          } else {
            (s as Record<string, unknown>)[k] = row.value;
          }
        }
      }
      set({ settings: s, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchAvailability: async () => {
    try {
      const rows = await query<{ day_of_week: number; enabled: number; hours: number }>(
        'SELECT day_of_week, enabled, hours FROM availability ORDER BY day_of_week'
      );
      set({
        availability: rows.map(r => ({
          day_of_week: r.day_of_week,
          enabled: r.enabled === 1,
          hours: r.hours,
        })),
      });
    } catch { /* ignore */ }
  },

  updateSetting: async (key, value) => {
    await execute(
      'INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)',
      [key, value]
    );
    const s = { ...get().settings };
    if (key in s) {
      const k = key as keyof Settings;
      if (typeof s[k] === 'number') {
        (s as Record<string, unknown>)[k] = Number(value);
      } else {
        (s as Record<string, unknown>)[k] = value;
      }
    }
    set({ settings: s });
  },

  updateAvailability: async (day, enabled, hours) => {
    await execute(
      'INSERT OR REPLACE INTO availability (day_of_week, enabled, hours) VALUES ($1, $2, $3)',
      [day, enabled ? 1 : 0, hours]
    );
    const avail = get().availability.map(a =>
      a.day_of_week === day ? { ...a, enabled, hours } : a
    );
    set({ availability: avail });
  },
}));
