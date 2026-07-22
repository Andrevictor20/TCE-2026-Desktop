import { describe, it, expect } from 'vitest';
import { parseCebraspePdf } from '../cebraspePdfParser';
import { parseGenericCsv } from '../genericCsvParser';
import { createHash } from 'crypto';

describe('Hash Consistency', () => {
  it('should generate the identical normalized text and hash for CSV and PDF', () => {
    // 1. O PDF frequentemente quebra linhas no meio do texto e tem múltiplos espaços
    const pdfProvaText = `
    10 O    conceito de   banco
    de dados relacional é
    baseado em tabelas.
    A) Correto
    B) Errado
    C) NS
    D) NS
    E) NS
    `;
    const pdfGabaritoText = `Questão 10 Gabarito A`;

    // 2. O CSV costuma vir bem formatado e limpo, em uma só linha
    const csvText = `
Enunciado;A;B;C;D;E;Gabarito;Banca
O conceito de banco de dados relacional é baseado em tabelas.;Correto;Errado;NS;NS;NS;A;Cebraspe
    `;

    const qsPdf = parseCebraspePdf(pdfProvaText, pdfGabaritoText);
    const qsCsv = parseGenericCsv(csvText);

    expect(qsPdf).toHaveLength(1);
    expect(qsCsv).toHaveLength(1);

    const statementPdf = qsPdf[0].statement;
    const statementCsv = qsCsv[0].statement;

    // A normalização deve deixá-los idênticos
    expect(statementPdf).toBe(statementCsv);

    // O Hash SHA-256 (igual ao do Rust)
    const hashPdf = createHash('sha256').update(statementPdf).digest('hex');
    const hashCsv = createHash('sha256').update(statementCsv).digest('hex');

    expect(hashPdf).toBe(hashCsv);
  });
});
