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

    <!-- Section des genres, tri et plus de filtres (masquée si "Featured Games" est actif) -->
    <div v-if="!isSearchActive && activeFilter === 'all'" class="flex items-center justify-between w-full">
      <!-- Conteneur pour "Genres" et "More Filters" à gauche -->
      <div class="flex items-center gap-2">
        <!-- Bouton "Genres" et son menu -->
        <div class="relative" ref="genresContainer">
          <CrzButton size="sm" variant="primary2" @click="toggleGenreFilter" class="mb-2">
            Genres {{ genreFilter ? '▲' : '▼' }}
          </CrzButton>

          <!-- Menu déroulant pour les genres -->
          <div
            v-if="genreFilter"
            class="absolute mt-2 bg-[#1e2537] text-white rounded shadow-lg z-10 w-48 flex flex-col"
            ref="genresMenu"
          >
            <!-- En-tête fixe avec "Genres" et la croix -->
            <div class="p-2">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium">Genres</span>
                <button
                  @click="toggleGenreFilter"
                  class="text-white hover:bg-white hover:bg-opacity-10 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              <hr class="border-t border-white opacity-20" />
            </div>

            <!-- Liste des genres avec défilement -->
            <div class="max-h-60 overflow-y-auto px-2">
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
            </div>

            <!-- Pied de page fixe avec "Clear All" -->
            <div class="p-2">
              <hr class="border-t border-white opacity-20 mb-2" />
              <button
                @click="selectedGenres.length > 0 ? clearAllGenres() : null"
                class="text-sm w-full text-right"
                :class="[
                  selectedGenres.length > 0
                    ? 'text-[#facc15] hover:text-[#ffd700] cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed',
                ]"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        <!-- Bouton "More Filters" et son menu -->
        <div class="relative" ref="moreFiltersContainer">
          <CrzButton size="sm" variant="primary2" @click="toggleMoreFilters" class="mb-2">
            More Filters + {{ moreFilters ? '▲' : '▼' }}
          </CrzButton>

          <!-- Menu déroulant pour "Plus de filtres" -->
          <div
            v-if="moreFilters"
            class="absolute mt-2 bg-[#1e2537] text-white rounded shadow-lg z-10 w-64 flex flex-col"
            ref="moreFiltersMenu"
          >
            <!-- En-tête fixe avec "Plus de filtres" et la croix -->
            <div class="p-2">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium">More Filters</span>
                <button
                  @click="toggleMoreFilters"
                  class="text-white hover:bg-white hover:bg-opacity-10 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              <hr class="border-t border-white opacity-20" />
            </div>

            <!-- Contenu avec défilement -->
            <div class="max-h-60 overflow-y-auto px-2">
              <!-- Section "Players" -->
              <div class="mb-4">
                <span class="text-sm font-medium">Players</span>
                <div class="mt-2">
                  <div
                    class="flex items-center justify-between py-1 cursor-pointer hover:bg-[#2d3748]"
                    @click="toggleGameModeSelection('multiplayer')"
                  >
                    <span class="text-sm">Multiplayer</span>
                    <span
                      class="w-4 h-4 border border-gray-300 rounded flex items-center justify-center cursor-pointer"
                      :class="{ 'bg-[#facc15]': selectedGameModes.includes('multiplayer') }"
                    >
                      <span v-if="selectedGameModes.includes('multiplayer')" class="text-black text-xs">✔</span>
                    </span>
                  </div>
                  <div
                    class="flex items-center justify-between py-1 cursor-pointer hover:bg-[#2d3748]"
                    @click="toggleGameModeSelection('solo')"
                  >
                    <span class="text-sm">Solo</span>
                    <span
                      class="w-4 h-4 border border-gray-300 rounded flex items-center justify-center cursor-pointer"
                      :class="{ 'bg-[#facc15]': selectedGameModes.includes('solo') }"
                    >
                      <span v-if="selectedGameModes.includes('solo')" class="text-black text-xs">✔</span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Section "Languages" -->
              <div>
                <span class="text-sm font-medium">Languages</span>
                <div class="mt-2">
                  <div
                    v-for="language in sortedLanguages"
                    :key="language.id"
                    class="flex items-center justify-between py-1 cursor-pointer hover:bg-[#2d3748]"
                    @click="toggleLanguageSelection(language.name)"
                  >
                    <span class="text-sm">{{ language.name }}</span>
                    <span
                      class="w-4 h-4 border border-gray-300 rounded flex items-center justify-center cursor-pointer"
                      :class="{ 'bg-[#facc15]': selectedLanguages.includes(language.name) }"
                    >
                      <span v-if="selectedLanguages.includes(language.name)" class="text-black text-xs">✔</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pied de page fixe avec "Clear All" -->
            <div class="p-2">
              <hr class="border-t border-white opacity-20 mb-2" />
              <button
                @click="clearAllMoreFilters"
                class="text-sm w-full text-right"
                :class="[
                  selectedGameModes.length > 0 || selectedLanguages.length > 0
                    ? 'text-[#facc15] hover:text-[#ffd700] cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed',
                ]"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bouton "Sort by" et son menu (à droite) -->
      <div class="relative" ref="sortContainer">
        <CrzButton size="sm" variant="primary2" @click="toggleSortFilter" class="mb-2">
          Sort by {{ sortFilter ? '▲' : '▼' }}
        </CrzButton>

        <!-- Menu déroulant pour le tri -->
        <div
          v-if="sortFilter"
          class="absolute mt-2 right-0 bg-[#1e2537] text-white rounded shadow-lg z-10 w-48 flex flex-col"
          ref="sortMenu"
        >
          <!-- En-tête fixe avec "Trier par" et la croix -->
          <div class="p-2">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium">Sort by</span>
              <button
                @click="toggleSortFilter"
                class="text-white hover:bg-white hover:bg-opacity-10 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <hr class="border-t border-white opacity-20" />
          </div>

          <!-- Liste des options de tri -->
          <div class="max-h-60 overflow-y-auto px-2">
            <div
              v-for="option in sortOptions"
              :key="option.value"
              class="flex items-center justify-between py-1 cursor-pointer hover:bg-[#2d3748]"
              @click="setSortOption(option.value)"
            >
              <span class="text-sm">{{ option.label }}</span>
              <span
                class="w-4 h-4 border border-gray-300 rounded-full flex items-center justify-center cursor-pointer"
                :class="{ 'bg-[#facc15]': sortOption === option.value }"
              >
                <span v-if="sortOption === option.value" class="bg-black rounded-full w-2 h-2"></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grille des jeux ou skeleton loading -->
    <div
      class="grid grid-cols-auto-fit gap-8 relative"
      style="grid-template-columns: repeat(auto-fit, minmax(180px, 220px))"
    >
      <!-- Skeleton loading ou jeux réels -->
      <template v-if="isLoadingGames">
        <!-- Afficher des placeholders (skeleton) pendant le chargement -->
        <div v-for="n in perPage" :key="'skeleton-' + n">
          <div class="w-full h-[290px] bg-gray-700 rounded-lg"></div>
          <div class="mt-2 h-[25px] bg-gray-700 rounded w-3/4"></div>
          <div class="mt-1 h-[18px] bg-gray-700 rounded w-1/2"></div>
        </div>
      </template>
      <template v-else-if="filteredGames && filteredGames.length > 0">
        <!-- Afficher les jeux réels une fois chargés -->
        <div v-for="game in filteredGames" :key="game.id">
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
      :on-page-change="handlePageChange"
      @update:currentPage="currentPage = $event"
    />

    <!-- Messages pour l'absence de jeux lors de la recherche via l'input -->
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
import { type ComputedRef, type Ref, computed, onMounted, onUnmounted, ref } from 'vue'
import CrzPagination from '~~/src-common/components/core/CrzPagination.vue'
import CrzSpinner from '~~/src-common/components/loaders/CrzSpinner.vue'
import type GamePlatformModel from '~~/src-common/core/models/GamePlatformModel'
import GameCategoryService from '~~/src-common/core/services/GameCategoryService'
import type { PaginationMeta } from '~~/src-common/core/services/GameService'
import { LanguagesService } from '~~/src-common/core/services/LanguageService'
import { type GamePaidAndOwnedStatus, ProductService } from '~~/src-common/core/services/ProductService'
import { useGameStore } from '~~/src-nuxt/stores/game.store'

import CrzButton from '#src-common/components/buttons/CrzButton.vue'
import CrzGameCard from '#src-common/components/cards/CrzGameCard.vue'
import CrzSearchBar from '#src-common/components/inputs/CrzSearchBar.vue'
import CrzBadge from '#src-common/components/ui/CrzBadge.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import type GameModel from '#src-common/core/models/GameModel'
import type { LanguageModel } from '#src-common/core/models/LanguageModel'

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

/**
 * Option de tri pour les jeux.
 * @type {SortOption}
 * @property {string} label - Libellé de l'option de tri
 * @property {string} value - Valeur de l'option de tri
 */
type SortOption = {
  label: string
  value: string
}

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
 * Contrôle l'affichage du menu déroulant du tri.
 * @type {Ref<boolean>}
 */
const sortFilter: Ref<boolean> = ref(false)

/**
 * Contrôle l'affichage du menu déroulant "Plus de filtres".
 * @type {Ref<boolean>}
 */
const moreFilters: Ref<boolean> = ref(false)

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
 * Modes de jeu sélectionnés par l'utilisateur (solo, multijoueur).
 * @type {Ref<string[]>}
 */
const selectedGameModes: Ref<string[]> = ref([])

/**
 * Langues sélectionnées par l'utilisateur.
 * @type {Ref<string[]>}
 */
const selectedLanguages: Ref<string[]> = ref([])

/**
 * Option de tri sélectionnée.
 * @type {Ref<string>}
 * @default 'releaseDate'
 */
const sortOption: Ref<string> = ref('releaseDate')

/**
 * Options de tri disponibles pour les jeux,
 * permet à l'utilisateur de choisir comment trier les jeux.
 * @type {SortOption[]}
 */
const sortOptions: SortOption[] = [
  { label: 'Release date', value: 'releaseDate' },
  { label: 'Alphabetical A-Z', value: 'titleAsc' },
  { label: 'Alphabetical Z-A', value: 'titleDesc' },
]

/**
 * Liste des langues disponibles, récupérées depuis l'API.
 * @type {Ref<LanguageModel[]>}
 */
const languages: Ref<LanguageModel[]> = ref([])

/**
 * Liste des catégories triées par ordre alphabétique.
 * @type {ComputedRef<GamePlatformModel[]>}
 */
const sortedGameCategories: ComputedRef<GamePlatformModel[]> = computed(() => {
  return [...gameCategories.value].sort((a: GamePlatformModel, b: GamePlatformModel) => a.name.localeCompare(b.name))
})

/**
 * Liste des langues triées par ordre alphabétique.
 * @type {ComputedRef<LanguageModel[]>}
 */
const sortedLanguages: ComputedRef<LanguageModel[]> = computed(() => {
  return [...languages.value].sort((a: LanguageModel, b: LanguageModel) => a.name.localeCompare(b.name))
})

/**
 * Références aux conteneurs des menus pour détecter les clics en dehors.
 * @type {Ref<HTMLElement | null>}
 */
const genresContainer: Ref<HTMLElement | null> = ref<HTMLElement | null>(null)
const genresMenu: Ref<HTMLElement | null> = ref<HTMLElement | null>(null)
const sortContainer: Ref<HTMLElement | null> = ref<HTMLElement | null>(null)
const sortMenu: Ref<HTMLElement | null> = ref<HTMLElement | null>(null)
const moreFiltersContainer: Ref<HTMLElement | null> = ref<HTMLElement | null>(null)
const moreFiltersMenu: Ref<HTMLElement | null> = ref<HTMLElement | null>(null)

/* CYCLE - HOOKS */
/**
 * Lifecycle hook mounted
 * @returns {Promise<void>} - Promise void
 */
onMounted(async (): Promise<void> => {
  await fetchAllGamesAndEnrichGame()
  await fetchGameCategories()
  await fetchLanguages()

  // Ajouter un écouteur pour détecter les clics en dehors
  document.addEventListener('click', handleClickOutside)
})

/**
 * Lifecycle hook unmounted
 * Nettoie l'écouteur d'événements pour éviter les fuites de mémoire
 */
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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
    selectedGameModes.value = [] // Réinitialise les modes de jeu
    selectedLanguages.value = [] // Réinitialise les langues
    await fetchAllGamesAndEnrichGame()
  } else {
    // Si la searchbar est vide et "Enter" est pressé, revenir à "All Games"
    isSearchActive.value = false
    lastValidatedSearchTerm.value = ''
    activeCategory.value = 'All'
    activeFilter.value = 'all'
    currentPage.value = 1
    selectedGenres.value = []
    selectedGameModes.value = []
    selectedLanguages.value = []
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
  selectedGameModes.value = [] // Réinitialise les modes de jeu
  selectedLanguages.value = [] // Réinitialise les langues
  await fetchAllGamesAndEnrichGame()
}

/**
 * Permet de définir le filtre actif.
 * @param {filter} filter - Filtre actif ('all' ou 'featured')
 * @returns {void}
 */
const setFilter: (filter: filter) => Promise<void> = async (filter: filter): Promise<void> => {
  activeFilter.value = filter
  searchTerm.value = '' // Réinitialise la recherche
  lastValidatedSearchTerm.value = ''
  isSearchActive.value = false // Désactive le filtre de recherche
  activeCategory.value = 'All' // Réinitialise la catégorie
  currentPage.value = 1 // Réinitialise la page courante
  selectedGenres.value = [] // Réinitialise les genres sélectionnés
  selectedGameModes.value = [] // Réinitialise les modes de jeu
  selectedLanguages.value = [] // Réinitialise les langues
  await fetchAllGamesAndEnrichGame(filter)
}

/**
 * Bascule l'affichage du menu déroulant des genres.
 * @returns {void}
 */
const toggleGenreFilter: () => void = (): void => {
  if (sortFilter.value) {
    sortFilter.value = false // Ferme le menu de tri si ouvert
  }
  if (moreFilters.value) {
    moreFilters.value = false // Ferme le menu "Plus de filtres" si ouvert
  }
  genreFilter.value = !genreFilter.value // Ouvre ou ferme le menu des genres
}

/**
 * Bascule l'affichage du menu déroulant du tri.
 * @returns {void}
 */
const toggleSortFilter: () => void = (): void => {
  if (genreFilter.value) {
    genreFilter.value = false // Ferme le menu de genres si ouvert
  }
  if (moreFilters.value) {
    moreFilters.value = false // Ferme le menu "Plus de filtres" si ouvert
  }
  sortFilter.value = !sortFilter.value // Ouvre ou ferme le menu de tri
}

/**
 * Bascule l'affichage du menu déroulant "Plus de filtres".
 * @returns {void}
 */
const toggleMoreFilters: () => void = (): void => {
  if (genreFilter.value) {
    genreFilter.value = false // Ferme le menu de genres si ouvert
  }
  if (sortFilter.value) {
    sortFilter.value = false // Ferme le menu de tri si ouvert
  }
  moreFilters.value = !moreFilters.value // Ouvre ou ferme le menu "Plus de filtres"
}

/**
 * Définit l'option de tri sélectionnée.
 * @param {string} value - Valeur de l'option de tri
 * @returns {void}
 */
const setSortOption: (value: string) => void = (value: string): void => {
  sortOption.value = value
  toggleSortFilter() // Ferme le menu après sélection
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
  activeCategory.value =
    selectedGenres.value.length > 0 || selectedGameModes.value.length > 0 || selectedLanguages.value.length > 0
      ? 'Custom'
      : 'All'
  await fetchAllGamesAndEnrichGame()
}

/**
 * Toggle la sélection d'un mode de jeu.
 * @param {string} mode - Le mode de jeu à sélectionner/désélectionner (solo ou multijoueur)
 * @returns {void}
 */
const toggleGameModeSelection: (mode: string) => Promise<void> = async (mode: string): Promise<void> => {
  if (selectedGameModes.value.includes(mode)) {
    selectedGameModes.value = selectedGameModes.value.filter((m: string) => m !== mode)
  } else {
    selectedGameModes.value.push(mode)
  }
  activeCategory.value =
    selectedGenres.value.length > 0 || selectedGameModes.value.length > 0 || selectedLanguages.value.length > 0
      ? 'Custom'
      : 'All'
  await fetchAllGamesAndEnrichGame()
}

/**
 * Toggle la sélection d'une langue.
 * @param {string} language - La langue à sélectionner/désélectionner
 * @returns {void}
 */
const toggleLanguageSelection: (language: string) => Promise<void> = async (language: string): Promise<void> => {
  if (selectedLanguages.value.includes(language)) {
    selectedLanguages.value = selectedLanguages.value.filter((l: string) => l !== language)
  } else {
    selectedLanguages.value.push(language)
  }
  activeCategory.value =
    selectedGenres.value.length > 0 || selectedGameModes.value.length > 0 || selectedLanguages.value.length > 0
      ? 'Custom'
      : 'All'
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
 * Récupère toutes les langues depuis l'API.
 * @returns {Promise<void>}
 */
const fetchLanguages: () => Promise<void> = async (): Promise<void> => {
  try {
    languages.value = await LanguagesService.getAllLanguages()
  } catch (error: any) {
    logger.error('[fetchLanguages] Erreur lors de la récupération des langues : ', error)
  }
}

/**
 * Réinitialise tous les genres sélectionnés.
 * @returns {void}
 */
const clearAllGenres: () => Promise<void> = async (): Promise<void> => {
  selectedGenres.value = []
  activeCategory.value = selectedGameModes.value.length > 0 || selectedLanguages.value.length > 0 ? 'Custom' : 'All'
  await fetchAllGamesAndEnrichGame()
}

/**
 * Réinitialise tous les filtres de "Plus de filtres".
 * @returns {void}
 */
const clearAllMoreFilters: () => Promise<void> = async (): Promise<void> => {
  selectedGameModes.value = []
  selectedLanguages.value = []
  activeCategory.value = selectedGenres.value.length > 0 ? 'Custom' : 'All'
  await fetchAllGamesAndEnrichGame()
}

/**
 * Permet de trier les jeux en fonction de l'option de tri sélectionnée.
 * Les filtres (genres, langues, modes de jeu, "featured") sont gérés côté backend.
 * @returns {ExtendedGameModel[]}
 */
const filteredGames: ComputedRef<ExtendedGameModel[]> = computed((): ExtendedGameModel[] => {
  let filtered: ExtendedGameModel[] = [...games.value] // Créer une copie pour éviter de modifier l'original

  // Appliquer le tri
  filtered.sort((a: ExtendedGameModel, b: ExtendedGameModel) => {
    switch (sortOption.value) {
      case 'releaseDate':
        return new Date(b.release_date).getTime() - new Date(a.release_date).getTime() // Plus récent au plus ancien
      case 'titleAsc':
        return a.title.localeCompare(b.title) // A-Z
      case 'titleDesc':
        return b.title.localeCompare(a.title) // Z-A
      default:
        return 0
    }
  })

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
 * @param {filter} [filter] - Filtre actif pour les jeux à récupérer (optionnel)
 * @returns {Promise<void>} Une promesse qui se résout une fois les données chargées.
 */
const fetchAllGamesAndEnrichGame: (filter?: filter) => Promise<void> = async (filter?: filter): Promise<void> => {
  // Activation de l'indicateur de chargement des jeux
  isLoadingGames.value = true

  try {
    // Récupération des jeux depuis le store avec les paramètres de recherche, pagination et filtres
    const response: GameModel[] = await gameStore.getAllGames(
      lastValidatedSearchTerm.value || undefined, // Utilise la recherche validée
      currentPage.value, // Page actuelle
      perPage.value, // Nombre d'éléments par page
      selectedGenres.value.length > 0 ? selectedGenres.value : undefined, // Genres sélectionnés
      selectedLanguages.value.length > 0 ? selectedLanguages.value : undefined, // Langues sélectionnées
      selectedGameModes.value.length > 0 ? selectedGameModes.value : undefined, // Modes de jeu sélectionnés
      filter === 'featured', // Filtre actif pour les jeux à la une (nouveaux ou à venir)
    )

    // Initialisation de la liste des jeux à enrichir
    let fetchedGames: GameModel[] = response

    // Récupération des métadonnées depuis l'état du store
    const paginationMeta: PaginationMeta = gameStore.paginationMeta || {
      total: 0,
      from: 0,
      to: 0,
      currentPage: 1,
      perPage: 24,
    }
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

/**
 * Gère les clics en dehors des menus déroulants pour les fermer automatiquement.
 * @param {MouseEvent} event - L'événement de clic
 * @returns {void}
 */
const handleClickOutside: (event: MouseEvent) => void = (event: MouseEvent): void => {
  if (
    genresContainer.value &&
    !genresContainer.value.contains(event.target as Node) &&
    genresMenu.value &&
    !genresMenu.value.contains(event.target as Node)
  ) {
    genreFilter.value = false
  }
  if (
    sortContainer.value &&
    !sortContainer.value.contains(event.target as Node) &&
    sortMenu.value &&
    !sortMenu.value.contains(event.target as Node)
  ) {
    sortFilter.value = false
  }
  if (
    moreFiltersContainer.value &&
    !moreFiltersContainer.value.contains(event.target as Node) &&
    moreFiltersMenu.value &&
    !moreFiltersMenu.value.contains(event.target as Node)
  ) {
    moreFilters.value = false
  }
}

/**
 * Gère le changement de page et effectue un défilement vers le haut si nécessaire.
 * @param {filter} [filter] - Filtre actif (optionnel)
 * @returns {Promise<void>}
 */
const handlePageChange: () => Promise<void> = async (): Promise<void> => {
  await fetchAllGamesAndEnrichGame()
}
</script>