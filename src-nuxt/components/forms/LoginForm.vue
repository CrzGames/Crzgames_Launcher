<template>
  <Form v-slot="{ meta }" class="flex flex-col gap-6" @submit="signIn">
    <CrzInput
      v-model:value="credentials.email"
      type="email"
      id="email"
      placeholder="email@crzgames.com"
      @keyup.enter="signIn"
    />

    <CrzInput
      v-model:value="credentials.password"
      type="password"
      id="password"
      placeholder="**************"
      @keyup.enter="signIn"
    />

    <slot />

    <!-- Bouton de connexion désactivé si les champs sont vides -->
    <CrzButton
      :load="buttonLoading"
      :disabled="isFormInvalid"
      :class="{ 'disabled-button': isFormInvalid }"
      type="submit"
    >
      {{ buttonLoading ? 'Loading...' : 'Login' }}
    </CrzButton>

    <!-- Modal si le compte n'est pas activé -->
    <CrzConfirmModal
      :show="showModal"
      :title="'Your account is not activated'"
      :message="'Please check your email for the verification code or click the Confirm button to resend an activation code by email.'"
      @update:show="showModal = $event"
      @ok="resendMailCodeActivationAccount"
      @cancel="showModal = false"
    />
  </Form>
</template>

<script lang="ts" setup>
import { Form } from 'vee-validate'
import { ref, watchEffect } from 'vue'
import type { Ref } from 'vue'

import CrzButton from '#src-common/components/buttons/CrzButton.vue'
import CrzInput from '#src-common/components/buttons/CrzInput.vue'
import CrzConfirmModal from '#src-common/components/modals/CrzConfirmModal.vue'
import type { AuthModel } from '#src-common/core/models/AuthModel'
import AuthService from '#src-common/core/services/AuthService'

import { TauriService } from '#src-core/services/TauriService'
import type { Credentials } from '#src-core/services/TauriService'

import { useAppStore } from '#src-nuxt/stores/app.store'
import { useAuthStore } from '#src-nuxt/stores/auth.store'

const { $notyf } = useNuxtApp()

/* PROPS */
// eslint-disable-next-line @typescript-eslint/typedef
const props = defineProps({
  showLabels: {
    type: Boolean,
    default: true,
  },
  stayLoggedIn: {
    type: Boolean,
    default: false,
  },
  initialCredentials: {
    type: Object,
    default: undefined,
  },
})

/* REFS */
const credentials: Ref<Credentials> = ref({
  email: '',
  password: '',
})
const buttonLoading: Ref<boolean> = ref(false)
const showModal: Ref<boolean> = ref(false)

/* COMPUTED REF */
// Vérifie si les champs sont vides
const isFormInvalid: ComputedRef<boolean> = computed((): boolean => {
  return credentials.value.email.trim().length === 0 || credentials.value.password.trim().length === 0
})

/* DATA */
let tryToSignIn: boolean = false // Indique si on a déjà essayé de se connecter automatiquement

/* LIFE CYCLE - HOOKS */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async (): Promise<void> => {
  if (props.initialCredentials) {
    credentials.value = { ...(props.initialCredentials as Credentials) }

    // Checker si la page précédente était la page d'index
    const appStore: any = useAppStore()
    if (appStore.previousUrl === '/' && !tryToSignIn) {
      // Si la route précédente était la page d'index, se connecter automatiquement à l'application
      // Si les informations de connexion sont déjà enregistrées dans le PC de l'utilisateur
      await signIn()
      tryToSignIn = true
    }
  }
})

/* METHODS */
/**
 * Sign in the user.
 * @returns {Promise<void>}
 */
const signIn: () => Promise<void> = async (): Promise<void> => {
  // On désactive le bouton de connexion
  buttonLoading.value = true

  /**
   * Si l'utilisateur a coché la case "Stay logged in",
   * on enregistre les informations de connexion dans le PC de l'utilisateur.
   * Sinon, on supprime les informations de connexion du PC de l'utilisateur.
   */
  if (props.stayLoggedIn) {
    const dataStayLoginIn: Credentials = {
      email: credentials.value.email,
      password: credentials.value.password,
    }
    await TauriService.setStayLoggedIn(dataStayLoginIn)
  } else {
    await TauriService.removeStayLoggedIn()
  }

  /**
   * On tente de connecter l'utilisateur.
   * Sinon, on affiche un message d'erreur à l'utilisateur par rapport à l'erreur rencontrée.
   */
  let isConnected: AuthModel | null = null
  try {
    isConnected = await useAuthStore().signIn(credentials.value)
  } catch (error: any) {
    if (
      error.response?.data &&
      typeof error.response.data === 'string' &&
      error.response.data === 'Account is not active'
    ) {
      showModal.value = true
    } else {
      console.error('Unexpected error:', error)
    }
  }

  /**
   * Si l'utilisateur est connecté, on le redirige vers la page d'accueil.
   */
  if (!!isConnected) {
    buttonLoading.value = false
    await goToPageHome()
    return
  }

  /**
   * Si l'utilisateur n'est pas connecté, on affiche un message d'erreur à l'utilisateur.
   */
  buttonLoading.value = false
  $notyf.error('Failed to sign in')
}

/**
 * Go to the home page.
 * @returns {Promise<void>}
 */
const goToPageHome: () => Promise<void> = async (): Promise<void> => {
  try {
    await TauriService.adjustWindowToHome(1030, 660)
  } catch (error) {
    console.error('goToPageHome error:', error)
  }
}

/**
 * Resend the activation code to the user's email.
 * @returns {Promise<void>}
 */
const resendMailCodeActivationAccount: () => Promise<void> = async (): Promise<void> => {
  await AuthService.resendNewCodeVerificationAccount(credentials.value.email)
  showModal.value = false
}
</script>
