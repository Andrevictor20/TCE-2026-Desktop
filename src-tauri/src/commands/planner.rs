use serde::Serialize;
use chrono::{NaiveDate, Datelike, Local, Weekday};

/// Data da prova objetiva + discursiva
const EXAM_DATE: &str = "2026-11-29";

#[derive(Serialize, Clone)]
pub struct CountdownInfo {
    pub days_total: i64,
    pub weekdays_remaining: i64,
    pub exam_date: String,
    pub today: String,
}

#[derive(Serialize, Clone)]
pub struct AvailableHours {
    pub weekdays_remaining: i64,
    pub total_hours: f64,
    pub review_block_hours: f64,
    pub study_hours: f64,
    pub review_block_days: i64,
}

/// Conta dias úteis (seg-sex) entre duas datas (exclusive da data final)
fn count_weekdays(start: NaiveDate, end: NaiveDate) -> i64 {
    let mut count = 0i64;
    let mut current = start;
    while current < end {
        match current.weekday() {
            Weekday::Sat | Weekday::Sun => {}
            _ => count += 1,
        }
        current = current.succ_opt().unwrap_or(current);
    }
    count
}

#[tauri::command]
pub fn get_countdown() -> Result<CountdownInfo, String> {
    let today = Local::now().date_naive();
    let exam = NaiveDate::parse_from_str(EXAM_DATE, "%Y-%m-%d")
        .map_err(|e| format!("Erro ao parsear data da prova: {}", e))?;

    let days_total = (exam - today).num_days();
    let weekdays_remaining = count_weekdays(today, exam);

    Ok(CountdownInfo {
        days_total,
        weekdays_remaining,
        exam_date: EXAM_DATE.to_string(),
        today: today.format("%Y-%m-%d").to_string(),
    })
}

#[tauri::command]
pub fn calculate_available_hours(
    hours_per_day: Vec<f64>,
    review_block_days: i64,
) -> Result<AvailableHours, String> {
    // hours_per_day: [dom, seg, ter, qua, qui, sex, sab] = 7 elementos
    if hours_per_day.len() != 7 {
        return Err("hours_per_day deve ter 7 elementos (dom=0 a sab=6)".into());
    }

    let today = Local::now().date_naive();
    let exam = NaiveDate::parse_from_str(EXAM_DATE, "%Y-%m-%d")
        .map_err(|e| format!("Erro ao parsear data da prova: {}", e))?;

    let weekdays_remaining = count_weekdays(today, exam);

    // Calcula total de horas iterando cada dia
    let mut total_hours = 0.0f64;
    let mut current = today;
    let mut _day_count = 0i64;

    while current < exam {
        let dow = current.weekday().num_days_from_sunday() as usize; // 0=dom ... 6=sab
        total_hours += hours_per_day[dow];
        _day_count += 1;
        current = current.succ_opt().unwrap_or(current);
    }

    // Reservar bloco de revisão final
    let review_days = review_block_days.min(weekdays_remaining);
    // Estimar horas do bloco de revisão (média de horas dos dias úteis)
    let avg_weekday_hours: f64 = (hours_per_day[1] + hours_per_day[2] + hours_per_day[3]
        + hours_per_day[4] + hours_per_day[5]) / 5.0;
    let review_block_hours = review_days as f64 * avg_weekday_hours;
    let study_hours = total_hours - review_block_hours;

    Ok(AvailableHours {
        weekdays_remaining,
        total_hours,
        review_block_hours,
        study_hours: study_hours.max(0.0),
        review_block_days: review_days,
    })
}

#[derive(Serialize, Clone)]
pub struct DailySessionBlock {
    pub id: i64,
    pub topic_id: Option<i64>,
    pub topic_title: Option<String>,
    pub block_type: String,
    pub duration_minutes: i64,
    pub sort_order: i64,
    pub status: String,
    pub notes: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct DailySessionInfo {
    pub session_date: String,
    pub planned_hours: f64,
    pub actual_hours: f64,
    pub status: String,
    pub blocks: Vec<DailySessionBlock>,
}

fn is_in_final_review_block(date: NaiveDate, exam_date: NaiveDate, review_block_days: i64) -> bool {
    let weekdays = count_weekdays(date, exam_date);
    weekdays <= review_block_days
}

#[tauri::command]
pub fn generate_daily_session(date_str: String) -> Result<DailySessionInfo, String> {
    let date = NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
        .map_err(|e| format!("Data inválida: {}", e))?;
    let exam_date = NaiveDate::parse_from_str(EXAM_DATE, "%Y-%m-%d").unwrap();
    
    // Assuming 30 days default for final review block if not provided by DB here
    let in_review = is_in_final_review_block(date, exam_date, 30);
    
    let mut allowed_blocks = vec!["spaced_review", "practice", "quick_sim", "full_sim"];
    if !in_review {
        allowed_blocks.push("theory");
    }

    let mut blocks = Vec::new();
    
    if !in_review {
        blocks.push(DailySessionBlock {
            id: 1,
            topic_id: Some(1),
            topic_title: Some("Tópico Mock (Teoria)".into()),
            block_type: "theory".into(),
            duration_minutes: 60,
            sort_order: 1,
            status: "pending".into(),
            notes: None,
        });
    }

    blocks.push(DailySessionBlock {
        id: 2,
        topic_id: Some(2),
        topic_title: Some("Tópico Mock (Prática)".into()),
        block_type: "practice".into(),
        duration_minutes: 120,
        sort_order: 2,
        status: "pending".into(),
        notes: None,
    });

    Ok(DailySessionInfo {
        session_date: date_str,
        planned_hours: 3.0,
        actual_hours: 0.0,
        status: "pending".into(),
        blocks,
    })
}

#[tauri::command]
pub fn get_daily_session() -> Result<DailySessionInfo, String> {
    let today = Local::now().date_naive().format("%Y-%m-%d").to_string();
    generate_daily_session(today)
}

#[derive(Serialize, Clone)]
pub struct WeekPlan {
    pub week_start: String,
    pub status: String,
}

#[tauri::command]
pub fn generate_weekly_plan(week_start: String) -> Result<WeekPlan, String> {
    // Placeholder logic for weekly plan generation
    Ok(WeekPlan {
        week_start,
        status: "generated".into(),
    })
}

#[tauri::command]
pub fn rebalance_remaining_week(changed_date: String) -> Result<WeekPlan, String> {
    // 1. Identificar a semana que contém changed_date
    // 2. Somar a capacidade restante
    // 3. Re-distribuir e regenerar os dias
    
    // Placeholder to return success
    Ok(WeekPlan {
        week_start: changed_date, // Simplified for now
        status: "rebalanced".into(),
    })
}
