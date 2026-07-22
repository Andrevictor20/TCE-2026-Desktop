import { PartialQuestion } from './cebraspePdfParser';
import { normalizeText } from './normalize';

export function parseGenericCsv(text: string): PartialQuestion[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const parsed: PartialQuestion[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split(';');
    if (cols.length >= 7) {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (cols[idx]) obj[h] = cols[idx].replace(/^"|"$/g, '').trim();
      });
      
      const correct = (obj.gabarito || obj.correct_answer || cols[6])?.toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(correct)) {
        parsed.push({
          statement: normalizeText(obj.enunciado || obj.statement || cols[0]),
          alt_a: normalizeText(obj.a || obj.alt_a || cols[1]),
          alt_b: normalizeText(obj.b || obj.alt_b || cols[2]),
          alt_c: normalizeText(obj.c || obj.alt_c || cols[3]),
          alt_d: normalizeText(obj.d || obj.alt_d || cols[4]),
          alt_e: normalizeText(obj.e || obj.alt_e || cols[5]),
          correct_answer: correct as any,
          banca: obj.banca || 'Manual',
          source: 'csv_generic',
          year: obj.ano ? parseInt(obj.ano, 10) : undefined,
          orgao: obj.orgao
        });
      }
    }
  }
  return parsed;
}
