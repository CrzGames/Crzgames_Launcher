<template>
  <section class="grid gap-4 px-4 py-5 pb-12 text-white">
    <!-- Titre de la page -->
    <h1 class="font-serif text-xl font-semibold sm:text-2xl">Download Manager</h1>

    <!-- Aucun téléchargement en cours ou terminé, on affiche cela quand il n'y a pas de téléchargement en cours ou terminé -->
    <p
      v-if="activeDownloadGames.length <= 0 && completeDownloadGames.length <= 0"
      class="text-center text-base font-semibold text-gray-400 md:text-xl"
    >
      No downloads are currently active or completed. <br />
      Browse games to start downloading !
    </p>

    <!-- Téléchargements en cours -->
    <div v-if="activeDownloadGames && activeDownloadGames.length > 0" class="mb-20 grid gap-4">
      <h4 class="font-serif text-sm font-medium">Active download</h4>

      <ActiveDownloadCard
        v-for="game in activeDownloadGames"
        :key="game.gameId"
        :title="game.gameTitle"
        :imageUrl="game.gamePictureUrl"
        :isPlaying="game.isPlaying"
        :progress="game.progress"
        :downloaded="bytesToSize(game.totalDownloadedBytesNow || 0)"
        :total="bytesToSize(game.gameBinarySize)"
        :speed="game.speed"
        :remainingTime="game.remainingTime"
        :gameId="game.gameId"
        :pathInstallLocation="game.pathInstallLocation"
        @play="resumeDownload(game)"
        @pause="pauseDownload(game)"
        @cancel="openModalCancelDownload(game)"
      />
    </div>

    <!-- Téléchargements terminés -->
    <div v-if="completeDownloadGames && completeDownloadGames.length > 0" class="grid gap-4">
      <h4 class="font-serif text-sm font-medium">Complete download</h4>

      <div class="grid gap-4">
        <CompleteDownloadCard
          v-for="game in completeDownloadGames"
          :key="game.gameTitle"
          :title="game.gameTitle"
          :imageUrl="game.gamePictureUrl"
        />
      </div>
    </div>

    <!-- Modal d'annulation de téléchargement d'un jeu en cours de téléchargement -->
    <CrzConfirmModal
      :show="showCancelDownloadModal"
      @update:show="showCancelDownloadModal = $event"
      @cancel="showCancelDownloadModal = false"
      @ok="confirmCancelDownload"
      title="Cancel Download"
      :message="`Are you sure you want to cancel the download for ${gameCurrentCancelDownloadModal?.gameTitle} ?`"
    />
  </section>
</template>

<script lang="ts" setup>
import type { ComputedRef, Ref } from 'vue'
import { ref } from 'vue'

import CrzConfirmModal from '#src-common/components/modals/CrzConfirmModal.vue'
import type GameBinaryModel from '#src-common/core/models/GameBinaryModel'
import type GameModel from '#src-common/core/models/GameModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'
import type { GameVersionModel } from '#src-common/core/models/GameVersionModel'
import type UserModel from '#src-common/core/models/UserModel'
import { GameService } from '#src-common/core/services/GameService'
import { GameVersionService } from '#src-common/core/services/GameVersionService'

import { TauriService } from '#src-core/services/TauriService'
import type { FileDetails } from '#src-core/services/TauriService'
import type { GameManifestLocal } from '#src-core/services/TauriService'
import type { GameManifestRemote } from '#src-core/services/TauriService'
import type { SystemOSInfo } from '#src-core/services/TauriService'
import { bytesToSize } from '#src-core/utils/bytesToSize'

import ActiveDownloadCard from '#src-nuxt/components/cards/ActiveDownloadCard.vue'
import CompleteDownloadCard from '#src-nuxt/components/cards/CompleteDownloadCard.vue'
import { useAuthStore } from '#src-nuxt/stores/auth.store'
import type { ActiveDownloadGame, CompleteDownloadGame } from '#src-nuxt/stores/downloads.store'
import { useDownloadsStore } from '#src-nuxt/stores/downloads.store'

const { $notyf } = useNuxtApp()

/* LAYOUT - MIDDLEWARE - TRANSITIONS */
definePageMeta({
  layout: 'layout-home',
  middleware: ['auth'],
  pageTransition: {
    name: 'fade-scale',
    mode: 'out-in',
  },
  layoutTransition: {
    name: 'slide-up',
    mode: 'out-in',
  },
})

/* DATA */
const user: UserModel | undefined = useAuthStore().user

/* STORES */
const downloadsStore: any = useDownloadsStore()

/* REFS */
/**
 * C'est le jeu actuel pour lequel l'utilisateur souhaite annuler le téléchargement
 * @type {Ref<ActiveDownloadGame | null>}
 */
const gameCurrentCancelDownloadModal: Ref<ActiveDownloadGame | null> = ref(null)
/**
 * Permet de savoir si la modal d'annulation de téléchargement doit être affichée
 * @type {Ref<boolean>}
 */
const showCancelDownloadModal: Ref<boolean> = ref(false)

/**
 * C'est la liste des jeux en cours de téléchargement
 * @type {ComputedRef<ActiveDownloadGame[]>}
 */
const activeDownloadGames: ComputedRef<ActiveDownloadGame[]> = computed(() => downloadsStore.activeDownloads)

/**
 * C'est la liste des jeux dont le téléchargement est terminé
 * @type {ComputedRef<CompleteDownloadGame[]>}
 */
const completeDownloadGames: ComputedRef<CompleteDownloadGame[]> = computed(() => downloadsStore.completedDownloads)

/* HOOKS */
/**
 * On mounted
 * @returns {Promise<void>}
 */
onMounted(async (): Promise<void> => {
  if (user) {
    await downloadsStore.loadActiveDownloadsPersisted(user)
  }
})

/* METHODS */
/**
 * Permet d'ouvrir la modal d'annulation de téléchargement d'un jeu en cours de téléchargement
 * @param {ActiveDownloadGame} game - The game
 * @returns {void}
 */
const openModalCancelDownload: (game: ActiveDownloadGame) => void = (game: ActiveDownloadGame): void => {
  gameCurrentCancelDownloadModal.value = game
  showCancelDownloadModal.value = true
}

/**
 * C'est lorsque l'utilisateur confirme l'annulation du téléchargement d'un jeu en cours,
 * il est supprimé de la liste des téléchargements actifs et le téléchargement est annulé
 * @returns {void}
 */
const confirmCancelDownload: () => Promise<void> = async (): Promise<void> => {
  if (gameCurrentCancelDownloadModal.value && user) {
    await TauriService.cancelDownloadGame(
      gameCurrentCancelDownloadModal.value.gameId,
      gameCurrentCancelDownloadModal.value.pathInstallLocation,
    )
    await downloadsStore.deleteActiveDownload(gameCurrentCancelDownloadModal.value.gameId, user.id)
    $notyf.success(`${gameCurrentCancelDownloadModal.value.gameTitle} game download canceled successfully`)
  }
  showCancelDownloadModal.value = false
}

/**
 * Permet de reprendre le téléchargement d'un jeu en pause
 * @param {ActiveDownloadGame} gameActiveDownload - The game
 * @returns {Promise<void>}
 */
const resumeDownload: (gameActiveDownload: ActiveDownloadGame) => Promise<void> = async (
  gameActiveDownload: ActiveDownloadGame,
): Promise<void> => {
  // Récupérer le manifeste local du jeu
  const gameManifestLocal: GameManifestLocal | undefined = await TauriService.getContentLocalManifest(
    gameActiveDownload.pathInstallLocation,
  )
  if (!gameManifestLocal) {
    return
  }

  // Récupérer les informations sur le système d'exploitation actuel
  const currentSystemOSInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
  if (!currentSystemOSInfo) {
    return
  }

  // Récupérer le jeu
  const game: GameModel = await GameService.getGameById(gameActiveDownload.gameId)

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
        gameManifestLocal.pathInstallLocation,
      )

      // Télécharger le jeu
      if (user) {
        gameActiveDownload.isPlaying = true
        await TauriService.downloadGame(
          gameBinaryPlatform.file.bucket.name,
          gameBinaryPlatform.file.pathfilename,
          gameManifestLocal.pathInstallLocation,
          false, // TODO: Il faut l'ajouter au préalable dans le manifest_local.json avant
          game.title,
          latestGameVersionAvailable.version,
          gameManifestLocal.gameBinarySize,
          game.id,
          user.id,
          files,
          gameManifestRemote,
        )
      }
    }
  }
}

/**
 * Permet de mettre en pause le téléchargement d'un jeu
 * @param {ActiveDownloadGame} game - The game
 * @returns {void}
 */
const pauseDownload: (game: ActiveDownloadGame) => void = (game: ActiveDownloadGame): void => {
  game.isPlaying = false
}
</script>
