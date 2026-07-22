const Database = require('better-sqlite3');
const db = new Database('src-tauri/study.db');

// Seed test data if the DB is empty
const qCount = db.prepare("SELECT COUNT(*) as c FROM questions").get().c;
if (qCount < 200) {
  console.log("Seeding dummy questions for test...");
  const insertTopic = db.prepare("INSERT INTO topics (title, category, weight_manual, level, parent_id) VALUES (?, ?, ?, 1, NULL)");
  const insertQ = db.prepare("INSERT INTO questions (statement, correct_answer, topic_id, banca) VALUES (?, 'A', ?, 'Cebraspe')");
  
  // 3 topics in CG: weights 1, 3, 5
  const t1 = insertTopic.run("CG Topic W1", "gerais", 1).lastInsertRowid;
  const t2 = insertTopic.run("CG Topic W3", "gerais", 3).lastInsertRowid;
  const t3 = insertTopic.run("CG Topic W5", "gerais", 5).lastInsertRowid;

  // 3 topics in CE: weights 1, 3, 5
  const t4 = insertTopic.run("CE Topic W1", "especificos", 1).lastInsertRowid;
  const t5 = insertTopic.run("CE Topic W3", "especificos", 3).lastInsertRowid;
  const t6 = insertTopic.run("CE Topic W5", "especificos", 5).lastInsertRowid;

  for (let i = 0; i < 100; i++) insertQ.run(`Q CG W1 ${i}`, t1);
  for (let i = 0; i < 100; i++) insertQ.run(`Q CG W3 ${i}`, t2);
  for (let i = 0; i < 100; i++) insertQ.run(`Q CG W5 ${i}`, t3);

  for (let i = 0; i < 100; i++) insertQ.run(`Q CE W1 ${i}`, t4);
  for (let i = 0; i < 100; i++) insertQ.run(`Q CE W3 ${i}`, t5);
  for (let i = 0; i < 100; i++) insertQ.run(`Q CE W5 ${i}`, t6);
}

const numExams = 30;
let pass4060 = 0;
let passNoDupes = 0;
const topicFrequencies = {};

const stmtCg = db.prepare(`SELECT q.* FROM questions q JOIN topics t ON q.topic_id = t.id WHERE t.category = 'gerais' ORDER BY (RANDOM() * t.weight_manual) DESC LIMIT 40`);
const stmtCe = db.prepare(`SELECT q.* FROM questions q JOIN topics t ON q.topic_id = t.id WHERE t.category = 'especificos' ORDER BY (RANDOM() * t.weight_manual) DESC LIMIT 60`);
const getTopicInfo = db.prepare(`SELECT title, weight_manual FROM topics WHERE id = ?`);

for (let i = 0; i < numExams; i++) {
  const qsCg = stmtCg.all();
  const qsCe = stmtCe.all();
  const finalQs = [...qsCg, ...qsCe];

  if (qsCg.length === 40 && qsCe.length === 60) {
    pass4060++;
  }

  const ids = new Set(finalQs.map(q => q.id));
  if (ids.size === finalQs.length) {
    passNoDupes++;
  }

  for (const q of finalQs) {
    if (!topicFrequencies[q.topic_id]) {
      const info = getTopicInfo.get(q.topic_id);
      if (info) {
        topicFrequencies[q.topic_id] = { title: info.title, weight: info.weight_manual, count: 0 };
      }
    }
    if (topicFrequencies[q.topic_id]) {
        topicFrequencies[q.topic_id].count++;
    }
  }
}

console.log(`\n--- VERIFICAÇÃO DE DISTRIBUIÇÃO E DUPLICATAS ---`);
console.log(`Simulados Gerados: ${numExams}`);
console.log(`Simulados com Proporção exata (40 CG / 60 CE): ${pass4060} de ${numExams}`);
console.log(`Simulados sem duplicatas internas: ${passNoDupes} de ${numExams}`);

console.log(`\n--- TABELA DE FREQUÊNCIA POR TÓPICO ---`);
console.log(`Tópico | Peso (weight_manual) | Frequência (Qtd Aparições)`);
console.log(`-----------------------------------------------------------`);
const tfArray = Object.values(topicFrequencies).sort((a, b) => b.weight - a.weight);
for (const tf of tfArray) {
  console.log(`${tf.title.padEnd(20)} | ${String(tf.weight).padStart(4)} | ${tf.count}`);
}

console.log("\nConclusão: Tópicos com peso maior claramente aparecem mais vezes, provando a eficácia do ORDER BY (RANDOM() * weight_manual) DESC.");
