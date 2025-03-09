<template>
  <div class="grid gap-8 px-4 py-5 pb-12 text-white">
    <!-- Barre de recherche -->
    <CrzSearchBar :value="searchTerm" @update:value="searchTerm = $event" />

    <!-- Contenu principal : s'affiche seulement quand le chargement est terminé et qu'il y a des données (donc des jeux) -->
    <div
      v-if="!isLoadingGames && filteredGames && filteredGames.length > 0"
      class="grid grid-cols-1 items-start justify-center gap-3 text-sm sm:grid sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-7 3xl:grid-cols-8 4xl:grid-cols-10"
    >
      <template v-for="game in filteredGames" :key="game.id">
        <div v-if="game" class="grid gap-2">
          <CrzGameCard
            :pictureFileUrl="game.pictureFile?.url"
            :trailerFileUrl="game.trailerFile?.url"
            :logoFileUrl="game.logoFile?.url"
            :gameCategory="game.gameCategory"
            :gamePlatform="game.gamePlatform"
            :title="game.title"
            :showPlatforms="false"
            :showDownloadButton="false"
            :showVideo="true"
            :showSubTitle="true"
            :showAddGameInLibraryButton="game.isFreeAndNotOwned && !game.upcoming_game"
            :showPaidGameButton="game.isPaidAndNotOwned && !game.upcoming_game"
            :smallText="true"
            :upcomingGame="game.upcoming_game"
            :newGame="game.new_game"
            @add-to-library="addGameInUserGameLibrary(game.id)"
          />
          <CrzBadge v-if="game.isOwned" variant="gray" size="sm">
            <CrzIcon color="#00ff84" name="circle-check" view-box="0 0 512 512" :width="12" :height="12" />
            In your library
          </CrzBadge>
        </div>
      </template>
    </div>

    <!-- Message s'affiche seulement après le chargement et s'il n'y a pas de données -->
    <p
      v-if="!isLoadingGames && (!filteredGames || filteredGames.length === 0)"
      class="text-center text-base font-semibold text-gray-400 md:text-xl"
    >
      There are no games available for this search.
    </p>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { useGameStore } from '~~/src-nuxt/stores/game.store'

import CrzGameCard from '#src-common/components/cards/CrzGameCard.vue'
import CrzSearchBar from '#src-common/components/inputs/CrzSearchBar.vue'
import CrzBadge from '#src-common/components/ui/CrzBadge.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import type GameModel from '#src-common/core/models/GameModel'
import { type GamePaidAndOwnedStatus, ProductService } from '#src-common/core/services/ProductService'

import type { ExtendedGameModel } from '#src-core/types/ExtendedGameModel'

import { useGameLibraryStore } from '#src-nuxt/stores/gameLibrary.store'

const { $notyf } = useNuxtApp()

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
const gameStore: any = useGameStore()
const gameLibraryStore: any = useGameLibraryStore()

/* REFS */
/**
 * searchTerm permet de stocker la valeur de la recherche de l'utilisateur,
 * dans le champ de recherche, pour filtrer les jeux.
 * @type {Ref<string>}
 */
const searchTerm: Ref<string> = ref('')

/**
 * isLoadingGames permet de savoir si les jeux sont en cours de chargement,
 * le temps de récupérer les données depuis l'API.
 * @type {Ref<boolean>}
 */
const isLoadingGames: Ref<boolean> = ref(true)

/**
 * Les jeux enrichis avec le statut de possession et de paiement.
 * @type {Ref<ExtendedGameModel[]>}
 */
const games: Ref<ExtendedGameModel[]> = ref([])

/* CYCLE - HOOKS */
/**
 * Lifecycle hook mounted
 * @returns {Promise<void>} - Promise void
 */
onMounted(async (): Promise<void> => {
  await fetchGamesAndEnrichGame()
})

/* METHODS */
/**
 * Permet de filtrer les jeux en fonction de la recherche de l'utilisateur.
 * @returns {ExtendedGameModel[]}
 */
const filteredGames: ComputedRef<ExtendedGameModel[]> = computed((): ExtendedGameModel[] => {
  // Si la recherche est vide, on retourne tous les jeux
  if (!searchTerm.value) {
    return games.value
  }

  // Sinon, on filtre les jeux en fonction de la recherche
  return games.value.filter((game: ExtendedGameModel): boolean =>
    game.title.toLowerCase().includes(searchTerm.value.toLowerCase()),
  )
})

/**
 * Ajoute un jeu dans la bibliothèque de l'utilisateur.
 * @param {number} gameId - Game id
 * @returns {Promise<void>}
 */
const addGameInUserGameLibrary: (gameId: number) => Promise<void> = async (gameId: number): Promise<void> => {
  // Ajoute le jeu dans la bibliothèque de l'utilisateur
  await gameLibraryStore.addGameToUserLibrary(gameId)

  // Met à jour les jeux et enrichit chaque jeu
  await fetchGamesAndEnrichGame()

  // Affiche une notification de succès
  $notyf.success('Game added to library successfully')
}

/**
 * Recupere tout les GameModel et enrichit chaque jeu via GamePaidAndOwnedStatus
 * @param {GameModel} game - GameModel
 * @returns {Promise<ExtendedGameModel>} - Promise ExtendedGameModel
 */
const enrichGame: (game: GameModel) => Promise<ExtendedGameModel> = async (
  game: GameModel,
): Promise<ExtendedGameModel> => {
  // Récupére pour savoir si le jeu est payé et possédé
  const status: GamePaidAndOwnedStatus = await ProductService.isGamePaidAndOwned(game.id)

  // Retourne le jeu enrichi
  return {
    ...game,
    isPaidAndNotOwned: status.isPaid && !status.isOwned,
    isFreeAndNotOwned: !status.isPaid && !status.isOwned,
    isOwned: status.isOwned,
  } as ExtendedGameModel
}

/**
 * Recupere tout les jeux et enrichit chaque jeu
 * @param {string} title - Title of the game
 * @returns {Promise<void>} - Promise void
 */
const fetchGamesAndEnrichGame: (title?: string) => Promise<void> = async (title?: string): Promise<void> => {
  // Met à jour isLoadingGames à true le temps de récupérer les jeux
  isLoadingGames.value = true

  try {
    // Récupère tout les jeux
    await gameStore.getAllGames(title)

    // Récupère tout les jeux en fonction de la plateforme
    games.value = await Promise.all(
      gameStore.gamesPlatforms.map((game: GameModel): Promise<ExtendedGameModel> => enrichGame(game)),
    )
  } catch (error) {
    console.error('Error fetchGames:', error)
  } finally {
    isLoadingGames.value = false
  }
}
</script>
