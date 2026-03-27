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

    <!-- Liste des jeux en cours de tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement -->
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

    <!-- Jeux dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  installÃƒÆ’Ã‚Â©, mais nÃƒÆ’Ã‚Â©cessitant une mise ÃƒÆ’Ã‚Â  jour -->
    <div v-if="!isLoading && gameNeedsUpdate && gameNeedsUpdate.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-lg font-medium flex items-center">
        Games needing updates
        <!-- Badge avec le nombre de jeux trouvÃƒÆ’Ã‚Â©s -->
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

    <!-- Jeux acheter / gratuit dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  installÃƒÆ’Ã‚Â©s -->
    <div v-if="!isLoading && gameInstalled && gameInstalled.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-lg font-medium flex items-center">
        My games installed
        <!-- Badge avec le nombre de jeux trouvÃƒÆ’Ã‚Â©s -->
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

    <!-- Jeux acheter / gratuit non installÃƒÆ’Ã‚Â©s -->
    <div v-if="!isLoading && gameNotInstalledVisible.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-lg font-medium flex items-center">
        My games not installed
        <!-- Badge avec le nombre de jeux trouvÃƒÆ’Ã‚Â©s -->
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
    <!-- Messages pour l'absence de jeux, si aucun jeux est dans la bibliothÃƒÆ’Ã‚Â¨que de l'utilisateur -->
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

    <!-- Modal de tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement -->
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

    <!-- Modal pour rÃƒÆ’Ã‚Â©parer le chemin d'installation du jeu et vÃƒÆ’Ã‚Â©rifier les fichiers -->
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

    <!-- Modal pour lancer le jeu mais qui n'a pas d'executable ou de dossier du jeu trouvÃƒÆ’Ã‚Â© -->
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
const logger: Logger = createLogger('LibraryPage')

const gamesInstalled: Ref<GameInstalled[] | undefined> = ref(undefined) // Jeux dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  installÃƒÆ’Ã‚Â©
const gamesNeedsUpdate: Ref<GameInstalled[]> = ref([]) // Jeux deja installÃƒÆ’Ã‚Â© qui ont besoin d'une mise ÃƒÆ’Ã‚Â  jour
const filesDownloadUpdateGame: Ref<FileDetails[] | undefined> = ref(undefined) // Fichiers ÃƒÆ’Ã‚Â  tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©charger pour mettre ÃƒÆ’Ã‚Â  jour le jeu
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

// Modal pour lancer le jeu mais qui n'a pas d'executable ou de dossier du jeu trouvÃƒÆ’Ã‚Â©
const showPlayGameNotFoundExecutableModal: Ref<boolean> = ref(false)
const gameToPlayNotFoundExecutable: Ref<GameModel | null> = ref(null)
const showPlayGameNotFoundExecutableMessageError: Ref<string> = ref('')
const showUnstallGame: Ref<boolean> = ref(false)

// Modal pour rÃƒÆ’Ã‚Â©parer le jeu installÃƒÆ’Ã‚Â©
const showFixGameInstalledModal: Ref<boolean> = ref(false)
const showFixInstallationInformationsError: Ref<boolean> = ref(false)
const showFixInstallationInformationsSuccess: Ref<boolean> = ref(false)
const showFixInstallationInformationsError2: Ref<boolean> = ref(false)
const filesRepair: Ref<FileDetails[]> = ref([])

// Modal de tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement
const gameToDownload: Ref<GameModel | null> = ref(null)
const gameToDownloadFileSize: Ref<number | undefined> = ref(undefined)
const showDownloadModal: Ref<boolean> = ref(false)
const gamePathInstallLocation: Ref<PathInstallLocation | undefined> = ref(undefined)
const createDesktopShortcut: Ref<boolean> = ref(false)
const currentSystemOSInfo: Ref<SystemOSInfo | undefined> = ref(undefined)
const preloadedDownloadPayload: Ref<PreloadedDownloadPayload | null> = ref(null)
// Boolean qui permet de dÃƒÆ’Ã‚Â©terminer si l'espace du disk dur du user a assez en fonction de la taille du jeu
const isSufficientDiskSpaceAvailable: Ref<boolean> = ref(false)
const showButtonCreateDesktopShortcut: Ref<boolean> = ref(true)
const showButtonChangePath: Ref<boolean> = ref(true)

/**
 * Normalise un titre de jeu pour les comparaisons.
 * @param {string | undefined} value - Titre brut.
 * @returns {string} - Titre normalise.
 */
const normalizeGameTitle: (value?: string) => string = (value?: string): string =>
  (value || '').trim().toLowerCase()

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
 * On recoit l'ÃƒÆ’Ã‚Â©vÃƒÆ’Ã‚Â©nement quand un jeu est tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargÃƒÆ’Ã‚Â©
 */
watch(
  () => downloadsStore.completedDownloads,
  async (completedDownloads: CompleteDownloadGame[]) => {
    const currentUserId: number | undefined = authStore.user?.id
    if (!currentUserId) {
      return
    }

    for (const completedGame of completedDownloads) {
      // VÃƒÆ’Ã‚Â©rifier si le jeu tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargÃƒÆ’Ã‚Â© n'est pas dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  dans gamesInstalled pour ÃƒÆ’Ã‚Â©viter les doublons
      if (
        !gamesInstalled.value?.some((game: GameInstalled): boolean =>
          isInstalledEntryForCanonicalGameId(game, completedGame.gameId),
        )
      ) {
        try {
          // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer tous les jeux installÃƒÆ’Ã‚Â©s via un fichier installÃƒÆ’Ã‚Â© sur le disque de l'utilisateur
          const gamesInstalledAll: GameInstalled[] | undefined = await TauriService.getGamesInstalled(currentUserId)
          if (!gamesInstalledAll) {
            console.warn('Get games installed failed')
            return
          }

          // Ajouter le jeu aux jeux installÃƒÆ’Ã‚Â©s
          gamesInstalled.value = gamesInstalledAll
          gameInstalled.value.push(await GameService.getGameById(completedGame.gameId))

          // Retirer ce jeu des jeux non installÃƒÆ’Ã‚Â©s
          gameNotInstalled.value = gameNotInstalled.value.filter(
            (game: GameModel): boolean => game.id !== completedGame.gameId,
          )

          // Supprimer le jeu de la liste des jeux en cours de tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement
          gameActiveDownload.value = gameActiveDownload.value.filter(
            (game: GameModel): boolean => game.id !== completedGame.gameId,
          )
        } catch (error: any) {
          console.error("Erreur lors de l'ajout du jeu installÃƒÆ’Ã‚Â© :", error)
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
      // VÃƒÆ’Ã‚Â©rifier si le jeu tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargÃƒÆ’Ã‚Â© n'est pas dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  dans gameActiveDownload pour ÃƒÆ’Ã‚Â©viter les doublons
      // et s'il n'est pas dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  dans gameNeedsUpdate pour ÃƒÆ’Ã‚Â©viter les doublons
      if (
        !gameActiveDownload.value.some((game: GameModel): boolean => game.id === activeDownload.gameId) &&
        !gameNeedsUpdate.value.some((game: GameModel): boolean => game.id === activeDownload.gameId)
      ) {
        try {
          // Retirer ce jeu des jeux non installÃƒÆ’Ã‚Â©s
          gameNotInstalled.value = gameNotInstalled.value.filter(
            (game: GameModel): boolean => game.id !== activeDownload.gameId,
          )

          // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer le jeu ÃƒÆ’Ã‚Â  tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©charger
          const game: GameModel = await GameService.getGameById(activeDownload.gameId)
          gameActiveDownload.value.push(game)
        } catch (error: any) {
          console.error("Erreur lors de l'ajout du jeu ÃƒÆ’Ã‚Â  tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©charger :", error)
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
    // Chercher le jeu dans les jeux installÃƒÆ’Ã‚Â©s
    let currentGame: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesInstalled.value, game.id)

    // Si le jeu n'est pas trouvÃƒÆ’Ã‚Â© dans les jeux installÃƒÆ’Ã‚Â©s, le chercher dans les jeux nÃƒÆ’Ã‚Â©cessitant une mise ÃƒÆ’Ã‚Â  jour
    if (!currentGame) {
      currentGame = findInstalledEntryByCanonicalGameId(gamesNeedsUpdate.value, game.id)
    }

    // Si le jeu n'est trouvÃƒÆ’Ã‚Â© ni dans les jeux installÃƒÆ’Ã‚Â©s ni dans les jeux nÃƒÆ’Ã‚Â©cessitant une mise ÃƒÆ’Ã‚Â  jour, sortir
    if (!currentGame) {
      return
    }

    // DÃƒÆ’Ã‚Â©sinstaller le jeu
    await TauriService.uninstallGame(currentGame.gameManifest.pathInstallLocation)
    // Supprimer le jeu installÃƒÆ’Ã‚Â© de la liste des jeux installÃƒÆ’Ã‚Â©s dans le fichier de configuration local
    const currentUserId: number | undefined = authStore.user?.id
    await TauriService.removeGameInstalled(currentGame.gameManifest.gameId, currentUserId)

    // Supprimer le jeu de la liste des jeux installÃƒÆ’Ã‚Â©s ou de la liste des jeux nÃƒÆ’Ã‚Â©cessitant une mise ÃƒÆ’Ã‚Â  jour
    gamesInstalled.value = gamesInstalled.value?.filter((gameInstalled: GameInstalled) => {
      return !isInstalledEntryForCanonicalGameId(gameInstalled, game.id)
    })
    gamesNeedsUpdate.value = gamesNeedsUpdate.value.filter((gameNeedsUpdate: GameInstalled) => {
      return !isInstalledEntryForCanonicalGameId(gameNeedsUpdate, game.id)
    })

    // Mettre ÃƒÆ’Ã‚Â  jour les listes de jeux ÃƒÆ’Ã‚Â  afficher
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
 * CrÃƒÆ’Ã‚Â©er un raccourci sur le bureau
 * @param {GameModel} game - The game
 * @returns {Promise<void>} - The promise
 */
const createShortcutOnDesktop: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  // Chercher le jeu dans les jeux installÃƒÆ’Ã‚Â©s
  let currentGame: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesInstalled.value, game.id)

  // Si le jeu n'est pas trouvÃƒÆ’Ã‚Â© dans les jeux installÃƒÆ’Ã‚Â©s, le chercher dans les jeux nÃƒÆ’Ã‚Â©cessitant une mise ÃƒÆ’Ã‚Â  jour
  if (!currentGame) {
    currentGame = findInstalledEntryByCanonicalGameId(gamesNeedsUpdate.value, game.id)
  }

  // Si le jeu n'est trouvÃƒÆ’Ã‚Â© ni dans les jeux installÃƒÆ’Ã‚Â©s ni dans les jeux nÃƒÆ’Ã‚Â©cessitant une mise ÃƒÆ’Ã‚Â  jour, sortir
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
 * Fermer la modal decrivant que le jeu n'a pas d'executable ou de dossier du jeu trouvÃƒÆ’Ã‚Â©
 * @returns {void}
 */
const closePlayGameNotFoundExecutableModal: () => void = (): void => {
  showPlayGameNotFoundExecutableModal.value = false
  showUnstallGame.value = false
}

/**
 * VÃƒÆ’Ã‚Â©rifie les mises ÃƒÆ’Ã‚Â  jour pour un jeu spÃƒÆ’Ã‚Â©cifique
 * @param {GameModel} game - Le jeu ÃƒÆ’Ã‚Â  vÃƒÆ’Ã‚Â©rifier
 * @returns {Promise<boolean>} - Retourne true si une mise ÃƒÆ’Ã‚Â  jour est disponible, false sinon
 */
const checkForGameUpdate: (game: GameModel) => Promise<boolean> = async (game: GameModel): Promise<boolean> => {
  const canonicalGameId: number = game.id
  const latestGameVersionAvailable: GameVersionModel | undefined =
    await GameVersionService.getLatestAvailableGameVersionByGameId(canonicalGameId)

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
 * Fait un check pour voir si les jeux dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  installÃƒÆ’Ã‚Â©es ont besoin d'une mise ÃƒÆ’Ã‚Â  jour
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

  const currentUserId: number | undefined = authStore.user?.id
  if (!currentUserId) {
    gamesInstalled.value = []
    gameInstalled.value = []
    gameNeedsUpdate.value = []
    gameNotInstalled.value = []
    gameActiveDownload.value = []
    isLoading.value = false
    return
  }

  await userGameLibrariesStore.getUserGameLibraries()

  gamesInstalled.value = []
  gameNeedsUpdate.value = []
  gamesNeedsUpdate.value = []

  const installedGames: GameInstalled[] | undefined = await TauriService.getGamesInstalled(currentUserId)

  if (installedGames && installedGames.length > 0) {
    for (const installedGame of installedGames) {
      const canonicalGameId: number | undefined = resolveCanonicalGameIdForInstalledGame(installedGame)
      if (!canonicalGameId) {
        logger.warn(
          `[Library] Unable to resolve canonical gameId for installed manifest title="${installedGame.gameManifest.gameTitle}" id=${installedGame.gameManifest.gameId}`,
        )
        continue
      }

      try {
        const latestGameVersionAvailable: GameVersionModel | undefined =
          await GameVersionService.getLatestAvailableGameVersionByGameId(canonicalGameId)

        if (latestGameVersionAvailable.version !== installedGame.gameManifest.version) {
          const gameModel: GameModel | undefined = userGameLibrariesStore.userGameLibrariesSortedByPlatform.find(
            (libraryGame: GameModel): boolean => libraryGame.id === canonicalGameId,
          )

          if (!gameModel) {
            continue
          }

          gameNeedsUpdate.value.push(gameModel)
          gamesNeedsUpdate.value = [...gamesNeedsUpdate.value, installedGame]
        } else {
          gamesInstalled.value = [...gamesInstalled.value, installedGame]
        }
      } catch (error: unknown) {
        logger.warn(
          `[Library] Failed to check latest version for canonicalGameId=${canonicalGameId} localManifestId=${installedGame.gameManifest.gameId}: ${error instanceof Error ? error.message : String(error)}`,
        )
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
   * Check si si il y a au moins un jeu installÃƒÆ’Ã‚Â©
   */
  if (gamesInstalled.value) {
    /**
     * Chercher le jeu dans les jeux installÃƒÆ’Ã‚Â©s par rapport ÃƒÆ’Ã‚Â  l'id du jeu passÃƒÆ’Ã‚Â© en paramÃƒÆ’Ã‚Â¨tre
     * lors de l'appel de la fonction onPlayGame, c'est quand on clique sur le bouton play du jeu
     */
    const currentGame: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesInstalled.value, game.id)

    /**
     * Si le jeu est trouvÃƒÆ’Ã‚Â© dans les jeux installÃƒÆ’Ã‚Â©s, on continue
     */
    if (currentGame) {
      // VÃƒÆ’Ã‚Â©rifier si une mise ÃƒÆ’Ã‚Â  jour est disponible
      const hasUpdate: boolean = await checkForGameUpdate(game)

      // Si une mise ÃƒÆ’Ã‚Â  jour est disponible, afficher un message et sortir
      if (hasUpdate) {
        // Supprimer le jeu de la liste des jeux installÃƒÆ’Ã‚Â©s
        gamesInstalled.value = gamesInstalled.value.filter(
          (gameInstalled: GameInstalled): boolean => !isInstalledEntryForCanonicalGameId(gameInstalled, game.id),
        )

        notyf.error(`An update is available for ${game.title}. Please update the game before playing.`)
        return
      }

      // Lancer le jeu
      try {
        isLaunchingGame.value = true
        // Attendez un dÃƒÆ’Ã‚Â©lai arbitraire pour simuler le lancement du jeu
        setTimeout(() => {
          isLaunchingGame.value = false
        }, 2000)
        await TauriService.launchGame(currentGame.gameManifest.pathInstallLocation)
      } catch (error) {
        // Affiche un message disant que le dossier du jeu n'existe pas ou que l'executable n'existe pas
        // une popup avec un boutton disant rÃƒÆ’Ã‚Â©parer le jeu installÃƒÆ’Ã‚Â©
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
    // Jeux installÃƒÆ’Ã‚Â©s
    gameInstalled.value = userGameLibrariesStore.userGameLibrariesSortedByPlatform.filter((game: GameModel) => {
      return gamesInstalled.value?.some((installedGame: GameInstalled) =>
        isInstalledEntryForCanonicalGameId(installedGame, game.id),
      )
    })

    // Jeux nÃƒÆ’Ã‚Â©cessitant une mise ÃƒÆ’Ã‚Â  jour
    gameNeedsUpdate.value = userGameLibrariesStore.userGameLibrariesSortedByPlatform.filter((game: GameModel) => {
      return gameNeedsUpdate.value.some((gameUpdate: GameModel) => gameUpdate.id === game.id)
    })

    // Jeux non installÃƒÆ’Ã‚Â©s
    gameNotInstalled.value = userGameLibrariesStore.userGameLibrariesSortedByPlatform.filter((game: GameModel) => {
      return (
        !gamesInstalled.value?.some((installedGame: GameInstalled) =>
          isInstalledEntryForCanonicalGameId(installedGame, game.id),
        ) &&
        !gameNeedsUpdate.value.some((gameUpdate: GameModel) => gameUpdate.id === game.id)
      )
    })

    // Jeux en cours de tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement
    gameActiveDownload.value = userGameLibrariesStore.userGameLibrariesSortedByPlatform.filter((game: GameModel) => {
      return downloadsStore.activeDownloads.some(
        (activeDownload: ActiveDownloadGame) => activeDownload.gameId === game.id,
      )
    })
  } else {
    gameInstalled.value = []
    gameNeedsUpdate.value = []
    gameNotInstalled.value = []
    gameActiveDownload.value = []
  }
}

/**
 * Ouvrir la modal de tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement
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

  // VÃƒÆ’Ã‚Â©rifier si le jeu est installÃƒÆ’Ã‚Â© ou nÃƒÆ’Ã‚Â©cessite une mise ÃƒÆ’Ã‚Â  jour
  const installedGame: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesInstalled.value, game.id)
  const gameNeedUpdate: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesNeedsUpdate.value, game.id)

  const gameManifest: GameManifestLocal | undefined = installedGame
    ? installedGame.gameManifest
    : gameNeedUpdate?.gameManifest

  if (gameManifest) {
    // RÃƒÆ’Ã‚Â©paration d'un jeu installÃƒÆ’Ã‚Â© ou mise ÃƒÆ’Ã‚Â  jour d'un jeu
    pathInstallLocationGame = gameManifest.pathInstallLocation
    showButtonCreateDesktopShortcut.value = false
    showButtonChangePath.value = false
  } else {
    // Jeux non installÃƒÆ’Ã‚Â©s
    const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
      (gamePlatform: GamePlatformModel) =>
        gamePlatform.name.toLowerCase() === currentSystemOSInfo.value?.os.toLowerCase(),
    )

    // Si une plateforme correspondante est trouvÃƒÆ’Ã‚Â©e, je rÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©re le fichier binaire du jeu pour rÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer sa taille
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
    // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer le manifeste local du jeu
    const gameManifestLocal: GameManifestLocal | undefined = await TauriService.getContentLocalManifest(
      gameManifest.pathInstallLocation,
    )
    if (!gameManifestLocal || !currentSystemOSInfo.value) {
      return
    }

    const currentOSInfo: SystemOSInfo = currentSystemOSInfo.value

    // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer le jeu
    const gameDetails: GameModel = await GameService.getGameById(game.id)

    // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer la plateforme du jeu qui correspond ÃƒÆ’Ã‚Â  l'OS du systÃƒÆ’Ã‚Â¨me actuel en rendant la comparaison insensible ÃƒÆ’Ã‚Â  la casse
    const gamePlatform: GamePlatformModel | undefined = gameDetails.gamePlatform.find(
      (gamePlatform: GamePlatformModel) => gamePlatform.name.toLowerCase() === currentOSInfo.os.toLowerCase(),
    )

    // Si une plateforme correspondante est trouvÃƒÆ’Ã‚Â©e, procÃƒÆ’Ã‚Â©dez au tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement
    if (gamePlatform) {
      const gameBinaryPlatform: GameBinaryModel | undefined = gameDetails.gameBinary.find(
        (gameBinary: GameBinaryModel): boolean => gameBinary.gamePlatform.id === gamePlatform.id,
      )

      if (gameBinaryPlatform) {
        // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer la derniÃƒÆ’Ã‚Â¨re version du jeu disponible
        const latestGameVersionAvailable: GameVersionModel | undefined =
          await GameVersionService.getLatestAvailableGameVersionByGameId(gameDetails.id)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!latestGameVersionAvailable) {
          return
        }

        // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer le manifeste du jeu ÃƒÆ’Ã‚Â  partir du serveur
        const fullPathFilename: string = `${gameBinaryPlatform.file.pathfilename}${latestGameVersionAvailable.version}/${currentOSInfo.architecture}/`
        const gameManifestRemote: GameManifestRemote | undefined = await TauriService.downloadGameManifestRemote(
          gameBinaryPlatform.file.bucket.name,
          fullPathFilename,
        )
        if (!gameManifestRemote) {
          return
        }

        // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer la liste des fichiers ÃƒÆ’Ã‚Â  tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©charger pour le jeu en comparant les manifestes locaux et distant
        filesDownloadUpdateGame.value = await TauriService.getFilesToDownload(
          gameManifestLocal,
          gameManifestRemote,
          gameManifestLocal.pathInstallLocation,
        )

        // VÃƒÆ’Ã‚Â©rifier si l'espace disque est suffisant pour installer le jeu
        // en faisant le total de la taille des fichiers ÃƒÆ’Ã‚Â  tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©charger
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

  // Set la valeur par dÃƒÆ’Ã‚Â©faut
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
 * VÃƒÆ’Ã‚Â©rifier si l'espace disque est suffisant pour installer le jeu
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
 * Fermer la modal de tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement
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
 * TÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©charger le jeu
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
    gameToDownloadFileSizeCurrent || preloadedPayload?.totalSizeToDownload,
  )

  if (game && gamePathInstallLocationPathSystem) {
    downloadsStore.addActiveDownload({
      pathInstallLocation: gamePathInstallLocationPathSystem,
      gameId: game.id,
      gameTitle: game.title,
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
        // Récupérer la plateforme du jeu qui correspond à l'OS du système actuel en rendant la comparaison insensible à la casse
        const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
          (gamePlatform: GamePlatformModel) =>
            gamePlatform.name.toLowerCase() === resolvedSystemOSInfo.os.toLowerCase(),
        )

        // Si une plateforme correspondante est trouvée, procédez au téléchargement
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
 * Changer le chemin de tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement
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
 * Ajouter un rÃƒÆ’Ã‚Â©pertoire de jeu pour le chemin d'installation en ce basant sur le nom du jeu
 * Exemple : C:\Users\user\Documents\seatyrants (on rajoute le nom du jeu)
 * @returns {Promise<void>}
 */
const addDirectoryGameForPathInstallLocation: () => Promise<void> = async (): Promise<void> => {
  const gameId: number | undefined = gameToDownload.value?.id
  if (gameId) {
    const game: GameModel = await GameService.getGameById(gameId)
    const systemInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()

    if (systemInfo && gamePathInstallLocation.value) {
      // Utiliser un sÃƒÆ’Ã‚Â©parateur de chemin basÃƒÆ’Ã‚Â© sur le systÃƒÆ’Ã‚Â¨me d'exploitation
      const separator: string = systemInfo.os.toLowerCase() === 'windows' ? '\\' : '/'
      const fullPath: string = `${gamePathInstallLocation.value.pathSystem}${separator}${game.title}`

      gamePathInstallLocation.value = {
        pathSystem: fullPath,
      }
    }
  }
}

/**
 * Fermer la modal de rÃƒÆ’Ã‚Â©paration du jeu installÃƒÆ’Ã‚Â©
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
 * Ouvrir la modal pour rÃƒÆ’Ã‚Â©parer le jeu installÃƒÆ’Ã‚Â©
 * @param {GameModel} game - The game
 * @returns {Promise<void>} - The promise
 */
const openFixGameInstalledModal: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  closePlayGameNotFoundExecutableModal()

  gameToDownload.value = game

  let pathInstallLocationGame: string | undefined = undefined
  let launcherGetPath: boolean = true

  // VÃƒÆ’Ã‚Â©rifier si le jeu est installÃƒÆ’Ã‚Â© ou nÃƒÆ’Ã‚Â©cessite une mise ÃƒÆ’Ã‚Â  jour
  const installedGame: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesInstalled.value, game.id)
  const gameNeedUpdate: GameInstalled | undefined = findInstalledEntryByCanonicalGameId(gamesNeedsUpdate.value, game.id)

  if (installedGame) {
    pathInstallLocationGame = installedGame.gameManifest.pathInstallLocation
    launcherGetPath = false
  } else if (gameNeedUpdate) {
    pathInstallLocationGame = gameNeedUpdate.gameManifest.pathInstallLocation
    launcherGetPath = false
  }

  await setInstallLocationDefault(false, launcherGetPath, 0, pathInstallLocationGame)

  showFixGameInstalledModal.value = true
}

/**
 * VÃƒÆ’Ã‚Â©rifier l'installation du jeu pour rÃƒÆ’Ã‚Â©parer les fichiers
 * @param {GameModel} game - The game
 * @returns {void}
 */
const verifyInstallationGame: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  if (!gamePathInstallLocation.value) {
    return
  }

  // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer le manifeste local du jeu par rapport au chemin d'installation du jeu
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

  // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer les informations sur le systÃƒÆ’Ã‚Â¨me d'exploitation actuel
  const currentSystemOSInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
  if (!currentSystemOSInfo) {
    return
  }

  // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer la plateforme du jeu qui correspond ÃƒÆ’Ã‚Â  l'OS du systÃƒÆ’Ã‚Â¨me actuel en rendant la comparaison insensible ÃƒÆ’Ã‚Â  la casse
  const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
    (gamePlatform: GamePlatformModel) => gamePlatform.name.toLowerCase() === currentSystemOSInfo.os.toLowerCase(),
  )

  // Si une plateforme correspondante est trouvÃƒÆ’Ã‚Â©e, procÃƒÆ’Ã‚Â©dez au tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement
  if (gamePlatform) {
    const gameBinaryPlatform: GameBinaryModel | undefined = game.gameBinary.find(
      (gameBinary: GameBinaryModel): boolean => gameBinary.gamePlatform.id === gamePlatform.id,
    )

    if (gameBinaryPlatform) {
      // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer la derniÃƒÆ’Ã‚Â¨re version du jeu disponible
      const latestGameVersionAvailable: GameVersionModel | undefined =
        await GameVersionService.getLatestAvailableGameVersionByGameId(game.id)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!latestGameVersionAvailable) {
        return
      }

      // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer le manifeste du jeu ÃƒÆ’Ã‚Â  partir du serveur
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

      // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer la liste des fichiers ÃƒÆ’Ã‚Â  tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©charger pour le jeu en comparant les manifestes locaux et distant
      const files: FileDetails[] = await TauriService.getFilesToDownload(
        gameManifestLocal,
        gameManifestRemote,
        gamePathInstallLocation.value.pathSystem,
      )
      if (files.length === 0) {
        if (user) {
          // Tout les fichiers ÃƒÆ’Ã‚Â©tait OK mais le path d'installation du jeu ne correspond pas ÃƒÆ’Ã‚Â  celui enregistrÃƒÆ’Ã‚Â© donc on le met ÃƒÆ’Ã‚Â  jour
          // et on recrÃƒÆ’Ã‚Â©e un GameInstalled avec le nouveau path d'installation du jeu
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
        // Dire avec succÃƒÆ’Ã‚Â¨s qu'ont n'as bien rÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer le manifest_local.json par rapport au path d'installation du jeu
        // MAIS il y a des fichiers manquants ou des fichiers diffÃƒÆ’Ã‚Â©rents
        showFixInstallationInformationsError2.value = true
        showFixInstallationInformationsSuccess.value = false
        showFixInstallationInformationsError.value = false

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
}

/**
 * DÃƒÆ’Ã‚Â©filement vers le haut de la page avec un effet de dÃƒÆ’Ã‚Â©filement doux.
 * @returns {Promise<void>}
 */
const scrollToTop: () => Promise<void> = async (): Promise<void> => {
  await nextTick()

  // Trouver le conteneur scrollable dÃƒÆ’Ã‚Â©fini dans layout-home.vue
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

  // VÃƒÆ’Ã‚Â©rification aprÃƒÆ’Ã‚Â¨s la recherche
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

