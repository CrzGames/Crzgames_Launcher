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
use std::time::Instant;
use core::time::Duration;
use serde_json::json;
use dirs;
use sysinfo::{ Disks, System };
use zip::ZipArchive;
use futures::StreamExt;
use sha2::{Digest, Sha256};
use tokio::sync::mpsc;
use std::thread;
use std::fs::remove_dir_all;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
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

lazy_static! {
    static ref DOWNLOAD_STATES: DownloadState = Arc::new(Mutex::new(HashMap::new()));
}

fn get_or_create_download_state(game_id: u64) -> (Arc<AtomicBool>, Arc<AtomicBool>) {
    let mut states = DOWNLOAD_STATES.lock().unwrap();
    states.entry(game_id).or_insert_with(|| (Arc::new(AtomicBool::new(false)), Arc::new(AtomicBool::new(false)))).clone()
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
    println!("Starting download for game: {}", game_title);

    let (cancel_flag, pause_flag) = get_or_create_download_state(game_id);
    cancel_flag.store(false, Ordering::Relaxed);
    pause_flag.store(false, Ordering::Relaxed);

    // Crée le répertoire de téléchargement si nécessaire
    let game_directory = Path::new(&file_location_download);
    println!("Games directory: {:?}", game_directory);
    fs::create_dir_all(&game_directory).map_err(|e| e.to_string())?;

    // Charger le manifeste local pour obtenir l'état actuel du téléchargement ou créer un nouveau manifeste
    let mut game_manifest = load_or_create_manifest(
        &file_location_download,
        game_id,
        game_title.clone(),
        game_binary_size,
        game_version.clone(),
    )?;

    // Supprimer les fichiers obsolètes avant de commencer le téléchargement
    // Par exemple si la version suivante à supprimer certains fichier / dossier par rapport à la version actuelle
    remove_obsolete_files(&game_directory, &mut game_manifest, &game_manifest_remote)?;

    // Supprimer les doublons dans le manifest_local.json avant de commencer le téléchargement
    remove_duplicates(&mut game_manifest);

    // Mettre à jour la version du jeu et la taille binaire dans le manifeste local
    game_manifest.version = game_version.clone();
    game_manifest.gameBinarySize = game_binary_size;
    game_manifest.gameTitle = game_title.clone();

    // Sauvegarder le manifeste mis à jour après la suppression des fichiers obsolètes
    save_manifest(&file_location_download, &game_manifest)?;

    // Calculer le total à télécharger en fonction des fichiers à télécharger
    let total_size_to_download: u64 = files_to_download.iter().map(|file| file.size).sum();

    // Si le manifest_local.json existe déjà, récupérer tout les file.size et les sommer
    // Taille totale DEJA téléchargée (pour la reprise du téléchargement si nécessaire)
    let mut total_downloaded: u64 = calculate_real_total_downloaded(&game_directory, &game_manifest);

    // Utiliser seulement pour renvoyer le speed du telechargement
    let mut bytes_downloaded = 0;

    // Configuration du client HTTP pour les requêtes
    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;

    let start_time = Instant::now();
    let mut last_emit_time = Instant::now();

    for file in files_to_download {
        if cancel_flag.load(Ordering::Relaxed) {
            return Err("Download canceled".to_string());
        }

        if pause_flag.load(Ordering::Relaxed) {
            return Err("Download paused".to_string());
        }

        // Construction de l'URL pour la requête GET avec les paramètres
        let full_path = format!("{}{}/{}/{}", path_filename, game_version, os_architecture, file.name);
        let request_url = format!("{}?bucketName={}&pathFilename={}", api_url, bucket_name, full_path);
        println!("Downloading file, URL API: {}", request_url);

        // Envoie la requête GET et gère la réponse
        let response = client.get(&request_url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to download file: {} received {} response", file.name, response.status()));
        }

        // Séparation de la partie d'obtention des en-têtes HTTP
        let content_type = response.headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_string();

        // Extraire le chemin du fichier à partir de son nom
        let file_path = game_directory.join(&file.name);
        if let Some(parent) = file_path.parent() {
            println!("Creating directory: {}", parent.display());
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        let mut file_data = vec![];
        let mut stream = response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    if cancel_flag.load(Ordering::Relaxed) {
                        return Err("Download canceled".to_string());
                    }

                    if pause_flag.load(Ordering::Relaxed) {
                        return Err("Download paused".to_string());
                    }

                    file_data.extend_from_slice(&bytes);

                    let elapsed = start_time.elapsed().as_secs_f64();
                    let speed = bytes_downloaded as f64 / elapsed; // bytes per second

                    if last_emit_time.elapsed() >= Duration::from_millis(50) { // Émettre toutes les 200 ms
                        last_emit_time = Instant::now();
                        // Envoyer un événement de progression de téléchargement avec la vitesse
                        webview.emit("download-game-progress", Some(json!({
                            "userId": user_id,
                            "pathInstallLocation": file_location_download,
                            "gameId": game_id,
                            "gameTitle": game_title,
                            "gameVersion": game_version,
                            "speed": speed, // vitesse en bytes par seconde
                            "totalDownloaded": total_downloaded,
                            "totalSizeToDownload": total_size_to_download,
                            "gameBinarySize": game_binary_size,
                        })))
                            .map_err(|e| format!("Failed to emit download progress event: {}", e))?;
                    }
                },
                Err(err) => return Err(format!("Error receiving chunk for {}: {}", file.name, err)),
            }
        }

        if content_type == "application/zip" {
            // Traitement du fichier ZIP
            println!("Processing ZIP file: {}", file.name);
            let cursor = std::io::Cursor::new(file_data);
            let mut zip = ZipArchive::new(cursor).map_err(|e| format!("Failed to read zip archive: {}", e))?;

            // Pour chaque fichier dans l'archive, calculer le hash et mettre à jour le manifest
            for i in 0..zip.len() {
                let mut zip_file = zip.by_index(i).map_err(|e| format!("Failed to access file in zip: {}", e))?;
                let out_path = game_directory.join(&file.name);
                println!("Extracted file path: {}", out_path.display());

                // Créez les dossiers nécessaires avant d'extraire le fichier
                if let Some(parent) = out_path.parent() {
                    println!("Creating directory: {}", parent.display());
                    fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
                }

                let mut buffer = Vec::new();
                zip_file.read_to_end(&mut buffer).map_err(|e| format!("Failed to read zip file: {}", e))?;
                fs::write(&out_path, &buffer).map_err(|e| format!("Failed to write file: {}", e))?;

                let extracted_hash = calculate_file_hash(&out_path)?;
                println!("Extracted file hash: {}", extracted_hash);

                // Mettre à jour le manifest local pour chaque fichier extrait
                let extracted_file_details = FileDetails {
                    name: file.name.to_string(),
                    hash: file.hash.to_string(),
                    size: file.size,
                };
                game_manifest.files.push(extracted_file_details.clone());
                remove_duplicates(&mut game_manifest);
                save_manifest(&file_location_download, &game_manifest)?;
                //update_local_manifest(&file_location_download, &extracted_file_details, game_id, &game_title, &game_version, game_binary_size)?;
                total_downloaded += file.size;
                bytes_downloaded += file.size;
            }
        } else {
            // Si le fichier doit être placé dans un sous-dossier, ajustez le chemin
            let target_path = game_directory.join(&file.name);
            if let Some(parent) = target_path.parent() {
                if parent != game_directory {
                    println!("Creating directory for nested file: {}", parent.display());
                    fs::create_dir_all(parent).map_err(|e| format!("Failed to create nested directory: {}", e))?;
                }
            }

            // Écriture atomique du fichier
            let temp_file_path = target_path.with_extension("tmp");
            println!("Writing file to temporary path: {}", temp_file_path.display());
            fs::write(&temp_file_path, &file_data).map_err(|e| format!("Failed to write file: {}", e))?;
            fs::rename(&temp_file_path, &target_path).map_err(|e| format!("Failed to rename temp file: {}", e))?;

            // Validation du fichier téléchargé (comparaison des hash)
            let downloaded_hash = calculate_file_hash(&target_path)?;
            println!("Downloaded file hash: {}", downloaded_hash);
            if downloaded_hash != file.hash {
                return Err(format!("File hash mismatch for {}: expected {}, got {}", file.name, file.hash, downloaded_hash));
            }

            // Mettre à jour le manifest local et la progression du téléchargement
            game_manifest.files.push(file.clone());
        }
    }

    // Supprimer les doublons dans le manifeste local
    remove_duplicates(&mut game_manifest);

    // Sauvegarder le manifeste mis à jour après le téléchargement
    save_manifest(&file_location_download, &game_manifest)?;

    // Appeler la fonction de nettoyage après avoir sauvegardé le manifeste
    // Pour supprimer les fichiers que l'utilisateur aurait pus ajouté manuellement
    clean_up_directory(&game_directory, &game_manifest)?;

    // Création d'un raccourci sur le bureau si nécessaire
    if desktop_shortcut {
        create_shortcut(file_location_download.clone()).map_err(|e| format!("Failed to create shortcut: {}", e))?;
    }

    // Émettre un événement de fin de téléchargement
    webview.emit("game-installation-complete", Some(json!({
        "gameTitle": game_title,
        "gameId": game_id,
        "user_id": user_id,
        "fileLocationDownload": file_location_download,
        "gameVersion": game_version,
        "gameBinarySize": game_binary_size
    })))
        .map_err(|e| format!("Failed to emit game installation complete event: {}", e))?;

    Ok(())
}

fn calculate_file_hash(file_path: &Path) -> Result<String, String> {
    let file = fs::File::open(file_path).map_err(|e| format!("Failed to open file: {}", e))?;
    let mut reader = BufReader::new(file);
    let mut hasher = Sha256::new();
    let mut buffer = Vec::new();

    reader.read_to_end(&mut buffer).map_err(|e| format!("Failed to read file: {}", e))?;
    hasher.update(buffer);

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

fn calculate_real_total_downloaded(game_directory: &Path, manifest: &GameManifestLocal) -> u64 {
    manifest.files.iter().filter_map(|file| {
        let file_path = game_directory.join(&file.name);
        if file_path.exists() {
            Some(file.size)
        } else {
            None
        }
    }).sum()
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

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[allow(non_snake_case)]
struct GameProgressDownload {
    user_id: u64,
    pathInstallLocation: String,
    gameId: u64,
    gameTitle: String,
    version: String
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

fn main() {
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
                    "quit" => app.exit(0),
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
            cancel_download
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
