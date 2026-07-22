/**
 * Normaliza uma string de texto para cálculos de hash consistentes.
 * - Converte para minúsculas
 * - Remove acentos (diacríticos)
 * - Remove espaços múltiplos e quebras de linha
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, " ")            // transforma múltiplos espaços/quebras em um só espaço
    .trim();
}
