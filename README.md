# Estudos TCE-MA 2026 (Cargo 15)

Aplicativo desktop **100% offline** e focado exclusivamente na preparação para o concurso do **Tribunal de Contas do Estado do Maranhão (Edital nº 1/2026)** para o **Cargo 15: Auditor Estadual de Controle Externo – Especialidade: Tecnologia da Informação**.

## Funcionalidades Principais

- **Planner Inteligente (Motor SM-2)**: Distribuição automática de horas de estudo entre Conhecimentos Gerais (35%) e Específicos (65%), respeitando a disponibilidade diária do usuário.
- **Edital Estruturado**: Todo o edital de TI já pré-cadastrado no banco de dados.
- **Banco de Questões e Simulados**: Avalie seu desempenho através de testes simulados e histórico real (com pesos 1x para Gerais e 2x para Específicos). 
- **Cadernos (Notebooks) com IA**: Acesse as anotações e os textos originais do edital. Integração de chat via **Ollama** (rodando localmente) para tutor particular focado apenas nos materiais do edital.
- **100% Local**: Sem nuvem, sem login. Os dados são armazenados de forma persistente e criptografada (se suportado pelo sistema) no seu próprio computador via SQLite (`~/.local/share/com.tce-ma-2026.cargo15/study.db`).

## Como Instalar (Fedora Linux / Wayland / Niri)

O pacote oficial é distribuído em `.rpm` ou `.AppImage`.

### Instalação via RPM
```bash
sudo dnf install target/release/bundle/rpm/*.rpm
```
*(Certifique-se de ter instalado os pacotes `webkit2gtk4.1` caso não tenha).*

Após a instalação, procure por **Estudos TCE-MA 2026** no launcher (Noctalia).

### Build a partir do código fonte
Se preferir compilar localmente:
```bash
npm install
npm run tauri build
```
Os executáveis finais serão gerados em `src-tauri/target/release/bundle/`.

## Stack Tecnológica

- **Frontend**: React, TypeScript, Zustand, Recharts, CSS Custom Properties (tema escuro e vívido).
- **Backend (Desktop)**: Tauri 2.x, Rust, SQLite (via `tauri-plugin-sql`), Keyring (GNOME Keyring / Libsecret).
