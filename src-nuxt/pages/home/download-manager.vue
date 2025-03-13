<template>
  <section class="grid gap-4 px-4 py-5 pb-12 text-white relative">
    <!-- Section pour le logo et les éléments de navigation -->
    <div class="flex items-center justify-between">
      <!-- Boutons de navigation gauche / droite -->
      <NavigationPages class="mr-5" />

      <!-- Logo CrzGames (déplacé en position absolue) -->
      <div class="relative w-full">
        <img
          src="/images/logo_fond_transparent_whitout_text.png"
          alt="CrzGames Logo"
          class="w-20 h-20 object-contain absolute top-0 right-0 mt-2 mr-2 z-10"
        />
      </div>
    </div>

    <!-- Titre principal de la page "Download Manager" -->
    <h1 class="font-serif text-xl font-semibold sm:text-2xl mt-5">Download Manager</h1>

    <!-- Diviseur -->
    <Divider class="mt-5" />

    <!-- Section affichant les téléchargements en cours -->
    <div v-if="activeDownloadGameList.length > 0" class="grid gap-4">
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
          :total="bytesToSize(activeDownloadGame.gameBinarySize)"
          :speed="activeDownloadGame.speed"
          :remaining-time="activeDownloadGame.remainingTime"
          :game-id="activeDownloadGame.gameId"
          :path-install-location="activeDownloadGame.pathInstallLocation"
          @play="resumeGameDownload(activeDownloadGame)"
          @pause="pauseGameDownload(activeDownloadGame)"
          @cancel="openCancelDownloadModal(activeDownloadGame)"
        />
      </div>
    </div>

    <!-- Section affichant les téléchargements terminés -->
    <div v-if="completedDownloadGameList.length > 0" class="grid gap-4">
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
      v-if="!hasActiveOrCompletedDownloads"
      class="flex flex-col items-center justify-center w-full max-w-3xl mx-auto bg-[#141724] text-center p-6 rounded-xl"
    >
      <CrzIcon name="search" color="#6b7280" view-box="0 0 24 24" class="w-12 h-12 mb-4" />
      <h2 class="text-lg font-semibold text-white">No downloads are currently active or completed.</h2>
      <p class="text-sm text-gray-400 mt-2">
        Go to your library to start downloading a game or browse the list of available games to add to your library.
      </p>

      <CrzButton @click="goToPage('/home/browse')" class="mt-4"> Browse all games </CrzButton>
      <CrzButton @click="goToPage('/home/library')" class="mt-4"> Go to my library </CrzButton>
    </div>

    <!-- Modal de confirmation pour annuler un telechargement -->
    <CrzConfirmModal
      :show="isCancelDownloadModalVisible"
      title="Cancel Download"
      :message="cancelDownloadModalMessage"
      @update:show="isCancelDownloadModalVisible = $event"
      @cancel="isCancelDownloadModalVisible = false"
      @ok="confirmGameDownloadCancellation"
    />
  </section>
</template>

<script lang="ts" setup>
import type { Notyf } from 'notyf'
import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import NavigationPages from '~/components/navigations/NavigationPages.vue'
import Divider from '~/components/ui/Divider.vue'
import CrzButton from '~~/src-common/components/buttons/CrzButton.vue'
import CrzIcon from '~~/src-common/components/ui/CrzIcon.vue'

import CrzConfirmModal from '#src-common/components/modals/CrzConfirmModal.vue'
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

import ActiveDownloadCard from '#src-nuxt/components/cards/ActiveDownloadCard.vue'
import CompleteDownloadCard from '#src-nuxt/components/cards/CompleteDownloadCard.vue'
import { useAuthStore } from '#src-nuxt/stores/auth.store'
import { useDownloadsStore } from '#src-nuxt/stores/downloads.store'
import type { ActiveDownloadGame, CompleteDownloadGame } from '#src-nuxt/stores/downloads.store'

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

/* HOOKS */
/**
 * Hook execute au montage du composant pour initialiser les telechargements
 * - Charge les telechargements persistants si un utilisateur est connecte
 * @returns {Promise<void>} Promesse resolue une fois l'initialisation terminee
 */
onMounted(async (): Promise<void> => {
  try {
    // Charge les telechargements persistants depuis le store pour l'utilisateur actuel
    await downloadsStore.loadActiveDownloadsPersisted(currentAuthenticatedUser)

    // Log la reussite du chargement des telechargements
    logger.info(`[Component Mounting] Telechargements actifs charges avec succes`)
  } catch (error: unknown) {
    // Log une erreur si une exception survient pendant le chargement
    logger.error(`[Component Mounting] Echec du chargement des telechargements actifs`, error as Error)

    // Affiche une notification d'erreur a l'utilisateur
    notyf.error('Failed to load active downloads')
  }
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
 * Ouvre la modal de confirmation pour annuler le telechargement d'un jeu specifique
 * - Met a jour la reference du jeu selectionne et affiche la modal
 * @param {ActiveDownloadGame} gameToCancel - Jeu dont le telechargement doit etre annule
 * @returns {void}
 */
const openCancelDownloadModal: (gameToCancel: ActiveDownloadGame) => void = (
  gameToCancel: ActiveDownloadGame,
): void => {
  try {
    // Log l'action d'ouverture de la modal avec le titre du jeu
    logger.debug(`[Cancel Modal] Ouverture de la modal pour le jeu: ${gameToCancel.gameTitle}`)

    // Met a jour la reference reactive avec le jeu selectionne pour l'annulation
    selectedGameForDownloadCancellation.value = gameToCancel

    // Definit l'indicateur de visibilite de la modal a true pour l'afficher
    isCancelDownloadModalVisible.value = true
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

    // Appelle TauriService pour annuler le telechargement avec l'ID du jeu et le chemin d'installation
    await TauriService.cancelDownloadGame(gameToCancel.gameId, gameToCancel.pathInstallLocation)
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
    // Log la fin de l'operation, meme en cas d'erreur ou de succes
    logger.debug(`[Download Cancellation] Fermeture de la modal et reinitialisation de la selection`)
    // Masque la modal en definissant l'indicateur a false
    isCancelDownloadModalVisible.value = false
    // Reinitialise la reference du jeu selectionne a null
    selectedGameForDownloadCancellation.value = null
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
  try {
    // Log l'initiation de la reprise du telechargement
    logger.info(`[Download Resume] Reprise du telechargement pour: ${gameToResumeDownload.gameTitle}`)

    // Recupere le manifeste local du jeu a partir de son chemin d'installation
    const gameManifestLocal: GameManifestLocal | undefined = await TauriService.getContentLocalManifest(
      gameToResumeDownload.pathInstallLocation,
    )
    // Verifie si le manifeste local a ete recupere avec succes
    if (!gameManifestLocal) {
      // Log une erreur si le manifeste local est introuvable
      logger.error(`[Download Resume] Manifeste local introuvable pour ${gameToResumeDownload.gameTitle}`)
      // Lance une exception pour indiquer l'absence du manifeste local
      throw new Error('Local manifest not found')
    }
    // Log la recuperation reussie du manifeste local
    logger.debug(`[Download Resume] Manifeste local recupere avec succes pour ${gameToResumeDownload.gameTitle}`)

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
    const gameDataDetails: GameModel = await GameService.getGameById(gameToResumeDownload.gameId)
    // Log la recuperation reussie des donnees du jeu
    logger.debug(`[Download Resume] Donnees du jeu recuperees pour l'ID: ${gameToResumeDownload.gameId}`)

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
      (binary: GameBinaryModel): boolean => binary.game_platforms_id === compatiblePlatform.id,
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

    // Calcule les fichiers necessaires au telechargement en comparant les manifests local et distant
    const filesToDownloadForGame: FileDetails[] = await TauriService.getFilesToDownload(
      gameManifestLocal,
      gameManifestRemote,
      gameManifestLocal.pathInstallLocation,
    )
    // Log le nombre de fichiers identifies pour le telechargement
    logger.debug(`[Download Resume] Nombre de fichiers a telecharger: ${filesToDownloadForGame.length}`)

    // Marque le telechargement comme actif en modifiant l'etat isPlaying
    gameToResumeDownload.isPlaying = true
    // Log la mise a jour de l'etat du telechargement
    logger.info(`[Download Resume] Telechargement marque comme actif pour ${gameDataDetails.title}`)

    // Lance le telechargement du jeu avec toutes les informations necessaires
    await TauriService.downloadGame(
      gameBinaryForPlatform.file.bucket.name, // Nom du bucket S3 contenant les fichiers
      gameBinaryForPlatform.file.pathfilename, // Chemin du fichier dans le bucket
      gameManifestLocal.pathInstallLocation, // Chemin local ou les fichiers seront installes
      false, // Indicateur pour la creation d'un raccourci bureau (non implemente pour l'instant)
      gameDataDetails.title, // Titre du jeu pour identification
      latestGameVersion.version, // Version du jeu a telecharger
      gameManifestLocal.gameBinarySize, // Taille totale du binaire du jeu
      gameDataDetails.id, // ID unique du jeu
      currentAuthenticatedUser.id, // ID de l'utilisateur connecte
      filesToDownloadForGame, // Liste des fichiers a telecharger
      gameManifestRemote, // Manifeste distant pour verification
    )
    // Log la reussite de la reprise du telechargement
    logger.info(`[Download Resume] Telechargement repris avec succes pour ${gameDataDetails.title}`)
  } catch (error: unknown) {
    // Log une erreur si une exception survient pendant la reprise
    logger.error(`[Download Resume] Echec de la reprise pour ${gameToResumeDownload.gameTitle}`, error as Error)
    // Remet le telechargement en pause en cas d'echec
    gameToResumeDownload.isPlaying = false
    // Affiche une notification d'erreur a l'utilisateur
    notyf.error(`Failed to resume download for ${gameToResumeDownload.gameTitle}`)
  }
}

/**
 * Met en pause le telechargement actif d'un jeu specifique
 * - Modifie l'etat isPlaying pour indiquer une pause
 * @param {ActiveDownloadGame} gameToPauseDownload - Jeu dont le telechargement doit etre mis en pause
 * @returns {void}
 */
const pauseGameDownload: (gameToPauseDownload: ActiveDownloadGame) => void = (
  gameToPauseDownload: ActiveDownloadGame,
): void => {
  try {
    // Log l'action de mise en pause du telechargement
    logger.info(`[Download Pause] Mise en pause pour: ${gameToPauseDownload.gameTitle}`)
    // Modifie l'etat du telechargement pour le mettre en pause
    gameToPauseDownload.isPlaying = false
  } catch (error: unknown) {
    // Log une erreur si une exception survient pendant la mise en pause
    logger.error(`[Download Pause] Echec de la mise en pause pour ${gameToPauseDownload.gameTitle}`, error as Error)
    // Affiche une notification d'erreur a l'utilisateur
    notyf.error(`Failed to pause download for ${gameToPauseDownload.gameTitle}`)
  }
}
</script>
