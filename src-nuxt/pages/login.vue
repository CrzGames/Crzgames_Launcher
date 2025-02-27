<template>
  <main class="mx-auto max-w-xl bg-blue-800">
    <WindowBar />

    <CrzLogo2 />

    <LoginForm class="px-5 py-0" :stayLoggedIn="stayLoggedIn" :initialCredentials="credentials" :showLabels="false">
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

    <LoginLinks style="margin-top: 25px" />
  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'

import CrzCheckbox from '#src-common/components/buttons/CrzCheckbox.vue'
import CrzSquareIconButton from '#src-common/components/buttons/CrzSquareIconButton.vue'
import CrzLogo2 from '#src-common/components/ui/CrzLogo2.vue'

import type { Credentials, SystemOSInfo } from '#src-core/services/TauriService'
import { TauriService } from '#src-core/services/TauriService'

import LoginForm from '#src-nuxt/components/forms/LoginForm.vue'
import LoginLinks from '#src-nuxt/components/login/LoginLinks.vue'
import WindowBar from '#src-nuxt/components/window-bar/WindowBar.vue'
import { useWindowStore } from '#src-nuxt/stores/window.store'

/* REFS */
const stayLoggedIn: Ref<boolean> = ref(false)
const credentials: Ref<Credentials | undefined> = ref(undefined)

/* STATE */
let osSystemCurrent: SystemOSInfo | undefined = undefined

/* CYCLE - HOOKS */
/**
 * Lifecycle hook: mounted
 * @returns {Promise<void>}
 */
onMounted(async (): Promise<void> => {
  // DEBUG: Get OS System Info
  osSystemCurrent = await TauriService.getSystemOSCurrent()
  if (osSystemCurrent) console.log(JSON.stringify(osSystemCurrent))

  /**
   * Récupération des identifiants de connexion sauvegarder sur le PC de l'utilisateur (stayLoggedIn.json)
   * si l'utilisateur à cocher la case "Stay logged in" lors de la connexion précédente
   */
  credentials.value = await TauriService.getStayLoggedIn()
  if (credentials.value) {
    // Si les identifiants de connexion sont récupérés, on coche automatiquement la case "Stay logged in"
    stayLoggedIn.value = true
  }

  // On utilise cela si on se déconnecte et qu'ont n'ai rediriger sur la page login
  useWindowStore().setLoading(false)
})

/* METHODS */
/**
 * Stay logged in checkbox click event.
 * @returns {void}
 */
const onClickStayLoggedIn: () => void = (): void => {
  stayLoggedIn.value = !stayLoggedIn.value
}

/**
 * Prevent default click action.
 * @param {Event} event - The click event
 * @returns {void}
 */
const preventDefault: (event: Event) => void = (event: Event): void => {
  event.preventDefault()
}
</script>
