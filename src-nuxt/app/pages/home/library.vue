<template>
  <div :class="{ 'launching-cursor': isLaunchingGame }" class="grid gap-8 px-4 py-5 pb-12 text-white relative">
    <div class="flex items-center justify-between">
      <div class="flex flex-wrap items-center w-full">
        <!-- Boutons de navigation gauche / droite -->
        <NavigationPages class="mr-5" />

        <!-- Barre de recherche -->
        <CrzSearchBar
          class="flex-grow min-w-[200px]"
          :height="40"
          :value="searchTerm"
          :placeholder="'Search for games (CTRL + E)'"
          @update:value="searchTerm = $event"
        />

      </div>
    </div>

    <!-- Titre principal de la page "My Library" -->
    <h1 class="font-serif text-xl font-semibold sm:text-2xl">My Library</h1>

    <!-- Diviseur -->
    <Divider />

    <!-- Spinner de chargement : s'affiche seulement pendant le chargement des jeux -->
    <div v-if="isLoading" class="flex min-h-[320px] w-full items-center justify-center">
      <CrzSpinner />
    </div>

    <!-- Liste des jeux en cours de tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chargement -->
    <div v-if="!isLoading && gameActiveDownload && gameActiveDownload.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-lg font-medium flex items-center">
        Games being downloaded
        <CrzBadge variant="yellow" size="sm" class="ml-2">
          {{ gameActiveDownload.length }}
        </CrzBadge>
      </h4>

      <div class="grid grid-cols-auto-fit gap-8" style="grid-template-columns: repeat(auto-fit, minmax(180px, 220px))">
        <template v-for="game in gameActiveDownload" :key="game.id">
          <div class="grid gap-1">
            <!-- Carte du jeu -->
            <CrzGameCard
              :pictureFileUrl="game.pictureFile?.url"
              :trailerFileUrl="game.trailerFile?.url"
              :logoFileUrl="game.logoFile?.url"
              :gameCategory="game.gameCategory"
              :gamePlatform="game.gamePlatform"
              :title="game.title"
              :showPlatforms="false"
              :showVideo="false"
              :showSubTitle="false"
              :smallText="true"
              :upcomingGame="game.upcoming_game"
              :newGame="game.new_game"
              :showButtonDownloadProgress="true"
              :isDownloadPaused="isActiveDownloadPaused(game.id)"
            />
            <p
              v-if="getLibraryVersionLabel(game.id, 'active-download')"
              :class="[
                'text-xs font-medium',
                isActiveDownloadPaused(game.id) ? 'text-amber-400' : 'text-zinc-400',
              ]"
            >
              {{ getLibraryVersionLabel(game.id, 'active-download') }}
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- Jeux dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©, mais nÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cessitant une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour -->
    <div v-if="!isLoading && gameNeedsUpdate && gameNeedsUpdate.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-lg font-medium flex items-center">
        Games needing updates
        <!-- Badge avec le nombre de jeux trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s -->
        <CrzBadge variant="yellow" size="sm" class="ml-2">
          {{ gameNeedsUpdate.length }}
        </CrzBadge>
      </h4>
      <div class="grid grid-cols-auto-fit gap-8" style="grid-template-columns: repeat(auto-fit, minmax(180px, 220px))">
        <template v-for="game in gameNeedsUpdate" :key="game.id">
          <div class="grid gap-1">
            <CrzGameCard
              :pictureFileUrl="game.pictureFile?.url"
              :trailerFileUrl="game.trailerFile?.url"
              :logoFileUrl="game.logoFile?.url"
              :gameCategory="game.gameCategory"
              :gamePlatform="game.gamePlatform"
              :title="game.title"
              :showPlatforms="false"
              :showVideo="false"
              :showSubTitle="false"
              :smallText="true"
              :upcomingGame="game.upcoming_game"
              :newGame="game.new_game"
              :showUpdateIndicator="true"
              :showFixGameInstalledInLibraryButton="true"
              :showDownloadButton="true"
              :showEllipsisButton="true"
              @fixGameInstalledInLibrary="openFixGameInstalledModal(game)"
              @createDesktopShortcut="createShortcutOnDesktop(game)"
              @uninstallGame="UninstallGame(game)"
              @forceUpdateGame="openDownloadModal(game, false, false, true)"
              @download="openDownloadModal(game, false, false)"
            />
            <p v-if="getLibraryVersionLabel(game.id, 'needs-update')" class="text-xs font-medium text-zinc-400">
              {{ getLibraryVersionLabel(game.id, 'needs-update') }}
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- Jeux acheter / gratuit dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s -->
    <div v-if="!isLoading && gameInstalled && gameInstalled.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-lg font-medium flex items-center">
        My games installed
        <!-- Badge avec le nombre de jeux trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s -->
        <CrzBadge variant="yellow" size="sm" class="ml-2">
          {{ gameInstalled.length }}
        </CrzBadge>
      </h4>
      <div class="grid grid-cols-auto-fit gap-8" style="grid-template-columns: repeat(auto-fit, minmax(180px, 220px))">
        <template v-for="game in gameInstalled" :key="game.id">
          <div class="grid gap-1">
            <CrzGameCard
              :pictureFileUrl="game.pictureFile?.url"
              :trailerFileUrl="game.trailerFile?.url"
              :logoFileUrl="game.logoFile?.url"
              :gameCategory="game.gameCategory"
              :gamePlatform="game.gamePlatform"
              :title="game.title"
              :showPlatforms="false"
              :showVideo="false"
              :showSubTitle="false"
              :smallText="true"
              :showPlayButton="true"
              :upcomingGame="game.upcoming_game"
              :newGame="game.new_game"
              :showFixGameInstalledInLibraryButton="true"
              :showEllipsisButton="true"
              @play="onPlayGame(game)"
              @fixGameInstalledInLibrary="openFixGameInstalledModal(game)"
              @createDesktopShortcut="createShortcutOnDesktop(game)"
              @uninstallGame="UninstallGame(game)"
              @forceUpdateGame="openDownloadModal(game, false, false, true)"
            />
            <p v-if="getLibraryVersionLabel(game.id, 'installed')" class="text-xs font-medium text-zinc-400">
              {{ getLibraryVersionLabel(game.id, 'installed') }}
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- Jeux acheter / gratuit non installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s -->
    <div v-if="!isLoading && gameNotInstalledVisible.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-lg font-medium flex items-center">
        My games not installed
        <!-- Badge avec le nombre de jeux trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s -->
        <CrzBadge variant="yellow" size="sm" class="ml-2">
          {{ gameNotInstalledVisible.length }}
        </CrzBadge>
      </h4>
      <div class="grid grid-cols-auto-fit gap-8" style="grid-template-columns: repeat(auto-fit, minmax(180px, 220px))">
        <template v-for="game in gameNotInstalledVisible" :key="game.id">
          <div class="grid gap-1">
            <CrzGameCard
              :pictureFileUrl="game.pictureFile?.url"
              :trailerFileUrl="game.trailerFile?.url"
              :logoFileUrl="game.logoFile?.url"
              :gameCategory="game.gameCategory"
              :gamePlatform="game.gamePlatform"
              :title="game.title"
              :showPlatforms="false"
              :showVideo="false"
              :showSubTitle="false"
              :smallText="true"
              :showDownloadButton="true"
              :showFixGameInstalledInLibraryButton="true"
              @download="openDownloadModal(game, true, true)"
              @fixGameInstalledInLibrary="openFixGameInstalledModal(game)"
            />
            <p v-if="getLibraryVersionLabel(game.id, 'not-installed')" class="text-xs font-medium text-zinc-400">
              {{ getLibraryVersionLabel(game.id, 'not-installed') }}
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- Messages pour l'absence de jeux lors la recherche via l'input -->
    <div
      v-if="
        gameInstalled.length === 0 &&
        gameNotInstalledVisible.length === 0 &&
        gameNeedsUpdate.length === 0 &&
        searchTerm.length > 0 &&
        !isLoading
      "
      class="flex flex-col items-center justify-center w-full max-w-3xl mx-auto bg-[#141724] text-center p-6 rounded-xl"
    >
      <CrzIcon name="search" color="#6b7280" view-box="0 0 24 24" class="w-12 h-12 mb-4" />
      <h2 class="text-lg font-semibold text-white">No results found</h2>
      <p class="text-sm text-gray-400 mt-2">No games or extensions match your search.</p>
      <p class="text-sm text-gray-400 mt-2">Try searching with different keywords.</p>
    </div>
    <!-- Messages pour l'absence de jeux, si aucun jeux est dans la bibliothÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨que de l'utilisateur -->
    <div
      v-if="
        gameInstalled.length === 0 &&
        gameNotInstalledVisible.length === 0 &&
        gameNeedsUpdate.length === 0 &&
        gameActiveDownload.length === 0 &&
        searchTerm.length === 0 &&
        !isLoading
      "
      class="flex flex-col items-center justify-center w-full max-w-3xl mx-auto bg-[#141724] text-center p-6 rounded-xl"
    >
      <h2 class="text-lg font-semibold text-white">Your library is empty</h2>
      <p class="text-sm text-gray-400 mt-2">
        Purchase a game or add a free game to your library to start building your library.
      </p>
    </div>

    <!-- Modal de tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chargement -->
    <DownloadModal
      v-if="gameToDownload && gamePathInstallLocation"
      :show="showDownloadModal"
      :imageUrl="gameToDownload.pictureFile?.url"
      :gameTitle="gameToDownload.title"
      :fileSize="gameToDownloadFileSize"
      :createDesktopShortcut="createDesktopShortcut"
      :gamePathInstallLocation="gamePathInstallLocation"
      :isSufficientDiskSpaceAvailable="isSufficientDiskSpaceAvailable"
      :showButtonCreateDesktopShortcut="showButtonCreateDesktopShortcut"
      :showButtonChangePath="showButtonChangePath"
      @close="closeDownloadModal"
      @download="downloadGame(filesDownloadUpdateGame)"
      @changePath="changeDownloadPath(true)"
      @update:createDesktopShortcut="onCheckCreateDesktopShortcut($event)"
    />

    <!-- Modal pour rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©parer le chemin d'installation du jeu et vÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rifier les fichiers -->
    <FixGameInstalledInLibraryModal
      v-if="gameToDownload && gamePathInstallLocation"
      :show="showFixGameInstalledModal"
      :imageUrl="gameToDownload.pictureFile?.url"
      :gameTitle="gameToDownload.title"
      :gamePathInstallLocation="gamePathInstallLocation"
      :showFixInstallationInformationsError="showFixInstallationInformationsError"
      :fixInstallationErrorMessage="fixInstallationErrorMessage"
      :showFixInstallationInformationsError2="showFixInstallationInformationsError2"
      :showFixInstallationInformationsSuccess="showFixInstallationInformationsSuccess"
      :buttonLoading="isVerifyingInstallation"
      :verificationCheckedFiles="verifyProgressCheckedFiles"
      :verificationTotalFiles="verifyProgressTotalFiles"
      :verificationProgressPercent="verifyProgressPercent"
      @close="closeFixGameInstalledModal"
      @verifyInstallationGame="verifyInstallationGame(gameToDownload)"
      @changePath="changeDownloadPath(false)"
      @repair="downloadGame(filesRepair)"
      @repair-full-installation="repairFullInstallationFromFixModal"
      @saveQuit="closeFixGameInstalledModal"
    />

    <!-- Modal pour lancer le jeu mais qui n'a pas d'executable ou de dossier du jeu trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© -->
    <PlayGameNotFoundExecutableModal
      v-if="showPlayGameNotFoundExecutableModal && gameToPlayNotFoundExecutable"
      :show="showPlayGameNotFoundExecutableModal"
      :gamePictureImageUrl="gameToPlayNotFoundExecutable.pictureFile.url"
      :gameTitle="gameToPlayNotFoundExecutable.title"
      :messageError="showPlayGameNotFoundExecutableMessageError"
      :unstallGame="showUnstallGame"
      @cancel="closePlayGameNotFoundExecutableModal"
      @ok="closePlayGameNotFoundExecutableModal"
      @open-modal-repair="openFixGameInstalledModal(gameToPlayNotFoundExecutable)"
    />

    <CrzModal
      v-if="showUninstallBlockedByRunningGameModal"
      :show="showUninstallBlockedByRunningGameModal"
      :show-left-button="false"
      :show-right-button="false"
      bgClass="bg-blue-800"
      @update:show="closeUninstallBlockedByRunningGameModal"
    >
      <div class="grid gap-8">
        <div class="flex flex-wrap gap-4">
          <img
            v-if="uninstallBlockedGame?.pictureFile?.url"
            class="h-14 w-14 rounded-lg object-cover"
            :src="uninstallBlockedGame.pictureFile.url"
            :alt="uninstallBlockedGame?.title || 'Game'"
          />
          <div class="flex flex-col">
            <h2 class="text-base font-medium text-zinc-300">
              {{ uninstallBlockedGame?.title || 'Game' }}
            </h2>
            <h3 class="text-base font-bold text-red-500">Unable to uninstall game</h3>
          </div>
        </div>

        <div class="grid gap-3 rounded-lg bg-yellow-100 p-4">
          <h4 class="text-base font-bold text-red-600">Important: Read Carefully</h4>
          <p class="text-sm text-black">
            This game is currently running, so uninstall is blocked to avoid corrupted files.
          </p>
          <p class="text-sm text-black">Please close the game first, then try uninstalling again.</p>
        </div>

        <div class="flex justify-end">
          <button
            @click="closeUninstallBlockedByRunningGameModal"
            type="button"
            class="translate-y-0 transform rounded-lg border border-gray-500 bg-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 duration-100 hover:bg-gray-600 hover:text-white focus:z-10 focus:outline-none active:translate-y-1"
          >
            Close
          </button>
        </div>
      </div>
    </CrzModal>

    <CrzModal
      v-if="showUninstallingGameModal"
      :show="showUninstallingGameModal"
      :show-left-button="false"
      :show-right-button="false"
      bgClass="bg-blue-800"
      @update:show="keepUninstallingGameModalOpen"
    >
      <div class="grid gap-8">
        <div class="flex flex-wrap gap-4">
          <img
            v-if="uninstallingGame?.pictureFile?.url"
            class="h-14 w-14 rounded-lg object-cover"
            :src="uninstallingGame.pictureFile.url"
            :alt="uninstallingGame?.title || 'Game'"
          />
          <div class="flex flex-col">
            <h2 class="text-base font-medium text-zinc-300">
              {{ uninstallingGame?.title || 'Game' }}
            </h2>
            <h3 class="text-base font-bold text-white">Uninstalling game</h3>
          </div>
        </div>

        <div class="grid gap-3 rounded-lg bg-orange-500/80 p-4">
          <h4 class="flex items-center text-base font-bold text-white">
            Removing files
            <span class="library-loading-dots ml-1" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </h4>
          <p class="text-sm text-white">
            Please wait while CrzGames Launcher removes the game files from your computer.
          </p>
          <p class="text-sm text-white">
            {{ uninstallProgressRemovedEntries }} / {{ uninstallProgressTotalEntries }} items removed ({{
              Math.round(uninstallProgressPercent)
            }}%)
          </p>
        </div>
      </div>
    </CrzModal>

    <CrzModal
      v-if="showCheckingDiskSpaceModal"
      :show="showCheckingDiskSpaceModal"
      :show-left-button="false"
      :show-right-button="false"
      bgClass="bg-blue-800"
      @update:show="keepCheckingDiskSpaceModalOpen"
    >
      <div class="grid gap-8">
        <div class="flex flex-wrap gap-4">
          <img
            v-if="checkingDiskSpaceGame?.pictureFile?.url"
            class="h-14 w-14 rounded-lg object-cover"
            :src="checkingDiskSpaceGame.pictureFile.url"
            :alt="checkingDiskSpaceGame?.title || 'Game'"
          />
          <div class="flex flex-col">
            <h2 class="text-base font-medium text-zinc-300">
              {{ checkingDiskSpaceGame?.title || 'Game' }}
            </h2>
            <h3 class="text-base font-bold text-white">Checking disk space</h3>
          </div>
        </div>

        <div class="grid gap-3 rounded-lg bg-orange-500/80 p-4">
          <h4 class="flex items-center text-base font-bold text-white">
            Preparing download options
            <span class="library-loading-dots ml-1" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </h4>
          <p class="text-sm text-white">
            We are checking available disk space before opening download settings.
          </p>
        </div>
      </div>
    </CrzModal>

    <CrzModal
      v-if="showPreparingDownloadModal"
      :show="showPreparingDownloadModal"
      :show-left-button="false"
      :show-right-button="false"
      bgClass="bg-blue-800"
      @update:show="keepPreparingDownloadModalOpen"
    >
      <div class="grid gap-8">
        <div class="flex flex-wrap gap-4">
          <img
            v-if="preparingDownloadGame?.pictureFile?.url"
            class="h-14 w-14 rounded-lg object-cover"
            :src="preparingDownloadGame.pictureFile.url"
            :alt="preparingDownloadGame?.title || 'Game'"
          />
          <div class="flex flex-col">
            <h2 class="text-base font-medium text-zinc-300">
              {{ preparingDownloadGame?.title || 'Game' }}
            </h2>
            <h3 class="text-base font-bold text-white">Preparing download</h3>
          </div>
        </div>

        <div class="grid gap-3 rounded-lg bg-orange-500/80 p-4">
          <template v-if="preparingDownloadStep === 'verifying-files'">
            <h4 class="flex items-center text-base font-bold text-white">
              Verifying installed files
              <span class="library-loading-dots ml-1" aria-hidden="true">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </h4>
            <p class="text-sm text-white">Checking local files before opening download settings.</p>
            <p class="text-sm text-white">
              {{ preparingDownloadCheckedFiles }} / {{ preparingDownloadTotalFiles }} files checked ({{
                Math.round(preparingDownloadProgressPercent)
              }}%)
            </p>
          </template>

          <template v-else>
            <h4 class="flex items-center text-base font-bold text-white">
              Checking disk space
              <span class="library-loading-dots ml-1" aria-hidden="true">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </h4>
            <p class="text-sm text-white">Verifying free disk space before opening download settings.</p>
            <p class="text-sm text-white">File verification complete: 100%</p>
          </template>
        </div>
      </div>
    </CrzModal>

    <CrzModal
      v-if="showInstallPathAccessDeniedModal"
      :show="showInstallPathAccessDeniedModal"
      :show-left-button="false"
      :show-right-button="false"
      bgClass="bg-blue-800"
      @update:show="closeInstallPathAccessDeniedModal"
    >
      <div class="grid gap-8">
        <div class="flex flex-wrap gap-4">
          <img
            v-if="installPathAccessDeniedGamePictureUrl"
            class="h-14 w-14 rounded-lg object-cover"
            :src="installPathAccessDeniedGamePictureUrl"
            :alt="installPathAccessDeniedGameTitle || 'Game'"
          />
          <div class="flex flex-col">
            <h2 class="text-base font-medium text-zinc-300">
              {{ installPathAccessDeniedGameTitle || gameToDownload?.title || 'Game' }}
            </h2>
            <h3 class="text-base font-bold text-red-500">Installation blocked</h3>
          </div>
        </div>

        <div class="grid gap-3 rounded-lg bg-yellow-100 p-4">
          <h4 class="text-base font-bold text-red-600">Important: Read Carefully</h4>
          <p class="text-sm text-black">
            Access denied: CrzGames Launcher cannot install the game in this folder.
          </p>
          <p class="text-sm text-black">{{ getInstallPathAccessDeniedMessage() }}</p>
          <p class="text-sm text-black">
            Selected path:
            <span class="font-mono break-all">{{ installPathAccessDeniedPath || '-' }}</span>
          </p>
          <p class="text-sm text-black">
            This folder is protected and requires administrator rights to install files in it.
          </p>
        </div>

        <div class="flex justify-end">
          <button
            @click="closeInstallPathAccessDeniedModal"
            type="button"
            class="translate-y-0 transform rounded-lg border border-gray-500 bg-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 duration-100 hover:bg-gray-600 hover:text-white focus:z-10 focus:outline-none active:translate-y-1"
          >
            Close
          </button>
        </div>
      </div>
    </CrzModal>
  </div>
</template>

<script lang="ts" setup>
import type { Notyf } from 'notyf'
import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import CrzBadge from '~~/src-common/components/ui/CrzBadge.vue'

import CrzGameCard from '#src-common/components/cards/CrzGameCard.vue'
import CrzSearchBar from '#src-common/components/inputs/CrzSearchBar.vue'
import CrzSpinner from '#src-common/components/loaders/CrzSpinner.vue'
import CrzModal from '#src-common/components/modals/CrzModal.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import type GameBinaryModel from '#src-common/core/models/GameBinaryModel'
import type GameModel from '#src-common/core/models/GameModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'
import type { GameVersionModel } from '#src-common/core/models/GameVersionModel'
import type UserModel from '#src-common/core/models/UserModel'
import { GameService } from '#src-common/core/services/GameService'
import { GameVersionService } from '#src-common/core/services/GameVersionService'

import type {
  FileDetails,
  GameInstalled,
  GameManifestLocal,
  GameManifestRemote,
  PathInstallLocation,
  SystemOSInfo,
} from '#src-core/services/TauriService'
import { TauriService } from '#src-core/services/TauriService'
import { createLogger } from '#src-core/utils/logger'
import type { Logger } from '#src-core/utils/logger'

import DownloadModal from '#src-nuxt/app/components/modals/DownloadModal.vue'
import FixGameInstalledInLibraryModal from '#src-nuxt/app/components/modals/FixGameInstalledInLibraryModal.vue'
import PlayGameNotFoundExecutableModal from '#src-nuxt/app/components/modals/PlayGameNotFoundExecutableModal.vue'
import NavigationPages from '#src-nuxt/app/components/navigations/NavigationPages.vue'
import Divider from '#src-nuxt/app/components/ui/Divider.vue'
import { useAuthStore } from '#src-nuxt/app/stores/auth.store'
import { useDownloadsStore } from '#src-nuxt/app/stores/downloads.store'
import type { ActiveDownloadGame, CompleteDownloadGame } from '#src-nuxt/app/stores/downloads.store'
import { useGameVersionRealtimeStore } from '#src-nuxt/app/stores/gameVersionRealtime.store'
import { useUserGameLibrariesStore } from '#src-nuxt/app/stores/userGameLibraries.store'

/* LAYOUT - MIDDLEWARE - TRANSITIONS */
definePageMeta({
  layout: 'layout-home',
  middleware: ['auth', 'navigation'],
  pageTransition: {
    name: 'fade-scale',
    mode: 'out-in',
  },
  layoutTransition: {
    name: 'slide-up',
    mode: 'out-in',
  },
})

/* STORE */
const userGameLibrariesStore: any = useUserGameLibrariesStore()
const authStore: any = useAuthStore()
const downloadsStore: ReturnType<typeof useDownloadsStore> = useDownloadsStore()
const gameVersionRealtimeStore: ReturnType<typeof useGameVersionRealtimeStore> = useGameVersionRealtimeStore()

/* DATA */
/**
 * Instance de Notyf pour afficher des notifications a l'utilisateur
 * - Recuperee via useNuxtApp() pour integrer Notyf dans l'application Nuxt
 * @type {Notyf}
 */
const notyf: Notyf = useNuxtApp().$notyf
const logger: Logger = createLogger('LibraryPage')

const gamesInstalled: Ref<GameInstalled[] | undefined> = ref(undefined) // Jeux dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©
const gamesNeedsUpdate: Ref<GameInstalled[]> = ref([]) // Jeux deja installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© qui ont besoin d'une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour
const filesDownloadUpdateGame: Ref<FileDetails[] | undefined> = ref(undefined) // Fichiers ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©charger pour mettre ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour le jeu
const user: UserModel | undefined = authStore.user
/**
 * Donnees prechargees a l'ouverture de la modal pour accelerer le clic Download.
 */
type PreloadedDownloadPayload = {
  gameId: number
  bucketName: string
  basePathFilename: string
  latestVersion: string
  fullPathFilename: string
  gameManifestRemote: GameManifestRemote
  totalSizeToDownload: number
}

type VerifyInstallationProgressEventPayload = {
  scanId?: string
  gameId?: number | null
  pathInstallLocation?: string
  checkedFiles?: number
  totalFiles?: number
  missingFiles?: number
  progress?: number
  done?: boolean
}

type UninstallGameProgressEventPayload = {
  operationId?: string
  gameId?: number | null
  pathInstallLocation?: string
  removedEntries?: number
  totalEntries?: number
  progress?: number
  done?: boolean
}

/* REFS */
const searchTerm: Ref<string> = ref('')

const isLoading: Ref<boolean> = ref(true)
const isLaunchingGame: Ref<boolean> = ref(false)

const gameInstalled: Ref<GameModel[]> = ref([])
const gameNotInstalled: Ref<GameModel[]> = ref([])
const gameNeedsUpdate: Ref<GameModel[]> = ref([])
const gameActiveDownload: Ref<GameModel[]> = ref([])
const pendingActiveDownloadGameIds: Set<number> = new Set()
const gameNotInstalledVisible: ComputedRef<GameModel[]> = computed((): GameModel[] => {
  const activeDownloadGameIds: Set<number> = new Set(
    downloadsStore.activeDownloads.map((activeDownload: ActiveDownloadGame): number => activeDownload.gameId),
  )
  return gameNotInstalled.value.filter((game: GameModel): boolean => !activeDownloadGameIds.has(game.id))
})

// Modal pour lancer le jeu mais qui n'a pas d'executable ou de dossier du jeu trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©
const showPlayGameNotFoundExecutableModal: Ref<boolean> = ref(false)
const gameToPlayNotFoundExecutable: Ref<GameModel | null> = ref(null)
const showPlayGameNotFoundExecutableMessageError: Ref<string> = ref('')
const showUnstallGame: Ref<boolean> = ref(false)
const showUninstallBlockedByRunningGameModal: Ref<boolean> = ref(false)
const uninstallBlockedGame: Ref<GameModel | null> = ref(null)
const showUninstallingGameModal: Ref<boolean> = ref(false)
const uninstallingGame: Ref<GameModel | null> = ref(null)
const isUninstallingGame: Ref<boolean> = ref(false)
const uninstallingGamePathInstallLocation: Ref<string> = ref('')
const uninstallProgressRemovedEntries: Ref<number> = ref(0)
const uninstallProgressTotalEntries: Ref<number> = ref(0)
const uninstallProgressPercent: Ref<number> = ref(0)
const showInstallPathAccessDeniedModal: Ref<boolean> = ref(false)
const installPathAccessDeniedPath: Ref<string> = ref('')
const installPathAccessDeniedGameTitle: Ref<string> = ref('')
const installPathAccessDeniedGamePictureUrl: Ref<string> = ref('')
const showPreparingDownloadModal: Ref<boolean> = ref(false)
const preparingDownloadGame: Ref<GameModel | null> = ref(null)
const preparingDownloadGameId: Ref<number | undefined> = ref(undefined)
const preparingDownloadInstallPath: Ref<string> = ref('')
const preparingDownloadCheckedFiles: Ref<number> = ref(0)
const preparingDownloadTotalFiles: Ref<number> = ref(0)
const preparingDownloadProgressPercent: Ref<number> = ref(0)
const preparingDownloadStep: Ref<'verifying-files' | 'checking-disk'> = ref('verifying-files')
const showCheckingDiskSpaceModal: Ref<boolean> = ref(false)
const checkingDiskSpaceGame: Ref<GameModel | null> = ref(null)

// Modal pour rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©parer le jeu installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©
const showFixGameInstalledModal: Ref<boolean> = ref(false)
const showFixInstallationInformationsError: Ref<boolean> = ref(false)
const showFixInstallationInformationsSuccess: Ref<boolean> = ref(false)
const showFixInstallationInformationsError2: Ref<boolean> = ref(false)
const fixInstallationErrorMessage: Ref<string> = ref('')
const isVerifyingInstallation: Ref<boolean> = ref(false)
const filesRepair: Ref<FileDetails[]> = ref([])
const verifyProgressCheckedFiles: Ref<number> = ref(0)
const verifyProgressTotalFiles: Ref<number> = ref(0)
const verifyProgressPercent: Ref<number> = ref(0)
const unlistenVerifyInstallationProgress: Ref<UnlistenFn | null> = ref(null)
const unlistenUninstallGameProgress: Ref<UnlistenFn | null> = ref(null)

// Modal de tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chargement
const gameToDownload: Ref<GameModel | null> = ref(null)
const gameToDownloadFileSize: Ref<number | undefined> = ref(undefined)
const showDownloadModal: Ref<boolean> = ref(false)
const gamePathInstallLocation: Ref<PathInstallLocation | undefined> = ref(undefined)
const createDesktopShortcut: Ref<boolean> = ref(false)
const currentSystemOSInfo: Ref<SystemOSInfo | undefined> = ref(undefined)
const preloadedDownloadPayload: Ref<PreloadedDownloadPayload | null> = ref(null)
// Boolean qui permet de dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©terminer si l'espace du disk dur du user a assez en fonction de la taille du jeu
const isSufficientDiskSpaceAvailable: Ref<boolean> = ref(false)
const showButtonCreateDesktopShortcut: Ref<boolean> = ref(true)
const showButtonChangePath: Ref<boolean> = ref(true)
const LIBRARY_IMAGES_PRELOAD_TIMEOUT_MS: number = 8000
const MIN_LIBRARY_SPINNER_MS: number = 250
const MIN_UNINSTALL_MODAL_VISIBLE_MS: number = 2000
const MIN_PREPARE_DOWNLOAD_DISK_STEP_VISIBLE_MS: number = 550
const pendingOpenDownloadModalGameIds: Set<number> = new Set()

const normalizeInstallPathForComparison: (pathValue?: string) => string = (pathValue?: string): string => {
  return (pathValue || '').replace(/\\/g, '/').trim()
}

const areInstallPathsEqual: (left?: string, right?: string) => boolean = (
  left?: string,
  right?: string,
): boolean => {
  const normalizedLeft: string = normalizeInstallPathForComparison(left)
  const normalizedRight: string = normalizeInstallPathForComparison(right)
  if (!normalizedLeft || !normalizedRight) {
    return false
  }

  const shouldCompareCaseInsensitive: boolean = normalizedLeft.includes(':') || normalizedRight.includes(':')
  return shouldCompareCaseInsensitive
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight
}

const normalizeProgressNumber: (value: unknown) => number = (value: unknown): number => {
  const parsedNumber: number = Number(value)
  if (!Number.isFinite(parsedNumber)) {
    return 0
  }

  return parsedNumber
}

const clampPercentage: (value: number) => number = (value: number): number => {
  return Math.max(0, Math.min(100, value))
}

const resetVerifyProgress: () => void = (): void => {
  verifyProgressCheckedFiles.value = 0
  verifyProgressTotalFiles.value = 0
  verifyProgressPercent.value = 0
}

const resetUninstallProgress: () => void = (): void => {
  uninstallProgressRemovedEntries.value = 0
  uninstallProgressTotalEntries.value = 0
  uninstallProgressPercent.value = 0
}

const resetPreparingDownloadProgress: () => void = (): void => {
  preparingDownloadCheckedFiles.value = 0
  preparingDownloadTotalFiles.value = 0
  preparingDownloadProgressPercent.value = 0
}

const isVerifyInstallationPayloadMatchingSelection: (
  payload: VerifyInstallationProgressEventPayload,
  selectedGameId?: number,
  selectedInstallPath?: string,
) => boolean = (
  payload: VerifyInstallationProgressEventPayload,
  selectedGameId?: number,
  selectedInstallPath?: string,
): boolean => {
  const payloadGameId: number = normalizeProgressNumber(payload.gameId)
  if (selectedGameId && payloadGameId && payloadGameId !== selectedGameId) {
    return false
  }

  const payloadInstallPath: string | undefined = payload.pathInstallLocation
  if (selectedInstallPath && payloadInstallPath && !areInstallPathsEqual(selectedInstallPath, payloadInstallPath)) {
    return false
  }

  return true
}

const handleVerifyInstallationProgress: (payload: VerifyInstallationProgressEventPayload) => void = (
  payload: VerifyInstallationProgressEventPayload,
): void => {
  const totalFiles: number = Math.max(0, Math.floor(normalizeProgressNumber(payload.totalFiles)))
  const checkedFilesRaw: number = Math.max(0, Math.floor(normalizeProgressNumber(payload.checkedFiles)))
  const checkedFiles: number = totalFiles > 0 ? Math.min(checkedFilesRaw, totalFiles) : checkedFilesRaw
  const progressPercent: number =
    totalFiles > 0
      ? clampPercentage((checkedFiles / totalFiles) * 100)
      : payload.done
        ? 100
        : clampPercentage(normalizeProgressNumber(payload.progress))

  if (
    showFixGameInstalledModal.value &&
    isVerifyInstallationPayloadMatchingSelection(payload, gameToDownload.value?.id, gamePathInstallLocation.value?.pathSystem)
  ) {
    verifyProgressTotalFiles.value = totalFiles
    verifyProgressCheckedFiles.value = checkedFiles
    verifyProgressPercent.value = progressPercent
  }

  if (
    showPreparingDownloadModal.value &&
    preparingDownloadStep.value === 'verifying-files' &&
    isVerifyInstallationPayloadMatchingSelection(payload, preparingDownloadGameId.value, preparingDownloadInstallPath.value)
  ) {
    preparingDownloadTotalFiles.value = totalFiles
    preparingDownloadCheckedFiles.value = checkedFiles
    preparingDownloadProgressPercent.value = progressPercent
  }
}

const handleUninstallGameProgress: (payload: UninstallGameProgressEventPayload) => void = (
  payload: UninstallGameProgressEventPayload,
): void => {
  if (!showUninstallingGameModal.value) {
    return
  }

  const selectedGameId: number | undefined = uninstallingGame.value?.id
  const payloadGameId: number = normalizeProgressNumber(payload.gameId)
  if (selectedGameId && payloadGameId && payloadGameId !== selectedGameId) {
    return
  }

  const selectedInstallPath: string = uninstallingGamePathInstallLocation.value
  const payloadInstallPath: string | undefined = payload.pathInstallLocation
  if (selectedInstallPath && payloadInstallPath && !areInstallPathsEqual(selectedInstallPath, payloadInstallPath)) {
    return
  }

  const totalEntries: number = Math.max(0, Math.floor(normalizeProgressNumber(payload.totalEntries)))
  const removedEntriesRaw: number = Math.max(0, Math.floor(normalizeProgressNumber(payload.removedEntries)))
  const removedEntries: number = totalEntries > 0 ? Math.min(removedEntriesRaw, totalEntries) : removedEntriesRaw

  uninstallProgressTotalEntries.value = totalEntries
  uninstallProgressRemovedEntries.value = removedEntries

  if (totalEntries > 0) {
    uninstallProgressPercent.value = clampPercentage((removedEntries / totalEntries) * 100)
  } else if (payload.done) {
    uninstallProgressPercent.value = 100
  } else {
    uninstallProgressPercent.value = clampPercentage(normalizeProgressNumber(payload.progress))
  }
}

const registerProgressListeners: () => Promise<void> = async (): Promise<void> => {
  if (!unlistenVerifyInstallationProgress.value) {
    unlistenVerifyInstallationProgress.value = await listen<VerifyInstallationProgressEventPayload>(
      'verify-installation-progress',
      (event): void => {
        handleVerifyInstallationProgress(event.payload)
      },
    )
  }

  if (!unlistenUninstallGameProgress.value) {
    unlistenUninstallGameProgress.value = await listen<UninstallGameProgressEventPayload>(
      'uninstall-game-progress',
      (event): void => {
        handleUninstallGameProgress(event.payload)
      },
    )
  }
}

const unregisterProgressListeners: () => void = (): void => {
  if (unlistenVerifyInstallationProgress.value) {
    unlistenVerifyInstallationProgress.value()
    unlistenVerifyInstallationProgress.value = null
  }

  if (unlistenUninstallGameProgress.value) {
    unlistenUninstallGameProgress.value()
    unlistenUninstallGameProgress.value = null
  }
}

/**
 * Normalise un titre de jeu pour les comparaisons.
 * @param {string | undefined} value - Titre brut.
 * @returns {string} - Titre normalise.
 */
const normalizeGameTitle: (value?: string) => string = (value?: string): string =>
  (value || '').trim().toLowerCase()

/**
 * Normalise une version de jeu pour l'affichage.
 * @param {string | undefined} version - Version brute.
 * @returns {string | undefined} - Version nettoyee.
 */
const normalizeGameVersion: (version?: string) => string | undefined = (version?: string): string | undefined => {
  const normalizedVersion: string = String(version || '').trim()
  return normalizedVersion.length > 0 ? normalizedVersion : undefined
}

/**
 * Retourne le telechargement actif associe a un jeu.
 * @param {number} gameId - Id du jeu.
 * @returns {ActiveDownloadGame | undefined} - Telechargement actif si present.
 */
const findActiveDownloadByGameId: (gameId: number) => ActiveDownloadGame | undefined = (
  gameId: number,
): ActiveDownloadGame | undefined => {
  return downloadsStore.activeDownloads.find(
    (activeDownload: ActiveDownloadGame): boolean => activeDownload.gameId === gameId,
  )
}

/**
 * Retourne la version actuellement telechargee.
 * @param {number} gameId - Id du jeu.
 * @returns {string | undefined} - Version en cours de telechargement.
 */
const getActiveDownloadVersionByGameId: (gameId: number) => string | undefined = (
  gameId: number,
): string | undefined => normalizeGameVersion(findActiveDownloadByGameId(gameId)?.gameVersion)

/**
 * Retourne la version installee localement pour un jeu.
 * @param {number} gameId - Id du jeu.
 * @returns {string | undefined} - Version installee.
 */
const getInstalledVersionByGameId: (gameId: number) => string | undefined = (gameId: number): string | undefined => {
  const installedEntry: GameInstalled | undefined =
    findInstalledEntryByCanonicalGameId(gamesInstalled.value, gameId) ||
    findInstalledEntryByCanonicalGameId(gamesNeedsUpdate.value, gameId)

  return normalizeGameVersion(installedEntry?.gameManifest.version)
}

/**
 * Met en cache la derniere version disponible pour un jeu.
 * @param {number} gameId - Id du jeu.
 * @param {string | undefined} latestVersion - Derniere version recuperee.
 * @returns {void}
 */
const cacheLatestAvailableVersion: (gameId: number, latestVersion?: string) => void = (
  gameId: number,
  latestVersion?: string,
): void => {
  gameVersionRealtimeStore.cacheLatestAvailableVersion(gameId, latestVersion)
}

/**
 * Retourne la version disponible cote backend, si deja connue localement.
 * @param {number} gameId - Id du jeu.
 * @returns {string | undefined} - Derniere version disponible.
 */
const getLatestAvailableVersionByGameId: (gameId: number) => string | undefined = (
  gameId: number,
): string | undefined => normalizeGameVersion(gameVersionRealtimeStore.getLatestAvailableVersionByGameId(gameId))

/**
 * Indique si le telechargement actif d'un jeu est actuellement en pause.
 * @param {number} gameId - Id du jeu.
 * @returns {boolean} - True si pause detectee.
 */
const isActiveDownloadPaused: (gameId: number) => boolean = (gameId: number): boolean => {
  const activeDownload: ActiveDownloadGame | undefined = findActiveDownloadByGameId(gameId)
  if (!activeDownload) {
    return false
  }

  return !activeDownload.isPlaying && !activeDownload.hasError && Math.round(activeDownload.progress) < 100
}

type LibraryVersionContext = 'active-download' | 'needs-update' | 'installed' | 'not-installed'

/**
 * Construit le label de version affiche sur une card de My Library.
 * @param {number} gameId - Id du jeu.
 * @param {LibraryVersionContext} context - Contexte d'affichage.
 * @returns {string | undefined} - Label pret a afficher.
 */
const getLibraryVersionLabel: (gameId: number, context: LibraryVersionContext) => string | undefined = (
  gameId: number,
  context: LibraryVersionContext,
): string | undefined => {
  const downloadingVersion: string | undefined = getActiveDownloadVersionByGameId(gameId)
  const installedVersion: string | undefined = getInstalledVersionByGameId(gameId)
  const latestVersion: string | undefined = getLatestAvailableVersionByGameId(gameId)

  if (context === 'active-download') {
    const labelPrefix: string = isActiveDownloadPaused(gameId) ? 'Paused' : 'Downloading'

    if (downloadingVersion) {
      return `${labelPrefix}: ${downloadingVersion}`
    }

    if (latestVersion) {
      return `${labelPrefix}: ${latestVersion}`
    }

    if (installedVersion) {
      return `${labelPrefix}: ${installedVersion}`
    }

    return undefined
  }

  if (context === 'needs-update') {
    if (installedVersion && latestVersion && installedVersion !== latestVersion) {
      return `Installed: ${installedVersion} -> Latest: ${latestVersion}`
    }

    if (latestVersion) {
      return `Latest: ${latestVersion}`
    }

    if (installedVersion) {
      return `Installed: ${installedVersion}`
    }

    return undefined
  }

  if (context === 'installed') {
    if (installedVersion) {
      return `Installed: ${installedVersion}`
    }

    return undefined
  }

  if (latestVersion) {
    return `Latest: ${latestVersion}`
  }

  return undefined
}

/**
 * Resolves the canonical game id from an installed local manifest entry.
 * Priority: direct id match, fallback by title.
 * @param {GameInstalled} installedGame - Local installed game entry.
 * @returns {number | undefined} - Canonical game id, if found.
 */
const resolveCanonicalGameIdForInstalledGame: (installedGame: GameInstalled) => number | undefined = (
  installedGame: GameInstalled,
): number | undefined => {
  const libraryGames: GameModel[] = userGameLibrariesStore.userGameLibrariesSortedByPlatform || []
  const manifestGameId: number = installedGame.gameManifest.gameId

  const matchById: GameModel | undefined = libraryGames.find((libraryGame: GameModel): boolean => {
    return libraryGame.id === manifestGameId
  })
  if (matchById) {
    return matchById.id
  }

  const manifestTitle: string = normalizeGameTitle(installedGame.gameManifest.gameTitle)
  if (!manifestTitle) {
    return undefined
  }

  const matchByTitle: GameModel | undefined = libraryGames.find((libraryGame: GameModel): boolean => {
    return normalizeGameTitle(libraryGame.title) === manifestTitle
  })

  return matchByTitle?.id
}

/**
 * Trouve une entree de jeu installe pour un id de jeu canonique.
 * @param {GameInstalled[] | undefined} collection - Collection installee.
 * @param {number} canonicalGameId - Id canonique.
 * @returns {GameInstalled | undefined} - Entree locale.
 */
const findInstalledEntryByCanonicalGameId: (
  collection: GameInstalled[] | undefined,
  canonicalGameId: number,
) => GameInstalled | undefined = (
  collection: GameInstalled[] | undefined,
  canonicalGameId: number,
): GameInstalled | undefined => {
  return collection?.find((installedGame: GameInstalled): boolean => {
    return resolveCanonicalGameIdForInstalledGame(installedGame) === canonicalGameId
  })
}

/**
 * Verifie si une entree installee correspond a un id de jeu canonique.
 * @param {GameInstalled} installedGame - Entree locale.
 * @param {number} canonicalGameId - Id canonique.
 * @returns {boolean} - True si correspondance.
 */
const isInstalledEntryForCanonicalGameId: (installedGame: GameInstalled, canonicalGameId: number) => boolean = (
  installedGame: GameInstalled,
  canonicalGameId: number,
): boolean => resolveCanonicalGameIdForInstalledGame(installedGame) === canonicalGameId

/* CYCLE - HOOKS */
onMounted(async (): Promise<void> => {
  try {
    await registerProgressListeners()
  } catch (error: unknown) {
    logger.error(
      `[Library] Failed to register progress listeners: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  try {
    await scrollToTop()
    currentSystemOSInfo.value = await TauriService.getSystemOSCurrent()
    if (user) {
      await downloadsStore.loadActiveDownloadsPersisted(user)
    }
    await loadGames()
  } catch (error) {
    console.error('Error occurred while loading games: ', error)
    isLoading.value = false
  }
})

onBeforeUnmount((): void => {
  unregisterProgressListeners()
})

/**
 * On recoit l'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©nement quand un jeu est tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chargÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©
 */
watch(
  () => downloadsStore.completedDownloads,
  async (completedDownloads: CompleteDownloadGame[]) => {
    const currentUserId: number | undefined = authStore.user?.id
    if (!currentUserId) {
      return
    }

    for (const completedGame of completedDownloads) {
      // VÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rifier si le jeu tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chargÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© n'est pas dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  dans gamesInstalled pour ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©viter les doublons
      if (
        !gamesInstalled.value?.some((game: GameInstalled): boolean =>
          isInstalledEntryForCanonicalGameId(game, completedGame.gameId),
        )
      ) {
        try {
          // RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rer tous les jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s via un fichier installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© sur le disque de l'utilisateur
          const gamesInstalledAll: GameInstalled[] | undefined = await TauriService.getGamesInstalled(currentUserId)
          if (!gamesInstalledAll) {
            console.warn('Get games installed failed')
            return
          }

          // Ajouter le jeu aux jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s
          gamesInstalled.value = gamesInstalledAll
          gameInstalled.value.push(await GameService.getGameById(completedGame.gameId))

          // Retirer ce jeu des jeux non installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s
          gameNotInstalled.value = gameNotInstalled.value.filter(
            (game: GameModel): boolean => game.id !== completedGame.gameId,
          )

          // Supprimer le jeu de la liste des jeux en cours de tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chargement
          gameActiveDownload.value = gameActiveDownload.value.filter(
            (game: GameModel): boolean => game.id !== completedGame.gameId,
          )
        } catch (error: any) {
          console.error("Erreur lors de l'ajout du jeu installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© :", error)
        }
      }
    }
  },
  { deep: true },
)

watch(
  () => downloadsStore.activeDownloads,
  async (activeDownloads: ActiveDownloadGame[]) => {
    for (const activeDownload of activeDownloads) {
      const activeDownloadGameId: number = activeDownload.gameId

      // VÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rifier si le jeu tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chargÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© n'est pas dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  dans gameActiveDownload pour ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©viter les doublons
      // et s'il n'est pas dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  dans gameNeedsUpdate pour ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©viter les doublons
      if (
        !pendingActiveDownloadGameIds.has(activeDownloadGameId) &&
        !gameActiveDownload.value.some((game: GameModel): boolean => game.id === activeDownloadGameId) &&
        !gameNeedsUpdate.value.some((game: GameModel): boolean => game.id === activeDownloadGameId)
      ) {
        pendingActiveDownloadGameIds.add(activeDownloadGameId)

        try {
          // Retirer ce jeu des jeux non installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s
          gameNotInstalled.value = gameNotInstalled.value.filter((game: GameModel): boolean => game.id !== activeDownloadGameId)

          // RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rer le jeu ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©charger
          const game: GameModel = await GameService.getGameById(activeDownloadGameId)

          // Double-check apres await pour eviter les doublons en cas de callbacks concurrents.
          if (
            !gameActiveDownload.value.some(
              (activeDownloadedGame: GameModel): boolean => activeDownloadedGame.id === activeDownloadGameId,
            ) &&
            !gameNeedsUpdate.value.some(
              (gameNeedingUpdate: GameModel): boolean => gameNeedingUpdate.id === activeDownloadGameId,
            )
          ) {
            gameActiveDownload.value.push(game)
          }
        } catch (error: any) {
          console.error("Erreur lors de l'ajout du jeu ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©charger :", error)
        } finally {
          pendingActiveDownloadGameIds.delete(activeDownloadGameId)
        }
      }
    }
  },
  { deep: true },
)

/* METHODS */
/**
 * Indique si l'erreur de desinstallation vient d'un jeu encore en cours d'execution.
 * @param {unknown} error - Erreur brute.
 * @returns {boolean} - True si le jeu est verrouille par un processus actif.
 */
const isUninstallBlockedByRunningGameError: (error: unknown) => boolean = (error: unknown): boolean => {
  const errorMessage: string = error instanceof Error ? error.message : String(error || '')
  const normalizedMessage: string = errorMessage.toLowerCase()

  return (
    normalizedMessage.includes('os error 32') ||
    normalizedMessage.includes('used by another process') ||
    normalizedMessage.includes('being used by another process') ||
    normalizedMessage.includes('utilise par un autre processus') ||
    normalizedMessage.includes('utilisÃƒÂ© par un autre processus') ||
    normalizedMessage.includes('resource busy') ||
    normalizedMessage.includes('device or resource busy') ||
    normalizedMessage.includes('text file busy')
  )
}

/**
 * Ouvre la modal d'information quand une desinstallation est bloquee par un jeu en cours.
 * @param {GameModel} game - Jeu concerne.
 * @returns {void}
 */
const openUninstallBlockedByRunningGameModal: (game: GameModel) => void = (game: GameModel): void => {
  uninstallBlockedGame.value = game
  showUninstallBlockedByRunningGameModal.value = true
}

/**
 * Ferme la modal d'information de desinstallation bloquee.
 * @returns {void}
 */
const closeUninstallBlockedByRunningGameModal: () => void = (): void => {
  showUninstallBlockedByRunningGameModal.value = false
  uninstallBlockedGame.value = null
}

/**
 * Ouvre la modal d'information pendant la desinstallation d'un jeu.
 * @param {GameModel} game - Jeu concerne.
 * @returns {void}
 */
const openUninstallingGameModal: (game: GameModel, pathInstallLocation?: string) => void = (
  game: GameModel,
  pathInstallLocation?: string,
): void => {
  resetUninstallProgress()
  uninstallingGame.value = game
  uninstallingGamePathInstallLocation.value = pathInstallLocation || ''
  showUninstallingGameModal.value = true
  isUninstallingGame.value = true
}

/**
 * Ferme la modal d'information de desinstallation en cours.
 * @returns {void}
 */
const closeUninstallingGameModal: () => void = (): void => {
  showUninstallingGameModal.value = false
  uninstallingGame.value = null
  uninstallingGamePathInstallLocation.value = ''
  isUninstallingGame.value = false
  resetUninstallProgress()
}

/**
 * Empeche la fermeture manuelle de la modal pendant la desinstallation.
 * @returns {void}
 */
const keepUninstallingGameModalOpen: () => void = (): void => {}

/**
 * Ouvre la modal d'information de preparation de telechargement.
 * @param {GameModel} game - Jeu cible.
 * @param {string} installPath - Chemin d'installation local.
 * @returns {void}
 */
const openPreparingDownloadModal: (game: GameModel, installPath: string) => void = (
  game: GameModel,
  installPath: string,
): void => {
  preparingDownloadGame.value = game
  preparingDownloadGameId.value = game.id
  preparingDownloadInstallPath.value = installPath
  preparingDownloadStep.value = 'verifying-files'
  resetPreparingDownloadProgress()
  showPreparingDownloadModal.value = true
}

/**
 * Passe la modal de preparation en etape verification espace disque.
 * @returns {void}
 */
const setPreparingDownloadDiskStep: () => void = (): void => {
  preparingDownloadStep.value = 'checking-disk'
  preparingDownloadProgressPercent.value = 100
}

/**
 * Ferme et reinitialise la modal d'information de preparation.
 * @returns {void}
 */
const closePreparingDownloadModal: () => void = (): void => {
  showPreparingDownloadModal.value = false
  preparingDownloadGame.value = null
  preparingDownloadGameId.value = undefined
  preparingDownloadInstallPath.value = ''
  preparingDownloadStep.value = 'verifying-files'
  resetPreparingDownloadProgress()
}

/**
 * Empeche la fermeture manuelle de la modal pendant la preparation.
 * @returns {void}
 */
const keepPreparingDownloadModalOpen: () => void = (): void => {}

/**
 * Ouvre la modal d'information de verification de l'espace disque.
 * @param {GameModel} game - Jeu cible.
 * @returns {void}
 */
const openCheckingDiskSpaceModal: (game: GameModel) => void = (game: GameModel): void => {
  checkingDiskSpaceGame.value = game
  showCheckingDiskSpaceModal.value = true
}

/**
 * Ferme la modal de verification de l'espace disque.
 * @returns {void}
 */
const closeCheckingDiskSpaceModal: () => void = (): void => {
  showCheckingDiskSpaceModal.value = false
  checkingDiskSpaceGame.value = null
}

/**
 * Empeche la fermeture manuelle de la modal pendant la verification.
 * @returns {void}
 */
const keepCheckingDiskSpaceModalOpen: () => void = (): void => {}

/**
 * Ouvre la modal d'information quand le chemin d'installation n'est pas accessible en ecriture.
 * @param {string} installPath - Chemin d'installation selectionne.
 * @returns {void}
 */
const openInstallPathAccessDeniedModal: (installPath: string) => void = (installPath: string): void => {
  installPathAccessDeniedPath.value = installPath
  installPathAccessDeniedGameTitle.value = gameToDownload.value?.title || ''
  installPathAccessDeniedGamePictureUrl.value = gameToDownload.value?.pictureFile?.url || ''
  showInstallPathAccessDeniedModal.value = true
}

/**
 * Ferme la modal d'information de chemin d'installation refuse.
 * @returns {void}
 */
const closeInstallPathAccessDeniedModal: () => void = (): void => {
  showInstallPathAccessDeniedModal.value = false
  installPathAccessDeniedPath.value = ''
  installPathAccessDeniedGameTitle.value = ''
  installPathAccessDeniedGamePictureUrl.value = ''
}

/**
 * Uninstall the game
 * @param {GameModel} game - The game
 * @returns {Promise<void>} - The promise
 */
const UninstallGame: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  if (isUninstallingGame.value) {
    return
  }

  let uninstallModalOpenedAt: number | null = null

  try {
    // Chercher le jeu dans les jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s
    let currentGame: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesInstalled.value, game.id)

    // Si le jeu n'est pas trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© dans les jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s, le chercher dans les jeux nÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cessitant une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour
    if (!currentGame) {
      currentGame = findInstalledEntryByCanonicalGameId(gamesNeedsUpdate.value, game.id)
    }

    // Si le jeu n'est trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© ni dans les jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s ni dans les jeux nÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cessitant une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour, sortir
    if (!currentGame) {
      return
    }

    // DÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©sinstaller le jeu
    const isGameRunning: boolean = await TauriService.isGameRunning(currentGame.gameManifest.pathInstallLocation)
    if (isGameRunning) {
      logger.warn(`[Library] Uninstall blocked because game is running gameId=${game.id} title=${game.title}`)
      openUninstallBlockedByRunningGameModal(game)
      return
    }

    openUninstallingGameModal(game, currentGame.gameManifest.pathInstallLocation)
    uninstallModalOpenedAt = Date.now()
    await TauriService.uninstallGame(currentGame.gameManifest.pathInstallLocation, currentGame.gameManifest.gameId)
    // Supprimer le jeu installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© de la liste des jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s dans le fichier de configuration local
    const currentUserId: number | undefined = authStore.user?.id
    await TauriService.removeGameInstalled(currentGame.gameManifest.gameId, currentUserId)

    // Supprimer le jeu de la liste des jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s ou de la liste des jeux nÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cessitant une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour
    gamesInstalled.value = gamesInstalled.value?.filter((gameInstalled: GameInstalled) => {
      return !isInstalledEntryForCanonicalGameId(gameInstalled, game.id)
    })
    gamesNeedsUpdate.value = gamesNeedsUpdate.value.filter((gameNeedsUpdate: GameInstalled) => {
      return !isInstalledEntryForCanonicalGameId(gameNeedsUpdate, game.id)
    })

    // Mettre ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour les listes de jeux ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  afficher
    gameInstalled.value = gameInstalled.value.filter((gameModel: GameModel) => gameModel.id !== game.id)
    gameNeedsUpdate.value = gameNeedsUpdate.value.filter((gameModel: GameModel) => gameModel.id !== game.id)
    gameNotInstalled.value = [...gameNotInstalled.value, game]

    notyf.success(`The game ${game.title} has been uninstalled successfully`)
  } catch (error: any) {
    if (isUninstallBlockedByRunningGameError(error)) {
      logger.warn(
        `[Library] Uninstall blocked because game is running gameId=${game.id} title=${game.title}: ${error instanceof Error ? error.message : String(error)}`,
      )
      openUninstallBlockedByRunningGameModal(game)
      return
    }

    showPlayGameNotFoundExecutableMessageError.value = 'uninstall game'
    gameToPlayNotFoundExecutable.value = game
    showPlayGameNotFoundExecutableModal.value = true
    showUnstallGame.value = true
    console.error('Error occurred while uninstalling the game: ', error)
  } finally {
    if (uninstallModalOpenedAt !== null) {
      const elapsedMs: number = Date.now() - uninstallModalOpenedAt
      const remainingMs: number = Math.max(0, MIN_UNINSTALL_MODAL_VISIBLE_MS - elapsedMs)
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingMs))
      }
    }
    closeUninstallingGameModal()
  }
}

/**
 * CrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©er un raccourci sur le bureau
 * @param {GameModel} game - The game
 * @returns {Promise<void>} - The promise
 */
const createShortcutOnDesktop: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  // Chercher le jeu dans les jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s
  let currentGame: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesInstalled.value, game.id)

  // Si le jeu n'est pas trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© dans les jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s, le chercher dans les jeux nÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cessitant une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour
  if (!currentGame) {
    currentGame = findInstalledEntryByCanonicalGameId(gamesNeedsUpdate.value, game.id)
  }

  // Si le jeu n'est trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© ni dans les jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s ni dans les jeux nÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cessitant une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour, sortir
  if (!currentGame) {
    return
  }

  try {
    await TauriService.createShortcutOnDesktop(currentGame.gameManifest.pathInstallLocation)
    notyf.success(`The desktop shortcut has been created successfully for ${game.title}`)
  } catch (error) {
    showPlayGameNotFoundExecutableMessageError.value = 'could not create a desktop shortcut for the game'
    gameToPlayNotFoundExecutable.value = game
    showPlayGameNotFoundExecutableModal.value = true
    console.error('Error occurred while creating a desktop shortcut for the game: ', error)
  }
}

/**
 * Fermer la modal decrivant que le jeu n'a pas d'executable ou de dossier du jeu trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©
 * @returns {void}
 */
const closePlayGameNotFoundExecutableModal: () => void = (): void => {
  showPlayGameNotFoundExecutableModal.value = false
  showUnstallGame.value = false
}

/**
 * VÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rifie les mises ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour pour un jeu spÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cifique
 * @param {GameModel} game - Le jeu ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  vÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rifier
 * @returns {Promise<boolean>} - Retourne true si une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour est disponible, false sinon
 */
const checkForGameUpdate: (game: GameModel) => Promise<boolean> = async (game: GameModel): Promise<boolean> => {
  const canonicalGameId: number = game.id
  const latestGameVersionAvailable: GameVersionModel | undefined =
    await GameVersionService.getLatestAvailableGameVersionByGameId(canonicalGameId)
  cacheLatestAvailableVersion(canonicalGameId, latestGameVersionAvailable?.version)

  const installedGame: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(
    gamesInstalled.value,
    canonicalGameId,
  )

  if (installedGame && latestGameVersionAvailable.version !== installedGame.gameManifest.version) {
    const gameModel: GameModel | undefined = userGameLibrariesStore.userGameLibrariesSortedByPlatform.find(
      (libraryGame: GameModel) => libraryGame.id === canonicalGameId,
    )

    if (gameModel) {
      gameNeedsUpdate.value.push(gameModel)
      gamesNeedsUpdate.value = [...gamesNeedsUpdate.value, installedGame]
      return true
    }
  }

  return false
}

/**
 * Fait un check pour voir si les jeux dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es ont besoin d'une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour
 * @returns {Promise<void>} - The promise
 */
/**
 * Load games from the library and the installed games
 * @returns {Promise<void>} - The promise
 */
const loadGames: () => Promise<void> = async (): Promise<void> => {
  const loadingStartAtMs: number = Date.now()
  isLoading.value = true

  try {
    const currentUserId: number | undefined = authStore.user?.id
    if (!currentUserId) {
      gamesInstalled.value = []
      gameInstalled.value = []
      gameNeedsUpdate.value = []
      gameNotInstalled.value = []
      gameActiveDownload.value = []
      return
    }

    await userGameLibrariesStore.getUserGameLibraries()

    gamesInstalled.value = []
    gameNeedsUpdate.value = []
    gamesNeedsUpdate.value = []

    const installedGames: GameInstalled[] | undefined = await TauriService.getGamesInstalled(currentUserId)

    if (installedGames && installedGames.length > 0) {
      const installedCanonicalGameIds: number[] = [
        ...new Set(
          installedGames
            .map((installedGame: GameInstalled): number | undefined =>
              resolveCanonicalGameIdForInstalledGame(installedGame),
            )
            .filter((canonicalGameId: number | undefined): canonicalGameId is number => canonicalGameId !== undefined),
        ),
      ]

      await Promise.all(
        installedCanonicalGameIds.map(async (canonicalGameId: number): Promise<void> => {
          try {
            const latestGameVersionAvailable: GameVersionModel | undefined =
              await GameVersionService.getLatestAvailableGameVersionByGameId(canonicalGameId)
            cacheLatestAvailableVersion(canonicalGameId, latestGameVersionAvailable?.version)
          } catch (error: unknown) {
            logger.warn(
              `[Library] Initial update check failed for canonicalGameId=${canonicalGameId}: ${error instanceof Error ? error.message : String(error)}`,
            )
          }
        }),
      )

      for (const installedGame of installedGames) {
        const canonicalGameId: number | undefined = resolveCanonicalGameIdForInstalledGame(installedGame)
        if (!canonicalGameId) {
          logger.warn(
            `[Library] Unable to resolve canonical gameId for installed manifest title="${installedGame.gameManifest.gameTitle}" id=${installedGame.gameManifest.gameId}`,
          )
          continue
        }

        const latestKnownVersion: string | undefined = getLatestAvailableVersionByGameId(canonicalGameId)
        const installedVersion: string | undefined = normalizeGameVersion(installedGame.gameManifest.version)

        if (latestKnownVersion && installedVersion && latestKnownVersion !== installedVersion) {
          gamesNeedsUpdate.value = [...gamesNeedsUpdate.value, installedGame]
        } else {
          gamesInstalled.value = [...gamesInstalled.value, installedGame]
        }
      }
    }

    refreshLibrary()
    await preloadLibraryCardsImages()
  } finally {
    const elapsedMs: number = Date.now() - loadingStartAtMs
    if (elapsedMs < MIN_LIBRARY_SPINNER_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_LIBRARY_SPINNER_MS - elapsedMs))
    }
    isLoading.value = false
  }
}

/**
 * Run the game by launching the executable by the path installation location
 * @param {GameModel} game - The game
 * @returns {Promise<Promise<void> | string>} - The promise
 */
const onPlayGame: (game: GameModel) => Promise<Promise<void> | string> = async (
  game: GameModel,
): Promise<Promise<void> | string> => {
  /**
   * Check si si il y a au moins un jeu installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©
   */
  if (gamesInstalled.value) {
    /**
     * Chercher le jeu dans les jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s par rapport ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  l'id du jeu passÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© en paramÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨tre
     * lors de l'appel de la fonction onPlayGame, c'est quand on clique sur le bouton play du jeu
     */
    const currentGame: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesInstalled.value, game.id)

    /**
     * Si le jeu est trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© dans les jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s, on continue
     */
    if (currentGame) {
      // VÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rifier si une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour est disponible
      const hasUpdate: boolean = await checkForGameUpdate(game)

      // Si une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour est disponible, afficher un message et sortir
      if (hasUpdate) {
        // Supprimer le jeu de la liste des jeux installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s
        gamesInstalled.value = gamesInstalled.value.filter(
          (gameInstalled: GameInstalled): boolean => !isInstalledEntryForCanonicalGameId(gameInstalled, game.id),
        )

        notyf.error(`An update is available for ${game.title}. Please update the game before playing.`)
        return
      }

      // Lancer le jeu
      try {
        isLaunchingGame.value = true
        // Attendez un dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lai arbitraire pour simuler le lancement du jeu
        setTimeout(() => {
          isLaunchingGame.value = false
        }, 2000)
        await TauriService.launchGame(currentGame.gameManifest.pathInstallLocation)
      } catch (error) {
        // Affiche un message disant que le dossier du jeu n'existe pas ou que l'executable n'existe pas
        // une popup avec un boutton disant rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©parer le jeu installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©
        showPlayGameNotFoundExecutableMessageError.value = 'play game'
        gameToPlayNotFoundExecutable.value = game
        showPlayGameNotFoundExecutableModal.value = true
        console.error('Error occurred while launching the game: ', error)
      }
    }
  }
}

/**
 * Recalcule les jeux installes / a mettre a jour a partir des versions connues en realtime.
 * @returns {void}
 */
const reconcileInstalledStateWithKnownLatestVersions: () => void = (): void => {
  const mergedInstalledEntries: GameInstalled[] = [...(gamesInstalled.value || []), ...(gamesNeedsUpdate.value || [])]
  const uniqueEntriesByCanonicalGameId: Map<number, GameInstalled> = new Map<number, GameInstalled>()
  const entriesWithoutCanonicalGameId: GameInstalled[] = []

  for (const installedEntry of mergedInstalledEntries) {
    const canonicalGameId: number | undefined = resolveCanonicalGameIdForInstalledGame(installedEntry)
    if (!canonicalGameId) {
      entriesWithoutCanonicalGameId.push(installedEntry)
      continue
    }

    if (!uniqueEntriesByCanonicalGameId.has(canonicalGameId)) {
      uniqueEntriesByCanonicalGameId.set(canonicalGameId, installedEntry)
    }
  }

  const nextGamesInstalled: GameInstalled[] = [...entriesWithoutCanonicalGameId]
  const nextGamesNeedsUpdate: GameInstalled[] = []

  for (const [canonicalGameId, installedEntry] of uniqueEntriesByCanonicalGameId.entries()) {
    const latestKnownVersion: string | undefined = getLatestAvailableVersionByGameId(canonicalGameId)
    const installedVersion: string | undefined = normalizeGameVersion(installedEntry.gameManifest.version)

    if (latestKnownVersion && installedVersion && latestKnownVersion !== installedVersion) {
      nextGamesNeedsUpdate.push(installedEntry)
    } else {
      nextGamesInstalled.push(installedEntry)
    }
  }

  gamesInstalled.value = nextGamesInstalled
  gamesNeedsUpdate.value = nextGamesNeedsUpdate
}

/**
 * Refresh library
 * @returns {void}
 */
const refreshLibrary: () => void = (): void => {
  reconcileInstalledStateWithKnownLatestVersions()
  const libraryGames: GameModel[] = userGameLibrariesStore.userGameLibrariesSortedByPlatform || []

  if (libraryGames.length > 0) {
    const activeDownloadGameIds: Set<number> = new Set(
      downloadsStore.activeDownloads.map((activeDownload: ActiveDownloadGame): number => activeDownload.gameId),
    )
    const gamesNeedUpdateCanonicalIds: Set<number> = new Set(
      gamesNeedsUpdate.value
        .map((installedGame: GameInstalled): number | undefined => resolveCanonicalGameIdForInstalledGame(installedGame))
        .filter((canonicalGameId: number | undefined): canonicalGameId is number => canonicalGameId !== undefined),
    )
    const gamesInstalledCanonicalIds: Set<number> = new Set(
      (gamesInstalled.value || [])
        .map((installedGame: GameInstalled): number | undefined => resolveCanonicalGameIdForInstalledGame(installedGame))
        .filter((canonicalGameId: number | undefined): canonicalGameId is number => canonicalGameId !== undefined),
    )

    gameActiveDownload.value = libraryGames.filter((game: GameModel): boolean => activeDownloadGameIds.has(game.id))
    gameNeedsUpdate.value = libraryGames.filter(
      (game: GameModel): boolean => gamesNeedUpdateCanonicalIds.has(game.id) && !activeDownloadGameIds.has(game.id),
    )
    gameInstalled.value = libraryGames.filter(
      (game: GameModel): boolean =>
        gamesInstalledCanonicalIds.has(game.id) &&
        !gamesNeedUpdateCanonicalIds.has(game.id) &&
        !activeDownloadGameIds.has(game.id),
    )
    gameNotInstalled.value = libraryGames.filter(
      (game: GameModel): boolean =>
        !gamesInstalledCanonicalIds.has(game.id) &&
        !gamesNeedUpdateCanonicalIds.has(game.id) &&
        !activeDownloadGameIds.has(game.id),
    )
  } else {
    gameInstalled.value = []
    gameNeedsUpdate.value = []
    gameNotInstalled.value = []
    gameActiveDownload.value = []
  }
}

const preloadLibraryCardsImages: () => Promise<void> = async (): Promise<void> => {
  const imageUrls: string[] = getLibraryCardImageUrls()
  if (imageUrls.length === 0) {
    return
  }

  await Promise.race([
    Promise.all(imageUrls.map((url: string) => preloadLibraryImage(url))),
    new Promise<void>((resolve) => setTimeout(resolve, LIBRARY_IMAGES_PRELOAD_TIMEOUT_MS)),
  ])
}

const getLibraryCardImageUrls: () => string[] = (): string[] => {
  const urls: Set<string> = new Set<string>()
  const allGames: GameModel[] = [
    ...gameActiveDownload.value,
    ...gameNeedsUpdate.value,
    ...gameInstalled.value,
    ...gameNotInstalledVisible.value,
  ]

  for (const game of allGames) {
    const pictureUrl: string | undefined = game.pictureFile?.url
    const logoUrl: string | undefined = game.logoFile?.url

    if (pictureUrl) {
      urls.add(pictureUrl)
    }
    if (logoUrl) {
      urls.add(logoUrl)
    }
  }

  return Array.from(urls)
}

const preloadLibraryImage: (url: string) => Promise<void> = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    const image: HTMLImageElement = new Image()
    let settled: boolean = false

    const done = (): void => {
      if (settled) {
        return
      }
      settled = true
      resolve()
    }

    image.onload = done
    image.onerror = done
    image.src = url

    if (image.complete) {
      done()
    }
  })
}

/**
 * Ouvrir la modal de tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chargement
 * @param {GameModel} game - The game
 * @param {boolean} addDirectoryGame - The add directory game
 * @param {boolean} launcherGetPath - The launcher get path
 * @param {boolean} forceRemoteCheck - Force le check distant meme si la version est identique
 * @returns {Promise<void>} - The promise
 */
const openDownloadModal: (
  game: GameModel,
  addDirectoryGame: boolean,
  launcherGetPath: boolean,
  forceRemoteCheck?: boolean,
) => Promise<void> = async (
  game: GameModel,
  addDirectoryGame: boolean,
  launcherGetPath: boolean,
  forceRemoteCheck: boolean = false,
): Promise<void> => {
  if (pendingOpenDownloadModalGameIds.has(game.id)) {
    return
  }
  pendingOpenDownloadModalGameIds.add(game.id)

  try {
    closeFixGameInstalledModal()

    gameToDownload.value = game
    preloadedDownloadPayload.value = null
    showButtonCreateDesktopShortcut.value = true
    showButtonChangePath.value = true

    let pathInstallLocationGame: string | undefined = undefined
    let diskStepStartedAtMs: number | undefined = undefined

    // VÃ©rifier si le jeu est installÃ© ou nÃ©cessite une mise Ã  jour
    const installedGame: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesInstalled.value, game.id)
    const gameNeedUpdate: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesNeedsUpdate.value, game.id)

    const gameManifest: GameManifestLocal | undefined = installedGame
      ? installedGame.gameManifest
      : gameNeedUpdate?.gameManifest

    if (gameManifest) {
      // PrÃ©paration d'un jeu installÃ© ou mise Ã  jour d'un jeu
      pathInstallLocationGame = gameManifest.pathInstallLocation
      showButtonCreateDesktopShortcut.value = false
      showButtonChangePath.value = false
      openPreparingDownloadModal(game, pathInstallLocationGame)
    } else {
      // Jeux non installÃ©s
      openCheckingDiskSpaceModal(game)
      const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
        (gamePlatform: GamePlatformModel) =>
          gamePlatform.name.toLowerCase() === currentSystemOSInfo.value?.os.toLowerCase(),
      )

      // Si une plateforme correspondante est trouvÃ©e, je rÃ©cupÃ¨re le fichier binaire du jeu pour rÃ©cupÃ©rer sa taille
      if (gamePlatform) {
        const gameBinary: GameBinaryModel | undefined = game.gameBinary.find(
          (gameBinary: GameBinaryModel): boolean => gameBinary.gamePlatform.id === gamePlatform.id,
        )

        if (gameBinary) {
          if (!currentSystemOSInfo.value) {
            return
          }

          const latestGameVersionAvailable: GameVersionModel =
            await GameVersionService.getLatestAvailableGameVersionByGameId(game.id)
          cacheLatestAvailableVersion(game.id, latestGameVersionAvailable.version)

          const fullPathFilename: string = `${gameBinary.file.pathfilename}${latestGameVersionAvailable.version}/${currentSystemOSInfo.value.architecture}/`
          const gameManifestRemote: GameManifestRemote | undefined = await TauriService.downloadGameManifestRemote(
            gameBinary.file.bucket.name,
            fullPathFilename,
          )
          if (!gameManifestRemote) {
            return
          }

          const totalSizeToDownload: number = gameManifestRemote.files.reduce(
            (totalSize: number, file: FileDetails): number => totalSize + file.size,
            0,
          )
          preloadedDownloadPayload.value = {
            gameId: game.id,
            bucketName: gameBinary.file.bucket.name,
            basePathFilename: gameBinary.file.pathfilename,
            latestVersion: latestGameVersionAvailable.version,
            fullPathFilename: fullPathFilename,
            gameManifestRemote: gameManifestRemote,
            totalSizeToDownload: totalSizeToDownload,
          }

          await setInstallLocationDefault(addDirectoryGame, launcherGetPath, totalSizeToDownload, pathInstallLocationGame)
        }
      }
    }

    if (gameManifest) {
      // RÃ©cupÃ©rer le manifeste local du jeu
      let gameManifestLocal: GameManifestLocal | undefined = undefined
      let isManifestLocalMissingForUpdate: boolean = false
      try {
        gameManifestLocal = await TauriService.getContentLocalManifest(gameManifest.pathInstallLocation)
        if (!gameManifestLocal) {
          isManifestLocalMissingForUpdate = true
        }
      } catch (error: unknown) {
        isManifestLocalMissingForUpdate = true
        logger.warn(
          `[Download Modal] Local manifest missing/unreadable for update at path=${gameManifest.pathInstallLocation}. Falling back to remote verification: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
      }
      if (!currentSystemOSInfo.value) {
        return
      }

      const currentOSInfo: SystemOSInfo = currentSystemOSInfo.value

      // RÃ©cupÃ©rer le jeu
      const gameDetails: GameModel = await GameService.getGameById(game.id)

      // RÃ©cupÃ©rer la plateforme du jeu qui correspond Ã  l'OS du systÃ¨me actuel en rendant la comparaison insensible Ã  la casse
      const gamePlatform: GamePlatformModel | undefined = gameDetails.gamePlatform.find(
        (gamePlatform: GamePlatformModel) => gamePlatform.name.toLowerCase() === currentOSInfo.os.toLowerCase(),
      )

      // Si une plateforme correspondante est trouvÃ©e, procÃ©dez au tÃ©lÃ©chargement
      if (gamePlatform) {
        const gameBinaryPlatform: GameBinaryModel | undefined = gameDetails.gameBinary.find(
          (gameBinary: GameBinaryModel): boolean => gameBinary.gamePlatform.id === gamePlatform.id,
        )

        if (gameBinaryPlatform) {
          // RÃ©cupÃ©rer la derniÃ¨re version du jeu disponible
          const latestGameVersionAvailable: GameVersionModel | undefined =
            await GameVersionService.getLatestAvailableGameVersionByGameId(gameDetails.id)
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!latestGameVersionAvailable) {
            return
          }

          // RÃ©cupÃ©rer le manifeste du jeu Ã  partir du serveur
          const fullPathFilename: string = `${gameBinaryPlatform.file.pathfilename}${latestGameVersionAvailable.version}/${currentOSInfo.architecture}/`
          const gameManifestRemote: GameManifestRemote | undefined = await TauriService.downloadGameManifestRemote(
            gameBinaryPlatform.file.bucket.name,
            fullPathFilename,
          )
          if (!gameManifestRemote) {
            return
          }

          // RÃ©cupÃ©rer la liste des fichiers Ã  tÃ©lÃ©charger pour le jeu en comparant les manifestes locaux et distant
          const totalRemoteManifestSize: number = resolveTotalSizeToDownload(gameManifestRemote.files, 0)
          let filesToDownloadForUpdate: FileDetails[] = []

          if (isManifestLocalMissingForUpdate || !gameManifestLocal) {
            const hasAnyFileInDirectory: boolean = await TauriService.hasAnyFileInDirectory(gameManifest.pathInstallLocation)
            const syntheticManifestFromRemote: GameManifestLocal = {
              pathInstallLocation: gameManifest.pathInstallLocation,
              gameId: game.id,
              gameTitle: game.title,
              gameBinarySize: totalRemoteManifestSize,
              version: latestGameVersionAvailable.version,
              files: gameManifestRemote.files,
            }

            filesToDownloadForUpdate = hasAnyFileInDirectory
              ? await TauriService.getMissingFiles(gameManifest.pathInstallLocation, syntheticManifestFromRemote)
              : gameManifestRemote.files
          } else {
            filesToDownloadForUpdate = await TauriService.getFilesToDownload(
              gameManifestLocal,
              gameManifestRemote,
              gameManifest.pathInstallLocation,
            )
          }
          filesDownloadUpdateGame.value = filesToDownloadForUpdate

          // VÃ©rifier si l'espace disque est suffisant pour installer le jeu
          // en faisant le total de la taille des fichiers Ã  tÃ©lÃ©charger
          const totalSizeToDownload: number = filesDownloadUpdateGame.value.reduce(
            (totalSize: number, file: FileDetails): number => totalSize + file.size,
            0,
          )
	          preloadedDownloadPayload.value = {
	            gameId: gameDetails.id,
	            bucketName: gameBinaryPlatform.file.bucket.name,
	            basePathFilename: gameBinaryPlatform.file.pathfilename,
	            latestVersion: latestGameVersionAvailable.version,
	            fullPathFilename: fullPathFilename,
	            gameManifestRemote: gameManifestRemote,
	            totalSizeToDownload: totalSizeToDownload,
	          }

	          if (forceRemoteCheck && totalSizeToDownload === 0) {
	            notyf.success(`Force update check completed: no file differences found for ${game.title}.`)
	            return
	          }

	          setPreparingDownloadDiskStep()
	          diskStepStartedAtMs = Date.now()
	          await setInstallLocationDefault(addDirectoryGame, launcherGetPath, totalSizeToDownload, pathInstallLocationGame)
	        }
      }
    }

    if (diskStepStartedAtMs) {
      const elapsedMs: number = Date.now() - diskStepStartedAtMs
      if (elapsedMs < MIN_PREPARE_DOWNLOAD_DISK_STEP_VISIBLE_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_PREPARE_DOWNLOAD_DISK_STEP_VISIBLE_MS - elapsedMs))
      }
    }

    showDownloadModal.value = true
  } catch (error: unknown) {
    logger.error(
      `[Download Modal] Failed to prepare download for gameId=${game.id} title="${game.title}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    notyf.error(`Failed to prepare download for ${game.title}`)
  } finally {
    pendingOpenDownloadModalGameIds.delete(game.id)
    closePreparingDownloadModal()
    closeCheckingDiskSpaceModal()
  }
}

/**
 * On check create desktop shortcut
 * @param {boolean} checked - The checked value
 * @returns {void}
 */
const onCheckCreateDesktopShortcut: (checked: boolean) => void = (checked: boolean): void => {
  createDesktopShortcut.value = checked
}

/**
 * Message affiche en cas d'acces ecriture refuse sur un chemin d'installation.
 * @returns {string}
 */
const getInstallPathAccessDeniedMessage: () => string = (): string => {
  return 'Access denied for the selected installation path. Choose another folder or relaunch CrzGames Launcher as administrator to install there.'
}

/**
 * Message affiche quand le fichier manifest_local.json est absent.
 * @returns {string}
 */
const getManifestMissingRepairMessage: () => string = (): string => {
  return 'The file manifest_local.json is missing in this folder. Click "Repair Installation": existing valid files will be kept, missing/corrupted files will be redownloaded, and manifest_local.json will be regenerated.'
}

/**
 * Verifie l'acces en ecriture sur le chemin d'installation.
 * @param {string} installPath - Chemin a verifier
 * @returns {Promise<boolean>} - True si le chemin est accessible en ecriture
 */
const validateInstallPathWriteAccess: (installPath: string) => Promise<boolean> = async (
  installPath: string,
): Promise<boolean> => {
  const accessCheckResult = await TauriService.checkInstallPathWriteAccess(installPath)
  if (accessCheckResult.isWritable) {
    return true
  }

  logger.error(
    `[Install Path Access] denied path=${installPath} error=${accessCheckResult.error || 'unknown error'}`,
  )
  openInstallPathAccessDeniedModal(installPath)
  return false
}

/**
 * Set the default installation location
 * @param {boolean} addDirectoryGame - The add directory game
 * @param {boolean} launcherGetPath - The launcher get path
 * @param {number} totalSizeToDownload - The total size to download
 * @param {string} pathInstallLocationGame - The path install location game
 * @returns {Promise<void>}
 */
const setInstallLocationDefault: (
  addDirectoryGame: boolean,
  launcherGetPath: boolean,
  totalSizeToDownload: number,
  pathInstallLocationGame?: string,
) => Promise<void> = async (
  addDirectoryGame: boolean,
  launcherGetPath: boolean,
  totalSizeToDownload: number,
  pathInstallLocationGame?: string,
): Promise<void> => {
  let pathInstallLocationDefault: PathInstallLocation | undefined = undefined

  if (launcherGetPath) {
    pathInstallLocationDefault = await TauriService.getLauncherExecutablePathDirectory()
  } else {
    if (pathInstallLocationGame) {
      pathInstallLocationDefault = await TauriService.getDiskSpaceForInstallPath(pathInstallLocationGame)
    }
  }

  // Set la valeur par dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©faut
  if (pathInstallLocationDefault) {
    gamePathInstallLocation.value = {
      pathSystem: pathInstallLocationDefault.pathSystem,
      diskFreeSpace: pathInstallLocationDefault.diskFreeSpace,
    }

    checkIfEnoughDiskSpace(totalSizeToDownload)

    if (addDirectoryGame) {
      await addDirectoryGameForPathInstallLocation()
    }
  }
}

/**
 * VÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rifier si l'espace disque est suffisant pour installer le jeu
 * @param {number} totalSizeToDownload - The total size to download
 * @returns {boolean} - The promise
 */
const checkIfEnoughDiskSpace: (totalSizeToDownload: number) => boolean = (totalSizeToDownload: number): boolean => {
  if (!gamePathInstallLocation.value?.diskFreeSpace) {
    return false
  }

  if (gamePathInstallLocation.value.diskFreeSpace >= totalSizeToDownload) {
    logger.debug('ASSEZ DE DISK DUR POUR INSTALLER LE JEU')
    gameToDownloadFileSize.value = totalSizeToDownload
    isSufficientDiskSpaceAvailable.value = true
    return true
  } else {
    logger.debug('PAS ASSEZ DE DISK DUR POUR INSTALLER LE JEU')
    isSufficientDiskSpaceAvailable.value = false
    return false
  }
}

/**
 * Fermer la modal de tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chargement
 * @returns {void}
 */
const closeDownloadModal: () => void = (): void => {
  gameToDownload.value = null
  preloadedDownloadPayload.value = null
  showDownloadModal.value = false
  gameToDownloadFileSize.value = undefined
  isSufficientDiskSpaceAvailable.value = false
  createDesktopShortcut.value = false
  showButtonCreateDesktopShortcut.value = true
  showButtonChangePath.value = true
  filesDownloadUpdateGame.value = undefined
}

/**
 * Calcule la taille totale des fichiers a telecharger.
 * - Si une liste de fichiers est fournie (repair/update), elle est prioritaire.
 * - Sinon on utilise la valeur fallback (modal/preload).
 * @param {FileDetails[] | undefined} files - Liste des fichiers cibles
 * @param {number | undefined} fallbackTotalSize - Taille de secours
 * @returns {number} Taille totale a telecharger en octets.
 */
const resolveTotalSizeToDownload: (files?: FileDetails[], fallbackTotalSize?: number) => number = (
  files?: FileDetails[],
  fallbackTotalSize?: number,
): number => {
  if (files && files.length > 0) {
    return files.reduce((totalSize: number, file: FileDetails): number => totalSize + file.size, 0)
  }
  return fallbackTotalSize || 0
}

/**
 * TÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©charger le jeu
 * @param {FileDetails[]} files - The files
 * @returns {void} - The promise
 */
const downloadGame: (files?: FileDetails[]) => Promise<void> = async (files?: FileDetails[]): Promise<void> => {
  const game: GameModel | null = gameToDownload.value
  const preloadedPayload: PreloadedDownloadPayload | null = preloadedDownloadPayload.value
  const gamePathInstallLocationPathSystem: string | undefined = gamePathInstallLocation.value?.pathSystem
  const createDesktopShortcutCurrent: boolean = createDesktopShortcut.value
  const currentSystemOSInfoCurrent: SystemOSInfo | undefined = currentSystemOSInfo.value
  const gameToDownloadFileSizeCurrent: number | undefined = gameToDownloadFileSize.value
  const estimatedTotalSizeToDownload: number = resolveTotalSizeToDownload(
    files,
    gameToDownloadFileSizeCurrent ?? preloadedPayload?.totalSizeToDownload,
  )

  if (gamePathInstallLocationPathSystem) {
    const hasWriteAccessOnInstallPath: boolean = await validateInstallPathWriteAccess(gamePathInstallLocationPathSystem)
    if (!hasWriteAccessOnInstallPath) {
      return
    }
  }

  if (game && gamePathInstallLocationPathSystem) {
    const preloadedLatestVersion: string | undefined = preloadedPayload?.latestVersion?.trim()
    downloadsStore.addActiveDownload({
      pathInstallLocation: gamePathInstallLocationPathSystem,
      gameId: game.id,
      gameTitle: game.title,
      ...(preloadedLatestVersion ? { gameVersion: preloadedLatestVersion } : {}),
      gamePictureUrl: game.pictureFile.url,
      isPlaying: true,
      progress: 0,
      totalDownloadedBytesNow: 0,
      totalSizeToDownload: estimatedTotalSizeToDownload,
      gameBinarySize: estimatedTotalSizeToDownload,
      speed: '0 B/s',
      remainingTime: 'Calculating...',
    } as ActiveDownloadGame)
  }

  closeDownloadModal()
  await navigateTo('/home/download-manager')

  if (!game) {
    return
  }

  void (async (): Promise<void> => {
    try {
      if (user && preloadedPayload?.gameId === game.id) {
        const filesToDownload: FileDetails[] = files || preloadedPayload.gameManifestRemote.files
        const gameBinaryTotalSize: number = resolveTotalSizeToDownload(preloadedPayload.gameManifestRemote.files, 0)

        await TauriService.downloadGame(
          preloadedPayload.bucketName,
          preloadedPayload.basePathFilename,
          gamePathInstallLocationPathSystem,
          createDesktopShortcutCurrent,
          game.title,
          preloadedPayload.latestVersion,
          gameBinaryTotalSize,
          game.id,
          user.id,
          filesToDownload,
          preloadedPayload.gameManifestRemote,
          {
            navigateToDownloadManager: false,
            systemOSInfo: currentSystemOSInfoCurrent,
          },
        )
        return
      }

      const resolvedSystemOSInfo: SystemOSInfo | undefined =
        currentSystemOSInfoCurrent || (await TauriService.getSystemOSCurrent())

      if (resolvedSystemOSInfo) {
        // RÃƒÂ©cupÃƒÂ©rer la plateforme du jeu qui correspond ÃƒÂ  l'OS du systÃƒÂ¨me actuel en rendant la comparaison insensible ÃƒÂ  la casse
        const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
          (gamePlatform: GamePlatformModel) =>
            gamePlatform.name.toLowerCase() === resolvedSystemOSInfo.os.toLowerCase(),
        )

        // Si une plateforme correspondante est trouvÃƒÂ©e, procÃƒÂ©dez au tÃƒÂ©lÃƒÂ©chargement
        if (gamePlatform) {
          const gameBinaryPlatform: GameBinaryModel | undefined = game.gameBinary.find(
            (gameBinary: GameBinaryModel): boolean => gameBinary.gamePlatform.id === gamePlatform.id,
          )

          if (gameBinaryPlatform) {
            const latestGameVersionAvailable: GameVersionModel =
              await GameVersionService.getLatestAvailableGameVersionByGameId(game.id)
            const fullPathFilename: string =
              gameBinaryPlatform.file.pathfilename +
              latestGameVersionAvailable.version +
              '/' +
              resolvedSystemOSInfo.architecture +
              '/'

            const gameManifestRemote: GameManifestRemote | undefined = await TauriService.downloadGameManifestRemote(
              gameBinaryPlatform.file.bucket.name,
              fullPathFilename,
            )

            logger.debug(`gameManifestRemote.files count: ${gameManifestRemote?.files.length ?? 0}`)
            logger.debug(`files override count: ${files?.length || 0}`)

            if (user && gameManifestRemote) {
              const filesToDownload: FileDetails[] = files || gameManifestRemote.files
              const gameBinaryTotalSize: number = resolveTotalSizeToDownload(gameManifestRemote.files, 0)

              await TauriService.downloadGame(
                gameBinaryPlatform.file.bucket.name,
                gameBinaryPlatform.file.pathfilename,
                gamePathInstallLocationPathSystem,
                createDesktopShortcutCurrent,
                game.title,
                latestGameVersionAvailable.version,
                gameBinaryTotalSize,
                game.id,
                user.id,
                filesToDownload,
                gameManifestRemote,
                {
                  navigateToDownloadManager: false,
                  systemOSInfo: resolvedSystemOSInfo,
                },
              )
              return
            }
          }
        } else {
          console.error(`No matching platform found for current OS: ${resolvedSystemOSInfo.os}`)
        }
      } else {
        console.error('Failed to get the current OS.')
      }
    } catch (error) {
      console.error('Error occurred while downloading the game: ', error)
    }
  })()
}

/**
 * Changer le chemin de tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chargement
 * @param {boolean} addDirectoryGame - The add directory game
 * @returns {Promise<void>}
 */
const changeDownloadPath: (addDirectoryGame: boolean) => Promise<void> = async (
  addDirectoryGame: boolean,
): Promise<void> => {
  const previousPathInstallLocation: PathInstallLocation | undefined = gamePathInstallLocation.value
    ? { ...gamePathInstallLocation.value }
    : undefined
  const pathInstallLocation: PathInstallLocation | undefined = await TauriService.selectPathForInstallAndCheckSpace()

  if (pathInstallLocation) {
    gamePathInstallLocation.value = {
      pathSystem: pathInstallLocation.pathSystem,
      diskFreeSpace: pathInstallLocation.diskFreeSpace,
    }

    if (addDirectoryGame) {
      await addDirectoryGameForPathInstallLocation()
    }

    const selectedInstallPath: string | undefined = gamePathInstallLocation.value?.pathSystem
    if (selectedInstallPath) {
      const hasWriteAccessOnSelectedPath: boolean = await validateInstallPathWriteAccess(selectedInstallPath)

      if (!hasWriteAccessOnSelectedPath) {
        if (previousPathInstallLocation) {
          gamePathInstallLocation.value = previousPathInstallLocation
          checkIfEnoughDiskSpace(gameToDownloadFileSize.value || 0)
        }
        return
      }
    }

    checkIfEnoughDiskSpace(gameToDownloadFileSize.value || 0)
  }
}

/**
 * Ajouter un rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©pertoire de jeu pour le chemin d'installation en ce basant sur le nom du jeu
 * Exemple : C:\Users\user\Documents\seatyrants (on rajoute le nom du jeu)
 * @returns {Promise<void>}
 */
const addDirectoryGameForPathInstallLocation: () => Promise<void> = async (): Promise<void> => {
  const gameId: number | undefined = gameToDownload.value?.id
  if (gameId) {
    const game: GameModel = await GameService.getGameById(gameId)
    const systemInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()

    if (systemInfo && gamePathInstallLocation.value) {
      const currentPathRaw: string = gamePathInstallLocation.value.pathSystem || ''
      const currentPathNormalized: string = currentPathRaw.replace(/[\\/]+$/, '')
      const gameTitleNormalized: string = game.title.trim().toLowerCase()
      const currentPathParts: string[] = currentPathNormalized.split(/[\\/]+/).filter((part: string): boolean => part.length > 0)
      const currentPathLastSegment: string = currentPathParts[currentPathParts.length - 1]?.trim().toLowerCase() || ''

      // Utiliser un separateur de chemin base sur le systeme d'exploitation.
      const separator: string =
        currentPathRaw.includes('\\') || systemInfo.os.toLowerCase() === 'windows' ? '\\' : '/'
      const fullPath: string =
        currentPathLastSegment === gameTitleNormalized
          ? currentPathNormalized
          : `${currentPathNormalized}${separator}${game.title}`
      const diskFreeSpaceCurrentPath: number | undefined = gamePathInstallLocation.value.diskFreeSpace

      gamePathInstallLocation.value = {
        pathSystem: fullPath,
        diskFreeSpace: diskFreeSpaceCurrentPath,
      }
    }
  }
}

/**
 * Fermer la modal de rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©paration du jeu installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©
 * @returns {void}
 */
const closeFixGameInstalledModal: () => void = (): void => {
  isVerifyingInstallation.value = false
  resetVerifyProgress()
  showDownloadModal.value = false
  gameToDownloadFileSize.value = undefined
  isSufficientDiskSpaceAvailable.value = false
  createDesktopShortcut.value = false
  showFixGameInstalledModal.value = false
  showFixInstallationInformationsError2.value = false
  showFixInstallationInformationsSuccess.value = false
  showFixInstallationInformationsError.value = false
  fixInstallationErrorMessage.value = ''
}

/**
 * Reinstalle completement le jeu depuis la modal de reparation.
 * Ce flux ne depend pas d'un manifest_local.json existant et utilise le path choisi dans la popup.
 * @returns {Promise<void>}
 */
const repairFullInstallationFromFixModal: () => Promise<void> = async (): Promise<void> => {
  await addDirectoryGameForPathInstallLocation()
  const filesForRepairOrReinstall: FileDetails[] = [...filesRepair.value]
  closeFixGameInstalledModal()
  await downloadGame(filesForRepairOrReinstall)
}

/**
 * Ouvrir la modal pour rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©parer le jeu installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©
 * @param {GameModel} game - The game
 * @returns {Promise<void>} - The promise
 */
const openFixGameInstalledModal: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  closePlayGameNotFoundExecutableModal()
  resetVerifyProgress()

  gameToDownload.value = game
  preloadedDownloadPayload.value = null
  filesRepair.value = []
  fixInstallationErrorMessage.value = ''

  let pathInstallLocationGame: string | undefined = undefined
  let launcherGetPath: boolean = true

  // VÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rifier si le jeu est installÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© ou nÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cessite une mise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour
  const installedGame: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesInstalled.value, game.id)
  const gameNeedUpdate: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesNeedsUpdate.value, game.id)

  if (installedGame) {
    pathInstallLocationGame = installedGame.gameManifest.pathInstallLocation
    launcherGetPath = false
  } else if (gameNeedUpdate) {
    pathInstallLocationGame = gameNeedUpdate.gameManifest.pathInstallLocation
    launcherGetPath = false
  }

  await setInstallLocationDefault(launcherGetPath, launcherGetPath, 0, pathInstallLocationGame)

  showFixGameInstalledModal.value = true
}

/**
 * VÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rifier l'installation du jeu pour rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©parer les fichiers
 * @param {GameModel} game - The game
 * @returns {void}
 */
const verifyInstallationGame: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  if (!gamePathInstallLocation.value) {
    return
  }

  resetVerifyProgress()
  isVerifyingInstallation.value = true
  try {

  // RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rer le manifeste local du jeu par rapport au chemin d'installation du jeu
  fixInstallationErrorMessage.value = ''
  let gameManifestLocal: GameManifestLocal | undefined = undefined
  let isManifestLocalMissing: boolean = false
  try {
    gameManifestLocal = await TauriService.getContentLocalManifest(gamePathInstallLocation.value.pathSystem)
    if (!gameManifestLocal) {
      isManifestLocalMissing = true
    }
  } catch (error) {
    isManifestLocalMissing = true
    console.error('Error occurred while getting the local manifest: ', error)
  }

  // RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rer les informations sur le systÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨me d'exploitation actuel
  const currentSystemOSInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
  if (!currentSystemOSInfo) {
    return
  }

  // RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rer la plateforme du jeu qui correspond ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  l'OS du systÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨me actuel en rendant la comparaison insensible ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  la casse
  const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
    (gamePlatform: GamePlatformModel) => gamePlatform.name.toLowerCase() === currentSystemOSInfo.os.toLowerCase(),
  )

  // Si une plateforme correspondante est trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e, procÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dez au tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chargement
  if (gamePlatform) {
    const gameBinaryPlatform: GameBinaryModel | undefined = game.gameBinary.find(
      (gameBinary: GameBinaryModel): boolean => gameBinary.gamePlatform.id === gamePlatform.id,
    )

    if (gameBinaryPlatform) {
      // RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rer la derniÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨re version du jeu disponible
      const latestGameVersionAvailable: GameVersionModel | undefined =
        await GameVersionService.getLatestAvailableGameVersionByGameId(game.id)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!latestGameVersionAvailable) {
        return
      }

      // RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rer le manifeste du jeu ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  partir du serveur
      const fullPathFilename: string =
        gameBinaryPlatform.file.pathfilename +
        latestGameVersionAvailable.version +
        '/' +
        currentSystemOSInfo.architecture +
        '/'
      const gameManifestRemote: GameManifestRemote | undefined = await TauriService.downloadGameManifestRemote(
        gameBinaryPlatform.file.bucket.name,
        fullPathFilename,
      )
      if (!gameManifestRemote) {
        return
      }

      // RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rer la liste des fichiers ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©charger pour le jeu en comparant les manifestes locaux et distant
      const totalRemoteManifestSize: number = resolveTotalSizeToDownload(gameManifestRemote.files, 0)

      if (isManifestLocalMissing || !gameManifestLocal) {
        const hasAnyFileInDirectory: boolean = await TauriService.hasAnyFileInDirectory(
          gamePathInstallLocation.value.pathSystem,
        )
        const syntheticManifestFromRemote: GameManifestLocal = {
          pathInstallLocation: gamePathInstallLocation.value.pathSystem,
          gameId: game.id,
          gameTitle: game.title,
          gameBinarySize: totalRemoteManifestSize,
          version: latestGameVersionAvailable.version,
          files: gameManifestRemote.files,
        }
        const filesDetectedAsMissing: FileDetails[] = await TauriService.getMissingFiles(
          gamePathInstallLocation.value.pathSystem,
          syntheticManifestFromRemote,
        )
        const filesToRepairWhenManifestMissing: FileDetails[] = hasAnyFileInDirectory
          ? filesDetectedAsMissing
          : gameManifestRemote.files
        const totalSizeToRepairWhenManifestMissing: number = resolveTotalSizeToDownload(filesToRepairWhenManifestMissing, 0)

        preloadedDownloadPayload.value = {
          gameId: game.id,
          bucketName: gameBinaryPlatform.file.bucket.name,
          basePathFilename: gameBinaryPlatform.file.pathfilename,
          latestVersion: latestGameVersionAvailable.version,
          fullPathFilename: fullPathFilename,
          gameManifestRemote: gameManifestRemote,
          totalSizeToDownload: totalSizeToRepairWhenManifestMissing,
        }

        filesRepair.value = filesToRepairWhenManifestMissing
        gameToDownloadFileSize.value = totalSizeToRepairWhenManifestMissing
        checkIfEnoughDiskSpace(totalSizeToRepairWhenManifestMissing)
        fixInstallationErrorMessage.value = hasAnyFileInDirectory ? getManifestMissingRepairMessage() : ''
        showFixInstallationInformationsError2.value = false
        showFixInstallationInformationsSuccess.value = false
        showFixInstallationInformationsError.value = true
        return
      }

      const files: FileDetails[] = await TauriService.getFilesToDownload(
        gameManifestLocal,
        gameManifestRemote,
        gamePathInstallLocation.value.pathSystem,
      )
      if (files.length === 0) {
        if (user) {
          // Tout les fichiers ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©tait OK mais le path d'installation du jeu ne correspond pas ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  celui enregistrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© donc on le met ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour
          // et on recrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e un GameInstalled avec le nouveau path d'installation du jeu
          showFixInstallationInformationsSuccess.value = true
          showFixInstallationInformationsError2.value = false
          showFixInstallationInformationsError.value = false
          fixInstallationErrorMessage.value = ''

          gameManifestLocal.pathInstallLocation = gamePathInstallLocation.value.pathSystem
          const gameInstalled: GameInstalled = {
            user_id: user.id,
            gameManifest: gameManifestLocal,
          }
          await TauriService.saveGameInstalled(gameInstalled)

          await loadGames()

          return
        }
      } else {
        // Dire avec succÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨s qu'ont n'as bien rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rer le manifest_local.json par rapport au path d'installation du jeu
        // MAIS il y a des fichiers manquants ou des fichiers diffÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rents
        showFixInstallationInformationsError2.value = true
        showFixInstallationInformationsSuccess.value = false
        showFixInstallationInformationsError.value = false
        fixInstallationErrorMessage.value = ''

        filesRepair.value = files
        const repairMissingFilesSize: number = resolveTotalSizeToDownload(files, 0)
        gameToDownloadFileSize.value = repairMissingFilesSize
        checkIfEnoughDiskSpace(repairMissingFilesSize)
        return
      }
    }
  }

  closeFixGameInstalledModal()
  showFixInstallationInformationsError.value = false
  showFixInstallationInformationsSuccess.value = false
  showFixInstallationInformationsError2.value = false
  fixInstallationErrorMessage.value = ''
  } finally {
    isVerifyingInstallation.value = false
  }
}

/**
 * DÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©filement vers le haut de la page avec un effet de dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©filement doux.
 * @returns {Promise<void>}
 */
const scrollToTop: () => Promise<void> = async (): Promise<void> => {
  await nextTick()

  // Trouver le conteneur scrollable dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©fini dans layout-home.vue
  const scrollableContainer: HTMLElement | null = document.querySelector(
    '.main-content-scrollable',
  ) as HTMLElement | null

  if (scrollableContainer) {
    // Utiliser scrollTo sur le conteneur scrollable avec behavior: 'smooth'
    scrollableContainer.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
}

/* WATCHERS */
watch(
  (): Record<number, string> => gameVersionRealtimeStore.latestAvailableVersionByGameId,
  (): void => {
    refreshLibrary()
  },
  { deep: true },
)

/**
 * Watcher for search term
 * @param {string} newValue - The new value
 * @returns {void}
 */
watch(searchTerm, async (newValue: string): Promise<void> => {
  const loadingStartAtMs: number = Date.now()
  isLoading.value = true

  await userGameLibrariesStore.getUserGameLibraries(newValue)

  if (
    newValue &&
    (userGameLibrariesStore.userGameLibrariesSortedByPlatform.length === 0 ||
      !userGameLibrariesStore.userGameLibrariesSortedByPlatform)
  ) {
    gameInstalled.value = []
    gameNotInstalled.value = []
    gameNeedsUpdate.value = []
    gameActiveDownload.value = []
  } else {
    refreshLibrary()
  }

  await preloadLibraryCardsImages()

  const elapsedMs: number = Date.now() - loadingStartAtMs
  if (elapsedMs < MIN_LIBRARY_SPINNER_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_LIBRARY_SPINNER_MS - elapsedMs))
  }

  isLoading.value = false
})

/*  LIFECYCLE */
/**
 * Watcher for library games
 * @returns {void}
 */
watchEffect((): void => {
  refreshLibrary()
})
</script>

<style lang="scss" scoped>
/* Permet de changer le curseur de la souris en mode progress lorsqu'on clique sur le bouton play d'un jeu */
.launching-cursor {
  cursor: progress;
}

.library-loading-dots {
  display: inline-flex;
  gap: 1px;
}

.library-loading-dots span {
  animation: library-loading-dot 1.2s infinite ease-in-out;
  opacity: 0.25;
  line-height: 1;
}

.library-loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.library-loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes library-loading-dot {
  0%,
  20%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 1;
  }
}
</style>




