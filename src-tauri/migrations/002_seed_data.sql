-- ============================================================
-- TCE-MA 2026 — Cargo 15 — Seed Inicial
-- Todos os tópicos extraídos literalmente do edital
-- ============================================================

-- Metadados do concurso
INSERT INTO contest_meta (key, value) VALUES
  ('cargo', 'Auditor Estadual de Controle Externo – Especialidade: Tecnologia da Informação'),
  ('cargo_numero', '15'),
  ('remuneracao', 'R$ 20.112,20'),
  ('jornada', '30 horas semanais'),
  ('vagas_ac', '3'),
  ('vagas_pcd', '0'),
  ('vagas_pp', '1'),
  ('vagas_total', '4'),
  ('banca', 'Cebraspe'),
  ('data_prova', '2026-11-29'),
  ('data_inscricao_inicio', '2026-07-17'),
  ('data_inscricao_fim', '2026-08-21'),
  ('data_pagamento_taxa', '2026-09-15'),
  ('data_locais_prova', '2026-11-06'),
  ('data_gabarito', '2026-12-04'),
  ('data_resultado_final', '2027-01-06'),
  ('prova_objetiva_questoes_cg', '40'),
  ('prova_objetiva_peso_cg', '1.00'),
  ('prova_objetiva_questoes_ce', '60'),
  ('prova_objetiva_peso_ce', '2.00'),
  ('prova_objetiva_total_pontos', '160.00'),
  ('prova_objetiva_duracao_horas', '5'),
  ('prova_objetiva_nota_corte', '64.00'),
  ('prova_discursiva_total_pontos', '40.00'),
  ('prova_discursiva_duracao_horas', '4'),
  ('prova_discursiva_nota_corte', '20.00'),
  ('aprovados_objetiva_ac', '75'),
  ('aprovados_objetiva_pcd', '10'),
  ('aprovados_objetiva_pp', '25');

-- Configurações padrão
INSERT INTO settings (key, value) VALUES
  ('theme', 'system'),
  ('split_cg_percent', '35'),
  ('split_ce_percent', '65'),
  ('review_block_days', '10'),
  ('full_sim_frequency_weeks', '3'),
  ('block_duration_minutes', '60'),
  ('block_break_minutes', '5'),
  ('language', 'pt-BR'),
  ('llm_provider', 'none'),
  ('ollama_url', 'http://localhost:11434');

-- Disponibilidade padrão (seg-sex 5h, sáb-dom desabilitados)
INSERT INTO availability (day_of_week, enabled, hours) VALUES
  (0, 0, 0),   -- Domingo
  (1, 1, 5.0), -- Segunda
  (2, 1, 5.0), -- Terça
  (3, 1, 5.0), -- Quarta
  (4, 1, 5.0), -- Quinta
  (5, 1, 5.0), -- Sexta
  (6, 0, 0);   -- Sábado

-- ============================================================
-- CONHECIMENTOS GERAIS (9 disciplinas)
-- ============================================================

-- 1. LÍNGUA PORTUGUESA
INSERT INTO topics (parent_id, category, title, level, sort_order, edital_text) VALUES
  (NULL, 'gerais', 'Língua Portuguesa', 0, 1, 'Compreensão e interpretação de textos de gêneros variados. Reconhecimento de tipos e gêneros textuais. Domínio da ortografia oficial. Domínio dos mecanismos de coesão textual. Emprego de elementos de referenciação, substituição e repetição, de conectores e de outros elementos de sequenciação textual. Emprego de tempos e modos verbais. Domínio da estrutura morfossintática do período. Emprego das classes de palavras. Relações de coordenação entre orações e entre termos da oração. Relações de subordinação entre orações e entre termos da oração. Emprego dos sinais de pontuação. Concordância verbal e nominal. Regência verbal e nominal. Emprego do sinal indicativo de crase. Colocação dos pronomes átonos. Reescrita de frases e parágrafos do texto. Significação das palavras. Substituição de palavras ou de trechos de texto. Reorganização da estrutura de orações e de períodos do texto. Reescrita de textos de diferentes gêneros e níveis de formalidade.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (1, 'gerais', 'Compreensão e interpretação de textos de gêneros variados', 1, 1),
  (1, 'gerais', 'Reconhecimento de tipos e gêneros textuais', 1, 2),
  (1, 'gerais', 'Domínio da ortografia oficial', 1, 3),
  (1, 'gerais', 'Domínio dos mecanismos de coesão textual', 1, 4),
  (1, 'gerais', 'Emprego de elementos de referenciação, substituição e repetição, de conectores e de outros elementos de sequenciação textual', 1, 5),
  (1, 'gerais', 'Emprego de tempos e modos verbais', 1, 6),
  (1, 'gerais', 'Domínio da estrutura morfossintática do período', 1, 7),
  (1, 'gerais', 'Emprego das classes de palavras', 1, 8),
  (1, 'gerais', 'Relações de coordenação entre orações e entre termos da oração', 1, 9),
  (1, 'gerais', 'Relações de subordinação entre orações e entre termos da oração', 1, 10),
  (1, 'gerais', 'Emprego dos sinais de pontuação', 1, 11),
  (1, 'gerais', 'Concordância verbal e nominal', 1, 12),
  (1, 'gerais', 'Regência verbal e nominal', 1, 13),
  (1, 'gerais', 'Emprego do sinal indicativo de crase', 1, 14),
  (1, 'gerais', 'Colocação dos pronomes átonos', 1, 15),
  (1, 'gerais', 'Reescrita de frases e parágrafos do texto', 1, 16),
  (1, 'gerais', 'Significação das palavras', 1, 17),
  (1, 'gerais', 'Substituição de palavras ou de trechos de texto', 1, 18),
  (1, 'gerais', 'Reorganização da estrutura de orações e de períodos do texto', 1, 19),
  (1, 'gerais', 'Reescrita de textos de diferentes gêneros e níveis de formalidade', 1, 20);

-- 2. COMPETÊNCIAS DIGITAIS E INFORMÁTICA APLICADA AO SETOR PÚBLICO
INSERT INTO topics (parent_id, category, title, level, sort_order, edital_text) VALUES
  (NULL, 'gerais', 'Competências Digitais e Informática Aplicada ao Setor Público', 0, 2, 'Cultura digital e letramento digital no setor público. Noções de sistema operacional (ambiente Windows). Edição de textos, planilhas e apresentações (pacotes Microsoft Office). Redes de computadores. Conceitos básicos, ferramentas, aplicativos e procedimentos de Internet. Noções de LGPD (Lei nº 13.709/2018). Fundamentos de segurança da informação. Plataforma Gov.br. SEI (Sistema Eletrônico de Informações). PEN (Processo Eletrônico Nacional). Inteligência artificial aplicada ao setor público.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (22, 'gerais', 'Cultura digital e letramento digital no setor público', 1, 1),
  (22, 'gerais', 'Noções de sistema operacional (ambiente Windows)', 1, 2),
  (22, 'gerais', 'Edição de textos, planilhas e apresentações (pacotes Microsoft Office)', 1, 3),
  (22, 'gerais', 'Redes de computadores', 1, 4),
  (22, 'gerais', 'Conceitos básicos, ferramentas, aplicativos e procedimentos de Internet', 1, 5),
  (22, 'gerais', 'Noções de LGPD (Lei nº 13.709/2018)', 1, 6),
  (22, 'gerais', 'Fundamentos de segurança da informação', 1, 7),
  (22, 'gerais', 'Plataforma Gov.br', 1, 8),
  (22, 'gerais', 'SEI (Sistema Eletrônico de Informações)', 1, 9),
  (22, 'gerais', 'PEN (Processo Eletrônico Nacional)', 1, 10),
  (22, 'gerais', 'Inteligência artificial aplicada ao setor público', 1, 11);

-- 3. RACIOCÍNIO LÓGICO
INSERT INTO topics (parent_id, category, title, level, sort_order, edital_text) VALUES
  (NULL, 'gerais', 'Raciocínio Lógico', 0, 3, 'Estruturas lógicas. Lógica de argumentação: analogias, inferências, deduções e conclusões. Lógica sentencial (ou proposicional). Proposições simples e compostas. Tabelas-verdade. Equivalências. Leis de De Morgan. Diagramas lógicos. Lógica de primeira ordem. Princípios de contagem e probabilidade. Operações com conjuntos. Raciocínio lógico envolvendo problemas aritméticos, geométricos e matriciais.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (34, 'gerais', 'Estruturas lógicas', 1, 1),
  (34, 'gerais', 'Lógica de argumentação: analogias, inferências, deduções e conclusões', 1, 2),
  (34, 'gerais', 'Lógica sentencial (ou proposicional)', 1, 3),
  (34, 'gerais', 'Proposições simples e compostas', 1, 4),
  (34, 'gerais', 'Tabelas-verdade', 1, 5),
  (34, 'gerais', 'Equivalências', 1, 6),
  (34, 'gerais', 'Leis de De Morgan', 1, 7),
  (34, 'gerais', 'Diagramas lógicos', 1, 8),
  (34, 'gerais', 'Lógica de primeira ordem', 1, 9),
  (34, 'gerais', 'Princípios de contagem e probabilidade', 1, 10),
  (34, 'gerais', 'Operações com conjuntos', 1, 11),
  (34, 'gerais', 'Raciocínio lógico envolvendo problemas aritméticos, geométricos e matriciais', 1, 12);

-- 4. DIREITO ADMINISTRATIVO
INSERT INTO topics (parent_id, category, title, level, sort_order, edital_text) VALUES
  (NULL, 'gerais', 'Direito Administrativo', 0, 4, 'Estado, governo e administração pública. Direito administrativo. Fontes do direito administrativo. Administração pública. Organização administrativa. Agentes públicos. Poderes administrativos. Ato administrativo. Controle e responsabilização da administração. Contrato administrativo. Licitação (Lei nº 14.133/2021). Desapropriação. Serviços públicos. Responsabilidade civil do Estado.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (47, 'gerais', 'Estado, governo e administração pública', 1, 1),
  (47, 'gerais', 'Direito administrativo: conceito e fontes', 1, 2),
  (47, 'gerais', 'Administração pública: conceito e princípios', 1, 3),
  (47, 'gerais', 'Organização administrativa: administração direta e indireta', 1, 4),
  (47, 'gerais', 'Agentes públicos', 1, 5),
  (47, 'gerais', 'Poderes administrativos', 1, 6),
  (47, 'gerais', 'Ato administrativo', 1, 7),
  (47, 'gerais', 'Controle e responsabilização da administração', 1, 8),
  (47, 'gerais', 'Contrato administrativo', 1, 9),
  (47, 'gerais', 'Licitação (Lei nº 14.133/2021)', 1, 10),
  (47, 'gerais', 'Desapropriação', 1, 11),
  (47, 'gerais', 'Serviços públicos', 1, 12),
  (47, 'gerais', 'Responsabilidade civil do Estado', 1, 13);

-- 5. DIREITO CONSTITUCIONAL
INSERT INTO topics (parent_id, category, title, level, sort_order, edital_text) VALUES
  (NULL, 'gerais', 'Direito Constitucional', 0, 5, 'Constituição da República Federativa do Brasil de 1988. Princípios fundamentais. Aplicabilidade das normas constitucionais. Direitos e garantias fundamentais. Organização político-administrativa do Estado. Administração pública. Poder Legislativo. Poder Executivo. Poder Judiciário. Funções essenciais à justiça. Constituição do Estado do Maranhão.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (61, 'gerais', 'Constituição da República Federativa do Brasil de 1988', 1, 1),
  (61, 'gerais', 'Princípios fundamentais', 1, 2),
  (61, 'gerais', 'Aplicabilidade das normas constitucionais', 1, 3),
  (61, 'gerais', 'Direitos e garantias fundamentais', 1, 4),
  (61, 'gerais', 'Organização político-administrativa do Estado', 1, 5),
  (61, 'gerais', 'Administração pública', 1, 6),
  (61, 'gerais', 'Poder Legislativo', 1, 7),
  (61, 'gerais', 'Poder Executivo', 1, 8),
  (61, 'gerais', 'Poder Judiciário', 1, 9),
  (61, 'gerais', 'Funções essenciais à justiça', 1, 10),
  (61, 'gerais', 'Constituição do Estado do Maranhão', 1, 11);

-- 6. CONTROLE EXTERNO
INSERT INTO topics (parent_id, category, title, level, sort_order, edital_text) VALUES
  (NULL, 'gerais', 'Controle Externo', 0, 6, 'Conceito, tipos e formas de controle. Controle interno e externo. Controle parlamentar. Controle pelos tribunais de contas. Controle administrativo. Lei nº 8.429/1992 (Lei de Improbidade Administrativa). Sistemas de controle jurisdicional da administração pública: contencioso administrativo e sistema da jurisdição una. Controle jurisdicional da administração pública no direito brasileiro. Controle da atividade financeira do Estado: espécies e sistemas. Tribunal de Contas da União (TCU), tribunais de contas dos estados e do Distrito Federal. Tribunal de Contas do Estado do Maranhão na Constituição do Estado do Maranhão.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (73, 'gerais', 'Conceito, tipos e formas de controle', 1, 1),
  (73, 'gerais', 'Controle interno e externo', 1, 2),
  (73, 'gerais', 'Controle parlamentar', 1, 3),
  (73, 'gerais', 'Controle pelos tribunais de contas', 1, 4),
  (73, 'gerais', 'Controle administrativo', 1, 5),
  (73, 'gerais', 'Lei nº 8.429/1992 (Lei de Improbidade Administrativa)', 1, 6),
  (73, 'gerais', 'Sistemas de controle jurisdicional da administração pública', 1, 7),
  (73, 'gerais', 'Contencioso administrativo e sistema da jurisdição una', 2, 8),
  (73, 'gerais', 'Controle jurisdicional da administração pública no direito brasileiro', 1, 9),
  (73, 'gerais', 'Controle da atividade financeira do Estado: espécies e sistemas', 1, 10),
  (73, 'gerais', 'TCU, tribunais de contas dos estados e do Distrito Federal', 1, 11),
  (73, 'gerais', 'Tribunal de Contas do Estado do Maranhão na Constituição do Estado do Maranhão', 1, 12);

-- 7. LEGISLAÇÃO ESPECÍFICA
INSERT INTO topics (parent_id, category, title, level, sort_order, edital_text) VALUES
  (NULL, 'gerais', 'Legislação Específica', 0, 7, 'Regimento Interno do TCE/MA. Lei nº 8.258/2005 (Lei Orgânica do TCE/MA). Lei nº 9.936/2013 (Estatuto dos Servidores do TCE/MA). Instrução Normativa nº 50/2017 (Normas de Organização e de Processo do TCE/MA). Instrução Normativa nº 82/2025.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (86, 'gerais', 'Regimento Interno do TCE/MA', 1, 1),
  (86, 'gerais', 'Lei nº 8.258/2005 (Lei Orgânica do TCE/MA)', 1, 2),
  (86, 'gerais', 'Lei nº 9.936/2013 (Estatuto dos Servidores do TCE/MA)', 1, 3),
  (86, 'gerais', 'Instrução Normativa nº 50/2017 (Normas de Organização e de Processo do TCE/MA)', 1, 4),
  (86, 'gerais', 'Instrução Normativa nº 82/2025', 1, 5);

-- 8. HISTÓRIA E GEOGRAFIA DO MARANHÃO
INSERT INTO topics (parent_id, category, title, level, sort_order, edital_text) VALUES
  (NULL, 'gerais', 'História e Geografia do Maranhão', 0, 8, 'História do Maranhão colonial. Balaiada. Batalha do Jenipapo. Geografia física, humana e econômica do Maranhão.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (92, 'gerais', 'História do Maranhão colonial', 1, 1),
  (92, 'gerais', 'Balaiada', 1, 2),
  (92, 'gerais', 'Batalha do Jenipapo', 1, 3),
  (92, 'gerais', 'Geografia física do Maranhão', 1, 4),
  (92, 'gerais', 'Geografia humana do Maranhão', 1, 5),
  (92, 'gerais', 'Geografia econômica do Maranhão', 1, 6);

-- 9. NOÇÕES DE DIREITOS HUMANOS
INSERT INTO topics (parent_id, category, title, level, sort_order, edital_text) VALUES
  (NULL, 'gerais', 'Noções de Direitos Humanos', 0, 9, 'Declaração Universal dos Direitos Humanos (DUDH). Agenda 2030 para o Desenvolvimento Sustentável (ODS). Estatuto da Pessoa com Deficiência (Lei nº 13.146/2015). Estatuto da Igualdade Racial (Lei nº 12.288/2010).');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (99, 'gerais', 'Declaração Universal dos Direitos Humanos (DUDH)', 1, 1),
  (99, 'gerais', 'Agenda 2030 para o Desenvolvimento Sustentável (ODS)', 1, 2),
  (99, 'gerais', 'Estatuto da Pessoa com Deficiência (Lei nº 13.146/2015)', 1, 3),
  (99, 'gerais', 'Estatuto da Igualdade Racial (Lei nº 12.288/2010)', 1, 4);

-- ============================================================
-- CONHECIMENTOS ESPECÍFICOS — CARGO 15 (10 disciplinas)
-- ============================================================

-- 1. INFRAESTRUTURA DE TI
INSERT INTO topics (parent_id, category, title, level, sort_order, weight_manual, edital_text) VALUES
  (NULL, 'especificos', 'Infraestrutura de TI', 0, 1, 4, 'Redes de computadores. Modelo de referência OSI e arquitetura TCP/IP. Protocolos: SNMP, MIB, MPLS. Redes sem fio (IEEE 802.11, EAP, WEP, WPA2). Routing e switching. Segurança de redes: firewall, IDS/IPS, VPN, malwares. Criptografia simétrica e assimétrica. Sistemas operacionais: Windows Server, Linux (administração e shell script). Active Directory e LDAP. Computação em nuvem e virtualização. Servidores de aplicação. Data center: RAID, NAS/SAN, backup e recuperação de desastres. Conteinerização e DevOps.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (104, 'especificos', 'Redes de computadores e modelo OSI', 1, 1),
  (104, 'especificos', 'Arquitetura TCP/IP', 1, 2),
  (104, 'especificos', 'Protocolos: SNMP, MIB, MPLS', 1, 3),
  (104, 'especificos', 'Redes sem fio: IEEE 802.11, EAP, WEP, WPA2', 1, 4),
  (104, 'especificos', 'Routing e switching', 1, 5),
  (104, 'especificos', 'Segurança de redes: firewall, IDS/IPS, VPN, malwares', 1, 6),
  (104, 'especificos', 'Criptografia simétrica e assimétrica', 1, 7),
  (104, 'especificos', 'Sistemas operacionais: Windows Server e Linux', 1, 8),
  (104, 'especificos', 'Active Directory e LDAP', 1, 9),
  (104, 'especificos', 'Computação em nuvem e virtualização', 1, 10),
  (104, 'especificos', 'Servidores de aplicação', 1, 11),
  (104, 'especificos', 'Data center: RAID, NAS/SAN, backup', 1, 12),
  (104, 'especificos', 'Conteinerização e DevOps', 1, 13);

-- 2. ENGENHARIA DE DADOS
INSERT INTO topics (parent_id, category, title, level, sort_order, weight_manual, edital_text) VALUES
  (NULL, 'especificos', 'Engenharia de Dados', 0, 2, 4, 'Dado, informação e conhecimento. Bancos de dados relacionais e NoSQL. Modelagem de dados: conceitual, lógica e física. Normalização. SQL: DDL e DML. Administração de bancos de dados. ETL/ELT.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (118, 'especificos', 'Dado, informação e conhecimento', 1, 1),
  (118, 'especificos', 'Bancos de dados relacionais', 1, 2),
  (118, 'especificos', 'Bancos de dados NoSQL', 1, 3),
  (118, 'especificos', 'Modelagem de dados: conceitual, lógica e física', 1, 4),
  (118, 'especificos', 'Normalização', 1, 5),
  (118, 'especificos', 'SQL: DDL e DML', 1, 6),
  (118, 'especificos', 'Administração de bancos de dados', 1, 7),
  (118, 'especificos', 'ETL/ELT', 1, 8);

-- 3. ENGENHARIA DE SOFTWARE
INSERT INTO topics (parent_id, category, title, level, sort_order, weight_manual, edital_text) VALUES
  (NULL, 'especificos', 'Engenharia de Software', 0, 3, 4, 'Projeto de software. BDD, TDD e ATDD. Engenharia de requisitos. Histórias de usuário. Práticas ágeis: MVP, Scrum, Kanban. Testes de software. SonarQube. DevOps e CI/CD. Docker e Kubernetes.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (127, 'especificos', 'Projeto de software', 1, 1),
  (127, 'especificos', 'BDD, TDD e ATDD', 1, 2),
  (127, 'especificos', 'Engenharia de requisitos', 1, 3),
  (127, 'especificos', 'Histórias de usuário', 1, 4),
  (127, 'especificos', 'Práticas ágeis: MVP, Scrum, Kanban', 1, 5),
  (127, 'especificos', 'Testes de software', 1, 6),
  (127, 'especificos', 'SonarQube', 1, 7),
  (127, 'especificos', 'DevOps e CI/CD', 1, 8),
  (127, 'especificos', 'Docker e Kubernetes', 1, 9);

-- 4. SEGURANÇA DA INFORMAÇÃO
INSERT INTO topics (parent_id, category, title, level, sort_order, weight_manual, edital_text) VALUES
  (NULL, 'especificos', 'Segurança da Informação', 0, 4, 5, 'Política de segurança da informação (PSI). Autenticação e controle de acesso. Malwares. Golpes na internet. Ataques: DoS/DDoS, SQL injection, buffer overflow. Ransomware. DMZ. VPN. Criptografia e certificação digital. PKI. Honeypots. ISO 27001 e 27002. ISO 27005 e 15999.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (137, 'especificos', 'Política de segurança da informação (PSI)', 1, 1),
  (137, 'especificos', 'Autenticação e controle de acesso', 1, 2),
  (137, 'especificos', 'Malwares', 1, 3),
  (137, 'especificos', 'Golpes na internet', 1, 4),
  (137, 'especificos', 'Ataques: DoS/DDoS, SQL injection, buffer overflow', 1, 5),
  (137, 'especificos', 'Ransomware', 1, 6),
  (137, 'especificos', 'DMZ', 1, 7),
  (137, 'especificos', 'VPN', 1, 8),
  (137, 'especificos', 'Criptografia e certificação digital', 1, 9),
  (137, 'especificos', 'PKI (Infraestrutura de Chaves Públicas)', 1, 10),
  (137, 'especificos', 'Honeypots', 1, 11),
  (137, 'especificos', 'ISO 27001 e 27002', 1, 12),
  (137, 'especificos', 'ISO 27005 e 15999', 1, 13);

-- 5. GESTÃO E GOVERNANÇA DE TI
INSERT INTO topics (parent_id, category, title, level, sort_order, weight_manual, edital_text) VALUES
  (NULL, 'especificos', 'Gestão e Governança de TI', 0, 5, 5, 'COBIT 2019. ISO 38500. ISO 31000 e COSO. ITIL v4. PMBOK 8ª edição, Scrum e Kanban. PETI/PDTI. BPMN. LAI (Lei 12.527/2011 — Lei de Acesso à Informação). LGPD (Lei 13.709/2018). DAMA-DMBoK.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (151, 'especificos', 'COBIT 2019', 1, 1),
  (151, 'especificos', 'ISO 38500', 1, 2),
  (151, 'especificos', 'ISO 31000 e COSO', 1, 3),
  (151, 'especificos', 'ITIL v4', 1, 4),
  (151, 'especificos', 'PMBOK 8ª edição, Scrum e Kanban', 1, 5),
  (151, 'especificos', 'PETI/PDTI', 1, 6),
  (151, 'especificos', 'BPMN', 1, 7),
  (151, 'especificos', 'LAI (Lei 12.527/2011 — Lei de Acesso à Informação)', 1, 8),
  (151, 'especificos', 'LGPD (Lei 13.709/2018)', 1, 9),
  (151, 'especificos', 'DAMA-DMBoK', 1, 10);

-- 6. FISCALIZAÇÃO DE CONTRATOS DE TI
INSERT INTO topics (parent_id, category, title, level, sort_order, weight_manual, edital_text) VALUES
  (NULL, 'especificos', 'Fiscalização de Contratos de TI', 0, 6, 3, 'Lei 14.133/2021 (Nova Lei de Licitações e Contratos). IN SGD/ME nº 94/2022. IN SEGES/ME nº 65/2021.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (162, 'especificos', 'Lei 14.133/2021 (Nova Lei de Licitações e Contratos)', 1, 1),
  (162, 'especificos', 'IN SGD/ME nº 94/2022', 1, 2),
  (162, 'especificos', 'IN SEGES/ME nº 65/2021', 1, 3);

-- 7. COMPUTAÇÃO EM NUVEM
INSERT INTO topics (parent_id, category, title, level, sort_order, weight_manual, edital_text) VALUES
  (NULL, 'especificos', 'Computação em Nuvem', 0, 7, 4, 'IaaS, PaaS e SaaS. Modelos de implantação: pública, privada, híbrida, comunitária. AWS, Azure e GCP. Arquitetura serverless e event-driven. IAM, RBAC e MFA. Terraform (infraestrutura como código). FinOps. Multicloud. Soberania de dados.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (166, 'especificos', 'IaaS, PaaS e SaaS', 1, 1),
  (166, 'especificos', 'Modelos de implantação: pública, privada, híbrida, comunitária', 1, 2),
  (166, 'especificos', 'AWS, Azure e GCP', 1, 3),
  (166, 'especificos', 'Arquitetura serverless e event-driven', 1, 4),
  (166, 'especificos', 'IAM, RBAC e MFA', 1, 5),
  (166, 'especificos', 'Terraform (infraestrutura como código)', 1, 6),
  (166, 'especificos', 'FinOps', 1, 7),
  (166, 'especificos', 'Multicloud', 1, 8),
  (166, 'especificos', 'Soberania de dados', 1, 9);

-- 8. ANÁLISE DE DADOS
INSERT INTO topics (parent_id, category, title, level, sort_order, weight_manual, edital_text) VALUES
  (NULL, 'especificos', 'Análise de Dados', 0, 8, 3, 'Mineração de dados e CRISP-DM. Classificação. Clusterização. Detecção de anomalias. Python, R e SAS para análise de dados.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (176, 'especificos', 'Mineração de dados e CRISP-DM', 1, 1),
  (176, 'especificos', 'Classificação', 1, 2),
  (176, 'especificos', 'Clusterização', 1, 3),
  (176, 'especificos', 'Detecção de anomalias', 1, 4),
  (176, 'especificos', 'Python, R e SAS para análise de dados', 1, 5);

-- 9. INTELIGÊNCIA ARTIFICIAL
INSERT INTO topics (parent_id, category, title, level, sort_order, weight_manual, edital_text) VALUES
  (NULL, 'especificos', 'Inteligência Artificial', 0, 9, 4, 'Fundamentos de IA. Machine Learning (aprendizado supervisionado, não supervisionado, por reforço). IA generativa. Redes neurais e deep learning. Processamento de linguagem natural (PLN). MLOps. Ética e viés algorítmico. Explicabilidade de modelos.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (182, 'especificos', 'Fundamentos de IA', 1, 1),
  (182, 'especificos', 'Machine Learning: supervisionado, não supervisionado, por reforço', 1, 2),
  (182, 'especificos', 'IA generativa', 1, 3),
  (182, 'especificos', 'Redes neurais e deep learning', 1, 4),
  (182, 'especificos', 'Processamento de linguagem natural (PLN)', 1, 5),
  (182, 'especificos', 'MLOps', 1, 6),
  (182, 'especificos', 'Ética e viés algorítmico', 1, 7),
  (182, 'especificos', 'Explicabilidade de modelos', 1, 8);

-- 10. AUDITORIA DO SETOR PÚBLICO (matéria âncora — peso alto)
INSERT INTO topics (parent_id, category, title, level, sort_order, weight_manual, edital_text) VALUES
  (NULL, 'especificos', 'Auditoria do Setor Público', 0, 10, 5, 'Conceito de auditoria. INTOSAI: ISSAIs 100, 200, 300, 400. NBASP (Normas Brasileiras de Auditoria do Setor Público). Planejamento de auditoria. Matriz de planejamento. Papéis de trabalho. Evidências de auditoria. Matriz de achados e responsabilização. Relatórios de auditoria. Monitoramento.');

INSERT INTO topics (parent_id, category, title, level, sort_order) VALUES
  (191, 'especificos', 'Conceito de auditoria', 1, 1),
  (191, 'especificos', 'INTOSAI: ISSAIs 100, 200, 300, 400', 1, 2),
  (191, 'especificos', 'NBASP (Normas Brasileiras de Auditoria do Setor Público)', 1, 3),
  (191, 'especificos', 'Planejamento de auditoria', 1, 4),
  (191, 'especificos', 'Matriz de planejamento', 1, 5),
  (191, 'especificos', 'Papéis de trabalho', 1, 6),
  (191, 'especificos', 'Evidências de auditoria', 1, 7),
  (191, 'especificos', 'Matriz de achados e responsabilização', 1, 8),
  (191, 'especificos', 'Relatórios de auditoria', 1, 9),
  (191, 'especificos', 'Monitoramento', 1, 10);
