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

        <!-- Bouton "Check for Updates" -->
        <button
          v-if="gameInstalled.length > 0 || gameNeedsUpdate.length > 0"
          @click="checkForUpdatesGames"
          class="flex-shrink-0 min-w-[180px] flex items-center rounded px-4 py-2 text-black ml-auto pl-2"
          :style="{ backgroundColor: 'rgb(224, 161, 0)' }"
        >
          <CrzIcon color="#000000" name="arrows-rotate" view-box="0 0 512 512" :width="18" :height="18" class="mr-2" />
          Search for Game Updates
        </button>
      </div>
    </div>

    <!-- Titre principal de la page "My Library" -->
    <h1 class="font-serif text-xl font-semibold sm:text-2xl">My Library</h1>

    <!-- Diviseur -->
    <Divider />

    <!-- Spinner de chargement : s'affiche seulement pendant le chargement des jeux -->
    <CrzSpinner v-if="isLoading" />

    <!-- Liste des jeux en cours de tÃƒÂ©lÃƒÂ©chargement -->
    <div v-if="!isLoading && gameActiveDownload && gameActiveDownload.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-lg font-medium flex items-center">
        Games being downloaded
        <CrzBadge variant="yellow" size="sm" class="ml-2">
          {{ gameActiveDownload.length }}
        </CrzBadge>
      </h4>

      <div class="grid grid-cols-auto-fit gap-8" style="grid-template-columns: repeat(auto-fit, minmax(180px, 220px))">
        <template v-for="game in gameActiveDownload" :key="game.id">
          <div class="relative">
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
            />
          </div>
        </template>
      </div>
    </div>

    <!-- Jeux dÃƒÂ©jÃƒÂ  installÃƒÂ©, mais nÃƒÂ©cessitant une mise ÃƒÂ  jour -->
    <div v-if="!isLoading && gameNeedsUpdate && gameNeedsUpdate.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-lg font-medium flex items-center">
        Games needing updates
        <!-- Badge avec le nombre de jeux trouvÃƒÂ©s -->
        <CrzBadge variant="yellow" size="sm" class="ml-2">
          {{ gameNeedsUpdate.length }}
        </CrzBadge>
      </h4>
      <div class="grid grid-cols-auto-fit gap-8" style="grid-template-columns: repeat(auto-fit, minmax(180px, 220px))">
        <template v-for="game in gameNeedsUpdate" :key="game.id">
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
            @download="openDownloadModal(game, false, false)"
          />
        </template>
      </div>
    </div>

    <!-- Jeux acheter / gratuit dÃƒÂ©jÃƒÂ  installÃƒÂ©s -->
    <div v-if="!isLoading && gameInstalled && gameInstalled.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-lg font-medium flex items-center">
        My games installed
        <!-- Badge avec le nombre de jeux trouvÃƒÂ©s -->
        <CrzBadge variant="yellow" size="sm" class="ml-2">
          {{ gameInstalled.length }}
        </CrzBadge>
      </h4>
      <div class="grid grid-cols-auto-fit gap-8" style="grid-template-columns: repeat(auto-fit, minmax(180px, 220px))">
        <template v-for="game in gameInstalled" :key="game.id">
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
          />
        </template>
      </div>
    </div>

    <!-- Jeux acheter / gratuit non installÃƒÂ©s -->
    <div v-if="!isLoading && gameNotInstalledVisible.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-lg font-medium flex items-center">
        My games not installed
        <!-- Badge avec le nombre de jeux trouvÃƒÂ©s -->
        <CrzBadge variant="yellow" size="sm" class="ml-2">
          {{ gameNotInstalledVisible.length }}
        </CrzBadge>
      </h4>
      <div class="grid grid-cols-auto-fit gap-8" style="grid-template-columns: repeat(auto-fit, minmax(180px, 220px))">
        <template v-for="game in gameNotInstalledVisible" :key="game.id">
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
    <!-- Messages pour l'absence de jeux, si aucun jeux est dans la bibliothÃƒÂ¨que de l'utilisateur -->
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

    <!-- Modal de tÃƒÂ©lÃƒÂ©chargement -->
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

    <!-- Modal pour rÃƒÂ©parer le chemin d'installation du jeu et vÃƒÂ©rifier les fichiers -->
    <FixGameInstalledInLibraryModal
      v-if="gameToDownload && gamePathInstallLocation"
      :show="showFixGameInstalledModal"
      :imageUrl="gameToDownload.pictureFile?.url"
      :gameTitle="gameToDownload.title"
      :gamePathInstallLocation="gamePathInstallLocation"
      :showFixInstallationInformationsError="showFixInstallationInformationsError"
      :showFixInstallationInformationsError2="showFixInstallationInformationsError2"
      :showFixInstallationInformationsSuccess="showFixInstallationInformationsSuccess"
      @close="closeFixGameInstalledModal"
      @verifyInstallationGame="verifyInstallationGame(gameToDownload)"
      @changePath="changeDownloadPath(false)"
      @repair="downloadGame(filesRepair)"
      @repair-full-installation="openDownloadModal(gameToDownload, true, false)"
      @saveQuit="closeFixGameInstalledModal"
    />

    <!-- Modal pour lancer le jeu mais qui n'a pas d'executable ou de dossier du jeu trouvÃƒÂ© -->
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
  </div>
</template>

<script lang="ts" setup>
import type { Notyf } from 'notyf'
import { computed, nextTick, onMounted, ref, watch, watchEffect } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import CrzBadge from '~~/src-common/components/ui/CrzBadge.vue'

import CrzGameCard from '#src-common/components/cards/CrzGameCard.vue'
import CrzSearchBar from '#src-common/components/inputs/CrzSearchBar.vue'
import CrzSpinner from '#src-common/components/loaders/CrzSpinner.vue'
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

import DownloadModal from '#src-nuxt/app/components/modals/DownloadModal.vue'
import FixGameInstalledInLibraryModal from '#src-nuxt/app/components/modals/FixGameInstalledInLibraryModal.vue'
import PlayGameNotFoundExecutableModal from '#src-nuxt/app/components/modals/PlayGameNotFoundExecutableModal.vue'
import NavigationPages from '#src-nuxt/app/components/navigations/NavigationPages.vue'
import Divider from '#src-nuxt/app/components/ui/Divider.vue'
import { useAuthStore } from '#src-nuxt/app/stores/auth.store'
import { useDownloadsStore } from '#src-nuxt/app/stores/downloads.store'
import type { ActiveDownloadGame, CompleteDownloadGame } from '#src-nuxt/app/stores/downloads.store'
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

/* DATA */
/**
 * Instance de Notyf pour afficher des notifications a l'utilisateur
 * - Recuperee via useNuxtApp() pour integrer Notyf dans l'application Nuxt
 * @type {Notyf}
 */
const notyf: Notyf = useNuxtApp().$notyf

const gamesInstalled: Ref<GameInstalled[] | undefined> = ref(undefined) // Jeux dÃƒÂ©jÃƒÂ  installÃƒÂ©
const gamesNeedsUpdate: Ref<GameInstalled[]> = ref([]) // Jeux deja installÃƒÂ© qui ont besoin d'une mise ÃƒÂ  jour
const filesDownloadUpdateGame: Ref<FileDetails[] | undefined> = ref(undefined) // Fichiers ÃƒÂ  tÃƒÂ©lÃƒÂ©charger pour mettre ÃƒÂ  jour le jeu
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

/* REFS */
const searchTerm: Ref<string> = ref('')

const isLoading: Ref<boolean> = ref(true)
const isLaunchingGame: Ref<boolean> = ref(false)

const gameInstalled: Ref<GameModel[]> = ref([])
const gameNotInstalled: Ref<GameModel[]> = ref([])
const gameNeedsUpdate: Ref<GameModel[]> = ref([])
const gameActiveDownload: Ref<GameModel[]> = ref([])
const gameNotInstalledVisible: ComputedRef<GameModel[]> = computed((): GameModel[] => {
  const activeDownloadGameIds: Set<number> = new Set(
    downloadsStore.activeDownloads.map((activeDownload: ActiveDownloadGame): number => activeDownload.gameId),
  )
  return gameNotInstalled.value.filter((game: GameModel): boolean => !activeDownloadGameIds.has(game.id))
})

// Modal pour lancer le jeu mais qui n'a pas d'executable ou de dossier du jeu trouvÃƒÂ©
const showPlayGameNotFoundExecutableModal: Ref<boolean> = ref(false)
const gameToPlayNotFoundExecutable: Ref<GameModel | null> = ref(null)
const showPlayGameNotFoundExecutableMessageError: Ref<string> = ref('')
const showUnstallGame: Ref<boolean> = ref(false)

// Modal pour rÃƒÂ©parer le jeu installÃƒÂ©
const showFixGameInstalledModal: Ref<boolean> = ref(false)
const showFixInstallationInformationsError: Ref<boolean> = ref(false)
const showFixInstallationInformationsSuccess: Ref<boolean> = ref(false)
const showFixInstallationInformationsError2: Ref<boolean> = ref(false)
const filesRepair: Ref<FileDetails[]> = ref([])

// Modal de tÃƒÂ©lÃƒÂ©chargement
const gameToDownload: Ref<GameModel | null> = ref(null)
const gameToDownloadFileSize: Ref<number | undefined> = ref(undefined)
const showDownloadModal: Ref<boolean> = ref(false)
const gamePathInstallLocation: Ref<PathInstallLocation | undefined> = ref(undefined)
const createDesktopShortcut: Ref<boolean> = ref(false)
const currentSystemOSInfo: Ref<SystemOSInfo | undefined> = ref(undefined)
const preloadedDownloadPayload: Ref<PreloadedDownloadPayload | null> = ref(null)
// Boolean qui permet de dÃƒÂ©terminer si l'espace du disk dur du user a assez en fonction de la taille du jeu
const isSufficientDiskSpaceAvailable: Ref<boolean> = ref(false)
const showButtonCreateDesktopShortcut: Ref<boolean> = ref(true)
const showButtonChangePath: Ref<boolean> = ref(true)

/* CYCLE - HOOKS */
onMounted(async (): Promise<void> => {
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

/**
 * On recoit l'ÃƒÂ©vÃƒÂ©nement quand un jeu est tÃƒÂ©lÃƒÂ©chargÃƒÂ©
 */
watch(
  () => downloadsStore.completedDownloads,
  async (completedDownloads: CompleteDownloadGame[]) => {
    for (const completedGame of completedDownloads) {
      // VÃƒÂ©rifier si le jeu tÃƒÂ©lÃƒÂ©chargÃƒÂ© n'est pas dÃƒÂ©jÃƒÂ  dans gamesInstalled pour ÃƒÂ©viter les doublons
      if (
        !gamesInstalled.value?.some((game: GameInstalled): boolean => game.gameManifest.gameId === completedGame.gameId)
      ) {
        try {
          // RÃƒÂ©cupÃƒÂ©rer tous les jeux installÃƒÂ©s via un fichier installÃƒÂ© sur le disque de l'utilisateur
          const gamesInstalledAll: GameInstalled[] | undefined = await TauriService.getGamesInstalled()
          if (!gamesInstalledAll) {
            console.warn('Get games installed failed')
            return
          }

          // Ajouter le jeu aux jeux installÃƒÂ©s
          gamesInstalled.value = gamesInstalledAll
          gameInstalled.value.push(await GameService.getGameById(completedGame.gameId))

          // Retirer ce jeu des jeux non installÃƒÂ©s
          gameNotInstalled.value = gameNotInstalled.value.filter(
            (game: GameModel): boolean => game.id !== completedGame.gameId,
          )

          // Supprimer le jeu de la liste des jeux en cours de tÃƒÂ©lÃƒÂ©chargement
          gameActiveDownload.value = gameActiveDownload.value.filter(
            (game: GameModel): boolean => game.id !== completedGame.gameId,
          )
        } catch (error: any) {
          console.error("Erreur lors de l'ajout du jeu installÃƒÂ© :", error)
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
      // VÃƒÂ©rifier si le jeu tÃƒÂ©lÃƒÂ©chargÃƒÂ© n'est pas dÃƒÂ©jÃƒÂ  dans gameActiveDownload pour ÃƒÂ©viter les doublons
      // et s'il n'est pas dÃƒÂ©jÃƒÂ  dans gameNeedsUpdate pour ÃƒÂ©viter les doublons
      if (
        !gameActiveDownload.value.some((game: GameModel): boolean => game.id === activeDownload.gameId) &&
        !gameNeedsUpdate.value.some((game: GameModel): boolean => game.id === activeDownload.gameId)
      ) {
        try {
          // Retirer ce jeu des jeux non installÃƒÂ©s
          gameNotInstalled.value = gameNotInstalled.value.filter(
            (game: GameModel): boolean => game.id !== activeDownload.gameId,
          )

          // RÃƒÂ©cupÃƒÂ©rer le jeu ÃƒÂ  tÃƒÂ©lÃƒÂ©charger
          const game: GameModel = await GameService.getGameById(activeDownload.gameId)
          gameActiveDownload.value.push(game)
        } catch (error: any) {
          console.error("Erreur lors de l'ajout du jeu ÃƒÂ  tÃƒÂ©lÃƒÂ©charger :", error)
        }
      }
    }
  },
  { deep: true },
)

/* METHODS */
/**
 * Uninstall the game
 * @param {GameModel} game - The game
 * @returns {Promise<void>} - The promise
 */
const UninstallGame: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  try {
    // Chercher le jeu dans les jeux installÃƒÂ©s
    let currentGame: GameInstalled | undefined = gamesInstalled.value?.find(
      (gameInstalled: GameInstalled) => gameInstalled.gameManifest.gameId === game.id,
    )

    // Si le jeu n'est pas trouvÃƒÂ© dans les jeux installÃƒÂ©s, le chercher dans les jeux nÃƒÂ©cessitant une mise ÃƒÂ  jour
    if (!currentGame) {
      currentGame = gamesNeedsUpdate.value.find(
        (gameNeedsUpdate: GameInstalled) => gameNeedsUpdate.gameManifest.gameId === game.id,
      )
    }

    // Si le jeu n'est trouvÃƒÂ© ni dans les jeux installÃƒÂ©s ni dans les jeux nÃƒÂ©cessitant une mise ÃƒÂ  jour, sortir
    if (!currentGame) {
      return
    }

    // DÃƒÂ©sinstaller le jeu
    await TauriService.uninstallGame(currentGame.gameManifest.pathInstallLocation)
    // Supprimer le jeu installÃƒÂ© de la liste des jeux installÃƒÂ©s dans le fichier de configuration local
    await TauriService.removeGameInstalled(currentGame.gameManifest.gameId)

    // Supprimer le jeu de la liste des jeux installÃƒÂ©s ou de la liste des jeux nÃƒÂ©cessitant une mise ÃƒÂ  jour
    gamesInstalled.value = gamesInstalled.value?.filter((gameInstalled: GameInstalled) => {
      return gameInstalled.gameManifest.gameId !== game.id
    })
    gamesNeedsUpdate.value = gamesNeedsUpdate.value.filter((gameNeedsUpdate: GameInstalled) => {
      return gameNeedsUpdate.gameManifest.gameId !== game.id
    })

    // Mettre ÃƒÂ  jour les listes de jeux ÃƒÂ  afficher
    gameInstalled.value = gameInstalled.value.filter((gameModel: GameModel) => gameModel.id !== game.id)
    gameNeedsUpdate.value = gameNeedsUpdate.value.filter((gameModel: GameModel) => gameModel.id !== game.id)
    gameNotInstalled.value = [...gameNotInstalled.value, game]

    notyf.success(`The game ${game.title} has been uninstalled successfully`)
  } catch (error: any) {
    showPlayGameNotFoundExecutableMessageError.value = 'uninstall game'
    gameToPlayNotFoundExecutable.value = game
    showPlayGameNotFoundExecutableModal.value = true
    showUnstallGame.value = true
    console.error('Error occurred while uninstalling the game: ', error)
  }
}

/**
 * CrÃƒÂ©er un raccourci sur le bureau
 * @param {GameModel} game - The game
 * @returns {Promise<void>} - The promise
 */
const createShortcutOnDesktop: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  // Chercher le jeu dans les jeux installÃƒÂ©s
  let currentGame: GameInstalled | undefined = gamesInstalled.value?.find(
    (gameInstalled: GameInstalled) => gameInstalled.gameManifest.gameId === game.id,
  )

  // Si le jeu n'est pas trouvÃƒÂ© dans les jeux installÃƒÂ©s, le chercher dans les jeux nÃƒÂ©cessitant une mise ÃƒÂ  jour
  if (!currentGame) {
    currentGame = gamesNeedsUpdate.value.find(
      (gameNeedsUpdate: GameInstalled) => gameNeedsUpdate.gameManifest.gameId === game.id,
    )
  }

  // Si le jeu n'est trouvÃƒÂ© ni dans les jeux installÃƒÂ©s ni dans les jeux nÃƒÂ©cessitant une mise ÃƒÂ  jour, sortir
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
 * Fermer la modal decrivant que le jeu n'a pas d'executable ou de dossier du jeu trouvÃƒÂ©
 * @returns {void}
 */
const closePlayGameNotFoundExecutableModal: () => void = (): void => {
  showPlayGameNotFoundExecutableModal.value = false
  showUnstallGame.value = false
}

/**
 * VÃƒÂ©rifie les mises ÃƒÂ  jour pour un jeu spÃƒÂ©cifique
 * @param {GameModel} game - Le jeu ÃƒÂ  vÃƒÂ©rifier
 * @returns {Promise<boolean>} - Retourne true si une mise ÃƒÂ  jour est disponible, false sinon
 */
const checkForGameUpdate: (game: GameModel) => Promise<boolean> = async (game: GameModel): Promise<boolean> => {
  const latestGameVersionAvailable: GameVersionModel | undefined =
    await GameVersionService.getLatestAvailableGameVersionByGameId(game.id)

  const installedGame: GameInstalled | undefined = gamesInstalled.value?.find(
    (gameInstalled: GameInstalled) => gameInstalled.gameManifest.gameId === game.id,
  )

  if (installedGame && latestGameVersionAvailable.version !== installedGame.gameManifest.version) {
    const gameModel: GameModel | undefined = userGameLibrariesStore.userGameLibrariesSortedByPlatform.find(
      (game: GameModel) => game.id === installedGame.gameManifest.gameId,
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
 * Fait un check pour voir si les jeux dÃƒÂ©jÃƒÂ  installÃƒÂ©es ont besoin d'une mise ÃƒÂ  jour
 * @returns {Promise<void>} - The promise
 */
const checkForUpdatesGames: () => Promise<void> = async (): Promise<void> => {
  isLoading.value = true
  await loadGames()
  isLoading.value = false
  notyf.success('Games have been checked for updates')
}

/**
 * Load games from the library and the installed games
 * @returns {Promise<void>} - The promise
 */
const loadGames: () => Promise<void> = async (): Promise<void> => {
  isLoading.value = true

  await userGameLibrariesStore.getUserGameLibraries()

  // RÃƒÂ©initialiser les listes avant de les remplir
  gamesInstalled.value = []
  gameNeedsUpdate.value = []
  gamesNeedsUpdate.value = []

  const installedGames: GameInstalled[] | undefined = await TauriService.getGamesInstalled()

  if (installedGames && installedGames.length > 0) {
    // Check for updates
    for (const installedGame of installedGames) {
      // RÃƒÂ©cupÃƒÂ©rer la derniÃƒÂ¨re version du jeu disponible
      const latestGameVersionAvailable: GameVersionModel | undefined =
        await GameVersionService.getLatestAvailableGameVersionByGameId(installedGame.gameManifest.gameId)

      // VÃƒÂ©rifier si la version du jeu installÃƒÂ© est diffÃƒÂ©rente de la version la plus rÃƒÂ©cente disponible
      if (latestGameVersionAvailable.version !== installedGame.gameManifest.version) {
        const gameModel: GameModel | undefined = userGameLibrariesStore.userGameLibrariesSortedByPlatform.find(
          (game: GameModel) => game.id === installedGame.gameManifest.gameId,
        )

        if (!gameModel) {
          continue
        }

        // Ajouter le jeu ÃƒÂ  la liste des jeux nÃƒÂ©cessitant une mise ÃƒÂ  jour
        gameNeedsUpdate.value.push(gameModel)
        gamesNeedsUpdate.value = [...gamesNeedsUpdate.value, installedGame]
      } else {
        // Ajouter un par un les jeux installÃƒÂ©s dans la liste des jeux installÃƒÂ©s si la version est la mÃƒÂªme
        gamesInstalled.value = [...gamesInstalled.value, installedGame]
      }
    }
  }

  refreshLibrary()

  isLoading.value = false
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
   * Check si si il y a au moins un jeu installÃƒÂ©
   */
  if (gamesInstalled.value) {
    /**
     * Chercher le jeu dans les jeux installÃƒÂ©s par rapport ÃƒÂ  l'id du jeu passÃƒÂ© en paramÃƒÂ¨tre
     * lors de l'appel de la fonction onPlayGame, c'est quand on clique sur le bouton play du jeu
     */
    const currentGame: GameInstalled | undefined = gamesInstalled.value.find(
      (gameInstalled: GameInstalled): boolean => {
        return gameInstalled.gameManifest.gameId === game.id
      },
    )

    /**
     * Si le jeu est trouvÃƒÂ© dans les jeux installÃƒÂ©s, on continue
     */
    if (currentGame) {
      // VÃƒÂ©rifier si une mise ÃƒÂ  jour est disponible
      const hasUpdate: boolean = await checkForGameUpdate(game)

      // Si une mise ÃƒÂ  jour est disponible, afficher un message et sortir
      if (hasUpdate) {
        // Supprimer le jeu de la liste des jeux installÃƒÂ©s
        gamesInstalled.value = gamesInstalled.value.filter(
          (gameInstalled: GameInstalled): boolean => gameInstalled.gameManifest.gameId !== game.id,
        )

        notyf.error(`An update is available for ${game.title}. Please update the game before playing.`)
        return
      }

      // Lancer le jeu
      try {
        isLaunchingGame.value = true
        // Attendez un dÃƒÂ©lai arbitraire pour simuler le lancement du jeu
        setTimeout(() => {
          isLaunchingGame.value = false
        }, 2000)
        await TauriService.launchGame(currentGame.gameManifest.pathInstallLocation)
      } catch (error) {
        // Affiche un message disant que le dossier du jeu n'existe pas ou que l'executable n'existe pas
        // une popup avec un boutton disant rÃƒÂ©parer le jeu installÃƒÂ©
        showPlayGameNotFoundExecutableMessageError.value = 'play game'
        gameToPlayNotFoundExecutable.value = game
        showPlayGameNotFoundExecutableModal.value = true
        console.error('Error occurred while launching the game: ', error)
      }
    }
  }
}

/**
 * Refresh library
 * @returns {void}
 */
const refreshLibrary: () => void = (): void => {
  if (
    userGameLibrariesStore.userGameLibrariesSortedByPlatform &&
    userGameLibrariesStore.userGameLibrariesSortedByPlatform.length > 0
  ) {
    // Jeux installÃƒÂ©s
    gameInstalled.value = userGameLibrariesStore.userGameLibrariesSortedByPlatform.filter((game: GameModel) => {
      return gamesInstalled.value?.some((installedGame: GameInstalled) => installedGame.gameManifest.gameId === game.id)
    })

    // Jeux nÃƒÂ©cessitant une mise ÃƒÂ  jour
    gameNeedsUpdate.value = userGameLibrariesStore.userGameLibrariesSortedByPlatform.filter((game: GameModel) => {
      return gameNeedsUpdate.value.some((gameUpdate: GameModel) => gameUpdate.id === game.id)
    })

    // Jeux non installÃƒÂ©s
    gameNotInstalled.value = userGameLibrariesStore.userGameLibrariesSortedByPlatform.filter((game: GameModel) => {
      return (
        !gamesInstalled.value?.some((installedGame: GameInstalled) => installedGame.gameManifest.gameId === game.id) &&
        !gameNeedsUpdate.value.some((gameUpdate: GameModel) => gameUpdate.id === game.id)
      )
    })

    // Jeux en cours de tÃƒÂ©lÃƒÂ©chargement
    gameActiveDownload.value = userGameLibrariesStore.userGameLibrariesSortedByPlatform.filter((game: GameModel) => {
      return downloadsStore.activeDownloads.some(
        (activeDownload: ActiveDownloadGame) => activeDownload.gameId === game.id,
      )
    })
  }
}

/**
 * Ouvrir la modal de tÃƒÂ©lÃƒÂ©chargement
 * @param {GameModel} game - The game
 * @param {boolean} addDirectoryGame - The add directory game
 * @param {boolean} launcherGetPath - The launcher get path
 * @returns {Promise<void>} - The promise
 */
const openDownloadModal: (
  game: GameModel,
  addDirectoryGame: boolean,
  launcherGetPath: boolean,
) => Promise<void> = async (game: GameModel, addDirectoryGame: boolean, launcherGetPath: boolean): Promise<void> => {
  closeFixGameInstalledModal()

  gameToDownload.value = game
  preloadedDownloadPayload.value = null

  let pathInstallLocationGame: string | undefined = undefined

  // VÃƒÂ©rifier si le jeu est installÃƒÂ© ou nÃƒÂ©cessite une mise ÃƒÂ  jour
  const installedGame: GameInstalled | undefined = gamesInstalled.value?.find(
    (installed: GameInstalled) => installed.gameManifest.gameId === game.id,
  )
  const gameNeedUpdate: GameInstalled | undefined = gamesNeedsUpdate.value.find(
    (update: GameInstalled) => update.gameManifest.gameId === game.id,
  )

  const gameManifest: GameManifestLocal | undefined = installedGame
    ? installedGame.gameManifest
    : gameNeedUpdate?.gameManifest

  if (gameManifest) {
    // RÃƒÂ©paration d'un jeu installÃƒÂ© ou mise ÃƒÂ  jour d'un jeu
    pathInstallLocationGame = gameManifest.pathInstallLocation
    showButtonCreateDesktopShortcut.value = false
    showButtonChangePath.value = false
  } else {
    // Jeux non installÃƒÂ©s
    const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
      (gamePlatform: GamePlatformModel) =>
        gamePlatform.name.toLowerCase() === currentSystemOSInfo.value?.os.toLowerCase(),
    )

    // Si une plateforme correspondante est trouvÃƒÂ©e, je rÃƒÂ©cupÃƒÂ©re le fichier binaire du jeu pour rÃƒÂ©cupÃƒÂ©rer sa taille
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
    // RÃƒÂ©cupÃƒÂ©rer le manifeste local du jeu
    const gameManifestLocal: GameManifestLocal | undefined = await TauriService.getContentLocalManifest(
      gameManifest.pathInstallLocation,
    )
    if (!gameManifestLocal || !currentSystemOSInfo.value) {
      return
    }

    const currentOSInfo: SystemOSInfo = currentSystemOSInfo.value

    // RÃƒÂ©cupÃƒÂ©rer le jeu
    const gameDetails: GameModel = await GameService.getGameById(gameManifest.gameId)

    // RÃƒÂ©cupÃƒÂ©rer la plateforme du jeu qui correspond ÃƒÂ  l'OS du systÃƒÂ¨me actuel en rendant la comparaison insensible ÃƒÂ  la casse
    const gamePlatform: GamePlatformModel | undefined = gameDetails.gamePlatform.find(
      (gamePlatform: GamePlatformModel) => gamePlatform.name.toLowerCase() === currentOSInfo.os.toLowerCase(),
    )

    // Si une plateforme correspondante est trouvÃƒÂ©e, procÃƒÂ©dez au tÃƒÂ©lÃƒÂ©chargement
    if (gamePlatform) {
      const gameBinaryPlatform: GameBinaryModel | undefined = gameDetails.gameBinary.find(
        (gameBinary: GameBinaryModel): boolean => gameBinary.gamePlatform.id === gamePlatform.id,
      )

      if (gameBinaryPlatform) {
        // RÃƒÂ©cupÃƒÂ©rer la derniÃƒÂ¨re version du jeu disponible
        const latestGameVersionAvailable: GameVersionModel | undefined =
          await GameVersionService.getLatestAvailableGameVersionByGameId(gameDetails.id)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!latestGameVersionAvailable) {
          return
        }

        // RÃƒÂ©cupÃƒÂ©rer le manifeste du jeu ÃƒÂ  partir du serveur
        const fullPathFilename: string = `${gameBinaryPlatform.file.pathfilename}${latestGameVersionAvailable.version}/${currentOSInfo.architecture}/`
        const gameManifestRemote: GameManifestRemote | undefined = await TauriService.downloadGameManifestRemote(
          gameBinaryPlatform.file.bucket.name,
          fullPathFilename,
        )
        if (!gameManifestRemote) {
          return
        }

        // RÃƒÂ©cupÃƒÂ©rer la liste des fichiers ÃƒÂ  tÃƒÂ©lÃƒÂ©charger pour le jeu en comparant les manifestes locaux et distant
        filesDownloadUpdateGame.value = await TauriService.getFilesToDownload(
          gameManifestLocal,
          gameManifestRemote,
          gameManifestLocal.pathInstallLocation,
        )

        // VÃƒÂ©rifier si l'espace disque est suffisant pour installer le jeu
        // en faisant le total de la taille des fichiers ÃƒÂ  tÃƒÂ©lÃƒÂ©charger
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
        await setInstallLocationDefault(addDirectoryGame, launcherGetPath, totalSizeToDownload, pathInstallLocationGame)
      }
    }
  }

  showDownloadModal.value = true
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

  // Set la valeur par dÃƒÂ©faut
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
 * VÃƒÂ©rifier si l'espace disque est suffisant pour installer le jeu
 * @param {number} totalSizeToDownload - The total size to download
 * @returns {boolean} - The promise
 */
const checkIfEnoughDiskSpace: (totalSizeToDownload: number) => boolean = (totalSizeToDownload: number): boolean => {
  if (!gamePathInstallLocation.value?.diskFreeSpace) {
    return false
  }

  if (gamePathInstallLocation.value.diskFreeSpace >= totalSizeToDownload) {
    console.log('ASSEZ DE DISK DUR POUR INSTALLER LE JEU')
    gameToDownloadFileSize.value = totalSizeToDownload
    isSufficientDiskSpaceAvailable.value = true
    return true
  } else {
    console.log('PAS ASSEZ DE DISK DUR POUR INSTALLER LE JEU')
    isSufficientDiskSpaceAvailable.value = false
    return false
  }
}

/**
 * Fermer la modal de tÃƒÂ©lÃƒÂ©chargement
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
 * TÃƒÂ©lÃƒÂ©charger le jeu
 * @param {FileDetails[]} files - The files
 * @returns {void} - The promise
 */
const downloadGame: (files?: FileDetails[]) => Promise<void> = async (files?: FileDetails[]): Promise<void> => {
  const game: GameModel | null = gameToDownload.value

  if (game) {
    try {
      const preloadedPayload: PreloadedDownloadPayload | null = preloadedDownloadPayload.value
      if (user && preloadedPayload?.gameId === game.id) {
        const filesToDownload: FileDetails[] = files || preloadedPayload.gameManifestRemote.files
        const computedTotalSizeToDownload: number =
          gameToDownloadFileSize.value ||
          (files
            ? files.reduce((totalSize: number, file: FileDetails): number => totalSize + file.size, 0)
            : preloadedPayload.totalSizeToDownload)

        await TauriService.downloadGame(
          preloadedPayload.bucketName,
          preloadedPayload.basePathFilename,
          gamePathInstallLocation.value?.pathSystem,
          createDesktopShortcut.value,
          game.title,
          preloadedPayload.latestVersion,
          computedTotalSizeToDownload,
          game.id,
          user.id,
          filesToDownload,
          preloadedPayload.gameManifestRemote,
        )

        closeDownloadModal()
        return
      }

      if (currentSystemOSInfo.value) {
        // RÃƒÂ©cupÃƒÂ©rer la plateforme du jeu qui correspond ÃƒÂ  l'OS du systÃƒÂ¨me actuel en rendant la comparaison insensible ÃƒÂ  la casse
        const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
          (gamePlatform: GamePlatformModel) =>
            gamePlatform.name.toLowerCase() === currentSystemOSInfo.value?.os.toLowerCase(),
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
              currentSystemOSInfo.value.architecture +
              '/'

            const gameManifestRemote: GameManifestRemote | undefined = await TauriService.downloadGameManifestRemote(
              gameBinaryPlatform.file.bucket.name,
              fullPathFilename,
            )

            console.log('gameManifestRemote.files: ', gameManifestRemote?.files)
            console.log('files: ', files)

            if (user && gameManifestRemote) {
              const filesToDownload: FileDetails[] = files || gameManifestRemote.files
              const computedTotalSizeToDownload: number =
                gameToDownloadFileSize.value ||
                filesToDownload.reduce((totalSize: number, file: FileDetails): number => totalSize + file.size, 0)

              await TauriService.downloadGame(
                gameBinaryPlatform.file.bucket.name,
                gameBinaryPlatform.file.pathfilename,
                gamePathInstallLocation.value?.pathSystem,
                createDesktopShortcut.value,
                game.title,
                latestGameVersionAvailable.version,
                computedTotalSizeToDownload,
                game.id,
                user.id,
                filesToDownload,
                gameManifestRemote,
              )
            }
          }
        } else {
          console.error(`No matching platform found for current OS: ${currentSystemOSInfo.value.os}`)
        }
      } else {
        console.error('Failed to get the current OS.')
      }
    } catch (error) {
      console.error('Error occurred while downloading the game: ', error)
    }
  }

  closeDownloadModal()
}

/**
 * Changer le chemin de tÃƒÂ©lÃƒÂ©chargement
 * @param {boolean} addDirectoryGame - The add directory game
 * @returns {Promise<void>}
 */
const changeDownloadPath: (addDirectoryGame: boolean) => Promise<void> = async (
  addDirectoryGame: boolean,
): Promise<void> => {
  const pathInstallLocation: PathInstallLocation | undefined = await TauriService.selectPathForInstallAndCheckSpace()

  if (pathInstallLocation) {
    gamePathInstallLocation.value = {
      pathSystem: pathInstallLocation.pathSystem,
      diskFreeSpace: pathInstallLocation.diskFreeSpace,
    }

    checkIfEnoughDiskSpace(gameToDownloadFileSize.value || 0)

    if (addDirectoryGame) {
      await addDirectoryGameForPathInstallLocation()
    }
  }
}

/**
 * Ajouter un rÃƒÂ©pertoire de jeu pour le chemin d'installation en ce basant sur le nom du jeu
 * Exemple : C:\Users\user\Documents\seatyrants (on rajoute le nom du jeu)
 * @returns {Promise<void>}
 */
const addDirectoryGameForPathInstallLocation: () => Promise<void> = async (): Promise<void> => {
  const gameId: number | undefined = gameToDownload.value?.id
  if (gameId) {
    const game: GameModel = await GameService.getGameById(gameId)
    const systemInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()

    if (systemInfo && gamePathInstallLocation.value) {
      // Utiliser un sÃƒÂ©parateur de chemin basÃƒÂ© sur le systÃƒÂ¨me d'exploitation
      const separator: string = systemInfo.os.toLowerCase() === 'windows' ? '\\' : '/'
      const fullPath: string = `${gamePathInstallLocation.value.pathSystem}${separator}${game.title}`

      gamePathInstallLocation.value = {
        pathSystem: fullPath,
      }
    }
  }
}

/**
 * Fermer la modal de rÃƒÂ©paration du jeu installÃƒÂ©
 * @returns {void}
 */
const closeFixGameInstalledModal: () => void = (): void => {
  showDownloadModal.value = false
  gameToDownloadFileSize.value = undefined
  isSufficientDiskSpaceAvailable.value = false
  createDesktopShortcut.value = false
  showFixGameInstalledModal.value = false
  showFixInstallationInformationsError2.value = false
  showFixInstallationInformationsSuccess.value = false
  showFixInstallationInformationsError.value = false
}

/**
 * Ouvrir la modal pour rÃƒÂ©parer le jeu installÃƒÂ©
 * @param {GameModel} game - The game
 * @returns {Promise<void>} - The promise
 */
const openFixGameInstalledModal: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  closePlayGameNotFoundExecutableModal()

  gameToDownload.value = game

  let pathInstallLocationGame: string | undefined = undefined
  let launcherGetPath: boolean = true

  // VÃƒÂ©rifier si le jeu est installÃƒÂ© ou nÃƒÂ©cessite une mise ÃƒÂ  jour
  const installedGame: GameInstalled | undefined = gamesInstalled.value?.find(
    (installed: GameInstalled) => installed.gameManifest.gameId === game.id,
  )
  const gameNeedUpdate: GameInstalled | undefined = gamesNeedsUpdate.value.find(
    (update: GameInstalled) => update.gameManifest.gameId === game.id,
  )

  if (installedGame) {
    pathInstallLocationGame = installedGame.gameManifest.pathInstallLocation
    launcherGetPath = false
  } else if (gameNeedUpdate) {
    pathInstallLocationGame = gameNeedUpdate.gameManifest.pathInstallLocation
    launcherGetPath = false
  }

  await setInstallLocationDefault(false, launcherGetPath, 1000, pathInstallLocationGame)

  showFixGameInstalledModal.value = true
}

/**
 * VÃƒÂ©rifier l'installation du jeu pour rÃƒÂ©parer les fichiers
 * @param {GameModel} game - The game
 * @returns {void}
 */
const verifyInstallationGame: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  if (!gamePathInstallLocation.value) {
    return
  }

  // RÃƒÂ©cupÃƒÂ©rer le manifeste local du jeu par rapport au chemin d'installation du jeu
  let gameManifestLocal: GameManifestLocal | undefined = undefined
  try {
    gameManifestLocal = await TauriService.getContentLocalManifest(gamePathInstallLocation.value.pathSystem)
    if (!gameManifestLocal) {
      showFixInstallationInformationsError2.value = false
      showFixInstallationInformationsSuccess.value = false
      showFixInstallationInformationsError.value = true
      return
    }
  } catch (error) {
    showFixInstallationInformationsError2.value = false
    showFixInstallationInformationsSuccess.value = false
    showFixInstallationInformationsError.value = true
    console.error('Error occurred while getting the local manifest: ', error)
    return
  }

  // RÃƒÂ©cupÃƒÂ©rer les informations sur le systÃƒÂ¨me d'exploitation actuel
  const currentSystemOSInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
  if (!currentSystemOSInfo) {
    return
  }

  // RÃƒÂ©cupÃƒÂ©rer la plateforme du jeu qui correspond ÃƒÂ  l'OS du systÃƒÂ¨me actuel en rendant la comparaison insensible ÃƒÂ  la casse
  const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
    (gamePlatform: GamePlatformModel) => gamePlatform.name.toLowerCase() === currentSystemOSInfo.os.toLowerCase(),
  )

  // Si une plateforme correspondante est trouvÃƒÂ©e, procÃƒÂ©dez au tÃƒÂ©lÃƒÂ©chargement
  if (gamePlatform) {
    const gameBinaryPlatform: GameBinaryModel | undefined = game.gameBinary.find(
      (gameBinary: GameBinaryModel): boolean => gameBinary.gamePlatform.id === gamePlatform.id,
    )

    if (gameBinaryPlatform) {
      // RÃƒÂ©cupÃƒÂ©rer la derniÃƒÂ¨re version du jeu disponible
      const latestGameVersionAvailable: GameVersionModel | undefined =
        await GameVersionService.getLatestAvailableGameVersionByGameId(game.id)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!latestGameVersionAvailable) {
        return
      }

      // RÃƒÂ©cupÃƒÂ©rer le manifeste du jeu ÃƒÂ  partir du serveur
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

      // RÃƒÂ©cupÃƒÂ©rer la liste des fichiers ÃƒÂ  tÃƒÂ©lÃƒÂ©charger pour le jeu en comparant les manifestes locaux et distant
      const files: FileDetails[] = await TauriService.getFilesToDownload(
        gameManifestLocal,
        gameManifestRemote,
        gamePathInstallLocation.value.pathSystem,
      )
      if (files.length === 0) {
        if (user) {
          // Tout les fichiers ÃƒÂ©tait OK mais le path d'installation du jeu ne correspond pas ÃƒÂ  celui enregistrÃƒÂ© donc on le met ÃƒÂ  jour
          // et on recrÃƒÂ©e un GameInstalled avec le nouveau path d'installation du jeu
          showFixInstallationInformationsSuccess.value = true
          showFixInstallationInformationsError2.value = false
          showFixInstallationInformationsError.value = false

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
        // Dire avec succÃƒÂ¨s qu'ont n'as bien rÃƒÂ©cupÃƒÂ©rer le manifest_local.json par rapport au path d'installation du jeu
        // MAIS il y a des fichiers manquants ou des fichiers diffÃƒÂ©rents
        showFixInstallationInformationsError2.value = true
        showFixInstallationInformationsSuccess.value = false
        showFixInstallationInformationsError.value = false

        filesRepair.value = files
        return
      }
    }
  }

  closeFixGameInstalledModal()
  showFixInstallationInformationsError.value = false
  showFixInstallationInformationsSuccess.value = false
  showFixInstallationInformationsError2.value = false
}

/**
 * DÃƒÂ©filement vers le haut de la page avec un effet de dÃƒÂ©filement doux.
 * @returns {Promise<void>}
 */
const scrollToTop: () => Promise<void> = async (): Promise<void> => {
  await nextTick()

  // Trouver le conteneur scrollable dÃƒÂ©fini dans layout-home.vue
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
/**
 * Watcher for search term
 * @param {string} newValue - The new value
 * @returns {void}
 */
watch(searchTerm, async (newValue: string): Promise<void> => {
  if (newValue.length === 0) isLoading.value = true

  await userGameLibrariesStore.getUserGameLibraries(newValue)

  // VÃƒÂ©rification aprÃƒÂ¨s la recherche
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
</style>
