<template>
  <!-- Boutons de navigation -->
  <div class="navigation-buttons">
    <!-- Bouton précédent -->
    <button @click="goBack" :class="{ active: canGoBack }" class="nav-btn">
      <img src="/images/arrow-left.svg" alt="Back" />
    </button>

    <!-- Bouton suivant -->
    <button @click="goForward" :class="{ active: canGoForward }" class="nav-btn">
      <img src="/images/arrow-right.svg" alt="Next" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import type { Router } from 'vue-router'
import { useNavigationStore } from '~/stores/navigation.store'

console.log('NavigationPages.vue')
/* DATA */
const router: Router = useRouter()

/* STORES */
const navigationStore: any = useNavigationStore()

/**
 * Vérifie si un retour en arrière est possible.
 * @type {ComputedRef<boolean>}
 */
const canGoBack: ComputedRef<boolean> = computed((): boolean => navigationStore.currentIndex > 0)

/**
 * Vérifie si une navigation en avant est possible.
 * @type {ComputedRef<boolean>}
 */
const canGoForward: ComputedRef<boolean> = computed(
  (): boolean => navigationStore.currentIndex < navigationStore.history.length - 1,
)

/**
 * Navigue vers la page précédente si possible.
 * @returns {void}
 */
const goBack: () => void = (): void => {
  const previousPage: string | null = navigationStore.goBack()
  if (previousPage) {
    router.push(previousPage)
  }
}

/**
 * Navigue vers la page suivante si possible.
 * @returns {void}
 */
const goForward: () => void = (): void => {
  const nextPage: string | null = navigationStore.goForward()
  if (nextPage) {
    router.push(nextPage)
  }
}
</script>

<style lang="scss" scoped>
/* Conteneur des boutons */
.navigation-buttons {
  display: flex;
  gap: 12px; /* Espacement entre les boutons */
}

/* Style des boutons */
.nav-btn {
  width: 36px; /* Taille exacte de ton image */
  height: 36px;
  background-color: rgba(50, 52, 69, 0.9); /* Fond sombre légèrement transparent */
  border: 1px solid transparent; /* Bordure invisible par défaut */
  border-radius: 8px; /* Coins arrondis */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: all 0.2s ease-in-out;
}

/* Style des icônes */
.nav-btn img {
  width: 20px;
  height: 20px;
}

/* Style des icônes (non active -> grisée) */
.nav-btn:not(.active) img {
  filter: brightness(0) invert(0.6); /* Icône gris clair */
}

/* Bouton actif (image normale) */
.nav-btn.active img {
  filter: none; /* Aucune modification sur l'icône */
}

/* Bouton sans hover */
.nav-btn.active {
  background-color: rgb(29, 32, 51); /* Fond actif actuel */
  border: 2px solid #64676d; /* Bordure grise */
}

/* Bouttons hover */
.nav-btn.active:hover {
  background-color: rgb(52, 54, 71) !important; /* Fond légèrement éclairci */
  border-color: #b0b3b8 !important; /* Bordure gris clair */
  cursor: pointer;
}
</style>
