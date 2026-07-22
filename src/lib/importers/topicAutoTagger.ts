export interface TopicInfo {
  id: number;
  title: string;
}

export function autoTagTopic(statement: string, topics: TopicInfo[]): { topic_id: number; confidence: number } | null {
  if (topics.length === 0 || !statement) return null;

  const normalizedStatement = statement.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const statementWords = new Set(normalizedStatement.split(/\W+/).filter(w => w.length > 3));

  let bestMatch = null;
  let highestScore = 0;

  for (const topic of topics) {
    const normalizedTitle = topic.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const titleWords = normalizedTitle.split(/\W+/).filter(w => w.length > 3);
    
    if (titleWords.length === 0) continue;

    let matchCount = 0;
    for (const word of titleWords) {
      if (statementWords.has(word)) {
        matchCount++;
      }
    }

    const score = matchCount / titleWords.length;
    if (score > highestScore) {
      highestScore = score;
      bestMatch = topic.id;
    }
  }

  if (bestMatch !== null) {
    return { topic_id: bestMatch, confidence: highestScore };
  }

  return null;
}
