import { describe, it, expect } from 'vitest';
import { parseCebraspePdf } from '../cebraspePdfParser';
import { parseGenericCsv } from '../genericCsvParser';
import { autoTagTopic } from '../topicAutoTagger';

describe('Importers', () => {
  it('should parse Cebraspe PDF', () => {
    const provaText = `
    1 Questão sobre redes de computadores.
    A) Alternativa A
    B) Alternativa B
    C) Alternativa C
    D) Alternativa D
    E) Alternativa E
    `;
    const gabaritoText = `
    Questão 1 Gabarito B
    `;

    const qs = parseCebraspePdf(provaText, gabaritoText);
    expect(qs).toHaveLength(1);
    expect(qs[0].statement).toBe('Questão sobre redes de computadores.');
    expect(qs[0].correct_answer).toBe('B');
    expect(qs[0].alt_a).toBe('Alternativa A');
  });

  it('should parse Generic CSV', () => {
    const csvText = `
Enunciado;A;B;C;D;E;Gabarito;Banca
O que é IP?;A1;B2;C3;D4;E5;C;Funesp
    `;
    const qs = parseGenericCsv(csvText);
    expect(qs).toHaveLength(1);
    expect(qs[0].statement).toBe('O que é IP?');
    expect(qs[0].correct_answer).toBe('C');
    expect(qs[0].banca).toBe('Funesp');
  });

  it('should auto-tag topic', () => {
    const topics = [
      { id: 1, title: 'Redes de Computadores' },
      { id: 2, title: 'Banco de Dados Relacionais' }
    ];

    const res = autoTagTopic('Qual o melhor banco de dados relacional?', topics);
    expect(res).not.toBeNull();
    expect(res?.topic_id).toBe(2);
  });
});
