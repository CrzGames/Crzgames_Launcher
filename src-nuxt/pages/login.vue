<template>
  <main class="mx-auto max-w-xl bg-blue-800">
    <!-- Spinner affiché lorsque isLoading est vrai (changement de fenetre window) -->
    <div v-if="windowStore.isLoading" class="spinner-overlay bg-blue-800">
      <CrzSpinner />
    </div>

    <!-- Barre Window -->
    <WindowBar />

    <!-- Logo CrzGames -->
    <CrzLogo2 />

    <!-- Formulaire de connexion -->
    <LoginForm
      ref="loginFormRef"
      class="px-5 py-0"
      :stayLoggedIn="stayLoggedIn"
      :initialCredentials="credentials"
      :showLabels="false"
    >
      <!-- Case à cocher "Stay logged in" + Tooltip -->
      <div class="flex items-center gap-2">
        <CrzCheckbox
          @change="onClickStayLoggedIn"
          class="mr-1.5"
          id="stayLoggedIn"
          label="Stay logged in"
          :checked="stayLoggedIn"
        />
        <div @click.prevent="preventDefault">
          <CrzSquareIconButton
            style="color: #908e97; margin-left: -15px; padding-bottom: 20px"
            tooltip="Save your credentials on this device and connect automatically on the next launch"
            variant="none"
            iconMode="stroke"
            iconName="tool-tip"
          />
        </div>
      </div>
    </LoginForm>

    <!-- Differents liens -->
    <LoginLinks style="margin-top: 25px" />
  </main>
</template>

<script lang="ts" setup>
import { getCurrentWindow } from '@tauri-apps/api/window'
import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import CrzSpinner from '~~/src-common/components/loaders/CrzSpinner.vue'

import CrzCheckbox from '#src-common/components/buttons/CrzCheckbox.vue'
import CrzSquareIconButton from '#src-common/components/buttons/CrzSquareIconButton.vue'
import CrzLogo2 from '#src-common/components/ui/CrzLogo2.vue'

import type { Credentials, SystemOSInfo } from '#src-core/services/TauriService'
import { TauriService } from '#src-core/services/TauriService'

import LoginForm from '#src-nuxt/components/forms/LoginForm.vue'
import LoginLinks from '#src-nuxt/components/login/LoginLinks.vue'
import WindowBar from '#src-nuxt/components/window-bar/WindowBar.vue'
import { useWindowStore } from '#src-nuxt/stores/window.store'

/* STORES */
const windowStore: any = useWindowStore()

/* REFS */
/**
 * Stay logged (case à cocher) permet de sauvegarder les identifiants de connexion sur le PC de l'utilisateur et
 * de se connecter automatiquement, lors du prochain lancement de l'application.
 * @type {Ref<boolean>}
 */
const stayLoggedIn: Ref<boolean> = ref(false)

/**
 * Les identifiants de connexion de l'utilisateur.
 * @type {Ref<Credentials | undefined>}
 * @example { email: 'xxx@orange.fr', password: '123456' }
 */
const credentials: Ref<Credentials | undefined> = ref(undefined)

/**
 * Référence vers le composant LoginForm.
 * @type {InstanceType<typeof LoginForm> | null}
 */
const loginFormRef: Ref<InstanceType<typeof LoginForm> | null> = ref(null)

/* CYCLE - HOOKS */
/**
 * Lifecycle hook: mounted
 * @returns {Promise<void>}
 */
onMounted(async (): Promise<void> => {
  // DEBUG: Get OS System Info
  const osSystemCurrent: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
  if (osSystemCurrent) console.log(JSON.stringify(osSystemCurrent))

  retrieveSavedCredentials()

  /**
   * On écoute l'événement keydown sur toute la page de login.
   * Si l'utilisateur appuie sur la touche ENTER, on déclenche la connexion.
   */
  document.addEventListener('keydown', handleKeyDown)

  /**
   * IMPORTANT: Mettre à la fin de onMounted(), quand la page est totalement charger.
   * On utilise cela si on se déconnecte des pages home et qu'ont n'ai rediriger sur la page login
   * On utilise cela si on viens de la page d'index (update auto) et qu'ont arrive sur la page login
   */
  await nextTick(() => {
    windowStore.setLoading(false)
  })
})

/**
 * Lifecycle hook: unmounted
 * @returns {void}
 */
onUnmounted((): void => {
  /**
   * On retire l'écouteur d'événement keydown quand la page de login est déchargée.
   * Pour éviter les fuites de mémoire.
   */
  document.removeEventListener('keydown', handleKeyDown)
})

/* METHODS */
/**
 * Cochée ou décochée la case "Stay logged in" lors du clic de l'utilisateur.
 * Et si l'utilisateur décoche la case "Stay logged in", on supprime les identifiants de connexion
 * sauvegarder sur le PC
 * @returns {void}
 */
const onClickStayLoggedIn: () => void = (): void => {
  stayLoggedIn.value = !stayLoggedIn.value
  if (!stayLoggedIn.value) {
    TauriService.removeStayLoggedIn()
  }
}

/**
 * Récupère les identifiants de connexion sauvegardés sur le PC de l'utilisateur (stayLoggedIn.json)
 * si l'utilisateur a coché la case "Stay logged in" lors de la connexion précédente.
 * @returns {Promise<void>}
 */
const retrieveSavedCredentials: () => Promise<void> = async (): Promise<void> => {
  credentials.value = await TauriService.getStayLoggedIn()
  if (credentials.value) {
    // Si les identifiants de connexion sont récupérés, on coche automatiquement la case "Stay logged in"
    stayLoggedIn.value = true
  }
}

/**
 * Capture l'événement keydown sur toute la page de connexion.
 * @param {KeyboardEvent} event - The keydown event
 * @returns {void}
 */
const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
  if (event.key === 'Enter') {
    triggerSignIn()
  }
}

/**
 * Déclenche la connexion lorsque l'utilisateur appuie sur ENTER sur la page de connexion.
 * @returns {void}
 */
const triggerSignIn: () => void = (): void => {
  if (loginFormRef.value) {
    loginFormRef.value.signIn()
  }
}

/**
 * Permet de prévenir l'action par défaut d'un événement.
 * @param {Event} event - The click event
 * @returns {void}
 */
const preventDefault: (event: Event) => void = (event: Event): void => {
  event.preventDefault()
}
</script>

<style lang="scss" scoped>
/* Spinner de chargement entre les fenetre window */
.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999999;
}
</style>
