import { useEffect } from 'react';
import { useSettingsStore, DAY_NAMES } from '../stores/settingsStore';

export default function Settings() {
  const {
    settings,
    availability,
    fetchSettings,
    fetchAvailability,
    updateSetting,
    updateAvailability,
  } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
    fetchAvailability();
  }, []);

  return (
    <div id="settings-page">
      <div className="section-header">
        <h1 className="section-title">Configurações</h1>
      </div>

      {/* Perfil de Disponibilidade */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card__header">
          <h2 className="card__title">📅 Perfil de Disponibilidade</h2>
        </div>
        <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-md)' }}>
          Configure quantas horas por dia da semana você pode dedicar aos estudos. O Planner usará esses valores para gerar sua sessão diária.
        </p>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Dia</th>
                <th>Habilitado</th>
                <th>Horas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {availability.map((day) => (
                <tr key={day.day_of_week}>
                  <td style={{ fontWeight: 500 }}>{DAY_NAMES[day.day_of_week]}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(e) => updateAvailability(day.day_of_week, e.target.checked, day.hours)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: 80 }}
                      min={0.5}
                      max={12}
                      step={0.5}
                      value={day.hours}
                      onChange={(e) => updateAvailability(day.day_of_week, day.enabled, Number(e.target.value))}
                      disabled={!day.enabled}
                    />
                  </td>
                  <td className="text-xs text-muted">
                    {day.enabled ? `${day.hours}h/dia` : 'Descanso'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="alert alert--info" style={{ marginTop: 'var(--space-md)' }}>
          💡 Ajuste a capacidade do dia diretamente no Dashboard para dias com imprevistos, sem alterar o perfil geral.
        </div>
      </div>

      {/* Distribuição CG/CE */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card__header">
          <h2 className="card__title">⚖️ Distribuição de Peso</h2>
        </div>
        <div className="form-group">
          <label className="form-label">
            Split Conhecimentos Gerais / Específicos: {settings.split_cg_percent}% / {settings.split_ce_percent}%
          </label>
          <input
            type="range"
            className="form-slider"
            min={10}
            max={90}
            value={settings.split_cg_percent}
            onChange={(e) => {
              const cg = Number(e.target.value);
              updateSetting('split_cg_percent', String(cg));
              updateSetting('split_ce_percent', String(100 - cg));
            }}
          />
          <div className="flex justify-between text-xs text-muted" style={{ marginTop: 'var(--space-xs)' }}>
            <span>Gerais ({settings.split_cg_percent}%) — 40 questões, 1 pt/questão</span>
            <span>Específicos ({settings.split_ce_percent}%) — 60 questões, 2 pts/questão</span>
          </div>
        </div>
      </div>

      {/* Planner Config */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card__header">
          <h2 className="card__title">📊 Configurações do Planner</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Bloco de revisão final (dias úteis)</label>
            <input
              type="number"
              className="form-input"
              min={5}
              max={20}
              value={settings.review_block_days}
              onChange={(e) => updateSetting('review_block_days', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Frequência de simulados completos (semanas)</label>
            <select
              className="form-input form-select"
              value={settings.full_sim_frequency_weeks}
              onChange={(e) => updateSetting('full_sim_frequency_weeks', e.target.value)}
            >
              <option value="2">A cada 2 semanas</option>
              <option value="3">A cada 3 semanas</option>
              <option value="4">A cada 4 semanas</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Duração de cada bloco (minutos)</label>
            <input
              type="number"
              className="form-input"
              min={30}
              max={120}
              step={15}
              value={settings.block_duration_minutes}
              onChange={(e) => updateSetting('block_duration_minutes', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pausa entre blocos (minutos)</label>
            <input
              type="number"
              className="form-input"
              min={0}
              max={30}
              step={5}
              value={settings.block_break_minutes}
              onChange={(e) => updateSetting('block_break_minutes', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tema */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card__header">
          <h2 className="card__title">🎨 Aparência</h2>
        </div>
        <div className="form-group">
          <label className="form-label">Tema</label>
          <div className="flex gap-sm">
            {['system', 'dark', 'light'].map(t => (
              <button
                key={t}
                className={`btn btn--sm ${settings.theme === t ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => {
                  updateSetting('theme', t);
                  if (t === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    document.documentElement.removeAttribute('data-theme');
                  }
                }}
              >
                {t === 'system' ? '🖥️ Sistema' : t === 'dark' ? '🌙 Escuro' : '☀️ Claro'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* API / Chat */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card__header">
          <h2 className="card__title">🤖 Chat LLM (Opcional)</h2>
        </div>
        <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-md)' }}>
          Configure uma fonte de LLM para o painel de chat dos notebooks. Se nenhuma estiver configurada, o chat fica desabilitado mas todo o restante do app funciona normalmente.
        </p>

        <div className="form-group">
          <label className="form-label">Provedor</label>
          <div className="flex gap-sm">
            {[
              { value: 'none', label: 'Nenhum' },
              { value: 'anthropic', label: 'Anthropic (Claude)' },
              { value: 'openai', label: 'OpenAI (GPT)' },
              { value: 'ollama', label: 'Ollama (Local)' },
            ].map(p => (
              <button
                key={p.value}
                className={`btn btn--sm ${settings.llm_provider === p.value ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => updateSetting('llm_provider', p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {settings.llm_provider === 'ollama' && (
          <div className="form-group">
            <label className="form-label">URL do Ollama</label>
            <input
              type="text"
              className="form-input"
              value={settings.ollama_url}
              onChange={(e) => updateSetting('ollama_url', e.target.value)}
              placeholder="http://localhost:11434"
            />
          </div>
        )}

        {(settings.llm_provider === 'anthropic' || settings.llm_provider === 'openai') && (
          <div className="form-group">
            <label className="form-label">Chave de API ({settings.llm_provider})</label>
            <div className="flex gap-sm">
              <input
                type="password"
                className="form-input"
                placeholder="sk-..."
                style={{ flex: 1 }}
                id="api-key-input"
              />
              <button
                className="btn btn--primary btn--sm"
                onClick={async () => {
                  const input = document.getElementById('api-key-input') as HTMLInputElement;
                  if (input.value) {
                    const { invoke } = await import('@tauri-apps/api/core');
                    await invoke('set_api_key', { provider: settings.llm_provider, key: input.value });
                    input.value = '';
                    alert('Chave salva!');
                  }
                }}
              >
                Salvar no Keyring
              </button>
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 'var(--space-xs)' }}>
              A chave será armazenada no keyring do sistema (Secret Service/libsecret).
            </div>
          </div>
        )}
      </div>

      {/* Backup */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">💾 Backup & Restauração</h2>
        </div>
        <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-md)' }}>
          O banco de dados está em <code>~/.local/share/com.tce-ma-2026.cargo15/study.db</code>
        </p>
        <div className="flex gap-sm">
          <button className="btn btn--secondary">📤 Exportar Backup (.db)</button>
          <button className="btn btn--secondary">📥 Importar Backup</button>
        </div>
      </div>
    </div>
  );
}
