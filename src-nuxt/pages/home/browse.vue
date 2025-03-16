<template>
  <div class="grid gap-8 px-4 py-5 text-white relative">
    <!-- Barre de recherche et boutons de navigation -->
    <div class="flex items-center w-full">
      <!-- Boutons de navigation gauche / droite -->
      <NavigationPages class="mr-5" />

      <!-- Barre de recherche -->
      <CrzSearchBar
        :height="40"
        :value="searchTerm"
        :placeholder="'Search for games (CTRL + E)'"
        @update:value="handleSearchInput"
        @keydown.enter="performSearch"
      />
    </div>

    <!-- Titre principal de la page "Browse" -->
    <h1 class="font-serif text-xl font-semibold sm:text-2xl">Browse</h1>

    <div class="flex items-center justify-between w-full" style="margin-top: -1rem">
      <!-- Les boutons "All Games" et "Featured Games" -->
      <div class="flex gap-2">
        <!-- Bouton "All Games" -->
        <CrzButton
          size="sm"
          :variant="activeFilter === 'all' && !isSearchActive ? 'active' : 'primary2'"
          @click="setFilter('all')"
        >
          All Games
        </CrzButton>
        <!-- Bouton "Featured Games" -->
        <CrzButton
          size="sm"
          :variant="activeFilter === 'featured' && !isSearchActive ? 'active' : 'primary2'"
          @click="setFilter('featured')"
        >
          Featured Games
        </CrzButton>
      </div>

      <!-- Indicateur de filtre de recherche actif avec "Best Results" -->
      <div v-if="isSearchActive" class="flex items-center gap-2">
        <span class="text-lg font-medium text-white">Search results for "{{ lastValidatedSearchTerm }}"</span>
        <CrzBadge variant="yellow" size="sm">
          Best Results - {{ filteredGames.length }} game{{ filteredGames.length === 1 ? '' : 's' }}
        </CrzBadge>
        <CrzButton size="sm" variant="danger" @click="clearSearch">Clear</CrzButton>
      </div>
    </div>

    <!-- Diviseur -->
    <Divider />

    <!-- Section des genres -->
    <div v-if="!isSearchActive">
      <CrzButton size="sm" variant="primary2" @click="toggleGenreFilter" class="mb-2">
        Genres {{ genreFilter ? '▲' : '▼' }}
      </CrzButton>

      <!-- Menu déroulant pour les genres (visible si genreFilter est true) -->
      <div
        v-if="genreFilter"
        class="absolute mt-2 bg-[#1e2537] text-white rounded shadow-lg z-10 p-2 w-48 max-h-80 overflow-y-auto"
      >
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium">Genres</span>
          <button
            @click="toggleGenreFilter"
            class="text-white hover:bg-white hover:bg-opacity-10 rounded-full w-5 h-5 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        <div
          v-for="category in sortedGameCategories"
          :key="category.id"
          class="flex items-center justify-between py-1 cursor-pointer hover:bg-[#2d3748]"
          @click="toggleGenreSelection(category.name)"
        >
          <span class="text-sm">{{ category.name }}</span>
          <span
            class="w-4 h-4 border border-gray-300 rounded flex items-center justify-center cursor-pointer"
            :class="{ 'bg-[#facc15]': selectedGenres.includes(category.name) }"
            @click.stop="toggleGenreSelection(category.name)"
          >
            <span v-if="selectedGenres.includes(category.name)" class="text-black text-xs">✔</span>
          </span>
        </div>
        <button @click="clearAllGenres" class="text-sm text-gray-400 hover:text-white mt-2 w-full text-left">
          Clear All
        </button>
      </div>
    </div>

    <!-- Spinner de chargement : s'affiche seulement pendant le chargement des jeux -->
    <CrzSpinner v-if="isLoadingGames" />

    <!-- Contenu principal : s'affiche seulement quand le chargement est terminé et qu'il y a des données -->
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
            @add-to-library="addGameToUserGameLibraryAndUpdateGameListAndNotify(game.id)"
          />
          <CrzBadge v-if="game.isOwned" variant="gray" size="sm" class="mt-2">
            <CrzIcon color="#00ff84" name="circle-check" view-box="0 0 512 512" :width="12" :height="12" />
            In your library
          </CrzBadge>
        </div>
      </template>
    </div>

    <!-- Composant de pagination -->
    <CrzPagination
      v-if="!isLoadingGames && filteredGames && filteredGames.length > 0"
      :total="total"
      :per-page="perPage"
      :current-page="currentPage"
      :on-page-change="fetchAllGamesAndEnrichGame"
      @update:currentPage="currentPage = $event"
    />

    <!-- Messages pour l'absence de jeux lors la recherche via l'input -->
    <div
      v-if="
        !isLoadingGames &&
        (!filteredGames || filteredGames.length === 0) &&
        (isSearchActive || activeCategory !== 'All')
      "
      class="flex flex-col items-center justify-center w-full max-w-3xl mx-auto bg-[#141724] text-center p-6 rounded-xl"
    >
      <CrzIcon name="search" color="#6b7280" view-box="0 0 24 24" class="w-12 h-12 mb-4" />
      <h2 class="text-lg font-semibold text-white">No results found</h2>
      <p class="text-sm text-gray-400 mt-2">No games match your search or filter.</p>
      <p class="text-sm text-gray-400 mt-2">Try searching with different keywords or changing the filter.</p>
      <CrzButton @click="setFilter('all')" class="mt-4">Browse all games</CrzButton>
      <CrzButton @click="setFilter('featured')" class="mt-4">Browse featured games</CrzButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Notyf } from 'notyf'
import { nextTick } from 'vue'
import { type ComputedRef, type Ref, computed, onMounted, ref } from 'vue'
import CrzPagination from '~~/src-common/components/core/CrzPagination.vue'
import CrzSpinner from '~~/src-common/components/loaders/CrzSpinner.vue'
import type GameCategoryModel from '~~/src-common/core/models/GameCategoryModel'
import type { PaginationMeta } from '~~/src-common/core/services/GameService'
import { useGameStore } from '~~/src-nuxt/stores/game.store'

import CrzButton from '#src-common/components/buttons/CrzButton.vue'
import CrzGameCard from '#src-common/components/cards/CrzGameCard.vue'
import CrzSearchBar from '#src-common/components/inputs/CrzSearchBar.vue'
import CrzBadge from '#src-common/components/ui/CrzBadge.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import type GameModel from '#src-common/core/models/GameModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'
import GameCategoryService from '#src-common/core/services/GameCategoryService'
import { type GamePaidAndOwnedStatus, ProductService } from '#src-common/core/services/ProductService'

import type { ExtendedGameModel } from '#src-core/types/ExtendedGameModel'
import { createLogger } from '#src-core/utils/logger'
import type { Logger } from '#src-core/utils/logger'

import NavigationPages from '#src-nuxt/components/navigations/NavigationPages.vue'
import Divider from '#src-nuxt/components/ui/Divider.vue'
import { useUserGameLibrariesStore } from '#src-nuxt/stores/userGameLibraries.store'

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

/* DATA */
/**
 * Instance de Notyf pour afficher des notifications à l'utilisateur
 * - Récupérée via useNuxtApp() pour intégrer Notyf dans l'application Nuxt
 * @type {Notyf}
 */
const notyf: Notyf = useNuxtApp().$notyf

/**
 * Instance du logger pour tracer les événements dans la page "Browse".
 * - Utilise createLogger avec un contexte "Browse".
 * @type {Logger}
 */
const logger: Logger = createLogger('Browse')

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
 * lastValidatedSearchTerm stocke la dernière valeur de recherche validée avec "Enter".
 * @type {Ref<string>}
 */
const lastValidatedSearchTerm: Ref<string> = ref('')

/**
 * isLoadingGames permet de savoir si les jeux sont en cours de chargement,
 * le temps de récupérer les données depuis l'API.
 * @type {Ref<boolean>}
 */
const isLoadingGames: Ref<boolean> = ref(true)

/**
 * Les jeux de base et enrichis avec le statut de possession et de paiement.
 * C'est cette liste qui est filtrée et affichée à l'utilisateur.
 * @type {Ref<ExtendedGameModel[]>}
 */
const games: Ref<ExtendedGameModel[]> = ref([])

/**
 * activeFilter permet de savoir quel filtre est actif.
 * @type {Ref<filter>}
 * @default 'all'
 * @example 'all' - Tous les jeux
 * @example 'featured' - Jeux à la une (nouveaux ou à venir)
 */
const activeFilter: Ref<filter> = ref('all')

/**
 * activeCategory permet de savoir quelle catégorie est active.
 * @type {Ref<string>}
 * @default 'All'
 */
const activeCategory: Ref<string> = ref('All')

/**
 * Contrôle l'affichage du menu déroulant des genres.
 * @type {Ref<boolean>}
 */
const genreFilter: Ref<boolean> = ref(false)

/**
 * Indique si un filtre de recherche est actif.
 * @type {Ref<boolean>}
 */
const isSearchActive: Ref<boolean> = ref(false)

/**
 * Numéro de la page actuelle pour la pagination.
 * @type {Ref<number>}
 * @default 1
 */
const currentPage: Ref<number> = ref(1)

/**
 * Nombre d'éléments par page pour la pagination.
 * @type {Ref<number>}
 * @default 24
 */
const perPage: Ref<number> = ref(24)

/**
 * Nombre total d'éléments pour la pagination.
 * @type {Ref<number>}
 */
const total: Ref<number> = ref(0)

/**
 * Liste des catégories de jeux récupérées depuis l'API.
 * @type {Ref<GamePlatformModel[]>}
 */
const gameCategories: Ref<GamePlatformModel[]> = ref([])

/**
 * Genres sélectionnés par l'utilisateur.
 * @type {Ref<string[]>}
 */
const selectedGenres: Ref<string[]> = ref([])

/**
 * Liste des catégories triées par ordre alphabétique.
 * @type {ComputedRef<GamePlatformModel[]>}
 */
const sortedGameCategories: ComputedRef<GamePlatformModel[]> = computed(() => {
  return [...gameCategories.value].sort((a: GamePlatformModel, b: GamePlatformModel) => a.name.localeCompare(b.name))
})

/* CYCLE - HOOKS */
/**
 * Lifecycle hook mounted
 * @returns {Promise<void>} - Promise void
 */
onMounted(async (): Promise<void> => {
  await fetchAllGamesAndEnrichGame()
  await fetchGameCategories()
})

/* METHODS */
/**
 * Gère l'entrée de texte dans la barre de recherche sans déclencher la recherche.
 * @param {string} value - La nouvelle valeur saisie dans la barre de recherche.
 * @returns {void}
 */
const handleSearchInput: (value: string) => void = (value: string): void => {
  searchTerm.value = value
}

/**
 * Effectue la recherche lorsque l'utilisateur appuie sur "Enter".
 * @returns {Promise<void>}
 */
const performSearch: () => Promise<void> = async (): Promise<void> => {
  if (searchTerm.value.trim()) {
    isSearchActive.value = true
    lastValidatedSearchTerm.value = searchTerm.value // Stocke la recherche validée
    activeCategory.value = 'Search' // Définit la catégorie comme "Search" lors de la recherche
    activeFilter.value = 'all' // Réinitialise le filtre à "all" pour rechercher sur tous les jeux
    currentPage.value = 1 // Réinitialise la page courante lors d'une nouvelle recherche
    selectedGenres.value = [] // Réinitialise les genres sélectionnés
    await fetchAllGamesAndEnrichGame()
  } else {
    // Si la searchbar est vide et "Enter" est pressé, revenir à "All Games"
    isSearchActive.value = false
    lastValidatedSearchTerm.value = ''
    activeCategory.value = 'All'
    activeFilter.value = 'all'
    currentPage.value = 1
    selectedGenres.value = []
    await fetchAllGamesAndEnrichGame()
  }
}

/**
 * Réinitialise la recherche.
 * @returns {void}
 */
const clearSearch: () => Promise<void> = async (): Promise<void> => {
  searchTerm.value = ''
  lastValidatedSearchTerm.value = ''
  isSearchActive.value = false
  activeCategory.value = 'All' // Réinitialise la catégorie
  currentPage.value = 1 // Réinitialise la page courante
  selectedGenres.value = [] // Réinitialise les genres sélectionnés
  await fetchAllGamesAndEnrichGame()
}

/**
 * Permet de définir le filtre actif.
 * @param {filter} filter - Filtre actif ('all' ou 'featured')
 * @returns {void}
 */
const setFilter: (filter: filter) => void = (filter: filter): void => {
  activeFilter.value = filter
  searchTerm.value = '' // Réinitialise la recherche
  lastValidatedSearchTerm.value = ''
  isSearchActive.value = false // Désactive le filtre de recherche
  activeCategory.value = 'All' // Réinitialise la catégorie
  currentPage.value = 1 // Réinitialise la page courante
  fetchAllGamesAndEnrichGame()
}

/**
 * Bascule l'affichage du menu déroulant des genres.
 * @returns {void}
 */
const toggleGenreFilter: () => void = (): void => {
  genreFilter.value = !genreFilter.value
}

/**
 * Toggle la sélection d'un genre.
 * @param {string} genre - Le genre à sélectionner/désélectionner
 * @returns {void}
 */
const toggleGenreSelection: (genre: string) => Promise<void> = async (genre: string): Promise<void> => {
  if (selectedGenres.value.includes(genre)) {
    selectedGenres.value = selectedGenres.value.filter((g: string) => g !== genre)
  } else {
    selectedGenres.value.push(genre)
  }
  activeCategory.value = selectedGenres.value.length > 0 ? 'Custom' : 'All'
  await fetchAllGamesAndEnrichGame()
}

/**
 * Récupère toutes les catégories de jeux depuis l'API.
 * @returns {Promise<void>}
 */
const fetchGameCategories: () => Promise<void> = async (): Promise<void> => {
  try {
    gameCategories.value = await GameCategoryService.getAllGameCategories()
  } catch (error: any) {
    logger.error('[fetchGameCategories] Erreur lors de la récupération des catégories : ', error)
  }
}

/**
 * Réinitialise tous les genres sélectionnés.
 * @returns {void}
 */
const clearAllGenres: () => Promise<void> = async (): Promise<void> => {
  selectedGenres.value = []
  activeCategory.value = 'All'
  await fetchAllGamesAndEnrichGame()
}

/**
 * Permet de filtrer les jeux en fonction du filtre actif, de la catégorie et de la recherche validée de l'utilisateur.
 * @returns {ExtendedGameModel[]}
 */
const filteredGames: ComputedRef<ExtendedGameModel[]> = computed((): ExtendedGameModel[] => {
  let filtered: ExtendedGameModel[] = games.value

  // Appliquer le filtre actif ("featured") uniquement si aucune recherche n'est active
  if (activeFilter.value === 'featured' && !isSearchActive.value) {
    filtered = games.value.filter((game: ExtendedGameModel): boolean => game.new_game || game.upcoming_game)
  }

  // Appliquer le filtre par catégorie ou recherche validée
  if (isSearchActive.value && lastValidatedSearchTerm.value.trim()) {
    filtered = games.value.filter((game: ExtendedGameModel): boolean =>
      game.title.toLowerCase().includes(lastValidatedSearchTerm.value.toLowerCase()),
    )
  } else if (selectedGenres.value.length > 0) {
    filtered = filtered.filter((game: ExtendedGameModel): boolean =>
      game.gameCategory.some((category: GameCategoryModel): boolean => selectedGenres.value.includes(category.name)),
    )
  } else if (activeCategory.value !== 'All' && activeCategory.value !== 'Search') {
    filtered = filtered.filter((game: ExtendedGameModel): boolean =>
      game.gameCategory.some((category: GameCategoryModel): boolean => category.name === activeCategory.value),
    )
  }

  return filtered
})

/**
 * Ajoute un jeu dans la bibliothèque de l'utilisateur, met à jour les jeux de la liste de la page
 * et affiche une notification de succès à l'utilisateur.
 * @param {number} gameId - Game id
 * @returns {Promise<void>}
 */
const addGameToUserGameLibraryAndUpdateGameListAndNotify: (gameId: number) => Promise<void> = async (
  gameId: number,
): Promise<void> => {
  try {
    // Ajoute le jeu à la bibliothèque de l'utilisateur (backend)
    await userGameLibrariesStore.addGameInUserGameLibrariesByGameId(gameId)

    // Met à jour uniquement le jeu concerné dans la liste (évite un refetch total)
    const gameIndex: number = games.value.findIndex((game: ExtendedGameModel): boolean => game.id === gameId)

    // Si le jeu est trouvé, met à jour le statut de possession
    if (gameIndex !== -1) {
      // Marque le jeu comme possédé (évite un refetch complet)
      games.value[gameIndex].isOwned = true
      games.value[gameIndex].isPaidAndNotOwned = false
      games.value[gameIndex].isFreeAndNotOwned = false
    }

    /**
     * Affiche une notification de succès à l'utilisateur.
     * Affiche immédiatement l'icône "In Your Library"
     */
    notyf.success('Game added to library successfully')
  } catch (error: any) {
    logger.error('[addGameToUserGameLibraryAndUpdateGameListAndNotify] error:', error)
    notyf.error('Failed to add game to library')
  }
}

/**
 * Récupère tous les jeux depuis le backend et enrichit chaque jeu avec les statuts
 * de possession et de paiement en fonction de l'utilisateur connecté.
 * @returns {Promise<void>} Une promesse qui se résout une fois les données chargées.
 */
const fetchAllGamesAndEnrichGame: () => Promise<void> = async (): Promise<void> => {
  // Activation de l'indicateur de chargement
  isLoadingGames.value = true

  try {
    // Récupération des jeux depuis le store avec les paramètres de recherche et pagination
    const response: GameModel[] = await gameStore.getAllGames(
      lastValidatedSearchTerm.value || undefined, // Utilise la recherche validée
      currentPage.value, // Page actuelle
      perPage.value, // Nombre d'éléments par page
    )

    // Initialisation de la liste des jeux à enrichir
    let fetchedGames: GameModel[] = response

    // Récupération des métadonnées depuis l'état du store
    const paginationMeta: PaginationMeta = gameStore.paginationMeta
    total.value = paginationMeta.total // Mise à jour du total basé sur les métadonnées

    // Récupération des statuts de paiement et de possession pour tous les jeux
    const allGamesPaidAndOwnedStatus: GamePaidAndOwnedStatus[] = await ProductService.getAllGamesProductsPaidAndOwned()

    // Création d'une map pour associer rapidement les statuts aux IDs des jeux
    const statusMap: Map<number, GamePaidAndOwnedStatus> = new Map<number, GamePaidAndOwnedStatus>()
    allGamesPaidAndOwnedStatus.forEach((status: GamePaidAndOwnedStatus): void => {
      statusMap.set(status.gameId as number, status)
    })

    // Enrichissement de chaque jeu avec les statuts de paiement et possession
    games.value = fetchedGames.map((game: GameModel): ExtendedGameModel => {
      const status: GamePaidAndOwnedStatus = statusMap.get(game.id) || { isPaid: false, isOwned: false }
      return {
        ...game,
        isPaidAndNotOwned: status.isPaid && !status.isOwned, // Jeu payé mais non possédé
        isFreeAndNotOwned: !status.isPaid && !status.isOwned, // Jeu gratuit et non possédé
        isOwned: status.isOwned, // Jeu possédé
      } as ExtendedGameModel
    })
  } catch (error: any) {
    // Gestion des erreurs avec journalisation
    logger.error('[fetchAllGamesAndEnrichGame] Erreur lors de la récupération des jeux : ', error)
  } finally {
    // Attendre le prochain tick pour s'assurer que les mises à jour réactives sont terminées
    await nextTick()

    // Ajoute une petite temporisation pour s'assurer que tout est bien chargé
    await new Promise((resolve: any) => setTimeout(resolve, 250))

    // Désactivation de l'indicateur de chargement
    isLoadingGames.value = false
  }
}
</script>
