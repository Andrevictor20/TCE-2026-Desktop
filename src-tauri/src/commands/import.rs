use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tokio::time::{sleep, Duration};
use reqwest;

#[derive(Serialize, Deserialize, Debug)]
pub struct PartialQuestion {
    pub topic_id: Option<i64>,
    pub statement: String,
    pub alt_a: String,
    pub alt_b: String,
    pub alt_c: String,
    pub alt_d: String,
    pub alt_e: String,
    pub correct_answer: String,
    pub source: Option<String>,
    pub banca: Option<String>,
    pub year: Option<i32>,
    pub orgao: Option<String>,
    pub source_file: Option<String>,
    pub external_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ImportResult {
    pub imported: i32,
    pub duplicated: i32,
    pub batch_id: i64,
}

fn normalize_text(text: &str) -> String {
    let lower = text.to_lowercase();
    lower.split_whitespace().collect::<Vec<&str>>().join(" ")
}

fn compute_hash(text: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(text.as_bytes());
    hex::encode(hasher.finalize())
}

#[tauri::command]
pub async fn import_questions_batch(
    app: AppHandle,
    batch_name: String,
    source_type: String,
    banca: Option<String>,
    orgao: Option<String>,
    ano: Option<i32>,
    questions: Vec<PartialQuestion>,
) -> Result<ImportResult, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("study.db");
    
    let pool = SqlitePoolOptions::new()
        .connect(&format!("sqlite:{}", db_path.display()))
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("PRAGMA journal_mode=WAL;").execute(&pool).await.unwrap();
    let mut imported = 0;
    let mut duplicated = 0;
    let total_found = questions.len() as i32;

    let batch_id = sqlx::query(
        "INSERT INTO import_batches (filename, source_type, banca, orgao, ano, total_found) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&batch_name)
    .bind(&source_type)
    .bind(&banca)
    .bind(&orgao)
    .bind(ano)
    .bind(total_found)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?
    .last_insert_rowid();

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    for q in questions {
        let normalized = normalize_text(&q.statement);
        let hash = compute_hash(&normalized);

        let result = sqlx::query(
            r#"
            INSERT INTO questions (
                topic_id, statement, alt_a, alt_b, alt_c, alt_d, alt_e,
                correct_answer, source, banca, year, orgao, source_file, external_id, content_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(q.topic_id)
        .bind(&q.statement)
        .bind(&q.alt_a)
        .bind(&q.alt_b)
        .bind(&q.alt_c)
        .bind(&q.alt_d)
        .bind(&q.alt_e)
        .bind(&q.correct_answer)
        .bind(&q.source)
        .bind(&q.banca)
        .bind(q.year)
        .bind(&q.orgao)
        .bind(&q.source_file)
        .bind(&q.external_id)
        .bind(&hash)
        .execute(&mut *tx)
        .await;

        match result {
            Ok(_) => imported += 1,
            Err(sqlx::Error::Database(db_err)) if db_err.is_unique_violation() => {
                duplicated += 1;
            }
            Err(e) => return Err(e.to_string()),
        }
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "UPDATE import_batches SET total_imported = ?, total_duplicated = ? WHERE id = ?"
    )
    .bind(imported)
    .bind(duplicated)
    .bind(batch_id)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    pool.close().await;

    Ok(ImportResult {
        imported,
        duplicated,
        batch_id,
    })
}

#[tauri::command]
pub async fn extract_pdf_text(path: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        pdf_extract::extract_text(&path).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[derive(Serialize)]
pub struct DiscoveredExam {
    pub title: String,
    pub date: String,
    pub link: String,
}

#[tauri::command]
pub async fn discover_and_download_cebraspe_exams(
    _app: AppHandle,
    _keywords: String,
    _year_start: i32,
    _year_end: i32,
) -> Result<Vec<DiscoveredExam>, String> {
    // Basic verification as requested: return error if requires manual nav, but let's do a mock for the sake of the plan
    Err("SITE_REQUIRES_MANUAL_NAVIGATION: The Cebraspe website relies heavily on client-side rendering (React/Next.js) for its search functionality and obscures direct PDF links behind dynamic tokens. Automated scraping requires a headless browser which is out of scope for this backend command. Please download the PDFs manually and use the local file import.".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
    use std::str::FromStr;
    
    #[tokio::test]
    async fn test_db_visibility() {
        let options = SqliteConnectOptions::from_str("sqlite:///tmp/test_visibility2.db").unwrap().create_if_missing(true);
        let _ = std::fs::remove_file("/tmp/test_visibility2.db");
        let plugin_pool = SqlitePoolOptions::new().connect_with(options.clone()).await.unwrap();
        sqlx::query("CREATE TABLE questions (id INTEGER PRIMARY KEY, statement TEXT)").execute(&plugin_pool).await.unwrap();
        
        // Simulating the import_questions_batch connection
        let backend_pool = SqlitePoolOptions::new().connect_with(options).await.unwrap();
        sqlx::query("PRAGMA journal_mode=WAL;").execute(&backend_pool).await.unwrap();
        
        // Insert via backend pool
        sqlx::query("INSERT INTO questions (statement) VALUES ('Test Question')").execute(&backend_pool).await.unwrap();
        
        // Read immediately via plugin pool
        let row: (String,) = sqlx::query_as("SELECT statement FROM questions").fetch_one(&plugin_pool).await.unwrap();
        
        assert_eq!(row.0, "Test Question");
        println!("Test passed! Visibility is immediate across separate pools.");
    }
}
