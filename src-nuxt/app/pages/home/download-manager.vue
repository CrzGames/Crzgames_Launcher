<template>
  <section class="grid gap-4 px-4 py-5 pb-12 text-white relative">
    <!-- Section pour le logo et les éléments de navigation -->
    <div class="flex items-center justify-between">
      <!-- Boutons de navigation gauche / droite -->
      <NavigationPages class="mr-5" />
    </div>

    <!-- Titre principal de la page "Download Manager" -->
    <h1 class="font-serif text-xl font-semibold sm:text-2xl mt-5">Download Manager</h1>

    <!-- Diviseur -->
    <Divider class="mt-5" />

    <div v-if="isPageLoading" class="flex min-h-[320px] w-full items-center justify-center">
      <CrzSpinner />
    </div>

    <!-- Section affichant les téléchargements en cours -->
    <div v-if="!isPageLoading && activeDownloadGameList.length > 0" class="grid gap-4">
      <!-- Icone + Titre "Active Downloads" -->
      <div class="flex items-center gap-3">
        <CrzIcon
          name="download"
          mode="stroke"
          color="#fbbf24"
          view-box="0 0 24 24"
          class="w-6 h-6"
          :height="20"
          :width="20"
        />
        <h4 class="text-lg font-semibold text-white tracking-wide">Active Downloads</h4>
        <div class="flex-grow border-t border-gray-600"></div>
      </div>

      <!-- Conteneur pour les cards des téléchargements en cours -->
      <div class="grid grid-cols-auto-fit gap-6">
        <ActiveDownloadCard
          v-for="activeDownloadGame in activeDownloadGameList"
          :key="activeDownloadGame.gameId"
          :title="activeDownloadGame.gameTitle"
          :image-url="activeDownloadGame.gamePictureUrl"
          :is-playing="activeDownloadGame.isPlaying"
          :progress="activeDownloadGame.progress"
          :downloaded="bytesToSize(activeDownloadGame.totalDownloadedBytesNow || 0)"
          :total="bytesToSize(activeDownloadGame.totalSizeToDownload || activeDownloadGame.gameBinarySize)"
          :speed="activeDownloadGame.speed"
          :remaining-time="activeDownloadGame.remainingTime"
          :game-version="activeDownloadGame.gameVersion || ''"
          :has-error="!!activeDownloadGame.hasError"
          :error-message="activeDownloadGame.errorMessage || ''"
          :is-preparing-resume="!!activeDownloadGame.isPreparingResume"
          :game-id="activeDownloadGame.gameId"
          :path-install-location="activeDownloadGame.pathInstallLocation"
          @play="resumeGameDownload(activeDownloadGame)"
          @pause="pauseGameDownload(activeDownloadGame)"
          @cancel="openCancelDownloadModal(activeDownloadGame)"
        />
      </div>
    </div>

    <!-- Section affichant les téléchargements terminés -->
    <div v-if="!isPageLoading && completedDownloadGameList.length > 0" class="grid gap-4">
      <!-- Icone + Titre "Completed Downloads" -->
      <div class="flex items-center gap-3">
        <CrzIcon name="circle-check" view-box="0 0 512 512" color="#00ff84" :width="20" :height="20" />
        <h4 class="text-lg font-semibold text-white tracking-wide">Completed Downloads</h4>
        <div class="flex-grow border-t border-gray-600"></div>
      </div>

      <!-- Conteneur pour les cards des jeux terminés -->
      <div class="grid grid-cols-auto-fit gap-6">
        <CompleteDownloadCard
          v-for="completedDownloadGame in completedDownloadGameList"
          :key="completedDownloadGame.gameTitle"
          :title="completedDownloadGame.gameTitle"
          :image-url="completedDownloadGame.gamePictureUrl"
        />
      </div>
    </div>

    <!-- Message affiché quand il n'y a aucun téléchargement actif ou terminé -->
    <div
      v-if="!isPageLoading && !hasActiveOrCompletedDownloads"
      class="flex flex-col items-center justify-center w-full max-w-3xl mx-auto bg-[#141724] text-center p-6 rounded-xl"
    >
      <CrzIcon name="search" color="#6b7280" view-box="0 0 24 24" class="w-12 h-12 mb-4" />
      <h2 class="text-lg font-semibold text-white">No downloads are currently active or completed.</h2>
      <p class="text-sm text-gray-400 mt-2">
        Go to your library to start downloading a game or browse the list of available games to add to your library.
      </p>

      <CrzButton @click="goToPage('/home/browse')" class="mt-4"> Go to Browse </CrzButton>
      <CrzButton @click="goToPage('/home/library')" class="mt-4"> Go to My Library </CrzButton>
    </div>

    <!-- Modal de confirmation pour annuler un telechargement -->
    <CrzConfirmModal
      :show="isCancelDownloadModalVisible"
      title="Cancel Download"
      :message="cancelDownloadModalMessage"
      @update:show="onCancelDownloadModalVisibilityChange"
      @ok="confirmGameDownloadCancellation"
    />

    <CrzModal
      v-if="showCancelingDownloadModal"
      :show="showCancelingDownloadModal"
      :show-left-button="false"
      :show-right-button="false"
      bgClass="bg-blue-800"
      @update:show="keepCancelingDownloadModalOpen"
    >
      <div class="grid gap-8">
        <div class="flex flex-wrap gap-4">
          <img
            v-if="cancelingDownloadGame?.gamePictureUrl"
            class="h-14 w-14 rounded-lg object-cover"
            :src="cancelingDownloadGame.gamePictureUrl"
            :alt="cancelingDownloadGame?.gameTitle || 'Game'"
          />
          <div class="flex flex-col">
            <h2 class="text-base font-medium text-zinc-300">
              {{ cancelingDownloadGame?.gameTitle || 'Game' }}
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
            {{ cancelingDownloadProgressRemovedEntries }} / {{ cancelingDownloadProgressTotalEntries }} items removed ({{
              Math.round(cancelingDownloadProgressPercent)
            }}%)
          </p>
        </div>
      </div>
    </CrzModal>
  </section>
</template>

<script lang="ts" setup>
import type { Notyf } from 'notyf'
import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'
import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import NavigationPages from '~/components/navigations/NavigationPages.vue'
import Divider from '~/components/ui/Divider.vue'
import CrzButton from '~~/src-common/components/buttons/CrzButton.vue'
import CrzSpinner from '~~/src-common/components/loaders/CrzSpinner.vue'
import CrzIcon from '~~/src-common/components/ui/CrzIcon.vue'

import CrzConfirmModal from '#src-common/components/modals/CrzConfirmModal.vue'
import CrzModal from '#src-common/components/modals/CrzModal.vue'
import type GameBinaryModel from '#src-common/core/models/GameBinaryModel'
import type GameModel from '#src-common/core/models/GameModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'
import type { GameVersionModel } from '#src-common/core/models/GameVersionModel'
import type UserModel from '#src-common/core/models/UserModel'
import { GameService } from '#src-common/core/services/GameService'
import { GameVersionService } from '#src-common/core/services/GameVersionService'

import { TauriService } from '#src-core/services/TauriService'
import type { FileDetails, GameManifestLocal, GameManifestRemote, SystemOSInfo } from '#src-core/services/TauriService'
import { bytesToSize } from '#src-core/utils/bytesToSize'
import { createLogger } from '#src-core/utils/logger'
import type { Logger } from '#src-core/utils/logger'

import ActiveDownloadCard from '#src-nuxt/app/components/cards/ActiveDownloadCard.vue'
import CompleteDownloadCard from '#src-nuxt/app/components/cards/CompleteDownloadCard.vue'
import { useAuthStore } from '#src-nuxt/app/stores/auth.store'
import { useDownloadsStore } from '#src-nuxt/app/stores/downloads.store'
import type { ActiveDownloadGame, CompleteDownloadGame } from '#src-nuxt/app/stores/downloads.store'

type UninstallGameProgressEventPayload = {
  gameId?: number | null
  pathInstallLocation?: string
  removedEntries?: number
  totalEntries?: number
  progress?: number
  done?: boolean
}

/* PAGE METADATA */
/**
 * Definit les metadonnees de la page avec le layout, les middlewares et les transitions
 * - layout: definit le layout utilise pour la page
 * - middleware: impose l'authentification avant acces
 * - pageTransition: ajoute une animation de transition entre pages
 * - layoutTransition: ajoute une animation pour le changement de layout
 */
definePageMeta({
  layout: 'layout-home',
  middleware: ['auth', 'navigation'],
  pageTransition: { name: 'fade-scale', mode: 'out-in' },
  layoutTransition: { name: 'slide-up', mode: 'out-in' },
})

/* DATA */
/**
 * Instance de Notyf pour afficher des notifications a l'utilisateur
 * - Recuperee via useNuxtApp() pour integrer Notyf dans l'application Nuxt
 * @type {Notyf}
 */
const notyf: Notyf = useNuxtApp().$notyf

/**
 * Instance du logger pour tracer les evenements dans le gestionnaire de telechargements
 * - Utilise createLogger avec un contexte specifique au Download Manager
 * @type {Logger}
 */
const logger: Logger = createLogger('DownloadManager')

/**
 * Utilisateur actuellement connecte, extrait du store d'authentification
 * @type {UserModel}
 */
const currentAuthenticatedUser: UserModel = useAuthStore().user as UserModel // On sait que l'utilisateur est authentifié grâce au middleware

/* STORES */
/**
 * Store gerant les telechargements actifs et termines
 * - Retourne le resultat de useDownloadsStore pour gerer l'etat des telechargements
 * @type {ReturnType<typeof useDownloadsStore>}
 */
const downloadsStore: ReturnType<typeof useDownloadsStore> = useDownloadsStore()

/* REFS */
/**
 * Reference reactive au jeu selectionne pour une demande d'annulation de telechargement
 * - Utilisee pour stocker le jeu concerne par la modal d'annulation
 * - Initialisee a null, mise a jour lorsqu'un utilisateur demande l'annulation
 * @type {Ref<ActiveDownloadGame | null>}
 */
const selectedGameForDownloadCancellation: Ref<ActiveDownloadGame | null> = ref<ActiveDownloadGame | null>(null)

/**
 * Indicateur reactive pour controler la visibilite de la modal de confirmation d'annulation
 * - Vrai si la modal doit etre affichee, faux sinon
 * - Modifie par les evenements de la modal (ok, cancel, update:show)
 * @type {Ref<boolean>}
 */
const isCancelDownloadModalVisible: Ref<boolean> = ref<boolean>(false)
const isPageLoading: Ref<boolean> = ref<boolean>(true)
const pendingPlayPauseGameIds: Set<number> = new Set<number>()
const shouldResumeDownloadAfterCancelModalClose: Ref<boolean> = ref<boolean>(false)
const isConfirmingDownloadCancellation: Ref<boolean> = ref<boolean>(false)
const showCancelingDownloadModal: Ref<boolean> = ref<boolean>(false)
const cancelingDownloadGame: Ref<ActiveDownloadGame | null> = ref<ActiveDownloadGame | null>(null)
const cancelingDownloadPathInstallLocation: Ref<string> = ref<string>('')
const cancelingDownloadProgressRemovedEntries: Ref<number> = ref<number>(0)
const cancelingDownloadProgressTotalEntries: Ref<number> = ref<number>(0)
const cancelingDownloadProgressPercent: Ref<number> = ref<number>(0)
const unlistenUninstallGameProgress: Ref<UnlistenFn | null> = ref<UnlistenFn | null>(null)
const DOWNLOAD_MANAGER_IMAGES_PRELOAD_TIMEOUT_MS: number = 8000
const MIN_DOWNLOAD_MANAGER_SPINNER_MS: number = 250
const MIN_CANCELING_DOWNLOAD_MODAL_VISIBLE_MS: number = 2000

/* COMPUTED */
/**
 * Liste calculee des jeux en cours de telechargement actif
 * - Extrait les telechargements actifs du store pour affichage dans le template
 * - Met a jour automatiquement si le store change
 * @type {ComputedRef<ActiveDownloadGame[]>}
 * @returns {ActiveDownloadGame[]} Liste des jeux actuellement en cours de telechargement
 */
const activeDownloadGameList: ComputedRef<ActiveDownloadGame[]> = computed(
  (): ActiveDownloadGame[] => downloadsStore.activeDownloads,
)

/**
 * Liste calculee des jeux dont le telechargement est completement termine
 * - Extrait les telechargements termines du store pour affichage dans le template
 * - Met a jour automatiquement si le store change
 * @type {ComputedRef<CompleteDownloadGame[]>}
 * @returns {CompleteDownloadGame[]} Liste des jeux dont le telechargement est termine
 */
const completedDownloadGameList: ComputedRef<CompleteDownloadGame[]> = computed(
  (): CompleteDownloadGame[] => downloadsStore.completedDownloads,
)

/**
 * Message dynamique genere pour la modal de confirmation d'annulation de telechargement
 * - Construit un message demandant confirmation pour l'annulation du telechargement du jeu selectionne
 * - Utilise le titre du jeu si disponible, sinon un texte generique
 * @type {ComputedRef<string>}
 * @returns {string} Message de confirmation avec le titre du jeu selectionne ou un texte par defaut
 */
const cancelDownloadModalMessage: ComputedRef<string> = computed(
  (): string =>
    `Are you sure you want to cancel the download for ${selectedGameForDownloadCancellation.value?.gameTitle || 'this game'}?`,
)

/**
 * Indique s'il y a des téléchargements actifs ou terminés à afficher
 * @type {ComputedRef<boolean>}
 */
const hasActiveOrCompletedDownloads: ComputedRef<boolean> = computed(
  (): boolean => activeDownloadGameList.value.length > 0 || completedDownloadGameList.value.length > 0,
)

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

const resetCancelingDownloadProgress: () => void = (): void => {
  cancelingDownloadProgressRemovedEntries.value = 0
  cancelingDownloadProgressTotalEntries.value = 0
  cancelingDownloadProgressPercent.value = 0
}

const handleCancelingDownloadProgress: (payload: UninstallGameProgressEventPayload) => void = (
  payload: UninstallGameProgressEventPayload,
): void => {
  if (!showCancelingDownloadModal.value) {
    return
  }

  const selectedGameId: number | undefined = cancelingDownloadGame.value?.gameId
  const payloadGameId: number = normalizeProgressNumber(payload.gameId)
  if (selectedGameId && payloadGameId && payloadGameId !== selectedGameId) {
    return
  }

  const selectedInstallPath: string = cancelingDownloadPathInstallLocation.value
  const payloadInstallPath: string | undefined = payload.pathInstallLocation
  if (selectedInstallPath && payloadInstallPath && !areInstallPathsEqual(selectedInstallPath, payloadInstallPath)) {
    return
  }

  const totalEntries: number = Math.max(0, Math.floor(normalizeProgressNumber(payload.totalEntries)))
  const removedEntriesRaw: number = Math.max(0, Math.floor(normalizeProgressNumber(payload.removedEntries)))
  const removedEntries: number = totalEntries > 0 ? Math.min(removedEntriesRaw, totalEntries) : removedEntriesRaw

  cancelingDownloadProgressTotalEntries.value = totalEntries
  cancelingDownloadProgressRemovedEntries.value = removedEntries

  if (totalEntries > 0) {
    cancelingDownloadProgressPercent.value = clampPercentage((removedEntries / totalEntries) * 100)
  } else if (payload.done) {
    cancelingDownloadProgressPercent.value = 100
  } else {
    cancelingDownloadProgressPercent.value = clampPercentage(normalizeProgressNumber(payload.progress))
  }
}

const registerUninstallProgressListener: () => Promise<void> = async (): Promise<void> => {
  if (unlistenUninstallGameProgress.value) {
    return
  }

  try {
    unlistenUninstallGameProgress.value = await listen<UninstallGameProgressEventPayload>(
      'uninstall-game-progress',
      (event): void => {
        handleCancelingDownloadProgress(event.payload)
      },
    )
  } catch (error: unknown) {
    logger.error(
      `[Uninstall Progress] Failed to register listener: ${error instanceof Error ? error.message : String(error)}`,
      error as Error,
    )
  }
}

const unregisterUninstallProgressListener: () => void = (): void => {
  if (!unlistenUninstallGameProgress.value) {
    return
  }

  unlistenUninstallGameProgress.value()
  unlistenUninstallGameProgress.value = null
}

const preloadDownloadManagerCardsImages: () => Promise<void> = async (): Promise<void> => {
  const imageUrls: string[] = getDownloadManagerCardImageUrls()
  if (imageUrls.length === 0) {
    return
  }

  await Promise.race([
    Promise.all(imageUrls.map((url: string) => preloadDownloadManagerImage(url))),
    new Promise<void>((resolve) => setTimeout(resolve, DOWNLOAD_MANAGER_IMAGES_PRELOAD_TIMEOUT_MS)),
  ])
}

const getDownloadManagerCardImageUrls: () => string[] = (): string[] => {
  const urls: Set<string> = new Set<string>()

  for (const activeDownloadGame of activeDownloadGameList.value) {
    if (activeDownloadGame.gamePictureUrl) {
      urls.add(activeDownloadGame.gamePictureUrl)
    }
  }

  for (const completedDownloadGame of completedDownloadGameList.value) {
    if (completedDownloadGame.gamePictureUrl) {
      urls.add(completedDownloadGame.gamePictureUrl)
    }
  }

  return Array.from(urls)
}

const preloadDownloadManagerImage: (url: string) => Promise<void> = (url: string): Promise<void> => {
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
 * Normalise un titre de jeu pour les comparaisons.
 * @param {string} value - Titre brut.
 * @returns {string} - Titre normalise.
 */
const normalizeGameTitle: (value: string) => string = (value: string): string => value.trim().toLowerCase()

/**
 * Indique si un telechargement est dans la phase post-download (100%) avant completion finale.
 * @param {ActiveDownloadGame} game - Telechargement actif.
 * @returns {boolean} - True si les fichiers sont entierement telecharges.
 */
const isPostDownloadPhase: (game: ActiveDownloadGame) => boolean = (game: ActiveDownloadGame): boolean =>
  Math.round(game.progress) >= 100 && !game.hasError

/**
 * Attend la fin d'une operation play/pause en cours pour un jeu.
 * @param {number} gameId - Identifiant du jeu.
 * @param {number} timeoutMs - Duree maximale d'attente.
 * @returns {Promise<boolean>} - True si aucune operation concurrente n'est active.
 */
const waitForPlayPauseIdle: (gameId: number, timeoutMs?: number) => Promise<boolean> = async (
  gameId: number,
  timeoutMs: number = 3000,
): Promise<boolean> => {
  const startedAt: number = Date.now()

  while (pendingPlayPauseGameIds.has(gameId)) {
    if (Date.now() - startedAt >= timeoutMs) {
      logger.warn(`[Play/Pause Lock] Timeout while waiting lock release for gameId=${gameId}`)
      return false
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  return true
}

/**
 * Resolve game details for resume flow.
 * Uses gameId first, then falls back to title if local ids are stale.
 * @param {number} requestedGameId - Game id from active download state.
 * @param {string} fallbackGameTitle - Fallback game title from active download state.
 * @returns {Promise<GameModel>} - Resolved game model.
 */
const resolveGameDetailsForResume: (requestedGameId: number, fallbackGameTitle: string) => Promise<GameModel> = async (
  requestedGameId: number,
  fallbackGameTitle: string,
): Promise<GameModel> => {
  try {
    return await GameService.getGameById(requestedGameId)
  } catch (primaryError) {
    const searchTerm: string = fallbackGameTitle || String(requestedGameId)
    const gamesResponse: Awaited<ReturnType<typeof GameService.getAllGames>> = await GameService.getAllGames(searchTerm)
    const gamesByTitle: GameModel[] = Array.isArray(gamesResponse) ? gamesResponse : gamesResponse.data
    const normalizedFallbackTitle: string = normalizeGameTitle(fallbackGameTitle || '')

    const fallbackGame: GameModel | undefined =
      gamesByTitle.find((game: GameModel): boolean => normalizeGameTitle(game.title) === normalizedFallbackTitle) ||
      (gamesByTitle.length === 1 ? gamesByTitle[0] : undefined)

    if (!fallbackGame) {
      throw primaryError
    }

    logger.warn(
      `[Download Resume] Resolved stale gameId requested=${requestedGameId} title="${fallbackGameTitle}" fallback=${fallbackGame.id}`,
    )
    return fallbackGame
  }
}

/**
 * Calcule la taille totale d'un manifeste distant.
 * @param {GameManifestRemote} gameManifestRemote - Manifeste distant.
 * @returns {number} - Taille totale en octets.
 */
const getRemoteManifestTotalSize: (gameManifestRemote: GameManifestRemote) => number = (
  gameManifestRemote: GameManifestRemote,
): number => gameManifestRemote.files.reduce((totalSize: number, file: FileDetails): number => totalSize + file.size, 0)

/**
 * Construit un manifeste local cible base sur le manifeste distant.
 * Utilise pour verifier/reparer la reprise meme si manifest_local.json est absent/corrompu.
 * @param {string} pathInstallLocation - Chemin d'installation cible.
 * @param {GameModel} gameDataDetails - Donnees du jeu.
 * @param {string} latestGameVersion - Derniere version disponible.
 * @param {GameManifestRemote} gameManifestRemote - Manifeste distant.
 * @returns {GameManifestLocal} - Manifeste local synthetique.
 */
const buildExpectedLocalManifestForResume: (
  pathInstallLocation: string,
  gameDataDetails: GameModel,
  latestGameVersion: string,
  gameManifestRemote: GameManifestRemote,
) => GameManifestLocal = (
  pathInstallLocation: string,
  gameDataDetails: GameModel,
  latestGameVersion: string,
  gameManifestRemote: GameManifestRemote,
): GameManifestLocal => {
  const remoteManifestTotalSize: number = getRemoteManifestTotalSize(gameManifestRemote)

  return {
    pathInstallLocation: pathInstallLocation,
    gameId: gameDataDetails.id,
    gameTitle: gameDataDetails.title,
    gameBinarySize: remoteManifestTotalSize,
    version: latestGameVersion,
    files: gameManifestRemote.files,
  }
}

/**
 * Lit le manifest_local.json si possible sans interrompre la reprise en cas d'erreur.
 * @param {string} pathInstallLocation - Chemin d'installation cible.
 * @returns {Promise<GameManifestLocal | undefined>} - Manifeste local si lisible.
 */
const tryGetLocalManifestForResume: (pathInstallLocation: string) => Promise<GameManifestLocal | undefined> = async (
  pathInstallLocation: string,
): Promise<GameManifestLocal | undefined> => {
  try {
    return await TauriService.getContentLocalManifest(pathInstallLocation)
  } catch (error: unknown) {
    logger.warn(
      `[Download Resume] Local manifest unreadable at path=${pathInstallLocation}. Falling back to remote verification: ${error instanceof Error ? error.message : String(error)}`,
    )
    return undefined
  }
}

/**
 * Verifie si un manifeste local est compatible avec le jeu en cours de reprise.
 * @param {localManifest} localManifest - Manifeste local lu depuis le disque.
 * @param {gameDataDetails} gameDataDetails - Jeu cible.
 * @returns {boolean} - True si le manifeste correspond au jeu attendu.
 */
const isLocalManifestCompatibleForResume: (localManifest: GameManifestLocal, gameDataDetails: GameModel) => boolean = (
  localManifest: GameManifestLocal,
  gameDataDetails: GameModel,
): boolean => {
  const isGameIdMatching: boolean = localManifest.gameId === gameDataDetails.id
  const isTitleMatching: boolean = normalizeGameTitle(localManifest.gameTitle) === normalizeGameTitle(gameDataDetails.title)

  return isGameIdMatching || isTitleMatching
}

/* HOOKS */
/**
 * Hook execute au montage du composant pour initialiser les telechargements
 * - Charge les telechargements persistants si un utilisateur est connecte
 * @returns {Promise<void>} Promesse resolue une fois l'initialisation terminee
 */
onMounted(async (): Promise<void> => {
  const loadingStartAtMs: number = Date.now()
  isPageLoading.value = true

  try {
    await scrollToTop()
    await registerUninstallProgressListener()

    // Charge les telechargements persistants depuis le store pour l'utilisateur actuel
    await downloadsStore.loadActiveDownloadsPersisted(currentAuthenticatedUser)
    await preloadDownloadManagerCardsImages()

    // Log la reussite du chargement des telechargements
    logger.info(`[Component Mounting] Telechargements actifs charges avec succes`)
  } catch (error: unknown) {
    // Log une erreur si une exception survient pendant le chargement
    logger.error(`[Component Mounting] Echec du chargement des telechargements actifs`, error as Error)

    // Affiche une notification d'erreur a l'utilisateur
    notyf.error('Failed to load active downloads')
  } finally {
    const elapsedMs: number = Date.now() - loadingStartAtMs
    if (elapsedMs < MIN_DOWNLOAD_MANAGER_SPINNER_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_DOWNLOAD_MANAGER_SPINNER_MS - elapsedMs))
    }
    isPageLoading.value = false
  }
})

onBeforeUnmount((): void => {
  unregisterUninstallProgressListener()
})

/* METHODS */
/**
 * Redirige l'utilisateur vers la page de navigation des jeux
 * - Utilise la fonction navigateTo pour changer de page
 * @param {string} route - Route de destination pour la redirection
 * @returns {Promise<void>}
 */
const goToPage: (route: string) => Promise<void> = async (route: string): Promise<void> => {
  // Redirige l'utilisateur vers la page de navigation des jeux
  await navigateTo(route)
}

/**
 * Gere les changements de visibilite de la modal d'annulation.
 * - En cas de fermeture via croix/ESC/Cancel, reprend automatiquement le telechargement si besoin.
 * @param {boolean} show - Etat de visibilite de la modal.
 * @returns {void}
 */
const onCancelDownloadModalVisibilityChange: (show: boolean) => void = (show: boolean): void => {
  isCancelDownloadModalVisible.value = show

  if (show) return

  // L'evenement @ok est emis juste apres update:show=false.
  // On decale d'un microtick pour laisser confirmGameDownloadCancellation
  // marquer l'etat de confirmation et eviter une reprise parasite.
  queueMicrotask((): void => {
    if (isConfirmingDownloadCancellation.value) {
      return
    }
    void closeCancelDownloadModalAndMaybeResume()
  })
}

/**
 * Ferme la modal d'annulation et reprend le telechargement si la fermeture est annulee.
 * @returns {Promise<void>}
 */
const closeCancelDownloadModalAndMaybeResume: () => Promise<void> = async (): Promise<void> => {
  const selectedGame: ActiveDownloadGame | null = selectedGameForDownloadCancellation.value
  const shouldResumeDownload: boolean = shouldResumeDownloadAfterCancelModalClose.value

  isCancelDownloadModalVisible.value = false
  selectedGameForDownloadCancellation.value = null
  shouldResumeDownloadAfterCancelModalClose.value = false

  if (!selectedGame || !shouldResumeDownload) {
    return
  }

  const stillActiveGame: ActiveDownloadGame | undefined = activeDownloadGameList.value.find(
    (activeGame: ActiveDownloadGame): boolean => activeGame.gameId === selectedGame.gameId,
  )

  if (!stillActiveGame || isPostDownloadPhase(stillActiveGame) || stillActiveGame.isPlaying) {
    return
  }

  const isPlayPauseIdle: boolean = await waitForPlayPauseIdle(stillActiveGame.gameId)
  if (!isPlayPauseIdle || isConfirmingDownloadCancellation.value) {
    return
  }

  await resumeGameDownload(stillActiveGame)
}

const openCancelingDownloadModal: (gameToCancel: ActiveDownloadGame) => void = (
  gameToCancel: ActiveDownloadGame,
): void => {
  resetCancelingDownloadProgress()
  cancelingDownloadGame.value = gameToCancel
  cancelingDownloadPathInstallLocation.value = gameToCancel.pathInstallLocation || ''
  showCancelingDownloadModal.value = true
}

const closeCancelingDownloadModal: () => void = (): void => {
  showCancelingDownloadModal.value = false
  cancelingDownloadGame.value = null
  cancelingDownloadPathInstallLocation.value = ''
  resetCancelingDownloadProgress()
}

const keepCancelingDownloadModalOpen: () => void = (): void => {}

/**
 * Ouvre la modal de confirmation pour annuler le telechargement d'un jeu specifique
 * - Met a jour la reference du jeu selectionne et affiche la modal
 * @param {ActiveDownloadGame} gameToCancel - Jeu dont le telechargement doit etre annule
 * @returns {void}
 */
const openCancelDownloadModal: (gameToCancel: ActiveDownloadGame) => void = (
  gameToCancel: ActiveDownloadGame,
): void => {
  try {
    if (isPostDownloadPhase(gameToCancel)) {
      logger.debug(
        `[Cancel Modal] Ignored for gameId=${gameToCancel.gameId} title=${gameToCancel.gameTitle} because download is already at 100%`,
      )
      return
    }

    // Log l'action d'ouverture de la modal avec le titre du jeu
    logger.debug(`[Cancel Modal] Ouverture de la modal pour le jeu: ${gameToCancel.gameTitle}`)

    const wasPlayingBeforeModalOpen: boolean = !!gameToCancel.isPlaying

    // Met a jour la reference reactive avec le jeu selectionne pour l'annulation
    selectedGameForDownloadCancellation.value = gameToCancel
    shouldResumeDownloadAfterCancelModalClose.value = wasPlayingBeforeModalOpen

    // Definit l'indicateur de visibilite de la modal a true pour l'afficher
    isCancelDownloadModalVisible.value = true

    // Met le telechargement en pause en arriere-plan pour laisser le temps
    // de confirmer l'annulation sans que l'installation se termine entre-temps.
    if (wasPlayingBeforeModalOpen) {
      void (async (): Promise<void> => {
        const isPlayPauseIdle: boolean = await waitForPlayPauseIdle(gameToCancel.gameId)
        if (!isPlayPauseIdle) return

        const currentGameState: ActiveDownloadGame | undefined = activeDownloadGameList.value.find(
          (activeGame: ActiveDownloadGame): boolean => activeGame.gameId === gameToCancel.gameId,
        )
        if (!currentGameState) return
        if (!isCancelDownloadModalVisible.value) return
        if (selectedGameForDownloadCancellation.value?.gameId !== gameToCancel.gameId) return
        if (!currentGameState.isPlaying || isPostDownloadPhase(currentGameState)) return

        await pauseGameDownload(currentGameState)
      })()
    }
  } catch (error: unknown) {
    // Log une erreur si une exception survient lors de l'ouverture de la modal
    logger.error(`[Cancel Modal] Erreur lors de l'ouverture de la modal pour ${gameToCancel.gameTitle}`, error as Error)

    // Affiche une notification d'erreur a l'utilisateur
    notyf.error(`Failed to open cancel modal for ${gameToCancel.gameTitle}`)
  }
}

/**
 * Confirme l'annulation d'un telechargement de jeu en cours et met a jour l'etat
 * - Annule le telechargement via TauriService, supprime l'entree du store, et informe l'utilisateur
 * @returns {Promise<void>} Promesse resolue une fois l'annulation completee
 */
const confirmGameDownloadCancellation: () => Promise<void> = async (): Promise<void> => {
  isConfirmingDownloadCancellation.value = true
  shouldResumeDownloadAfterCancelModalClose.value = false
  let cancelingModalOpenedAt: number | null = null

  try {
    // Verifie si un jeu est selectionne pour l'annulation
    if (!selectedGameForDownloadCancellation.value) {
      // Log un avertissement si les conditions ne sont pas remplies
      logger.warn(`[Download Cancellation] Aucun jeu disponible pour l'annulation`)
      // Sort de la fonction si les conditions ne sont pas remplies
      return
    }

    // Recupere le jeu a annuler dans une constante pour eviter les repetitions
    const gameToCancel: ActiveDownloadGame = selectedGameForDownloadCancellation.value
    // Log l'action de confirmation de l'annulation
    logger.info(`[Download Cancellation] Confirmation de l'annulation pour: ${gameToCancel.gameTitle}`)
    openCancelingDownloadModal(gameToCancel)
    cancelingModalOpenedAt = Date.now()

    // Appelle TauriService pour annuler le telechargement avec l'ID du jeu et le chemin d'installation
    await TauriService.cancelDownloadGame(
      gameToCancel.gameId,
      gameToCancel.pathInstallLocation,
      currentAuthenticatedUser.id,
    )
    // Log la confirmation que Tauri a annule le telechargement
    logger.debug(`[Download Cancellation] Telechargement annule via Tauri pour: ${gameToCancel.gameTitle}`)

    // Supprime le telechargement actif du store avec l'ID du jeu et l'ID de l'utilisateur
    await downloadsStore.deleteActiveDownload(gameToCancel.gameId, currentAuthenticatedUser.id)
    // Log la suppression reussie du telechargement dans le store
    logger.info(`[Download Cancellation] Telechargement supprime du store pour: ${gameToCancel.gameTitle}`)

    // Affiche une notification de succes a l'utilisateur avec le titre du jeu
    notyf.success(`${gameToCancel.gameTitle} download canceled successfully`)
  } catch (error: unknown) {
    // Log une erreur si une exception survient pendant l'annulation
    logger.error(
      `[Download Cancellation] Echec de l'annulation pour ${selectedGameForDownloadCancellation.value?.gameTitle || 'inconnu'}`,
      error as Error,
    )
    // Affiche une notification d'erreur a l'utilisateur avec le titre du jeu ou un texte generique
    notyf.error(
      `Failed to cancel download for ${selectedGameForDownloadCancellation.value?.gameTitle || 'unknown game'}`,
    )
  } finally {
    if (cancelingModalOpenedAt !== null) {
      const elapsedMs: number = Date.now() - cancelingModalOpenedAt
      const remainingMs: number = Math.max(0, MIN_CANCELING_DOWNLOAD_MODAL_VISIBLE_MS - elapsedMs)
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingMs))
      }
    }
    closeCancelingDownloadModal()

    // Log la fin de l'operation, meme en cas d'erreur ou de succes
    logger.debug(`[Download Cancellation] Fermeture de la modal et reinitialisation de la selection`)
    // Masque la modal en definissant l'indicateur a false
    isCancelDownloadModalVisible.value = false
    // Reinitialise la reference du jeu selectionne a null
    selectedGameForDownloadCancellation.value = null
    shouldResumeDownloadAfterCancelModalClose.value = false
    isConfirmingDownloadCancellation.value = false
  }
}

/**
 * Reprend le telechargement d'un jeu qui etait en pause
 * - Verifie les manifests, plateformes, et versions avant de relancer le telechargement
 * @param {ActiveDownloadGame} gameToResumeDownload - Jeu dont le telechargement doit etre repris
 * @returns {Promise<void>} Promesse resolue une fois la reprise terminee
 */
const resumeGameDownload: (gameToResumeDownload: ActiveDownloadGame) => Promise<void> = async (
  gameToResumeDownload: ActiveDownloadGame,
): Promise<void> => {
  if (isPostDownloadPhase(gameToResumeDownload)) {
    logger.debug(
      `[Download Resume] Ignored for gameId=${gameToResumeDownload.gameId} title=${gameToResumeDownload.gameTitle} because download is already at 100%`,
    )
    return
  }

  const pendingGameId: number = gameToResumeDownload.gameId
  if (pendingPlayPauseGameIds.has(pendingGameId)) {
    return
  }
  pendingPlayPauseGameIds.add(pendingGameId)

  try {
    // Log l'initiation de la reprise du telechargement
    logger.info(`[Download Resume] Reprise du telechargement pour: ${gameToResumeDownload.gameTitle}`)
    gameToResumeDownload.isPreparingResume = true
    gameToResumeDownload.isPlaying = false
    gameToResumeDownload.hasError = false
    gameToResumeDownload.errorMessage = undefined
    gameToResumeDownload.speed = '0 B/s'
    gameToResumeDownload.remainingTime = 'Checking local files...'

    const resumeInstallPath: string = String(gameToResumeDownload.pathInstallLocation || '').trim()
    if (!resumeInstallPath) {
      throw new Error('Installation path is missing')
    }

    const installPathAccessResult = await TauriService.checkInstallPathWriteAccess(resumeInstallPath)
    if (!installPathAccessResult.isWritable) {
      throw new Error(
        `Access denied for install path. Select another folder or relaunch launcher as administrator. (${resumeInstallPath})`,
      )
    }

    // Recupere les informations du systeme d'exploitation actuel
    const currentSystemOSInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
    // Verifie si les informations du systeme ont ete recuperees
    if (!currentSystemOSInfo) {
      // Log une erreur si la detection du systeme echoue
      logger.error(`[Download Resume] Echec de la detection du systeme d'exploitation`)
      // Lance une exception pour indiquer l'echec de la detection
      throw new Error('Failed to detect OS')
    }
    // Log les informations du systeme detecte
    logger.debug(`[Download Resume] Systeme d'exploitation detecte: ${currentSystemOSInfo.os}`)

    // Recupere les donnees detaillees du jeu a partir de son ID
    const gameDataDetails: GameModel = await resolveGameDetailsForResume(
      gameToResumeDownload.gameId,
      gameToResumeDownload.gameTitle,
    )
    // Log la recuperation reussie des donnees du jeu
    logger.debug(`[Download Resume] Donnees du jeu recuperees pour l'ID: ${gameDataDetails.id}`)

    // Recherche une plateforme compatible dans les donnees du jeu en comparant avec le systeme actuel
    const compatiblePlatform: GamePlatformModel | undefined = gameDataDetails.gamePlatform.find(
      (platform: GamePlatformModel): boolean => platform.name.toLowerCase() === currentSystemOSInfo.os.toLowerCase(),
    )
    // Verifie si une plateforme compatible a ete trouvee
    if (!compatiblePlatform) {
      // Log une erreur si aucune plateforme compatible n'est trouvee
      logger.error(`[Download Resume] Aucune plateforme compatible trouvee pour ${gameDataDetails.title}`)
      // Lance une exception pour indiquer l'absence de plateforme compatible
      throw new Error('No compatible platform found')
    }
    // Log la plateforme compatible trouvee
    logger.debug(`[Download Resume] Plateforme compatible trouvee: ${compatiblePlatform.name}`)

    // Recherche le binaire correspondant a la plateforme compatible dans les donnees du jeu
    const gameBinaryForPlatform: GameBinaryModel | undefined = gameDataDetails.gameBinary.find(
      (binary: GameBinaryModel): boolean => binary.gamePlatform.id === compatiblePlatform.id,
    )
    // Verifie si un binaire a ete trouve pour la plateforme
    if (!gameBinaryForPlatform) {
      // Log une erreur si aucun binaire n'est trouve
      logger.error(`[Download Resume] Aucun binaire trouve pour la plateforme ${compatiblePlatform.name}`)
      // Lance une exception pour indiquer l'absence de binaire
      throw new Error('No binary found for platform')
    }
    // Log la recuperation reussie du binaire
    logger.debug(`[Download Resume] Binaire du jeu recupere avec succes`)

    // Recupere la derniere version disponible du jeu a partir de son ID
    const latestGameVersion: GameVersionModel = await GameVersionService.getLatestAvailableGameVersionByGameId(
      gameDataDetails.id,
    )
    gameToResumeDownload.gameVersion = latestGameVersion.version
    // Log la version disponible recuperee
    logger.debug(`[Download Resume] Derniere version disponible: ${latestGameVersion.version}`)

    // Construit le chemin complet du fichier manifeste distant en combinant chemin, version et architecture
    const fullPathFilename: string = `${gameBinaryForPlatform.file.pathfilename}${latestGameVersion.version}/${currentSystemOSInfo.architecture}/`
    // Recupere le manifeste distant depuis le serveur S3
    const gameManifestRemote: GameManifestRemote | undefined = await TauriService.downloadGameManifestRemote(
      gameBinaryForPlatform.file.bucket.name,
      fullPathFilename,
    )
    // Verifie si le manifeste distant a ete recupere
    if (!gameManifestRemote) {
      // Log une erreur si le manifeste distant est introuvable
      logger.error(`[Download Resume] Manifeste distant introuvable pour ${gameDataDetails.title}`)
      // Lance une exception pour indiquer l'absence du manifeste distant
      throw new Error('Remote manifest not found')
    }
    // Log la recuperation reussie du manifeste distant
    logger.debug(`[Download Resume] Manifeste distant telecharge avec succes`)

    const remoteManifestTotalSize: number = getRemoteManifestTotalSize(gameManifestRemote)
    const expectedLocalManifestForResume: GameManifestLocal = buildExpectedLocalManifestForResume(
      resumeInstallPath,
      gameDataDetails,
      latestGameVersion.version,
      gameManifestRemote,
    )

    const localManifestForResume: GameManifestLocal | undefined = await tryGetLocalManifestForResume(resumeInstallPath)
    let filesToDownloadForGame: FileDetails[] = []
    if (localManifestForResume && isLocalManifestCompatibleForResume(localManifestForResume, gameDataDetails)) {
      filesToDownloadForGame = await TauriService.getFilesToDownload(
        localManifestForResume,
        gameManifestRemote,
        resumeInstallPath,
      )
    } else {
      if (localManifestForResume) {
        logger.warn(
          `[Download Resume] Local manifest mismatch at path=${resumeInstallPath}. expectedGameId=${gameDataDetails.id} localGameId=${localManifestForResume.gameId} expectedTitle="${gameDataDetails.title}" localTitle="${localManifestForResume.gameTitle}". Falling back to remote verification.`,
        )
      }

      const hasAnyLocalFileInDirectory: boolean = await TauriService.hasAnyFileInDirectory(resumeInstallPath)
      filesToDownloadForGame = hasAnyLocalFileInDirectory
        ? await TauriService.getMissingFiles(resumeInstallPath, expectedLocalManifestForResume)
        : gameManifestRemote.files
    }

    // Log le nombre de fichiers identifies pour le telechargement
    logger.debug(`[Download Resume] Nombre de fichiers a telecharger: ${filesToDownloadForGame.length}`)
    const totalSizeToDownloadForResume: number = filesToDownloadForGame.reduce(
      (totalSize: number, file: FileDetails): number => totalSize + file.size,
      0,
    )

    // Garder l'etat "Checking local files..." visible jusqu'au premier event
    // de progression reelle pour eviter un clignotement "Calculating... / 0 Byte".
    gameToResumeDownload.gameBinarySize = remoteManifestTotalSize || gameToResumeDownload.gameBinarySize
    gameToResumeDownload.hasError = false
    gameToResumeDownload.errorMessage = undefined

    logger.info(
      `[Download Resume] Resume checks completed for ${gameDataDetails.title}. filesToDownload=${filesToDownloadForGame.length} bytesToDownload=${totalSizeToDownloadForResume}. Waiting first progress event before switching UI state.`,
    )

    // Lance le telechargement du jeu avec toutes les informations necessaires
    await TauriService.downloadGame(
      gameBinaryForPlatform.file.bucket.name, // Nom du bucket S3 contenant les fichiers
      gameBinaryForPlatform.file.pathfilename, // Chemin du fichier dans le bucket
      resumeInstallPath, // Chemin local ou les fichiers seront installes
      false, // Indicateur pour la creation d'un raccourci bureau (non implemente pour l'instant)
      gameDataDetails.title, // Titre du jeu pour identification
      latestGameVersion.version, // Version du jeu a telecharger
      remoteManifestTotalSize || gameToResumeDownload.gameBinarySize, // Taille totale du binaire du jeu
      gameDataDetails.id, // ID unique du jeu
      currentAuthenticatedUser.id, // ID de l'utilisateur connecte
      filesToDownloadForGame, // Liste des fichiers a telecharger
      gameManifestRemote, // Manifeste distant pour verification
      {
        navigateToDownloadManager: false,
        systemOSInfo: currentSystemOSInfo,
      },
    )
    // Log la reussite de la reprise du telechargement
    logger.info(`[Download Resume] Telechargement repris avec succes pour ${gameDataDetails.title}`)
  } catch (error: unknown) {
    // Log une erreur si une exception survient pendant la reprise
    logger.error(`[Download Resume] Echec de la reprise pour ${gameToResumeDownload.gameTitle}`, error as Error)
    // Remet le telechargement en pause en cas d'echec
    gameToResumeDownload.isPreparingResume = false
    gameToResumeDownload.isPlaying = false
    // Affiche une notification d'erreur a l'utilisateur
    const errorMessage: string = error instanceof Error ? error.message : String(error)
    notyf.error(`Failed to resume download for ${gameToResumeDownload.gameTitle}`)
    logger.error(`[Download Resume] Reason: ${errorMessage}`)
  } finally {
    pendingPlayPauseGameIds.delete(pendingGameId)
  }
}

/**
 * Met en pause le telechargement actif d'un jeu specifique
 * - Modifie l'etat isPlaying pour indiquer une pause
 * @param {ActiveDownloadGame} gameToPauseDownload - Jeu dont le telechargement doit etre mis en pause
 * @returns {void}
 */
const pauseGameDownload: (gameToPauseDownload: ActiveDownloadGame) => Promise<void> = async (
  gameToPauseDownload: ActiveDownloadGame,
): Promise<void> => {
  if (isPostDownloadPhase(gameToPauseDownload)) {
    logger.debug(
      `[Download Pause] Ignored for gameId=${gameToPauseDownload.gameId} title=${gameToPauseDownload.gameTitle} because download is already at 100%`,
    )
    return
  }

  if (pendingPlayPauseGameIds.has(gameToPauseDownload.gameId)) {
    return
  }
  pendingPlayPauseGameIds.add(gameToPauseDownload.gameId)

  try {
    // Log l'action de mise en pause du telechargement
    logger.info(`[Download Pause] Mise en pause pour: ${gameToPauseDownload.gameTitle}`)
    await TauriService.pauseDownloadGame(gameToPauseDownload.gameId)
    // Modifie l'etat du telechargement pour le mettre en pause
    gameToPauseDownload.isPlaying = false
  } catch (error: unknown) {
    // Log une erreur si une exception survient pendant la mise en pause
    logger.error(`[Download Pause] Echec de la mise en pause pour ${gameToPauseDownload.gameTitle}`, error as Error)
    // Affiche une notification d'erreur a l'utilisateur
    notyf.error(`Failed to pause download for ${gameToPauseDownload.gameTitle}`)
  } finally {
    pendingPlayPauseGameIds.delete(gameToPauseDownload.gameId)
  }
}

/**
 * Défilement vers le haut de la page avec un effet de défilement doux.
 * @returns {Promise<void>}
 */
const scrollToTop: () => Promise<void> = async (): Promise<void> => {
  await nextTick()

  // Trouver le conteneur scrollable défini dans layout-home.vue
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
</script>

<style lang="scss" scoped>
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
