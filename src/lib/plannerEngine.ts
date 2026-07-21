import { query, execute } from './db';
import { addDays, format, startOfWeek } from 'date-fns';

interface Topic {
  id: number;
  category: string;
  status: string;
  weight_manual: number;
}

export async function generateDailySession(targetDate: Date): Promise<void> {
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  // Check if session already exists
  const existing = await query('SELECT id FROM daily_sessions WHERE session_date = $1', [dateStr]);
  if (existing.length > 0) return;

  // Get availability for this day of week (0 = Sunday)
  const dow = targetDate.getDay();
  const availRows = await query<{ enabled: number; hours: number }>(
    'SELECT enabled, hours FROM availability WHERE day_of_week = $1',
    [dow]
  );

  if (availRows.length === 0 || availRows[0].enabled === 0) {
    // Generate skipped session
    await execute(
      "INSERT INTO daily_sessions (session_date, planned_hours, status) VALUES ($1, 0, 'skipped')",
      [dateStr]
    );
    return;
  }

  const plannedHours = availRows[0].hours;
  
  // Create the session
  const res = await execute(
    "INSERT INTO daily_sessions (session_date, planned_hours, status) VALUES ($1, $2, 'pending')",
    [dateStr, plannedHours]
  );
  
  const sessionId = res.lastInsertId;
  if (!sessionId) return;

  // Distribute blocks
  // Default block size = 60 mins. Number of blocks = plannedHours.
  const numBlocks = Math.floor(plannedHours);
  
  // Logic: 
  // 1 block of spaced review (if any due)
  // Remaining blocks divided between CG (35%) and CE (65%)
  
  const settingsRows = await query<{ key: string, value: string }>('SELECT key, value FROM settings WHERE key IN ("split_cg_percent", "split_ce_percent", "block_duration_minutes")');
  const settings = { split_cg_percent: 35, split_ce_percent: 65, block_duration_minutes: 60 };
  settingsRows.forEach(r => {
    (settings as any)[r.key] = Number(r.value);
  });

  const duration = settings.block_duration_minutes;

  // Check spaced review due
  const dueReviews = await query<{ topic_id: number }>(
    'SELECT topic_id FROM spaced_review WHERE next_review_date <= $1 LIMIT 5',
    [dateStr]
  );

  let blockOrder = 1;
  let remainingBlocks = numBlocks;

  if (dueReviews.length > 0 && remainingBlocks > 0) {
    await execute(
      "INSERT INTO session_blocks (session_id, block_type, duration_minutes, sort_order) VALUES ($1, 'spaced_review', $2, $3)",
      [sessionId, duration, blockOrder++]
    );
    remainingBlocks--;
  }

  if (remainingBlocks > 0) {
    // Check topics already allocated this week to avoid repeating every day
    const weekStartStr = format(startOfWeek(targetDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEndStr = format(addDays(startOfWeek(targetDate, { weekStartsOn: 1 }), 6), 'yyyy-MM-dd');
    
    const plannedTopics = await query<{ topic_id: number }>(
      `SELECT sb.topic_id FROM session_blocks sb 
       JOIN daily_sessions ds ON ds.id = sb.session_id 
       WHERE ds.session_date >= $1 AND ds.session_date <= $2 AND sb.topic_id IS NOT NULL`,
      [weekStartStr, weekEndStr]
    );
    const plannedTopicIds = new Set(plannedTopics.map(t => t.topic_id));

    // Fetch all disciplines (level = 1) to distribute theory/practice
    const topics = await query<Topic>('SELECT id, category, status, weight_manual FROM topics WHERE level = 1');
    
    // Sort logic: 
    // 1. Unplanned this week goes first.
    // 2. Prioritize 'studying'.
    // 3. Fallback to weight.
    const activeTopics = topics.filter(t => t.status !== 'mastered');
    activeTopics.sort((a, b) => {
      const aPlanned = plannedTopicIds.has(a.id) ? 1 : 0;
      const bPlanned = plannedTopicIds.has(b.id) ? 1 : 0;
      
      if (aPlanned !== bPlanned) return aPlanned - bPlanned; // 0 goes before 1
      
      if (a.status === 'studying' && b.status !== 'studying') return -1;
      if (a.status !== 'studying' && b.status === 'studying') return 1;
      return b.weight_manual - a.weight_manual;
    });

    const cgTopics = activeTopics.filter(t => t.category === 'gerais');
    const ceTopics = activeTopics.filter(t => t.category === 'especificos');

    let ceBlocksCount = Math.round(remainingBlocks * (settings.split_ce_percent / 100));
    let cgBlocksCount = remainingBlocks - ceBlocksCount;

    // Inject at least 1 practice block
    let injectedPractice = false;
    if (ceBlocksCount > 0 && ceTopics.length > 0) {
      await execute(
        "INSERT INTO session_blocks (session_id, topic_id, block_type, duration_minutes, sort_order) VALUES ($1, $2, 'practice', $3, $4)",
        [sessionId, ceTopics[0].id, duration, blockOrder++]
      );
      ceBlocksCount--;
      injectedPractice = true;
    } else if (cgBlocksCount > 0 && cgTopics.length > 0) {
      await execute(
        "INSERT INTO session_blocks (session_id, topic_id, block_type, duration_minutes, sort_order) VALUES ($1, $2, 'practice', $3, $4)",
        [sessionId, cgTopics[0].id, duration, blockOrder++]
      );
      cgBlocksCount--;
      injectedPractice = true;
    }

    // Allocate CE blocks (theory)
    for (let i = 0; i < ceBlocksCount; i++) {
      // Offset by 1 if we used the first topic for practice, just to vary
      const topicIndex = (i + (injectedPractice ? 1 : 0)) % ceTopics.length;
      const topic = ceTopics[topicIndex];
      if (topic) {
        await execute(
          "INSERT INTO session_blocks (session_id, topic_id, block_type, duration_minutes, sort_order) VALUES ($1, $2, 'theory', $3, $4)",
          [sessionId, topic.id, duration, blockOrder++]
        );
      }
    }

    // Allocate CG blocks (theory)
    for (let i = 0; i < cgBlocksCount; i++) {
      const topicIndex = (i + (injectedPractice && ceBlocksCount === 0 ? 1 : 0)) % cgTopics.length;
      const topic = cgTopics[topicIndex];
      if (topic) {
        await execute(
          "INSERT INTO session_blocks (session_id, topic_id, block_type, duration_minutes, sort_order) VALUES ($1, $2, 'theory', $3, $4)",
          [sessionId, topic.id, duration, blockOrder++]
        );
      }
    }
  }
}

export async function generateWeeklyPlan(startDate: Date): Promise<void> {
  const start = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    await generateDailySession(d);
  }
}

export async function completeSessionBlock(blockId: number, actualDuration: number, quality: number = 3): Promise<void> {
  // Update block status
  await execute(
    "UPDATE session_blocks SET status = 'completed', completed_at = datetime('now') WHERE id = $1",
    [blockId]
  );

  // If it was a spaced review block, we'd update the SM-2 factors for the topics reviewed.
  // For theory blocks, we might add a spaced review entry.
  
  const blockRows = await query<{ topic_id: number, session_id: number }>('SELECT topic_id, session_id FROM session_blocks WHERE id = $1', [blockId]);
  if (blockRows.length === 0) return;
  const block = blockRows[0];

  // Update actual hours in daily_session
  await execute(
    "UPDATE daily_sessions SET actual_hours = actual_hours + ($1 / 60.0) WHERE id = $2",
    [actualDuration, block.session_id]
  );

  if (block.topic_id) {
    // Schedule next review (SM-2 simplified)
    const reviewRows = await query<{ id: number, ease_factor: number, interval_days: number, repetition: number }>(
      'SELECT id, ease_factor, interval_days, repetition FROM spaced_review WHERE topic_id = $1',
      [block.topic_id]
    );

    if (reviewRows.length === 0) {
      // First time reviewing
      const nextDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      await execute(
        "INSERT INTO spaced_review (topic_id, next_review_date) VALUES ($1, $2)",
        [block.topic_id, nextDate]
      );
    } else {
      const r = reviewRows[0];
      let interval = r.interval_days;
      let repetition = r.repetition;
      let ease = r.ease_factor;

      if (quality < 3) {
        repetition = 0;
        interval = 1;
      } else {
        if (repetition === 0) interval = 1;
        else if (repetition === 1) interval = 6;
        else interval = Math.round(interval * ease);
        repetition += 1;
      }
      ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
      
      const nextDate = format(addDays(new Date(), interval), 'yyyy-MM-dd');

      await execute(
        "UPDATE spaced_review SET ease_factor = $1, interval_days = $2, repetition = $3, next_review_date = $4, last_review_date = datetime('now'), quality = $5 WHERE id = $6",
        [ease, interval, repetition, nextDate, quality, r.id]
      );
    }
  }
}

export async function rebalanceRemainingWeek(changedDate: Date, newCapacity: number): Promise<void> {
  const dateStr = format(changedDate, 'yyyy-MM-dd');
  
  const currentSessionRow = await query<{ planned_hours: number }>('SELECT planned_hours FROM daily_sessions WHERE session_date = $1', [dateStr]);
  if (currentSessionRow.length === 0) return;
  const lostHours = currentSessionRow[0].planned_hours - newCapacity;
  
  await execute('UPDATE daily_sessions SET capacity_override = $1 WHERE session_date = $2', [newCapacity, dateStr]);
  
  const start = startOfWeek(changedDate, { weekStartsOn: 1 });
  const end = addDays(start, 4); // Friday
  
  const remainingDates: string[] = [];
  let d = addDays(changedDate, 1);
  while (d <= end) {
    remainingDates.push(format(d, 'yyyy-MM-dd'));
    d = addDays(d, 1);
  }
  
  if (remainingDates.length > 0 && lostHours !== 0) {
    const hoursToAddToEach = lostHours / remainingDates.length;
    for (const rd of remainingDates) {
      await execute('UPDATE daily_sessions SET planned_hours = planned_hours + $1 WHERE session_date = $2 AND status = "pending"', [hoursToAddToEach, rd]);
    }
  }
}
