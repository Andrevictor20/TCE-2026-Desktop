use serde::Serialize;

const SERVICE_NAME: &str = "tce-ma-2026-cargo15";

#[derive(Serialize)]
pub struct KeyResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub fn set_api_key(provider: String, key: String) -> KeyResult {
    let entry = keyring::Entry::new(SERVICE_NAME, &provider);
    match entry {
        Ok(entry) => match entry.set_password(&key) {
            Ok(_) => KeyResult {
                success: true,
                message: "Chave salva com sucesso no keyring do sistema.".into(),
            },
            Err(e) => KeyResult {
                success: false,
                message: format!("Erro ao salvar no keyring: {}. A chave será armazenada localmente (não criptografada).", e),
            },
        },
        Err(e) => KeyResult {
            success: false,
            message: format!("Erro ao acessar keyring: {}", e),
        },
    }
}

#[tauri::command]
pub fn get_api_key(provider: String) -> Option<String> {
    let entry = keyring::Entry::new(SERVICE_NAME, &provider).ok()?;
    entry.get_password().ok()
}

#[tauri::command]
pub fn delete_api_key(provider: String) -> KeyResult {
    match keyring::Entry::new(SERVICE_NAME, &provider) {
        Ok(entry) => match entry.delete_credential() {
            Ok(_) => KeyResult {
                success: true,
                message: "Chave removida do keyring.".into(),
            },
            Err(e) => KeyResult {
                success: false,
                message: format!("Erro ao remover: {}", e),
            },
        },
        Err(e) => KeyResult {
            success: false,
            message: format!("Erro ao acessar keyring: {}", e),
        },
    }
}
