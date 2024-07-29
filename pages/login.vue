<template>
  <main class="mx-auto max-w-xl">
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
import CrzLogo2 from '@/common/components/ui/CrzLogo2.vue'
import WindowBar from '@/components/window-bar/WindowBar.vue'
import LoginForm from '@/components/forms/LoginForm.vue'
import CrzCheckbox from '~/common/components/buttons/CrzCheckbox.vue'
import LoginLinks from '@/components/login/LoginLinks.vue'
import { onMounted, ref } from 'vue'
import type { Credentials, SystemOSInfo } from '@/services/TauriService'
import { TauriService } from '@/services/TauriService'
import type { Ref } from 'vue'
import { useWindowStore } from '~/stores/window.store'
import CrzSquareIconButton from '~/common/components/buttons/CrzSquareIconButton.vue'

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

  // Get Credentials saving in PC User
  credentials.value = await TauriService.getStayLoggedIn()
  if (credentials.value) {
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
