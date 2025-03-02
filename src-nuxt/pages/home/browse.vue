<template>
  <div class="grid gap-8 px-4 py-5 pb-12 text-white">
    <!-- Barre de recherche -->
    <CrzSearchBar :value="searchTerm" @update:value="searchTerm = $event" />

    <!-- Afficher le loader lorsque isLoading est vrai -->
    <CrzSpinner v-if="isLoading" />

    <!-- Contenu principal : s'affiche seulement quand le chargement est terminé et qu'il y a des données -->
    <div
      v-if="!isLoading && filteredGames && filteredGames.length > 0"
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
      v-if="!isLoading && (!filteredGames || filteredGames.length === 0)"
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
import CrzSpinner from '#src-common/components/loaders/CrzSpinner.vue'
import CrzBadge from '#src-common/components/ui/CrzBadge.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import type GameModel from '#src-common/core/models/GameModel'
import { type GamePaidAndOwnedStatus, ProductService } from '#src-common/core/services/ProductService'

import type { ExtendedGameModel } from '#src-core/types/ExtendedGameModel'

import { useGameLibraryStore } from '#src-nuxt/stores/gameLibrary.store'

const { $notyf } = useNuxtApp()

/* LAYOUT - MIDDLEWARE */
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

/* STORE */
// eslint-disable-next-line @typescript-eslint/typedef
const gameStore = useGameStore()
// eslint-disable-next-line @typescript-eslint/typedef
const gameLibraryStore = useGameLibraryStore()

/* REFS */
const searchTerm: Ref<string> = ref('')
const isLoading: Ref<boolean> = ref(true)
const games: Ref<ExtendedGameModel[]> = ref([])

/* METHODS */
/**
 * Filtered Games
 */
const filteredGames: ComputedRef<ExtendedGameModel[]> = computed(() => {
  if (!searchTerm.value) {
    return games.value
  }
  return games.value.filter((game: ExtendedGameModel) =>
    game.title.toLowerCase().includes(searchTerm.value.toLowerCase()),
  )
})

/**
 * Add game in library
 * @param {number} gameId - Game id
 * @returns {Promise<void>}
 */
const addGameInUserGameLibrary: (gameId: number) => Promise<void> = async (gameId: number): Promise<void> => {
  await gameLibraryStore.addGameToUserLibrary(gameId)
  await fetchGamesAndEnrichGame()
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
  const status: GamePaidAndOwnedStatus = await ProductService.isGamePaidAndOwned(game.id)
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
  isLoading.value = true

  try {
    await gameStore.getAllGames(title)
    games.value = await Promise.all(gameStore.gamesPlatforms.map((game: GameModel) => enrichGame(game)))
  } catch (error) {
    console.error('Error fetchGames:', error)
  } finally {
    isLoading.value = false
  }
}

/* CYCLE - HOOKS */
/**
 * Lifecycle hook mounted
 * @returns {Promise<void>} - Promise void
 */
onMounted(async (): Promise<void> => {
  await fetchGamesAndEnrichGame()
})
</script>
