import { create } from 'zustand';
import { query, execute } from '../lib/db';

export interface Note {
  id: number;
  topic_id: number;
  content: string;
  note_type: string;
}

export interface ChatMessage {
  id: number;
  topic_id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface NotebookStore {
  activeTopicId: number | null;
  note: Note | null;
  chatHistory: ChatMessage[];
  editalText: string;

  loadTopic: (topicId: number) => Promise<void>;
  saveNote: (content: string) => Promise<void>;
  sendMessage: (content: string, provider: 'ollama' | 'openai' | 'anthropic') => Promise<void>;
}

export const useNotebookStore = create<NotebookStore>((set, get) => ({
  activeTopicId: null,
  note: null,
  chatHistory: [],
  editalText: '',

  loadTopic: async (topicId) => {
    // Fetch Edital text
    const topics = await query<{ edital_text: string }>('SELECT edital_text FROM topics WHERE id = $1', [topicId]);
    const editalText = topics[0]?.edital_text || '';

    // Fetch Note
    const notes = await query<Note>('SELECT * FROM notes WHERE topic_id = $1 AND note_type = "user_note"', [topicId]);
    let note = notes[0] || null;
    
    // Create empty note if doesn't exist
    if (!note) {
      await execute('INSERT INTO notes (topic_id, content, note_type) VALUES ($1, "", "user_note")', [topicId]);
      const newNotes = await query<Note>('SELECT * FROM notes WHERE topic_id = $1 AND note_type = "user_note"', [topicId]);
      note = newNotes[0];
    }

    // Fetch Chat History
    const chat = await query<ChatMessage>('SELECT * FROM chat_history WHERE topic_id = $1 ORDER BY id ASC', [topicId]);

    set({ activeTopicId: topicId, note, chatHistory: chat, editalText });
  },

  saveNote: async (content) => {
    const { note } = get();
    if (!note) return;
    await execute('UPDATE notes SET content = $1, updated_at = datetime("now") WHERE id = $2', [content, note.id]);
    set({ note: { ...note, content } });
  },

  sendMessage: async (content, provider) => {
    const { activeTopicId, chatHistory, editalText } = get();
    if (!activeTopicId) return;

    // Save user message
    const userRes = await execute(
      'INSERT INTO chat_history (topic_id, role, content) VALUES ($1, "user", $2)',
      [activeTopicId, content]
    );
    const userMsg: ChatMessage = { id: userRes.lastInsertId!, topic_id: activeTopicId, role: 'user', content };
    
    set({ chatHistory: [...chatHistory, userMsg] });

    // Mock response for now (since we don't have API keys setup yet)
    // In a real app, this would use fetch() to Ollama or invoke Tauri command for OpenAI.
    const botReply = `(Simulação) Resposta do ${provider} baseada no seu edital: \n\n${editalText.substring(0, 50)}...`;

    const botRes = await execute(
      'INSERT INTO chat_history (topic_id, role, content, model_used) VALUES ($1, "assistant", $2, $3)',
      [activeTopicId, botReply, provider]
    );
    const botMsg: ChatMessage = { id: botRes.lastInsertId!, topic_id: activeTopicId, role: 'assistant', content: botReply };
    
    set({ chatHistory: [...get().chatHistory, botMsg] });
  }
}));
