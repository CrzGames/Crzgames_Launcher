// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    Window,
    Manager,
    Emitter,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{TrayIconBuilder, TrayIconEvent, MouseButton},
    image::Image,
};
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_autostart::MacosLauncher;
use std::env;
use std::path::{Path, PathBuf};
use std::fs;
use std::io::{BufReader, Read};
use core::time::Duration;
use serde_json::json;
use dirs;
use sysinfo::{ Disks, System };
use futures::StreamExt;
use sha2::{Digest, Sha256};
use tokio::io::AsyncWriteExt;
use tokio::sync::{mpsc, Semaphore};
use tokio::task::JoinSet;
use tokio::fs::OpenOptions as TokioOpenOptions;
use std::thread;
use std::fs::remove_dir_all;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use lazy_static::lazy_static;
use std::collections::HashSet;
#[allow(unused_imports)]
use futures::TryFutureExt;
#[allow(unused_imports)]
use std::process::Command;

#[cfg(target_os = "windows")]
const EXECUTABLE_EXTENSIONS: [&str; 1] = ["exe"];

#[cfg(target_os = "macos")]
const EXECUTABLE_EXTENSIONS: [&str; 1] = ["app"];

#[cfg(target_os = "linux")]
const EXECUTABLE_EXTENSIONS: [&str; 1] = ["AppImage"];

const MAX_CONCURRENT_DOWNLOADS: usize = 6;

// getSystemOSInfoCurrent
#[derive(Debug, serde::Serialize)]
struct SystemOSInfo {
    os: String,
    architecture: String,
}

fn get_system_os_info_current() -> SystemOSInfo {
    let os = if cfg!(target_os = "windows") {
        "Windows".to_string()
    } else if cfg!(target_os = "macos") {
        "macOS".to_string()
    } else if cfg!(target_os = "linux") {
        "Linux".to_string()
    } else {
        "Unknown OS".to_string()
    };

    let architecture = if cfg!(target_arch = "x86") {
        "x86".to_string()
    } else if cfg!(target_arch = "x86_64") {
        "x64".to_string()
    } else if cfg!(target_arch = "aarch64") {
        "arm64".to_string()
    } else {
        "Unknown Architecture".to_string()
    };

    SystemOSInfo { os, architecture }
}

#[tauri::command]
async fn check_disk_space(path: String) -> Result<u64, String> {
    let mut system = System::new_all();
    system.refresh_all();  // Refresh the system to get the latest information

    // Utilisation de Disks pour accéder aux informations de disque
    let disks = Disks::new_with_refreshed_list();
    for disk in disks.iter() {
        if let Some(mount_point) = disk.mount_point().to_str() {
            if mount_point == path {
                return Ok(disk.available_space());
            }
        }
    }

    Err(format!("Aucun disque trouvé pour le chemin fourni: {}", path))
}

// getLauncherPathDirectory
#[tauri::command]
fn get_launcher_path_directory() -> Result<String, String> {
    // Obtenez le chemin de l'exécutable courant.
    let exe_path = env::current_exe().map_err(|e| format!("Error obtaining current exe path: {}", e))?;

    // Obtenez le dossier contenant l'exécutable.
    let parent_dir = exe_path.parent().ok_or("Error obtaining parent directory".to_string())?;

    // Convertissez PathBuf en String pour le renvoyer.
    parent_dir.to_str().map(String::from).ok_or("Error converting path to string".to_string())
}

fn remove_duplicates(manifest: &mut GameManifestLocal) {
    let mut seen = std::collections::HashSet::new();
    manifest.files.retain(|file| seen.insert(file.name.clone()));
}

#[tauri::command]
fn check_missing_files(file_location_download: String, local_manifest: GameManifestLocal) -> Result<Vec<FileDetails>, String> {
    let game_directory = Path::new(&file_location_download);
    let mut missing_files = Vec::new();

    for file in &local_manifest.files {
        let file_path = game_directory.join(&file.name);
        if !file_path.exists() {
            missing_files.push(file.clone());
        }
    }

    Ok(missing_files)
}

fn clean_up_directory(game_directory: &Path, game_manifest: &GameManifestLocal) -> Result<(), String> {
    // Vérifier et supprimer les fichiers et dossiers indésirables
    let manifest_files: HashSet<PathBuf> = game_manifest.files.iter().map(|f| game_directory.join(&f.name)).collect();
    let mut to_delete = Vec::new();

    // Chemin complet du fichier manifest_local.json
    let manifest_file_path = game_directory.join("manifest_local.json");

    // Parcourir les fichiers et dossiers du répertoire du jeu
    for entry in fs::read_dir(&game_directory).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        // Si le chemin n'est pas dans les fichiers du manifeste, l'ajouter à la liste des suppressions
        if path != manifest_file_path && !manifest_files.contains(&path) && !manifest_files.iter().any(|f| f.starts_with(&path)) {
            to_delete.push(path);
        }
    }

    // Supprimer les fichiers et dossiers indésirables
    for path in to_delete {
        if path.is_dir() {
            fs::remove_dir_all(&path).map_err(|e| format!("Failed to remove directory: {}: {}", path.display(), e))?;
        } else {
            fs::remove_file(&path).map_err(|e| format!("Failed to remove file: {}: {}", path.display(), e))?;
        }
    }

    Ok(())
}

type DownloadState = Arc<Mutex<HashMap<u64, (Arc<AtomicBool>, Arc<AtomicBool>)>>>;
type RunningDownloadsState = Arc<Mutex<HashSet<u64>>>;

lazy_static! {
    static ref DOWNLOAD_STATES: DownloadState = Arc::new(Mutex::new(HashMap::new()));
    static ref RUNNING_DOWNLOADS: RunningDownloadsState = Arc::new(Mutex::new(HashSet::new()));
}

fn get_or_create_download_state(game_id: u64) -> (Arc<AtomicBool>, Arc<AtomicBool>) {
    let mut states = DOWNLOAD_STATES.lock().unwrap();
    states.entry(game_id).or_insert_with(|| (Arc::new(AtomicBool::new(false)), Arc::new(AtomicBool::new(false)))).clone()
}

fn try_mark_download_running(game_id: u64) -> bool {
    let mut running_downloads = RUNNING_DOWNLOADS.lock().unwrap();
    running_downloads.insert(game_id)
}

fn unmark_download_running(game_id: u64) {
    let mut running_downloads = RUNNING_DOWNLOADS.lock().unwrap();
    running_downloads.remove(&game_id);
}

struct DownloadRunningGuard {
    game_id: u64,
}

impl Drop for DownloadRunningGuard {
    fn drop(&mut self) {
        unmark_download_running(self.game_id);
    }
}

fn atomic_saturating_sub(atomic: &AtomicU64, value: u64) {
    let mut current = atomic.load(Ordering::Relaxed);
    loop {
        let new_value = current.saturating_sub(value);
        match atomic.compare_exchange_weak(
            current,
            new_value,
            Ordering::Relaxed,
            Ordering::Relaxed,
        ) {
            Ok(_) => break,
            Err(actual) => current = actual,
        }
    }
}

#[tauri::command]
fn cancel_download(game_id: u64) {
    let (cancel, _) = get_or_create_download_state(game_id);
    cancel.store(true, Ordering::Relaxed);
}

#[tauri::command]
fn pause_download(game_id: u64) {
    let (_, pause) = get_or_create_download_state(game_id);
    pause.store(true, Ordering::Relaxed);
}

#[tauri::command]
fn resume_download(game_id: u64) {
    let (cancel, pause) = get_or_create_download_state(game_id);
    cancel.store(false, Ordering::Relaxed);
    pause.store(false, Ordering::Relaxed);
}

fn pause_all_running_downloads() {
    let running_game_ids: Vec<u64> = {
        let running_downloads = RUNNING_DOWNLOADS.lock().unwrap();
        running_downloads.iter().copied().collect()
    };

    for game_id in running_game_ids {
        let (_, pause) = get_or_create_download_state(game_id);
        pause.store(true, Ordering::Relaxed);
    }
}

fn remove_obsolete_files(
    game_directory: &Path,
    local_manifest: &mut GameManifestLocal,
    remote_manifest: &GameManifestRemote
) -> Result<(), String> {
    // Crée un ensemble de tuples (name, size, hash) pour les fichiers du manifeste distant
    let remote_files: HashSet<_> = remote_manifest.files.iter().map(|file| (&file.name, file.size, &file.hash)).collect();

    // Parcourt les fichiers du manifeste local
    local_manifest.files.retain(|local_file| {
        // Crée un tuple pour le fichier local
        let local_file_key = (&local_file.name, local_file.size, &local_file.hash);

        // Vérifie si le fichier local est toujours présent dans le manifeste distant
        let is_still_valid = remote_files.contains(&local_file_key);

        // Si le fichier local n'est plus présent dans le manifeste distant, il est considéré comme obsolète
        if !is_still_valid {
            let file_path = game_directory.join(&local_file.name);

            // Supprime le fichier obsolète du disque
            if file_path.exists() {
                if file_path.is_dir() {
                    if let Err(e) = fs::remove_dir_all(&file_path) {
                        eprintln!("Failed to remove directory: {}: {}", file_path.display(), e);
                    }
                } else {
                    if let Err(e) = fs::remove_file(&file_path) {
                        eprintln!("Failed to remove file: {}: {}", file_path.display(), e);
                    }
                }
            }
        }

        // Retourne true si le fichier est encore valide, false s'il est obsolète
        is_still_valid
    });

    Ok(())
}

#[derive(Debug, serde::Deserialize)]
struct LauncherPresignedDownloadResponse {
    url: String,
}

fn get_part_file_path(target_path: &Path) -> PathBuf {
    PathBuf::from(format!("{}.part", target_path.to_string_lossy()))
}

fn calculate_initial_downloaded_for_resume(game_directory: &Path, files_to_download: &[FileDetails]) -> u64 {
    let mut total: u64 = 0;

    for file in files_to_download {
        let target_path = game_directory.join(&file.name);
        if target_path.exists() {
            if let Ok(existing_hash) = calculate_file_hash(&target_path) {
                if existing_hash == file.hash {
                    total = total.saturating_add(file.size);
                    continue;
                }
            }
        }

        let part_path = get_part_file_path(&target_path);
        if part_path.exists() {
            if let Ok(metadata) = fs::metadata(&part_path) {
                let part_size = metadata.len();
                if part_size < file.size {
                    total = total.saturating_add(part_size);
                }
            }
        }
    }

    total
}

async fn fetch_presigned_download_url(
    client: &reqwest::Client,
    presign_api_url: &str,
    bucket_name: &str,
    path_filename: &str,
) -> Result<String, String> {
    let request_url = reqwest::Url::parse_with_params(
        presign_api_url,
        &[
            ("bucketName", bucket_name),
            ("pathFilename", path_filename),
        ],
    )
    .map_err(|e| format!("Failed to build presign URL: {}", e))?;

    let response = client
        .get(request_url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch presigned URL: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response
            .text()
            .await
            .unwrap_or_else(|_| "Unable to read error body".to_string());
        return Err(format!(
            "Presign API returned {} for {}: {}",
            status, path_filename, body
        ));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read presign response body: {}", e))?;

    let payload: LauncherPresignedDownloadResponse = serde_json::from_str(&body)
        .map_err(|e| format!("Invalid presign response JSON: {}", e))?;

    if payload.url.trim().is_empty() {
        return Err("Presign API returned an empty URL".to_string());
    }

    Ok(payload.url)
}

async fn download_single_file_with_resume(
    client: reqwest::Client,
    presign_api_url: String,
    bucket_name: String,
    full_path: String,
    file: FileDetails,
    game_directory: PathBuf,
    cancel_flag: Arc<AtomicBool>,
    pause_flag: Arc<AtomicBool>,
    total_downloaded_atomic: Arc<AtomicU64>,
    session_downloaded_atomic: Arc<AtomicU64>,
) -> Result<FileDetails, String> {
    for attempt in 0..=1 {
        if cancel_flag.load(Ordering::Relaxed) {
            return Err("Download canceled".to_string());
        }
        if pause_flag.load(Ordering::Relaxed) {
            return Err("Download paused".to_string());
        }

        let target_path = game_directory.join(&file.name);
        if let Some(parent) = target_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {}", e))?;
        }

        if target_path.exists() {
            match calculate_file_hash(&target_path) {
                Ok(existing_hash) if existing_hash == file.hash => return Ok(file),
                _ => {
                    let _ = fs::remove_file(&target_path);
                }
            }
        }

        let part_path = get_part_file_path(&target_path);
        let mut resume_offset: u64 = 0;
        if part_path.exists() {
            resume_offset = fs::metadata(&part_path)
                .map_err(|e| format!("Failed to read .part metadata for {}: {}", file.name, e))?
                .len();

            if resume_offset > file.size {
                let _ = fs::remove_file(&part_path);
                resume_offset = 0;
            }
        }
        let mut counted_resume_bytes: u64 = if resume_offset < file.size {
            resume_offset
        } else {
            0
        };

        if resume_offset == file.size && file.size > 0 {
            if !target_path.exists() {
                fs::rename(&part_path, &target_path).map_err(|e| {
                    format!("Failed to restore complete part file for {}: {}", file.name, e)
                })?;
            }

            let downloaded_hash = calculate_file_hash(&target_path)?;
            if downloaded_hash == file.hash {
                total_downloaded_atomic.fetch_add(file.size, Ordering::Relaxed);
                return Ok(file);
            }

            let _ = fs::remove_file(&target_path);
            let _ = fs::remove_file(&part_path);
            resume_offset = 0;
            counted_resume_bytes = 0;
        }

        let presigned_url = fetch_presigned_download_url(
            &client,
            &presign_api_url,
            &bucket_name,
            &full_path,
        )
        .await?;

        let mut request_builder = client.get(&presigned_url);
        if resume_offset > 0 {
            request_builder =
                request_builder.header(reqwest::header::RANGE, format!("bytes={}-", resume_offset));
        }

        let response = request_builder
            .send()
            .await
            .map_err(|e| format!("Failed to send download request for {}: {}", file.name, e))?;

        if !response.status().is_success() {
            return Err(format!(
                "Failed to download {}: HTTP {}",
                file.name,
                response.status()
            ));
        }

        if resume_offset > 0 && response.status() == reqwest::StatusCode::OK {
            atomic_saturating_sub(&total_downloaded_atomic, counted_resume_bytes);
            atomic_saturating_sub(&session_downloaded_atomic, counted_resume_bytes);
            counted_resume_bytes = 0;
            resume_offset = 0;
        }

        let mut output = TokioOpenOptions::new()
            .create(true)
            .write(true)
            .append(resume_offset > 0)
            .truncate(resume_offset == 0)
            .open(&part_path)
            .await
            .map_err(|e| format!("Failed to open .part file for {}: {}", file.name, e))?;

        let mut bytes_written_this_attempt: u64 = 0;
        let mut stream = response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            if cancel_flag.load(Ordering::Relaxed) {
                return Err("Download canceled".to_string());
            }
            if pause_flag.load(Ordering::Relaxed) {
                return Err("Download paused".to_string());
            }

            let bytes = chunk.map_err(|e| format!("Error receiving chunk for {}: {}", file.name, e))?;
            output
                .write_all(&bytes)
                .await
                .map_err(|e| format!("Failed to write chunk for {}: {}", file.name, e))?;

            let chunk_len = bytes.len() as u64;
            bytes_written_this_attempt = bytes_written_this_attempt.saturating_add(chunk_len);
            total_downloaded_atomic.fetch_add(chunk_len, Ordering::Relaxed);
            session_downloaded_atomic.fetch_add(chunk_len, Ordering::Relaxed);
        }

        output
            .flush()
            .await
            .map_err(|e| format!("Failed to flush .part file for {}: {}", file.name, e))?;
        drop(output);

        let downloaded_size = fs::metadata(&part_path)
            .map_err(|e| format!("Failed to read final .part size for {}: {}", file.name, e))?
            .len();

        if downloaded_size != file.size {
            let rollback_bytes = counted_resume_bytes.saturating_add(bytes_written_this_attempt);
            atomic_saturating_sub(&total_downloaded_atomic, rollback_bytes);
            atomic_saturating_sub(&session_downloaded_atomic, rollback_bytes);

            let _ = fs::remove_file(&part_path);
            let _ = fs::remove_file(&target_path);

            if attempt == 0 {
                println!(
                    "Retrying {} after size mismatch (expected {}, got {})",
                    file.name, file.size, downloaded_size
                );
                continue;
            }

            return Err(format!(
                "File size mismatch for {}: expected {}, got {}",
                file.name, file.size, downloaded_size
            ));
        }

        if target_path.exists() {
            let _ = fs::remove_file(&target_path);
        }
        fs::rename(&part_path, &target_path)
            .map_err(|e| format!("Failed to finalize downloaded file {}: {}", file.name, e))?;

        let downloaded_hash = calculate_file_hash(&target_path)?;
        if downloaded_hash != file.hash {
            let rollback_bytes = counted_resume_bytes.saturating_add(bytes_written_this_attempt);
            atomic_saturating_sub(&total_downloaded_atomic, rollback_bytes);
            atomic_saturating_sub(&session_downloaded_atomic, rollback_bytes);

            let _ = fs::remove_file(&target_path);
            let _ = fs::remove_file(&part_path);

            if attempt == 0 {
                println!(
                    "Retrying {} after hash mismatch (expected {}, got {})",
                    file.name, file.hash, downloaded_hash
                );
                continue;
            }

            return Err(format!(
                "File hash mismatch for {}: expected {}, got {}",
                file.name, file.hash, downloaded_hash
            ));
        }

        return Ok(file);
    }

    Err(format!(
        "Failed to download {} after retries",
        file.name
    ))
}

#[tauri::command]
async fn download_and_update_game(
    webview: Window,
    bucket_name: String,
    path_filename: String,
    _os: String,
    os_architecture: String,
    api_url: String,
    file_location_download: String,
    files_to_download: Vec<FileDetails>,
    desktop_shortcut: bool,
    game_title: String,
    game_version: String,
    game_binary_size: u64,
    game_id: u64,
    user_id: u64,
    game_manifest_remote: GameManifestRemote
) -> Result<(), String> {
    println!("Starting optimized download for game: {}", game_title);
    let (cancel_flag, pause_flag) = get_or_create_download_state(game_id);
    cancel_flag.store(false, Ordering::Relaxed);
    pause_flag.store(false, Ordering::Relaxed);
    if !try_mark_download_running(game_id) {
        println!(
            "[download_and_update_game] game_id={} already running, skipping duplicate start",
            game_id
        );
        return Ok(());
    }
    let _download_running_guard = DownloadRunningGuard { game_id };
    let session_id = format!(
        "g{}-u{}-{}",
        game_id,
        user_id,
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    );
    let game_directory = PathBuf::from(&file_location_download);
    println!(
        "[download_and_update_game] session={} game_directory={}",
        session_id,
        game_directory.display()
    );
    fs::create_dir_all(&game_directory).map_err(|e| e.to_string())?;
    let mut game_manifest = load_or_create_manifest(
        &file_location_download,
        game_id,
        game_title.clone(),
        game_binary_size,
        game_version.clone(),
    )?;
    remove_obsolete_files(&game_directory, &mut game_manifest, &game_manifest_remote)?;
    remove_duplicates(&mut game_manifest);
    game_manifest.version = game_version.clone();
    let remote_manifest_total_size: u64 = game_manifest_remote.files.iter().map(|file| file.size).sum();
    let resolved_game_binary_size: u64 = if remote_manifest_total_size > 0 {
        remote_manifest_total_size
    } else if game_binary_size > 0 {
        game_binary_size
    } else {
        game_manifest.gameBinarySize
    };
    game_manifest.gameBinarySize = resolved_game_binary_size;
    game_manifest.gameTitle = game_title.clone();
    save_manifest(&file_location_download, &game_manifest)?;

    let download_targets: Vec<FileDetails> = if files_to_download.is_empty() {
        Vec::new()
    } else {
        let requested_names: HashSet<&str> = files_to_download
            .iter()
            .map(|file| file.name.as_str())
            .collect();
        let targets_from_remote: Vec<FileDetails> = game_manifest_remote
            .files
            .iter()
            .filter(|file| requested_names.contains(file.name.as_str()))
            .cloned()
            .collect();

        if targets_from_remote.is_empty() {
            files_to_download.clone()
        } else {
            targets_from_remote
        }
    };

    if download_targets.is_empty() {
        println!(
            "[download_and_update_game] session={} no files to download (cleanup/update only)",
            session_id
        );
    }

    let total_size_to_download: u64 = download_targets.iter().map(|file| file.size).sum();
    let files_count: usize = download_targets.len();
    let requested_files_count: usize = files_to_download.len();
    let initial_downloaded: u64 =
        calculate_initial_downloaded_for_resume(&game_directory, &download_targets);
    println!(
        "[download_and_update_game] session={} requested_files={} effective_targets={} total_size_to_download={} initial_downloaded={}",
        session_id, requested_files_count, files_count, total_size_to_download, initial_downloaded
    );
    let total_downloaded_atomic = Arc::new(AtomicU64::new(initial_downloaded));
    let session_downloaded_atomic = Arc::new(AtomicU64::new(0));
    let stop_progress_emitter = Arc::new(AtomicBool::new(false));
    let initial_progress: f64 = if total_size_to_download == 0 {
        100.0
    } else {
        (initial_downloaded as f64 / total_size_to_download as f64) * 100.0
    };
    webview
        .emit(
            "download-game-progress",
            Some(json!({
                "sessionId": session_id,
                "userId": user_id,
                "pathInstallLocation": file_location_download,
                "gameId": game_id,
                "gameTitle": game_title,
                "gameVersion": game_version,
                "speed": 0.0,
                "progress": initial_progress,
                "totalDownloaded": initial_downloaded,
                "totalSizeToDownload": total_size_to_download,
                "gameBinarySize": resolved_game_binary_size,
                "filesCount": files_count,
            })),
        )
        .map_err(|e| format!("Failed to emit initial download progress event: {}", e))?;
    let progress_window = webview.clone();
    let progress_stop_flag = stop_progress_emitter.clone();
    let progress_total_downloaded = total_downloaded_atomic.clone();
    let progress_session_downloaded = session_downloaded_atomic.clone();
    let progress_session_id = session_id.clone();
    let progress_install_path = file_location_download.clone();
    let progress_game_title = game_title.clone();
    let progress_game_version = game_version.clone();
    let progress_task = tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(200));
        loop {
            interval.tick().await;
            if progress_stop_flag.load(Ordering::Relaxed) {
                break;
            }
            let bytes_in_window: u64 = progress_session_downloaded.swap(0, Ordering::Relaxed);
            let speed: f64 = bytes_in_window as f64 / 0.2_f64;
            let total_downloaded_now: u64 = progress_total_downloaded
                .load(Ordering::Relaxed)
                .min(total_size_to_download);
            let progress: f64 = if total_size_to_download == 0 {
                100.0
            } else {
                (total_downloaded_now as f64 / total_size_to_download as f64) * 100.0
            };
            let _ = progress_window.emit(
                "download-game-progress",
                Some(json!({
                    "sessionId": progress_session_id,
                    "userId": user_id,
                    "pathInstallLocation": progress_install_path,
                    "gameId": game_id,
                    "gameTitle": progress_game_title,
                    "gameVersion": progress_game_version,
                    "speed": speed,
                    "progress": progress,
                    "totalDownloaded": total_downloaded_now,
                    "totalSizeToDownload": total_size_to_download,
                    "gameBinarySize": resolved_game_binary_size,
                    "filesCount": files_count,
                })),
            );
        }
    });
    let download_result: Result<(), String> = async {
        let client = reqwest::Client::builder()
            .pool_max_idle_per_host(MAX_CONCURRENT_DOWNLOADS)
            .tcp_keepalive(Some(Duration::from_secs(30)))
            .build()
            .map_err(|e| format!("Failed to build client: {}", e))?;
        let semaphore = Arc::new(Semaphore::new(MAX_CONCURRENT_DOWNLOADS));
        let mut join_set: JoinSet<Result<FileDetails, String>> = JoinSet::new();
        for file in download_targets.clone() {
            if cancel_flag.load(Ordering::Relaxed) {
                return Err("Download canceled".to_string());
            }
            if pause_flag.load(Ordering::Relaxed) {
                return Err("Download paused".to_string());
            }
            let permit = semaphore
                .clone()
                .acquire_owned()
                .await
                .map_err(|e| format!("Failed to acquire semaphore permit: {}", e))?;
            let full_path = format!(
                "{}{}/{}/{}",
                path_filename,
                game_version,
                os_architecture,
                file.name.clone()
            );
            let client_clone = client.clone();
            let presign_api_url = api_url.clone();
            let bucket_name_clone = bucket_name.clone();
            let game_directory_clone = game_directory.clone();
            let cancel_flag_clone = cancel_flag.clone();
            let pause_flag_clone = pause_flag.clone();
            let total_downloaded_clone = total_downloaded_atomic.clone();
            let session_downloaded_clone = session_downloaded_atomic.clone();
            join_set.spawn(async move {
                let _permit = permit;
                download_single_file_with_resume(
                    client_clone,
                    presign_api_url,
                    bucket_name_clone,
                    full_path,
                    file,
                    game_directory_clone,
                    cancel_flag_clone,
                    pause_flag_clone,
                    total_downloaded_clone,
                    session_downloaded_clone,
                )
                .await
            });
        }
        while let Some(task_result) = join_set.join_next().await {
            let downloaded_file = task_result
                .map_err(|e| format!("Download task join error: {}", e))??;
            game_manifest.files.push(downloaded_file);
            remove_duplicates(&mut game_manifest);
            save_manifest(&file_location_download, &game_manifest)?;
        }
        Ok(())
    }
    .await;
    stop_progress_emitter.store(true, Ordering::Relaxed);
    let _ = progress_task.await;
    if let Err(error) = download_result {
        let _ = webview.emit("download-game-error", Some(json!({
            "sessionId": session_id,
            "userId": user_id,
            "pathInstallLocation": file_location_download,
            "gameId": game_id,
            "gameTitle": game_title,
            "gameVersion": game_version,
            "totalSizeToDownload": total_size_to_download,
            "gameBinarySize": resolved_game_binary_size,
            "error": error.clone(),
        })));
        return Err(error);
    }
    remove_duplicates(&mut game_manifest);
    save_manifest(&file_location_download, &game_manifest)?;
    clean_up_directory(&game_directory, &game_manifest)?;
    if desktop_shortcut {
        create_shortcut(file_location_download.clone())
            .map_err(|e| format!("Failed to create shortcut: {}", e))?;
    }
    let final_total_downloaded: u64 = calculate_initial_downloaded_for_resume(&game_directory, &download_targets)
        .min(total_size_to_download);
    let final_progress: f64 = if total_size_to_download == 0 {
        100.0
    } else {
        (final_total_downloaded as f64 / total_size_to_download as f64) * 100.0
    };
    webview
        .emit(
            "download-game-progress",
            Some(json!({
                "sessionId": session_id,
                "userId": user_id,
                "pathInstallLocation": file_location_download,
                "gameId": game_id,
                "gameTitle": game_title,
                "gameVersion": game_version,
                "speed": 0.0,
                "progress": final_progress,
                "totalDownloaded": final_total_downloaded,
                "totalSizeToDownload": total_size_to_download,
                "gameBinarySize": resolved_game_binary_size,
                "filesCount": game_manifest.files.len(),
            })),
        )
        .map_err(|e| format!("Failed to emit final download progress event: {}", e))?;
    webview.emit("game-installation-complete", Some(json!({
        "sessionId": session_id,
        "gameTitle": game_title,
        "gameId": game_id,
        "userId": user_id,
        "fileLocationDownload": file_location_download,
        "gameVersion": game_version,
        "gameBinarySize": resolved_game_binary_size,
        "filesCount": game_manifest.files.len(),
        "totalDownloaded": final_total_downloaded,
        "totalSizeToDownload": total_size_to_download
    })))
        .map_err(|e| format!("Failed to emit game installation complete event: {}", e))?;
    Ok(())
}
fn calculate_file_hash(file_path: &Path) -> Result<String, String> {
    let file = fs::File::open(file_path).map_err(|e| format!("Failed to open file: {}", e))?;
    let mut reader = BufReader::new(file);
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 16 * 1024];
    loop {
        let bytes_read = reader
            .read(&mut buffer)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}
fn load_or_create_manifest(
    file_location_download: &str,
    game_id: u64,
    game_title: String,
    game_binary_size: u64,
    game_version: String,
) -> Result<GameManifestLocal, String> {
    let manifest_path = format!("{}/manifest_local.json", file_location_download);
    if Path::new(&manifest_path).exists() {
        let manifest_content = fs::read_to_string(&manifest_path).map_err(|e| e.to_string())?;
        let manifest: GameManifestLocal = serde_json::from_str(&manifest_content).map_err(|e| e.to_string())?;
        Ok(manifest)
    } else {
        Ok(GameManifestLocal {
            pathInstallLocation: file_location_download.to_string(),
            gameId: game_id,
            gameTitle: game_title,
            gameBinarySize: game_binary_size,
            version: game_version,
            files: vec![],
        })
    }
}

fn save_manifest(file_location_download: &str, manifest: &GameManifestLocal) -> Result<(), String> {
    let manifest_path = format!("{}/manifest_local.json", file_location_download);
    let updated_manifest = serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?;
    fs::write(&manifest_path, updated_manifest).map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct FileDetails {
    name: String,
    hash: String,
    size: u64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[allow(non_snake_case)]
struct GameManifestLocal {
    pathInstallLocation: String,
    gameId: u64,
    gameTitle: String,
    gameBinarySize: u64,
    version: String,
    files: Vec<FileDetails>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[allow(non_snake_case)]
struct GameManifestRemote {
    version: String,
    files: Vec<FileDetails>,
}

fn find_executable_in_directory(directory_path: &Path) -> Result<String, String> {
    if !directory_path.exists() || !directory_path.is_dir() {
        return Err(format!("Invalid directory path: {:?}", directory_path));
    }

    for entry in fs::read_dir(directory_path).map_err(|e| format!("Failed to read directory: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.is_dir() {
            #[cfg(target_os = "macos")]
            {
                // Vérifiez si le répertoire est un bundle .app
                if path.extension().and_then(|ext| ext.to_str()) == Some("app") {
                    let app_executable_path = path.join("Contents/MacOS");
                    if app_executable_path.exists() {
                        for app_entry in fs::read_dir(&app_executable_path).map_err(|e| format!("Failed to read app directory: {}", e))? {
                            let app_entry = app_entry.map_err(|e| format!("Failed to read app entry: {}", e))?;
                            let app_path = app_entry.path();
                            if app_path.is_file() && app_path.extension().is_none() {
                                return Ok(app_path.to_string_lossy().into_owned());
                            }
                        }
                    }
                }
            }

            if let Ok(executable) = find_executable_in_directory(&path) {
                return Ok(executable);
            }
        } else if EXECUTABLE_EXTENSIONS.iter().any(|&ext| path.extension().map_or(false, |p_ext| p_ext == ext)) {
            return Ok(path.to_string_lossy().into_owned());
        } else if cfg!(target_os = "linux") && path.extension().is_none() {
            // Vérifiez si le fichier sans extension est exécutable sous Linux
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                if let Ok(metadata) = fs::metadata(&path) {
                    let mut permissions = metadata.permissions();
                    permissions.set_mode(permissions.mode() | 0o111); // chmod +x
                    if let Err(e) = fs::set_permissions(&path, permissions) {
                        return Err(format!("Failed to set permissions: {}", e));
                    }
                    return Ok(path.to_string_lossy().into_owned());
                }
            }
        }
    }

    Err("No executable found in the directory".to_string())
}

// createShortcut
#[tauri::command]
fn create_shortcut(directory_path: String) -> Result<(), String> {
    let system_os_info = get_system_os_info_current();
    let os = &system_os_info.os;
    let desktop_path = get_desktop_path().ok_or_else(|| {
        let msg = "Failed to get desktop path";
        println!("{}", msg); // Log error message
        msg.to_string()
    })?;

    let directory_path = Path::new(&directory_path);

    // Pour macOS, nous devons trouver le bundle .app
    #[cfg(target_os = "macos")]
    let app_bundle_path = directory_path
        .read_dir()
        .map_err(|e| format!("Failed to read directory: {}", e))?
        .filter_map(Result::ok)
        .find(|entry| entry.path().extension().map_or(false, |ext| ext == "app"))
        .map(|entry| entry.path())
        .ok_or_else(|| "No .app bundle found in the directory".to_string())?;

    #[cfg(any(target_os = "windows", target_os = "linux"))]
    let executable_path = find_executable_in_directory(&directory_path).map_err(|e| {
        println!("Failed to find executable: {}", e); // Log error message
        e
    })?;

    #[cfg(any(target_os = "windows", target_os = "linux"))]
    let exe_name = Path::new(&executable_path)
        .file_stem()
        .ok_or("Failed to get executable name")?
        .to_str()
        .ok_or("Failed to convert executable name to str")?;

    match os.as_str() {
        "Windows" => {
            #[cfg(target_os = "windows")]
            {
                // Raccourci LNK for Windows
                let shortcut_path = Path::new(&desktop_path).join(format!("{}.lnk", exe_name));
                let sl = mslnk::ShellLink::new(&executable_path).map_err(|e| format!("Failed to create ShellLink: {}", e))?;
                sl.create_lnk(shortcut_path.to_string_lossy().into_owned()).map_err(|e| format!("Failed to create lnk: {}", e))?;
            }
        }
        "macOS" => {
            #[cfg(target_os = "macos")]
            {
                // Raccourci ALIAS for macOS
                let alias_name = format!("{}.alias", app_bundle_path.file_stem().unwrap().to_str().unwrap());
                let alias_path = Path::new(&desktop_path).join(&alias_name);
                let apple_script = format!(
                    "tell application \"Finder\" to make alias file to POSIX file \"{}\" at POSIX file \"{}\"",
                    app_bundle_path.to_str().unwrap(), // Utilise le chemin du bundle .app
                    alias_path.parent().unwrap().to_str().unwrap()
                );

                // Execute AppleScript
                Command::new("osascript")
                    .arg("-e")
                    .arg(&apple_script)
                    .output()
                    .map_err(|e| format!("Failed to create alias: {}", e))?;
            }
        }
        "Linux" => {
            #[cfg(target_os = "linux")]
            {
                // Définir les chemins de l'icône et des fichiers .desktop
                let icon_name = format!("{}.png", exe_name);
                let icon_source_path = directory_path.join(&icon_name);
                let icon_dest_path = dirs::home_dir().unwrap().join(".icons").join(&icon_name);

                // Créer le répertoire d'icônes s'il n'existe pas
                if !icon_dest_path.parent().unwrap().exists() {
                    fs::create_dir_all(icon_dest_path.parent().unwrap())
                        .map_err(|e| format!("Failed to create icons directory: {}", e))?;
                }

                // Copier l'icône vers le répertoire des icônes
                fs::copy(&icon_source_path, &icon_dest_path)
                    .map_err(|e| format!("Failed to copy icon: {}", e))?;

                // Créer le fichier .desktop
                let desktop_entry = format!(
                    "[Desktop Entry]\n\
                    Name={}\n\
                    Exec=\"{}\"\n\
                    Icon={}\n\
                    Type=Application\n\
                    Categories=Game;\n\
                    Terminal=false\n",
                    exe_name,
                    executable_path,
                    icon_name
                );

                let applications_path = dirs::data_dir().unwrap().join("applications");
                if !applications_path.exists() {
                    fs::create_dir_all(&applications_path)
                        .map_err(|e| format!("Failed to create applications directory: {}", e))?;
                }
                let desktop_file_path = Path::new(&desktop_path).join(format!("{}.desktop", exe_name));
                let applications_file_path = applications_path.join(format!("{}.desktop", exe_name));

                // Écrire le fichier .desktop et définir les permissions pour le bureau
                fs::write(&desktop_file_path, &desktop_entry)
                    .map_err(|e| format!("Failed to create .desktop file on desktop: {}", e))?;
                Command::new("chmod")
                    .arg("+x")
                    .arg(&desktop_file_path)
                    .output()
                    .map_err(|e| format!("Failed to set .desktop file as executable on desktop: {}", e))?;

                // Activer "Allow Launching"
                Command::new("gio")
                    .arg("set")
                    .arg(&desktop_file_path)
                    .arg("metadata::trusted")
                    .arg("true")
                    .output()
                    .map_err(|e| format!("Failed to set metadata::trusted on .desktop file: {}", e))?;

                // Écrire le fichier .desktop et définir les permissions pour applications
                fs::write(&applications_file_path, &desktop_entry)
                    .map_err(|e| format!("Failed to create .desktop file in applications: {}", e))?;
                Command::new("chmod")
                    .arg("+x")
                    .arg(&applications_file_path)
                    .output()
                    .map_err(|e| format!("Failed to set .desktop file as executable in applications: {}", e))?;
            }
        }
        _ => return Err("Unsupported OS".to_string()),
    }

    Ok(())
}

fn get_desktop_path() -> Option<PathBuf> {
    dirs::home_dir().map(|path| path.join("Desktop"))
}

#[tauri::command]
async fn launch_game(file_location_download: String) -> Result<(), String> {
    // Créer un canal pour transmettre les erreurs
    let (tx, mut rx) = mpsc::channel(1);

    thread::spawn(move || {
        // Vérifiez si le répertoire de jeu existe
        let game_dir = std::path::Path::new(&file_location_download);
        if !game_dir.exists() {
            let _ = tx.blocking_send(Err(format!("Game directory does not exist: {:?}", game_dir)));
            return;
        }

        // Trouver l'exécutable dans le répertoire du jeu
        let executable_path = match find_executable_in_directory(&game_dir) {
            Ok(path) => path,
            Err(e) => {
                let _ = tx.blocking_send(Err(format!("Error finding executable: {}", e)));
                return;
            }
        };
        let game_path = std::path::Path::new(&executable_path);

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut permissions = match std::fs::metadata(&game_path) {
                Ok(metadata) => metadata.permissions(),
                Err(e) => {
                    let _ = tx.blocking_send(Err(format!("Failed to get metadata: {}", e)));
                    return;
                }
            };
            permissions.set_mode(permissions.mode() | 0o111); // chmod +x
            if let Err(e) = std::fs::set_permissions(&game_path, permissions) {
                let _ = tx.blocking_send(Err(format!("Failed to set permissions: {}", e)));
                return;
            }
        }

        // Utiliser std::process::Command pour lancer le jeu et capturer les erreurs
        use std::process::Command;
        let output = match Command::new(&game_path)
            .current_dir(&game_dir)
            .output()
        {
            Ok(output) => output,
            Err(e) => {
                let _ = tx.blocking_send(Err(format!("Failed to launch game: {}", e)));
                return;
            }
        };

        // Vérifiez si le processus a renvoyé une erreur
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let _ = tx.blocking_send(Err(format!("Failed to launch game: {}", stderr)));
            return;
        }

        let _ = tx.blocking_send(Ok(()));
    });

    // Recevoir et traiter le résultat sans bloquer le thread principal
    if let Some(result) = rx.recv().await {
        return result;
    }

    Ok(())
}

#[tauri::command]
async fn uninstall_game(path_install_location: String) -> Result<(), String> {
    let game_directory = Path::new(&path_install_location);

    // Vérifier si le répertoire existe
    if game_directory.exists() && game_directory.is_dir() {
        // Supprimer le répertoire et son contenu
        remove_dir_all(game_directory).map_err(|e| format!("Failed to remove game directory: {}", e))?;
        Ok(())
    } else {
        Err(format!("Game directory does not exist or is not a directory: {}", path_install_location))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .setup(|app| {
            // Ouvre DevTools uniquement en mode debug (This is true for `tauri dev` and `tauri build --debug`)
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            // Plugin de mise à jour pour les applications de bureau
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            // Définir le menu de la barre d'état
            let show = MenuItemBuilder::new("Open CrzGames").id("show").build(app).unwrap();
            let hide = MenuItemBuilder::new("Hide CrzGames").id("hide").build(app).unwrap();
            let quit = MenuItemBuilder::new("Quit CrzGames").id("quit").build(app).unwrap();

            // Créer le menu de la barre d'état
            let menu = MenuBuilder::new(app)
                .items(&[&show, &hide, &quit])
                .build()
                .unwrap();

            // Créer l'icône de la barre d'état avec le menu défini ci-dessus et les events associés
            let _tray = TrayIconBuilder::new()
                .icon(Image::from_bytes(include_bytes!("../icons/icon.png"))?)
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => {
                        pause_all_running_downloads();
                        app.exit(0);
                    }
                    "hide" => {
                        let window = app.get_webview_window("main").unwrap();
                        window.hide().unwrap();
                    }
                    "show" => {
                        let window = app.get_webview_window("main").unwrap();
                        window.show().unwrap();
                        window.set_focus().unwrap();
                        window.center().unwrap();
                    }
                    _ => {}
                })
                // Gérer les événements de clic sur l'icône de la barre d'état
                .on_tray_icon_event(|app_handle, event| {
                    if let TrayIconEvent::Click { button, .. } = event {
                        if button == MouseButton::Left {
                            let app = app_handle.app_handle();
                            let window = app.get_webview_window("main").unwrap();
                            window.show().unwrap();
                            window.set_focus().unwrap();
                            window.center().unwrap();
                        }
                    }
                })
                .build(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_launcher_path_directory,
            check_disk_space,
            download_and_update_game,
            launch_game,
            create_shortcut,
            check_missing_files,
            uninstall_game,
            resume_download,
            pause_download,
            cancel_download,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
