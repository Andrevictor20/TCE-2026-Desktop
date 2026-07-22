use tauri_plugin_sql::{Migration, MigrationKind};

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Workaround for blank screen on Wayland (Niri/Noctalia) due to EGL/DMABUF issues
    // std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    // std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: include_str!("../migrations/001_initial_schema.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "seed_edital_data",
            sql: include_str!("../migrations/002_seed_data.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "discursive_answers",
            sql: include_str!("../migrations/003_discursive_answers.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_notebooklm_url",
            sql: include_str!("../migrations/004_notebooklm_url.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "seed_questions",
            sql: include_str!("../migrations/005_seed_questions.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "import_pipeline",
            sql: include_str!("../migrations/006_import_pipeline.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:study.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::planner::calculate_available_hours,
            commands::planner::get_daily_session,
            commands::planner::generate_daily_session,
            commands::planner::get_countdown,
            commands::planner::generate_weekly_plan,
            commands::planner::rebalance_remaining_week,
            commands::keyring::set_api_key,
            commands::keyring::get_api_key,
            commands::keyring::delete_api_key,
            commands::import::import_questions_batch,
            commands::import::extract_pdf_text,
            commands::import::discover_and_download_cebraspe_exams,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
