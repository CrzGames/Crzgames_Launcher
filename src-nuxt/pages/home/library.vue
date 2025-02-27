<template>
  <div :class="{ 'launching-cursor': isLaunchingGame }" class="grid gap-8 px-4 py-5 pb-12 text-white">
    <div class="flex items-center justify-between">
      <CrzSearchBar
        v-if="
          gameInstalled.length > 0 || gameNotInstalled.length > 0 || gameNeedsUpdate.length > 0 || searchTerm.length > 0
        "
        :value="searchTerm"
        @update:value="searchTerm = $event"
      />
      <!-- Bouton Check for Updates caché uniquement si tous les jeux sont non installés -->
      <button
        v-if="gameInstalled.length > 0 || gameNeedsUpdate.length > 0"
        @click="checkForUpdatesGames"
        class="flex items-center rounded px-4 py-2 text-black"
        :style="{ backgroundColor: 'rgb(224, 161, 0)' }"
      >
        <CrzIcon color="#000000" name="arrows-rotate" view-box="0 0 512 512" :width="18" :height="18" class="mr-2" />
        Check for Updates
      </button>
    </div>

    <!-- Affichage du loader unique pour tous les jeux en chargement -->
    <CrzSpinner v-if="isLoading" />

    <!-- Jeux déjà installé, mais nécessitant une mise à jour -->
    <div v-if="!isLoading && gameNeedsUpdate && gameNeedsUpdate.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-base font-medium">
        Games needing updates
        <span class="font-sans font-normal opacity-40">({{ gameNeedsUpdate.length }})</span>
      </h4>
      <div
        class="grid grid-cols-1 items-start justify-center gap-3 text-sm sm:grid sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-7 3xl:grid-cols-8 4xl:grid-cols-10"
      >
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
            :showSubTitle="true"
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

    <!-- Jeux acheter / gratuit déjà installés -->
    <div v-if="!isLoading && gameInstalled && gameInstalled.length > 0" class="mb-8 grid gap-4">
      <h4 class="font-serif text-base font-medium">
        My games installed
        <span class="font-sans font-normal opacity-40">({{ gameInstalled.length }})</span>
      </h4>
      <div
        class="grid grid-cols-1 items-start justify-center gap-3 text-sm sm:grid sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-7 3xl:grid-cols-8 4xl:grid-cols-10"
      >
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
            :showSubTitle="true"
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

    <!-- Jeux acheter / gratuit non installés -->
    <div v-if="!isLoading && gameNotInstalled && gameNotInstalled.length > 0" class="grid gap-4">
      <h4 class="font-serif text-base font-medium">
        My games not installed
        <span class="font-sans font-normal opacity-40">({{ gameNotInstalled.length }})</span>
      </h4>
      <div
        class="grid grid-cols-1 items-start justify-center gap-3 text-sm sm:grid sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-7 3xl:grid-cols-8 4xl:grid-cols-10"
      >
        <template :key="game.id" v-for="game in gameNotInstalled">
          <CrzGameCard
            :pictureFileUrl="game.pictureFile?.url"
            :trailerFileUrl="game.trailerFile?.url"
            :logoFileUrl="game.logoFile?.url"
            :gameCategory="game.gameCategory"
            :gamePlatform="game.gamePlatform"
            :title="game.title"
            :showPlatforms="false"
            :showVideo="false"
            :showSubTitle="true"
            :smallText="true"
            :showDownloadButton="true"
            :showFixGameInstalledInLibraryButton="true"
            @download="openDownloadModal(game, true, true)"
            @fixGameInstalledInLibrary="openFixGameInstalledModal(game)"
          />
        </template>
      </div>
    </div>

    <!-- Messages pour l'absence de jeux -->
    <p
      v-if="
        gameInstalled.length === 0 &&
        gameNotInstalled.length === 0 &&
        gameNeedsUpdate.length === 0 &&
        searchTerm.length > 0
      "
      class="text-center text-base font-semibold text-gray-400 md:text-xl"
    >
      There are no games available for this search.
    </p>
    <p
      v-if="
        gameInstalled.length === 0 &&
        gameNotInstalled.length === 0 &&
        gameNeedsUpdate.length === 0 &&
        searchTerm.length === 0
      "
      class="text-center text-base font-semibold text-gray-400 md:text-xl"
    >
      There are no games available in your library, at the moment.
    </p>

    <!-- Modal de téléchargement -->
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

    <!-- Modal pour réparer le chemin d'installation du jeu et vérifier les fichiers -->
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
import { onMounted, ref, watch, watchEffect } from 'vue'
import type { Ref } from 'vue'

import CrzGameCard from '#src-common/components/cards/CrzGameCard.vue'
import CrzSearchBar from '#src-common/components/inputs/CrzSearchBar.vue'
import CrzSpinner from '#src-common/components/loaders/CrzSpinner.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import type GameBinaryModel from '#src-common/core/models/GameBinaryModel'
import type GameModel from '#src-common/core/models/GameModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'
import type { GameVersionModel } from '#src-common/core/models/GameVersionModel'
import type UserModel from '#src-common/core/models/UserModel'
import { CloudStorageS3Service, type TotalSizeResponse } from '#src-common/core/services/CloudStorageS3Service'
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

import DownloadModal from '#src-nuxt/components/modals/DownloadModal.vue'
import FixGameInstalledInLibraryModal from '#src-nuxt/components/modals/FixGameInstalledInLibraryModal.vue'
import PlayGameNotFoundExecutableModal from '#src-nuxt/components/modals/PlayGameNotFoundExecutableModal.vue'
import { useAuthStore } from '#src-nuxt/stores/auth.store'
import { useGameLibraryStore } from '#src-nuxt/stores/gameLibrary.store'

const { $notyf } = useNuxtApp()

/* LAYOUT - MIDDLEWARE */
definePageMeta({
  layout: 'layout-home',
  middleware: ['auth'],
})

/*STORE*/
// eslint-disable-next-line @typescript-eslint/typedef
const gameLibraryStore = useGameLibraryStore()
// eslint-disable-next-line @typescript-eslint/typedef
const authStore = useAuthStore()

/* DATAS */
const gamesInstalled: Ref<GameInstalled[] | undefined> = ref(undefined)
const gamesNeedsUpdate: Ref<GameInstalled[]> = ref([]) // Jeux deja installé qui ont besoin d'une mise à jour
const filesDownloadUpdateGame: Ref<FileDetails[] | undefined> = ref(undefined) // Fichiers à télécharger pour mettre à jour le jeu
const user: UserModel | undefined = authStore.user

/* REFS */
const searchTerm: Ref<string> = ref('')

const isLoading: Ref<boolean> = ref(true)
const isLaunchingGame: Ref<boolean> = ref(false)

const gameInstalled: Ref<GameModel[]> = ref([])
const gameNotInstalled: Ref<GameModel[]> = ref([])
const gameNeedsUpdate: Ref<GameModel[]> = ref([])

// Modal pour lancer le jeu mais qui n'a pas d'executable ou de dossier du jeu trouvé
const showPlayGameNotFoundExecutableModal: Ref<boolean> = ref(false)
const gameToPlayNotFoundExecutable: Ref<GameModel | null> = ref(null)
const showPlayGameNotFoundExecutableMessageError: Ref<string> = ref('')
const showUnstallGame: Ref<boolean> = ref(false)

// Modal pour réparer le jeu installé
const showFixGameInstalledModal: Ref<boolean> = ref(false)
const showFixInstallationInformationsError: Ref<boolean> = ref(false)
const showFixInstallationInformationsSuccess: Ref<boolean> = ref(false)
const showFixInstallationInformationsError2: Ref<boolean> = ref(false)
const filesRepair: Ref<FileDetails[]> = ref([])

// Modal de téléchargement
const gameToDownload: Ref<GameModel | null> = ref(null)
const gameToDownloadFileSize: Ref<number | undefined> = ref(undefined)
const showDownloadModal: Ref<boolean> = ref(false)
const gamePathInstallLocation: Ref<PathInstallLocation | undefined> = ref(undefined)
const createDesktopShortcut: Ref<boolean> = ref(false)
const currentSystemOSInfo: Ref<SystemOSInfo | undefined> = ref(undefined)
// Boolean qui permet de déterminer si l'espace du disk dur du user a assez en fonction de la taille du jeu
const isSufficientDiskSpaceAvailable: Ref<boolean> = ref(false)
const showButtonCreateDesktopShortcut: Ref<boolean> = ref(true)
const showButtonChangePath: Ref<boolean> = ref(true)

/* CYCLE - HOOKS */
onMounted(async (): Promise<void> => {
  try {
    currentSystemOSInfo.value = await TauriService.getSystemOSCurrent()
    await loadGames()
  } catch (error) {
    console.error('Error occurred while loading games: ', error)
  } finally {
    isLoading.value = false
  }
})

/* METHODS */
/**
 * Uninstall the game
 * @param {GameModel} game - The game
 * @returns {Promise<void>} - The promise
 */
const UninstallGame: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  try {
    // Chercher le jeu dans les jeux installés
    let currentGame: GameInstalled | undefined = gamesInstalled.value?.find(
      (gameInstalled: GameInstalled) => gameInstalled.gameManifest.gameId === game.id,
    )

    // Si le jeu n'est pas trouvé dans les jeux installés, le chercher dans les jeux nécessitant une mise à jour
    if (!currentGame) {
      currentGame = gamesNeedsUpdate.value.find(
        (gameNeedsUpdate: GameInstalled) => gameNeedsUpdate.gameManifest.gameId === game.id,
      )
    }

    // Si le jeu n'est trouvé ni dans les jeux installés ni dans les jeux nécessitant une mise à jour, sortir
    if (!currentGame) {
      return
    }

    // Désinstaller le jeu
    await TauriService.uninstallGame(currentGame.gameManifest.pathInstallLocation)
    // Supprimer le jeu installé de la liste des jeux installés dans le fichier de configuration local
    await TauriService.removeGameInstalled(currentGame.gameManifest.gameId)

    // Supprimer le jeu de la liste des jeux installés ou de la liste des jeux nécessitant une mise à jour
    gamesInstalled.value = gamesInstalled.value?.filter((gameInstalled: GameInstalled) => {
      return gameInstalled.gameManifest.gameId !== game.id
    })
    gamesNeedsUpdate.value = gamesNeedsUpdate.value.filter((gameNeedsUpdate: GameInstalled) => {
      return gameNeedsUpdate.gameManifest.gameId !== game.id
    })

    // Mettre à jour les listes de jeux à afficher
    gameInstalled.value = gameInstalled.value.filter((gameModel: GameModel) => gameModel.id !== game.id)
    gameNeedsUpdate.value = gameNeedsUpdate.value.filter((gameModel: GameModel) => gameModel.id !== game.id)
    gameNotInstalled.value = [...gameNotInstalled.value, game]

    $notyf.success(`The game ${game.title} has been uninstalled successfully`)
  } catch (error: any) {
    showPlayGameNotFoundExecutableMessageError.value = 'uninstall game'
    gameToPlayNotFoundExecutable.value = game
    showPlayGameNotFoundExecutableModal.value = true
    showUnstallGame.value = true
    console.error('Error occurred while uninstalling the game: ', error)
  }
}

/**
 * Créer un raccourci sur le bureau
 * @param {GameModel} game - The game
 * @returns {Promise<void>} - The promise
 */
const createShortcutOnDesktop: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  // Chercher le jeu dans les jeux installés
  let currentGame: GameInstalled | undefined = gamesInstalled.value?.find(
    (gameInstalled: GameInstalled) => gameInstalled.gameManifest.gameId === game.id,
  )

  // Si le jeu n'est pas trouvé dans les jeux installés, le chercher dans les jeux nécessitant une mise à jour
  if (!currentGame) {
    currentGame = gamesNeedsUpdate.value.find(
      (gameNeedsUpdate: GameInstalled) => gameNeedsUpdate.gameManifest.gameId === game.id,
    )
  }

  // Si le jeu n'est trouvé ni dans les jeux installés ni dans les jeux nécessitant une mise à jour, sortir
  if (!currentGame) {
    return
  }

  try {
    await TauriService.createShortcutOnDesktop(currentGame.gameManifest.pathInstallLocation)
    $notyf.success(`The desktop shortcut has been created successfully for ${game.title}`)
  } catch (error) {
    showPlayGameNotFoundExecutableMessageError.value = 'could not create a desktop shortcut for the game'
    gameToPlayNotFoundExecutable.value = game
    showPlayGameNotFoundExecutableModal.value = true
    console.error('Error occurred while creating a desktop shortcut for the game: ', error)
  }
}

/**
 * Fermer la modal decrivant que le jeu n'a pas d'executable ou de dossier du jeu trouvé
 * @returns {void}
 */
const closePlayGameNotFoundExecutableModal: () => void = (): void => {
  showPlayGameNotFoundExecutableModal.value = false
  showUnstallGame.value = false
}

/**
 * Vérifie les mises à jour pour un jeu spécifique
 * @param {GameModel} game - Le jeu à vérifier
 * @returns {Promise<boolean>} - Retourne true si une mise à jour est disponible, false sinon
 */
const checkForGameUpdate: (game: GameModel) => Promise<boolean> = async (game: GameModel): Promise<boolean> => {
  const latestGameVersionAvailable: GameVersionModel | undefined =
    await GameVersionService.getLatestAvailableGameVersionByGameId(game.id)

  const installedGame: GameInstalled | undefined = gamesInstalled.value?.find(
    (gameInstalled: GameInstalled) => gameInstalled.gameManifest.gameId === game.id,
  )

  if (installedGame && latestGameVersionAvailable.version !== installedGame.gameManifest.version) {
    const gameModel: GameModel | undefined = gameLibraryStore.libraryGamesPlatforms.find(
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
 * Fait un check pour voir si les jeux déjà installées ont besoin d'une mise à jour
 * @returns {Promise<void>} - The promise
 */
const checkForUpdatesGames: () => Promise<void> = async (): Promise<void> => {
  isLoading.value = true
  await loadGames()
  isLoading.value = false
  $notyf.success('Games have been checked for updates')
}

/**
 * Load games from the library and the installed games
 * @returns {Promise<void>} - The promise
 */
const loadGames: () => Promise<void> = async (): Promise<void> => {
  await gameLibraryStore.getLibraryGames()

  // Réinitialiser les listes avant de les remplir
  gamesInstalled.value = []
  gameNeedsUpdate.value = []
  gamesNeedsUpdate.value = []

  const installedGames: GameInstalled[] | undefined = await TauriService.getGamesInstalled()

  if (installedGames && installedGames.length > 0) {
    // Check for updates
    for (const installedGame of installedGames) {
      // Récupérer la dernière version du jeu disponible
      const latestGameVersionAvailable: GameVersionModel | undefined =
        await GameVersionService.getLatestAvailableGameVersionByGameId(installedGame.gameManifest.gameId)

      // Vérifier si la version du jeu installé est différente de la version la plus récente disponible
      if (latestGameVersionAvailable.version !== installedGame.gameManifest.version) {
        const gameModel: GameModel | undefined = gameLibraryStore.libraryGamesPlatforms.find(
          (game: GameModel) => game.id === installedGame.gameManifest.gameId,
        )

        if (!gameModel) {
          continue
        }

        // Ajouter le jeu à la liste des jeux nécessitant une mise à jour
        gameNeedsUpdate.value.push(gameModel)
        gamesNeedsUpdate.value = [...gamesNeedsUpdate.value, installedGame]
      } else {
        // Ajouter un par un les jeux installés dans la liste des jeux installés si la version est la même
        gamesInstalled.value = [...gamesInstalled.value, installedGame]
      }
    }
  }

  refreshLibrary()
}

/**
 * Run the game by launching the executable by the path installation location
 * @param {GameModel} game - The game
 * @returns {Promise<Promise<void> | string>} - The promise
 */
const onPlayGame: (game: GameModel) => Promise<Promise<void> | string> = async (
  game: GameModel,
): Promise<Promise<void> | string> => {
  if (gamesInstalled.value) {
    const currentGame: GameInstalled | undefined = gamesInstalled.value.find((gameInstalled: GameInstalled) => {
      return gameInstalled.gameManifest.gameId === game.id
    })

    if (currentGame) {
      // Vérifier si une mise à jour est disponible
      const hasUpdate: boolean = await checkForGameUpdate(game)

      if (hasUpdate) {
        // Supprimer le jeu de la liste des jeux installés
        gamesInstalled.value = gamesInstalled.value.filter(
          (gameInstalled: GameInstalled) => gameInstalled.gameManifest.gameId !== game.id,
        )

        $notyf.error(`An update is available for ${game.title}. Please update the game before playing.`)
        return
      }

      try {
        isLaunchingGame.value = true
        // Attendez un délai arbitraire pour simuler le lancement du jeu
        setTimeout(() => {
          isLaunchingGame.value = false
        }, 2000)
        await TauriService.launchGame(currentGame.gameManifest.pathInstallLocation)
      } catch (error) {
        // Affiche un message disant que le dossier du jeu n'existe pas ou que l'executable n'existe pas
        // une popup avec un boutton disant réparer le jeu installé
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (gameLibraryStore.libraryGamesPlatforms && gameLibraryStore.libraryGamesPlatforms.length > 0) {
    // Jeux installés
    gameInstalled.value = gameLibraryStore.libraryGamesPlatforms.filter((game: GameModel) => {
      return gamesInstalled.value?.some((installedGame: GameInstalled) => installedGame.gameManifest.gameId === game.id)
    })

    // Jeux nécessitant une mise à jour
    gameNeedsUpdate.value = gameLibraryStore.libraryGamesPlatforms.filter((game: GameModel) => {
      return gameNeedsUpdate.value.some((gameUpdate: GameModel) => gameUpdate.id === game.id)
    })

    // Jeux non installés
    gameNotInstalled.value = gameLibraryStore.libraryGamesPlatforms.filter((game: GameModel) => {
      return (
        !gamesInstalled.value?.some((installedGame: GameInstalled) => installedGame.gameManifest.gameId === game.id) &&
        !gameNeedsUpdate.value.some((gameUpdate: GameModel) => gameUpdate.id === game.id)
      )
    })
  }
}

/**
 * Ouvrir la modal de téléchargement
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

  let pathInstallLocationGame: string | undefined = undefined

  // Vérifier si le jeu est installé ou nécessite une mise à jour
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
    // Réparation d'un jeu installé ou mise à jour d'un jeu
    pathInstallLocationGame = gameManifest.pathInstallLocation
    showButtonCreateDesktopShortcut.value = false
    showButtonChangePath.value = false
  } else {
    // Jeux non installés
    const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
      (gamePlatform: GamePlatformModel) =>
        gamePlatform.name.toLowerCase() === currentSystemOSInfo.value?.os.toLowerCase(),
    )

    // Si une plateforme correspondante est trouvée, je récupére le fichier binaire du jeu pour récupérer sa taille
    if (gamePlatform) {
      const gameBinary: GameBinaryModel | undefined = game.gameBinary.find(
        (gameBinary: GameBinaryModel): boolean => gameBinary.game_platforms_id === gamePlatform.id,
      )

      if (gameBinary) {
        // Récupérer la taille du dossier du binaire du jeu pour la plateforme actuelle et de la version la plus récente
        const latestGameVersionAvailable: GameVersionModel | undefined =
          await GameVersionService.getLatestAvailableGameVersionByGameId(game.id)
        const gameBinarySize: TotalSizeResponse = await CloudStorageS3Service.getTotalSizeFileOrFolderInBucket(
          gameBinary.file.bucket.name,
          `${gameBinary.file.pathfilename}${latestGameVersionAvailable.version}/${currentSystemOSInfo.value?.architecture}/`,
        )
        await setInstallLocationDefault(
          addDirectoryGame,
          launcherGetPath,
          gameBinarySize.totalSize,
          pathInstallLocationGame,
        )
      }
    }
  }

  if (gameManifest) {
    // Récupérer le manifeste local du jeu
    const gameManifestLocal: GameManifestLocal | undefined = await TauriService.getContentLocalManifest(
      gameManifest.pathInstallLocation,
    )
    if (!gameManifestLocal || !currentSystemOSInfo.value) {
      return
    }

    const currentOSInfo: SystemOSInfo = currentSystemOSInfo.value

    // Récupérer le jeu
    const gameDetails: GameModel = await GameService.getGameById(gameManifest.gameId)

    // Récupérer la plateforme du jeu qui correspond à l'OS du système actuel en rendant la comparaison insensible à la casse
    const gamePlatform: GamePlatformModel | undefined = gameDetails.gamePlatform.find(
      (gamePlatform: GamePlatformModel) => gamePlatform.name.toLowerCase() === currentOSInfo.os.toLowerCase(),
    )

    // Si une plateforme correspondante est trouvée, procédez au téléchargement
    if (gamePlatform) {
      const gameBinaryPlatform: GameBinaryModel | undefined = gameDetails.gameBinary.find(
        (gameBinary: GameBinaryModel): boolean => gameBinary.game_platforms_id === gamePlatform.id,
      )

      if (gameBinaryPlatform) {
        // Récupérer la dernière version du jeu disponible
        const latestGameVersionAvailable: GameVersionModel | undefined =
          await GameVersionService.getLatestAvailableGameVersionByGameId(gameDetails.id)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!latestGameVersionAvailable) {
          return
        }

        // Récupérer le manifeste du jeu à partir du serveur
        const fullPathFilename: string = `${gameBinaryPlatform.file.pathfilename}${latestGameVersionAvailable.version}/${currentOSInfo.architecture}/`
        const gameManifestRemote: GameManifestRemote | undefined = await TauriService.downloadGameManifestRemote(
          gameBinaryPlatform.file.bucket.name,
          fullPathFilename,
        )
        if (!gameManifestRemote) {
          return
        }

        // Récupérer la liste des fichiers à télécharger pour le jeu en comparant les manifestes locaux et distant
        filesDownloadUpdateGame.value = await TauriService.getFilesToDownload(
          gameManifestLocal,
          gameManifestRemote,
          gameManifestLocal.pathInstallLocation,
        )

        // Vérifier si l'espace disque est suffisant pour installer le jeu
        // en faisant le total de la taille des fichiers à télécharger
        const totalSizeToDownload: number = filesDownloadUpdateGame.value.reduce(
          (totalSize: number, file: FileDetails): number => totalSize + file.size,
          0,
        )
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

  // Set la valeur par défaut
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
 * Vérifier si l'espace disque est suffisant pour installer le jeu
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
 * Fermer la modal de téléchargement
 * @returns {void}
 */
const closeDownloadModal: () => void = (): void => {
  gameToDownload.value = null
  showDownloadModal.value = false
  gameToDownloadFileSize.value = undefined
  isSufficientDiskSpaceAvailable.value = false
  createDesktopShortcut.value = false
  showButtonCreateDesktopShortcut.value = true
  showButtonChangePath.value = true
  filesDownloadUpdateGame.value = undefined
}

/**
 * Télécharger le jeu
 * @param {FileDetails[]} files - The files
 * @returns {void} - The promise
 */
const downloadGame: (files?: FileDetails[]) => Promise<void> = async (files?: FileDetails[]): Promise<void> => {
  const game: GameModel | null = gameToDownload.value

  if (game) {
    try {
      if (currentSystemOSInfo.value) {
        // Récupérer la plateforme du jeu qui correspond à l'OS du système actuel en rendant la comparaison insensible à la casse
        const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
          (gamePlatform: GamePlatformModel) =>
            gamePlatform.name.toLowerCase() === currentSystemOSInfo.value?.os.toLowerCase(),
        )

        // Si une plateforme correspondante est trouvée, procédez au téléchargement
        if (gamePlatform) {
          const gameBinaryPlatform: GameBinaryModel | undefined = game.gameBinary.find(
            (gameBinary: GameBinaryModel): boolean => gameBinary.game_platforms_id === gamePlatform.id,
          )

          if (gameBinaryPlatform) {
            const latestGameVersionAvailable: GameVersionModel | undefined =
              await GameVersionService.getLatestAvailableGameVersionByGameId(game.id)
            const fullPathFilename: string =
              gameBinaryPlatform.file.pathfilename +
              latestGameVersionAvailable.version +
              '/' +
              currentSystemOSInfo.value.architecture +
              '/'
            const gameBinarySize: TotalSizeResponse = await CloudStorageS3Service.getTotalSizeFileOrFolderInBucket(
              gameBinaryPlatform.file.bucket.name,
              fullPathFilename,
            )

            const gameManifestRemote: GameManifestRemote | undefined = await TauriService.downloadGameManifestRemote(
              gameBinaryPlatform.file.bucket.name,
              fullPathFilename,
            )

            console.log('gameManifestRemote.files: ', gameManifestRemote?.files)
            console.log('files: ', files)

            if (user && gameManifestRemote) {
              await TauriService.downloadGame(
                gameBinaryPlatform.file.bucket.name,
                gameBinaryPlatform.file.pathfilename,
                gamePathInstallLocation.value?.pathSystem,
                createDesktopShortcut.value,
                game.title,
                latestGameVersionAvailable.version,
                gameBinarySize.totalSize,
                game.id,
                user.id,
                files || gameManifestRemote.files,
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
 * Changer le chemin de téléchargement
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
 * Ajouter un répertoire de jeu pour le chemin d'installation en ce basant sur le nom du jeu
 * Exemple : C:\Users\user\Documents\seatyrants (on rajoute le nom du jeu)
 * @returns {Promise<void>}
 */
const addDirectoryGameForPathInstallLocation: () => Promise<void> = async (): Promise<void> => {
  const gameId: number | undefined = gameToDownload.value?.id
  if (gameId) {
    const game: GameModel = await GameService.getGameById(gameId)
    const systemInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()

    if (systemInfo && gamePathInstallLocation.value) {
      // Utiliser un séparateur de chemin basé sur le système d'exploitation
      const separator: string = systemInfo.os.toLowerCase() === 'windows' ? '\\' : '/'
      const fullPath: string = `${gamePathInstallLocation.value.pathSystem}${separator}${game.title}`

      gamePathInstallLocation.value = {
        pathSystem: fullPath,
      }
    }
  }
}

/**
 * Fermer la modal de réparation du jeu installé
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
 * Ouvrir la modal pour réparer le jeu installé
 * @param {GameModel} game - The game
 * @returns {Promise<void>} - The promise
 */
const openFixGameInstalledModal: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  closePlayGameNotFoundExecutableModal()

  gameToDownload.value = game

  let pathInstallLocationGame: string | undefined = undefined
  let launcherGetPath: boolean = true

  // Vérifier si le jeu est installé ou nécessite une mise à jour
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
 * Vérifier l'installation du jeu pour réparer les fichiers
 * @param {GameModel} game - The game
 * @returns {void}
 */
const verifyInstallationGame: (game: GameModel) => Promise<void> = async (game: GameModel): Promise<void> => {
  if (!gamePathInstallLocation.value) {
    return
  }

  // Récupérer le manifeste local du jeu par rapport au chemin d'installation du jeu
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

  // Récupérer les informations sur le système d'exploitation actuel
  const currentSystemOSInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
  if (!currentSystemOSInfo) {
    return
  }

  // Récupérer la plateforme du jeu qui correspond à l'OS du système actuel en rendant la comparaison insensible à la casse
  const gamePlatform: GamePlatformModel | undefined = game.gamePlatform.find(
    (gamePlatform: GamePlatformModel) => gamePlatform.name.toLowerCase() === currentSystemOSInfo.os.toLowerCase(),
  )

  // Si une plateforme correspondante est trouvée, procédez au téléchargement
  if (gamePlatform) {
    const gameBinaryPlatform: GameBinaryModel | undefined = game.gameBinary.find(
      (gameBinary: GameBinaryModel): boolean => gameBinary.game_platforms_id === gamePlatform.id,
    )

    if (gameBinaryPlatform) {
      // Récupérer la dernière version du jeu disponible
      const latestGameVersionAvailable: GameVersionModel | undefined =
        await GameVersionService.getLatestAvailableGameVersionByGameId(game.id)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!latestGameVersionAvailable) {
        return
      }

      // Récupérer le manifeste du jeu à partir du serveur
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

      // Récupérer la liste des fichiers à télécharger pour le jeu en comparant les manifestes locaux et distant
      const files: FileDetails[] = await TauriService.getFilesToDownload(
        gameManifestLocal,
        gameManifestRemote,
        gamePathInstallLocation.value.pathSystem,
      )
      if (files.length === 0) {
        if (user) {
          // Tout les fichiers était OK mais le path d'installation du jeu ne correspond pas à celui enregistré donc on le met à jour
          // et on recrée un GameInstalled avec le nouveau path d'installation du jeu
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
        // Dire avec succès qu'ont n'as bien récupérer le manifest_local.json par rapport au path d'installation du jeu
        // MAIS il y a des fichiers manquants ou des fichiers différents
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

/* WATCHERS */
/**
 * Watcher for search term
 * @param {string} newValue - The new value
 * @returns {void}
 */
watch(searchTerm, async (newValue: string): Promise<void> => {
  await gameLibraryStore.getLibraryGames(newValue)

  // Vérification après la recherche
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (newValue && (gameLibraryStore.libraryGamesPlatforms.length === 0 || !gameLibraryStore.libraryGamesPlatforms)) {
    gameInstalled.value = []
    gameNotInstalled.value = []
    gameNeedsUpdate.value = []
  } else {
    refreshLibrary()
  }
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
.launching-cursor {
  cursor: progress;
}
</style>
