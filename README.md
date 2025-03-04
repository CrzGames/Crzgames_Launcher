# Crzgames - Launcher

## IMPORTANT :

1. Pour que les jeux sois affiché et téléchargeable sur le launcher il faut sur le site "Crzgames_WebSite_FrontEnd" :
   - Crée le jeu via la page "Game Manager" en ajoutant : 
      - Ajouter la plateforme souhaité au jeu via l'input "Platforms" (Windows, macOS..)
      - Ajouter les binaires par rapport a la plateforme tout en bas de la page, exemple Windows le path : games/binaries/world-of-warcraft/windows/, quand on publie notre jeu dans ce dossier "windows" on ajoutera un dossier "1.2.0/x86_64" (version du jeu/l'architecture du processeur), donc le launcher quand il fera la demande à l'API il rajoutera le numéro de version du jeu + l'architecture de l'utilisateur actuellement connecté au Launcher.
   - Ajouter une version d'un jeu téléchargeable via la page "Game Version Manager", spécifier le jeu, la version et choses IMPORTANT tant que c'est pas coché pour "Available Download" l'utilisateur ne pourra pas voir la mise à jour, ce qui permet lors de la publication sur AppStore/PlayStore d'attendre que les Stores sois accepter et de synchroniser les plateformes Desktop / Mobile voir Consoles en MEME TEMPS il y aura plus qu'à cocher "Available Download" quand le PlayStore/AppStore on VALIDER. Permet également si une version est déffectueuse de REVENIR EN ARRIERE donc de décocher "Available Download".
2. Les jeux ne sont affiché seulement par rapport a la plateforme qui es executer, donc si le jeu est disponible que Windows il sera affiché que sur Windows
3. Pour le jeu Linux, pour les seeders, il faut installer : sudo apt install libsdl2-2.0-0 (pour qu'il puisse ce lancé le jeu)

<br /><br /><br /><br />

## 🛠 Tech Stack

- Tauri (framework)
- Nuxt.js (framework front-end in Tauri)
- Rust (back-end in Tauri)
- NodeJS (environnement)
- Vitest (tests unitaire)
- CI / CD (Github actions)

<br /><br /><br /><br />

## 📦 Versionning

On utilise la convention SemVer : https://semver.org/lang/fr/ <br /><br />
Pour une Release classique : MAJOR.MINOR.PATCH <br />
Pour une Pre-Release, exemples : MAJOR.MINOR.PATCH-rc.0 OR MAJOR.MINOR.PATCH-beta.3 <br /><br />

Nous utilison release-please de Google pour versionner, via Github Actions. <br />
Pour que cela sois pris en compte il faut utiliser les conventionnal commits : https://www.conventionalcommits.org/en/v1.0.0/ <br />
Release Please crée une demande d'extraction de version après avoir remarqué que la branche par défaut contient des « unités publiables » depuis la dernière version. Une unité publiable est un commit sur la branche avec l'un des préfixes suivants : `feat` et `fix`. <br /><br />

La première Release que créer release-please automatiquement est la version : 1.0.0 <br />
Pour créer une Pre-Release faire un commit vide, par exemple si on'ai à la version 1.0.0, on peut faire :

```bash
git commit --allow-empty -m "chore: release 1.1.0-rc.0" -m "Release-As: 1.1.0-rc.0"
```

<br /><br /><br /><br />

## ⚙️Setup Environment - Windows

1. Download and Install Microsoft Visual Studio 2022 (MSVC >= v143 and Windows SDK >= 10): https://visualstudio.microsoft.com/fr/vs/
2. Download and Install WebView2 (if windows < 10) : https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section
3. Download and Install Rust version >= 1.85.0 : https://www.rust-lang.org/tools/install
4. Spécifiquement pour build du ARM64 il faut installer LLVM et ajouté au PATH : https://github.com/llvm/llvm-project/releases
5. Install NodeJS latest LTS for Vue.js/Tauri :

```bash
# nvm
# nvm install : https://github.com/coreybutler/nvm-windows/releases
# Install Node.js latest LTS
nvm install lts && nvm use lts
```

6. Install dependencies for Nuxt.js/Tauri

```bash
 # npm
 # Install dependencies
 npm install
```

7. Install targets rust for build/compile Tauri :

```bash
npm run desktop:install:target:windows
```

8. Il y a toujours une chaine d'outils qui est utilisé par défault, c'est celui qui est choisi lors de la compilation

```bash
# Pour connaitre la chaine d'outils actuellement utilisé :
rustup default

# Pour changer la chaine d'outils par défault utilisé, exemples :
rustup default stable-x86_64-pc-windows-msvc # Windows x64
rustup default stable-aarch64-pc-windows-msvc # Windows arm64
```

<br />

## ⚙️ Setup Environment - macOS

1. Setup Command Line Tools :

```bash
xcode-select --install
```

2. Download and Install Rust version >= 1.85.0 :

```bash
#curl
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

3. Install NodeJS LTS latest for Vue.js/Tauri :

```bash
# nvm
# nvm install : https://github.com/coreybutler/nvm-windows/releases
# Install Node.js latest LTS
nvm install lts && nvm use lts
```

4. Install dependencies for Vue.js/Tauri

```bash
 # npm
 # Install dependencies
 npm install
```

5. Install targets rust for build/compile Tauri :

```bash
npm run desktop:install:target:macos
```

6. Il y a toujours une chaine d'outils qui est utilisé par défault, c'est celui qui est choisi lors de la compilation

```bash
# Pour connaitre la chaine d'outils actuellement utilisé :
rustup default

# Pour changer la chaine d'outils par défault utilisé, exemples :
rustup default stable-x86_64-apple-darwin # macOS Intel x86_64
rustup default stable-aarch64-unknown-linux-gnu # macOS Apple Silicon arm64
```

<br />

## ⚙️ Setup Environment - Linux

1. Dépendances système (Debian / Ubuntu) :

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  fuse # for .AppImage
```

2. Install Rust version >= 1.85.0 :

```bash
#curl
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

3. Install NodeJS latest LTS for Vue.js/Tauri :

```bash
# nvm
# nvm install : https://github.com/coreybutler/nvm-windows/releases
# Install Node.js latest LTS
 nvm install lts && nvm use lts
```

4. Install dependencies for Vue.js/Tauri

```bash
 # npm
 # Install dependencies
 npm install
```

5. Install targets rust for build/compile Tauri :

```bash
npm run desktop:install:target:linux
```

6. Il y a toujours une chaine d'outils qui est utilisé par défault, c'est celui qui est choisi lors de la compilation

```bash
# Pour connaitre la chaine d'outils actuellement utilisé :
rustup default

# Pour changer la chaine d'outils par défault utilisé, exemples :
rustup default stable-x86_64-unknown-linux-gnu # Linux x64
rustup default stable-aarch64-unknown-linux-gnu # Linux arm64
```

<br /><br /><br /><br />

## 🔄 Cycle Development

Cette commande vérifie rapidement votre code Rust pour s'assurer qu'il se compile mais ne produit pas d'exécutable et ne lance pas l'application (seulement pour s'assurer que le projet Rust compile) :

```bash
# npm
npm run desktop:run:check-compile
```

Application type : Desktop (.exe) <br />
Start the development server on http://localhost:1460/

```bash
# npm
npm run desktop:run:dev
```

<br /><br /><br /><br />

## 🧪 Unit Tests

### Development :

```sh
# npm
# test unit (Vitest)
# No GUI
npm run test:unit:dev

# GUI
npm run test:unit:dev:gui
```

### Staging / Production :

```sh
# npm
# test unit (Vitest)
npm run test:unit:staging-prod
```

<br /><br /><br /><br />

## 🚀 Production

### ⚙️➡️ Automatic - Pipeline CI / CD :

1.

<br />

### ✋ Manual :

### Install for production - Windows / macOS / Linux :

Par défaut, Rust installe uniquement les chaînes d'outils pour la cible de votre machine. <br />
Vous devez donc d'abord installer la chaîne d'outils pour le system souhaiter. <br /><br />
Exemple pour ajouter/installer la chaine d'outils Windows 32bit :

```bash
rustup target add i686-pc-windows-msvc
```

Supprimer une target spécifique :

```bash
rustup target remove i686-pc-windows-msvc
```

Lister les targets déjà installer :

```bash
rustup target list
```

Targets disponible : https://doc.rust-lang.org/nightly/rustc/platform-support.html

<br />

Il y a toujours une chaine d'outils qui est utilisé par défault, c'est celui qui est choisi lors de la compilation <br />
Pour connaitre la chaine d'outils actuellement utilisé :

```bash
rustup default
```

Pour changer la chaine d'outils par défault utilisé, exemple pour Windows-32bit :

```bash
rustup default stable-i686-pc-windows-msvc
```

<br /><br />

### Après avoir build, récupérer le binaires et/ou le programme d'installation pour le système d'exploitation ciblé :

Cette commande intègre vos ressources Web dans un seul binaire avec votre code Rust. <br />
Le binaire lui-même sera situé dans : <br />

```bash
src-tauri/target/release/[app name]
```

Et les programmes d'installation seront situés dans :

```bash
src-tauri/target/release/bundle/
```

<br /><br />

### 🖥 Build Desktop - Windows - .msi / .exe :

<span style="color: red;">IMPORTANT</span> : Veuillez noter que les installateurs de .msi ne peuvent être créés que sous Windows car la compilation croisée ne fonctionne pas encore.
<br />

<span style="color: red;">IMPORTANT (2)</span> : Windows 11 est compatible nativement, mais en-dessous de Windows 11 il n'y as pas WebView2 installer par défault. Il faudra le packager dans l'installeur .msi pour que ce sois compatible à partir de Windows7 et +. <br />

Windows 64-bit (Windows 7+) :

```bash
npm run desktop:build:windows:x64
```

Windows arm64 (Windows 10+) :

```bash
npm run desktop:build:windows:arm64
```

<br />

### 🐧 Build Desktop - Linux - .deb / .rpm / .AppImage :

<span style="color: red;">IMPORTANT</span> : Veuillez noter que les paquets .deb / .rpm / .AppImage ne peuvent être créés que sur Linux car la compilation croisée ne fonctionne pas encore. <br />

<span style="color: red;">IMPORTANT (2)</span> : Compiler un .AppImage pour faciliter les utilisateurs, et permet de rendre compatible sur tous les distributions Linux (à partir du moment ou c'est la même architecture). <br />

<span style="color: red;">IMPORTANT (3)</span> : L'utilisateur doit rendre le fichier exécutable pour l'executable .AppImage et installer fuse. <br />

```bash
chmod a+x MyApp.AppImage
sudo apt install fuse

# and run application :
./MyApp.AppImage
```

<span style="color: red;">IMPORTANT (4)</span> : Si votre application lit de l'audio/vidéo, vous devez activer tauri.conf.json > tauri > bundle > appimage > bundleMediaFramework. Cela augmentera la taille du bundle AppImage pour inclure gstreamerdes fichiers supplémentaires nécessaires à la lecture multimédia. Cet indicateur n'est actuellement pris en charge que sur les systèmes de construction Ubuntu. <br />

Linux 64-bit (kernel 3.2+, glibc 2.17+) :

```bash
npm run desktop:build:linux:x86_64
```

Linux arm64 (kernel 4.1+, glibc 2.17+) :

```bash
npm run desktop:build:linux:arm64
```

<br />

### 🍏 Build Desktop - macOS - .app / .dmg :

<span style="color: red;">IMPORTANT</span> : Veuillez noter que les bundles .app et .dmg ne peuvent être créés que sur macOS car la compilation croisée ne fonctionne pas encore. <br />

<span style="color: red;">IMPORTANT (2)</span> : Compiler un .app pour faciliter les utilisateurs. Une application .app est similaire à un fichier .exe sur Windows. <br />

<span style="color: red;">IMPORTANT (3)</span> : La version minimale du système d'exploitation nécessaire pour qu'une application Tauri puisse fonctionner sur macOS est 10.13. Si vous avez besoin du support pour les nouvelles API macOS comme window.print qui n'est pris en charge que depuis la version macOS 11. <br />

macOS Apple Silicon arm64 (11.0+, Big Sur+) :
produit un binaire macOS pour les machines Apple basé sur les processeurs Apple Silicon.

```bash
npm run desktop:build:macos:arm64
```

macOS Intel 64-bit (11.0+, Lion+) :
produit un binaire macOS pour les machines Apple basé sur les processeurs Intel.

```bash
npm run desktop:build:macos:x86_64
```

macOS Apple Silicon arm64 (11.0+, Big Sur+) AND macOS Intel 64-bit (11.0+, Lion+) : produit un binaire macOS universel qui s'exécute à la fois sur le processeurs Apple Silicon et sur les Mac à processeur Intel.

```bash
npm run desktop:build:macos:universal
```
