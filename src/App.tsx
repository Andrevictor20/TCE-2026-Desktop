import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EditalTree from './pages/EditalTree';
import Planner from './pages/Planner';
import QuestionBank from './pages/QuestionBank';
import QuestionImport from './pages/QuestionImport';
import Exams from './pages/Exams';
import ExamSession from './pages/ExamSession';
import ExamResults from './pages/ExamResults';
import ExamDiscovery from './pages/ExamDiscovery';
import Notebooks from './pages/Notebooks';
import Settings from './pages/Settings';
import './styles/index.css';
import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';
import { useEffect } from 'react';
import { usePlannerStore } from './stores/plannerStore';

export default function App() {
  const { fetchTodaySession, generatePlan } = usePlannerStore();

  useEffect(() => {
    const bootPlanner = async () => {
      await fetchTodaySession();
      const today = new Date();
      const isWeekday = today.getDay() >= 1 && today.getDay() <= 5;
      
      // We check the fresh state from store after fetch
      const session = usePlannerStore.getState().todaySession;
      if (isWeekday && !session) {
        await generatePlan();
      }
    };

    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) {
          const yes = await ask(`Uma nova versão do app está disponível (${update.version}). Deseja instalar agora?`, {
            title: 'Atualização Disponível',
            kind: 'info',
          });
          if (yes) {
            await update.downloadAndInstall();
            await relaunch();
          }
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    };

    bootPlanner();
    checkForUpdates();
  }, []);

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Top Bar */}
        <header className="app-topbar">
          <span className="app-topbar__title">
            Estudos TCE-MA 2026 — Auditor TI (Cargo 15)
          </span>
          <div className="app-topbar__actions">
            <span className="text-xs text-muted">v0.1.0</span>
          </div>
        </header>

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/edital" element={<EditalTree />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/questions" element={<QuestionBank />} />
            <Route path="/questions/import" element={<QuestionImport />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/exams/:id" element={<ExamSession />} />
            <Route path="/exams/:id/results" element={<ExamResults />} />
            <Route path="/discovery" element={<ExamDiscovery />} />
            <Route path="/notebooks" element={<Notebooks />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
