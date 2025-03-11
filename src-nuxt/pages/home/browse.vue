<template>
  <div class="grid gap-8 px-4 py-5 pb-12 text-white relative">
    <!-- Barre de recherche et boutons de navigation -->
    <div class="flex items-center w-full">
      <!-- Boutons de navigation gauche / droite -->
      <NavigationPages class="mr-5" />

      <!-- Barre de recherche -->
      <CrzSearchBar
        :height="40"
        :value="searchTerm"
        :placeholder="'Search for games (CTRL + E)'"
        @update:value="searchTerm = $event"
      />

      <!-- Logo CrzGames (déplacé en position absolue) -->
      <div class="relative w-full">
        <img
          src="/images/logo_fond_transparent_whitout_text.png"
          alt="CrzGames Logo"
          class="w-20 h-20 object-contain absolute top-0 right-0 mt-2 mr-2 z-10"
        />
      </div>
    </div>

    <!-- Titre principal de la page "Browse" -->
    <h1 class="font-serif text-xl font-semibold sm:text-2xl">Browse</h1>

    <div class="flex items-center justify-between w-full" style="margin-top: -1rem">
      <!-- Les boutons "All Games" et "Featured Games" (cachés pendant une recherche) -->
      <div class="flex gap-2">
        <!-- Bouton "All Games" -->
        <CrzButton
          size="sm"
          :variant="searchTerm ? 'disabled' : activeFilter === 'all' ? 'active' : 'primary2'"
          @click="setFilter('all')"
        >
          All Games
        </CrzButton>
        <!-- Bouton "Featured Games" -->
        <CrzButton
          size="sm"
          :variant="searchTerm ? 'disabled' : activeFilter === 'featured' ? 'active' : 'primary2'"
          @click="setFilter('featured')"
        >
          Featured Games
        </CrzButton>
      </div>

      <!-- Affichage des résultats de recherche -->
      <div v-if="searchTerm && filteredGames" class="flex items-center gap-2">
        <!-- Résultats de la saisie de l'utilisateur lors de la recherche via l'input -->
        <span class="text-lg font-medium text-white">Search results for "{{ searchTerm }}"</span>
        <!-- Badge avec le nombre de jeux trouvés, rajoute un "s" si le nombre est supérieur à 1 -->
        <CrzBadge variant="yellow" size="sm">
          {{ filteredGames.length }} game{{ filteredGames.length === 1 ? '' : 's' }}
        </CrzBadge>
      </div>
    </div>

    <!-- Diviseur -->
    <Divider />

    <!-- Contenu principal : s'affiche seulement quand le chargement est terminé et qu'il y a des données (donc des jeux) -->
    <div
      v-if="!isLoadingGames && filteredGames && filteredGames.length > 0"
      class="grid grid-cols-auto-fit gap-8"
      style="grid-template-columns: repeat(auto-fit, minmax(180px, 220px))"
    >
      <template v-for="game in filteredGames" :key="game.id">
        <div v-if="game">
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
            :showFavoritesGameButton="true"
            :enableHoverEffect="true"
            @add-to-library="addGameInUserGameLibrary(game.id)"
          />
          <CrzBadge v-if="game.isOwned" variant="gray" size="sm" class="mt-2">
            <CrzIcon color="#00ff84" name="circle-check" view-box="0 0 512 512" :width="12" :height="12" />
            In your library
          </CrzBadge>
        </div>
      </template>
    </div>

    <CrzSpinner v-else-if="isLoadingGames" />

    <!-- Messages pour l'absence de jeux lors la recherche via l'input -->
    <div
      v-if="!isLoadingGames && (!filteredGames || filteredGames.length === 0)"
      class="flex flex-col items-center justify-center w-full max-w-3xl mx-auto bg-[#141724] text-center p-6 rounded-xl"
    >
      <CrzIcon name="search" color="#6b7280" view-box="0 0 24 24" class="w-12 h-12 mb-4" />
      <h2 class="text-lg font-semibold text-white">No results found</h2>
      <p class="text-sm text-gray-400 mt-2">No games match your search.</p>
      <p class="text-sm text-gray-400 mt-2">Try searching with different keywords.</p>
      <CrzButton @click="setFilter('all')" class="mt-4"> Browse all games </CrzButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import CrzSpinner from '~~/src-common/components/loaders/CrzSpinner.vue'
import { useGameStore } from '~~/src-nuxt/stores/game.store'

import CrzButton from '#src-common/components/buttons/CrzButton.vue'
import CrzGameCard from '#src-common/components/cards/CrzGameCard.vue'
import CrzSearchBar from '#src-common/components/inputs/CrzSearchBar.vue'
import CrzBadge from '#src-common/components/ui/CrzBadge.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import type GameModel from '#src-common/core/models/GameModel'
import { type GamePaidAndOwnedStatus, ProductService } from '#src-common/core/services/ProductService'

import type { ExtendedGameModel } from '#src-core/types/ExtendedGameModel'

import NavigationPages from '#src-nuxt/components/navigations/NavigationPages.vue'
import Divider from '#src-nuxt/components/ui/Divider.vue'
import { useUserGameLibrariesStore } from '#src-nuxt/stores/userGameLibraries.store'

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
const userGameLibrariesStore: any = useUserGameLibrariesStore()

/* TYPES */
/**
 * Filtre actif pour les jeux à afficher.
 * @type {object} filter
 * @property {string} all - Tous les jeux
 * @property {string} featured - Jeux à la une (nouveaux ou à venir)
 */
type filter = 'all' | 'featured'

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
 * Les jeux de base et enrichis avec le statut de possession et de paiement.
 * @type {Ref<ExtendedGameModel[]>}
 */
const games: Ref<ExtendedGameModel[]> = ref([])

/**
 * activeFilter permet de savoir quel filtre est actif.
 * @type {Ref<filter>}
 */
const activeFilter: Ref<filter> = ref('all')

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
 * Permet de définir le filtre actif.
 * @param {filter} filter - Filtre actif ('all' ou 'featured')
 * @returns {void}
 */
const setFilter: (filter: filter) => void = (filter: filter): void => {
  activeFilter.value = filter
  searchTerm.value = ''
}

/**
 * Permet de filtrer les jeux en fonction de la recherche de l'utilisateur
 * ou du filtre actif.
 * @returns {ExtendedGameModel[]}
 */
const filteredGames: ComputedRef<ExtendedGameModel[]> = computed((): ExtendedGameModel[] => {
  if (searchTerm.value.trim()) {
    // Si la recherche n'est pas vide, on filtre les jeux en fonction du terme de recherche
    return games.value.filter((game: ExtendedGameModel): boolean =>
      game.title.toLowerCase().includes(searchTerm.value.toLowerCase()),
    )
  } else {
    if (activeFilter.value === 'all') {
      // Afficher tous les jeux
      return games.value
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    else if (activeFilter.value === 'featured') {
      // Afficher seulement les jeux "featured" (nouveaux ou à venir)
      return games.value.filter((game: ExtendedGameModel): boolean => game.new_game || game.upcoming_game)
    }

    // Par défaut, on retourne tous les jeux si aucun filtre n'est actif et qu'il n'y a pas de recherche
    return games.value
  }
})

/**
 * Ajoute un jeu dans la bibliothèque de l'utilisateur.
 * @param {number} gameId - Game id
 * @returns {Promise<void>}
 */
const addGameInUserGameLibrary: (gameId: number) => Promise<void> = async (gameId: number): Promise<void> => {
  // Ajoute le jeu dans la bibliothèque de l'utilisateur
  await userGameLibrariesStore.createGameInUserGameLibrariesByGameId(gameId)

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
 * Recupere tout les jeux et enrichit chaque jeu via enrichGame
 * qui ajoute le statut de possession et de paiement du jeu.
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
      gameStore.gamesSortedByPlatform.map((game: GameModel): Promise<ExtendedGameModel> => enrichGame(game)),
    )
  } catch (error) {
    console.error('Error fetchGames:', error)
  } finally {
    isLoadingGames.value = false
  }
}
</script>
