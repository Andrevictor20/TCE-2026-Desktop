import { Question } from '../../stores/questionStore';
import { normalizeText } from './normalize';

export type PartialQuestion = Partial<Question> & { 
  topic_id?: number | null;
  statement: string;
  alt_a: string;
  alt_b: string;
  alt_c: string;
  alt_d: string;
  alt_e: string;
  correct_answer: string;
  source?: string;
  banca?: string | null;
  year?: number | null;
  orgao?: string | null;
  source_file?: string;
  external_id?: string;
};

/**
 * Faz parsing do texto extraído de uma prova do Cebraspe (Múltipla Escolha A-E)
 * e o alinha com o texto extraído do gabarito definitivo.
 */
export function parseCebraspePdf(provaText: string, gabaritoText: string): PartialQuestion[] {
  const questions: PartialQuestion[] = [];
  
  // Padrão típico de questão Cebraspe múltipla escolha (Ex: "Questão 21 ... A ... B ...")
  const questionBlockRegex = /(?:QUESTÃO\s*)(\d+)[\s\S]+?(?=(?:QUESTÃO\s*)\d+|$)/gi;
  // Alternatives typically start with A, B, C, D, E followed by space, dot, hyphen or parenthesis
  const altRegex = /\n\s*([A-E])[\s\)\.-]+([\s\S]*?)(?=\n\s*[A-E][\s\)\.-]+|$)/gi;

  const matches = [...provaText.matchAll(questionBlockRegex)];
  
  for (const match of matches) {
    const block = match[0];
    const qNumberStr = match[1];
    if (!qNumberStr) continue;
    
    // const qNumber = parseInt(qNumberStr, 10);
    
    const firstAltMatch = /\n\s*A[\s\)\.-]+/i.exec(block);
    if (!firstAltMatch) continue; 
    
    const statement = block.substring(0, firstAltMatch.index).replace(/(?:QUESTÃO\s*)\d+\s*/i, '').trim();
    const altsText = block.substring(firstAltMatch.index);
    
    const alts: Record<string, string> = {};
    const altMatches = [...altsText.matchAll(altRegex)];
    for (const altM of altMatches) {
      alts[altM[1].toUpperCase()] = altM[2].trim();
    }
    
    if (alts['A'] && alts['B'] && alts['C'] && alts['D'] && alts['E']) {
      const correct_answer = findAnswerInGabarito(qNumberStr, gabaritoText);
      
      if (correct_answer) {
        questions.push({
          statement: normalizeText(statement),
          alt_a: normalizeText(alts['A']),
          alt_b: normalizeText(alts['B']),
          alt_c: normalizeText(alts['C']),
          alt_d: normalizeText(alts['D']),
          alt_e: normalizeText(alts['E']),
          correct_answer: correct_answer as any,
          banca: 'Cebraspe',
          source: 'pdf_cebraspe'
        });
      }
    }
  }
  
  return questions;
}

function findAnswerInGabarito(qNumberStr: string, gabaritoText: string): string | null {
  // Try table format: search for the number, then find its index in the row, then get the corresponding letter in the next row
  const lines = gabaritoText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < lines.length - 1; i++) {
    const tokens = lines[i].split(/\s+/);
    const idx = tokens.indexOf(qNumberStr);
    if (idx !== -1) {
      const answerTokens = lines[i+1].split(/\s+/);
      if (answerTokens.length === tokens.length && answerTokens[idx].match(/^[A-E]$/i)) {
        return answerTokens[idx].toUpperCase();
      }
    }
  }

  // Fallback to simple regex (e.g. Questão 21 Gabarito E)
  const regex = new RegExp(`(?:Questão|Item|Q)?\\s*0*${qNumberStr}\\s*[:\\-\\.]?\\s*(?:Gabarito|Resp)?\\s*([A-E])`, 'i');
  const match = gabaritoText.match(regex);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  
  return null;
}
