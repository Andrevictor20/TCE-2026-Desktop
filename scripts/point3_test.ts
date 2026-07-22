import { parseCebraspePdf } from '../src/lib/importers/cebraspePdfParser';
import * as fs from 'fs';
import * as path from 'path';

function runTest() {
  const provaPath = path.join(process.cwd(), 'scripts', 'samples', 'prova.txt');
  const gabaritoPath = path.join(process.cwd(), 'scripts', 'samples', 'gabarito.txt');

  const provaText = fs.readFileSync(provaPath, 'utf8');
  const gabaritoText = fs.readFileSync(gabaritoPath, 'utf8');

  // Regex para achar a maior questão mencionada no gabarito
  // Procuramos por algo como " 100 " ou "Questão 100" no gabarito
  const qNumbers = [...gabaritoText.matchAll(/(\d+)/g)].map(m => parseInt(m[1], 10));
  const expectedTotal = Math.max(...qNumbers, 0);

  console.log(`\n--- TESTE DE EXTRAÇÃO PDF REAL (CEBRASPE) ---`);
  console.log(`Questão máxima encontrada no texto do gabarito: ${expectedTotal} (Assumindo como total esperado)`);

  const parsedQuestions = parseCebraspePdf(provaText, gabaritoText);
  const foundTotal = parsedQuestions.length;

  console.log(`Questões extraídas com sucesso pelo parser: ${foundTotal}`);

  if (expectedTotal > 0) {
    const accuracy = (foundTotal / expectedTotal) * 100;
    console.log(`Taxa de extração: ${accuracy.toFixed(1)}%`);
  }

  console.log(`\n--- PRIMEIRAS 5 QUESTÕES EXTRAÍDAS ---`);
  parsedQuestions.slice(0, 5).forEach((q, idx) => {
    console.log(`[Q${idx+1}] Gabarito: ${q.correct_answer}`);
    console.log(`Enunciado: ${q.statement.substring(0, 80)}...`);
    console.log(`A) ${q.alt_a}`);
    console.log(`B) ${q.alt_b}`);
    console.log(`C) ${q.alt_c}`);
    console.log(`D) ${q.alt_d}`);
    console.log(`E) ${q.alt_e}\n`);
  });

  console.log(`\n--- ÚLTIMAS 5 QUESTÕES EXTRAÍDAS ---`);
  parsedQuestions.slice(-5).forEach((q, idx) => {
    console.log(`[Q${foundTotal - 5 + idx + 1}] Gabarito: ${q.correct_answer}`);
    console.log(`Enunciado: ${q.statement.substring(0, 80)}...`);
    console.log(`A) ${q.alt_a}`);
    console.log(`B) ${q.alt_b}`);
    console.log(`C) ${q.alt_c}`);
    console.log(`D) ${q.alt_d}`);
    console.log(`E) ${q.alt_e}\n`);
  });
}

runTest();
