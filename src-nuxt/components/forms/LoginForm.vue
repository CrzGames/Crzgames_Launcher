<template>
  <Form v-slot="{ meta }" class="flex flex-col gap-6" @submit="signIn">
    <!-- Input pour l'email -->
    <CrzInput v-model:value="credentials.email" type="email" id="email" placeholder="email@crzgames.com" />

    <!-- Input pour le mot de passe -->
    <CrzInput v-model:value="credentials.password" type="password" id="password" placeholder="**************" />

    <!-- Slot pour insérer des éléments entre les inputs et le bouton de connexion -->
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
/**
 * Les identifiants de connexion de l'utilisateur.
 * @type {Ref<Credentials>}
 * @example { email: 'xxx@orange.fr', password: '123456' }
 */
const credentials: Ref<Credentials> = ref({
  email: '',
  password: '',
})

/**
 * Permet de savoir si le bouton de connexion est cliqué pour éviter les double clics et
 * les envois multiples du formulaire.
 * @type {Ref<boolean>} - True si le bouton de connexion n'ai pas cliquable, false si le bouton de connexion est cliquable.
 */
const buttonLoading: Ref<boolean> = ref(false)

/**
 * Permet d'afficher ou non la modal si le compte n'est pas activé.
 * @type {Ref<boolean>} - True si le compte n'est pas activé, false si le compte est activé.
 */
const showModal: Ref<boolean> = ref(false)

/* COMPUTED REF */
/**
 * Vérifie si les inputs du formulaire ont été remplis de minimum 1 caractère chacun.
 * @returns {boolean} - True si le formulaire est invalide, false si le formulaire est valide.
 */
const isFormInvalid: ComputedRef<boolean> = computed((): boolean => {
  return credentials.value.email.trim().length === 0 || credentials.value.password.trim().length === 0
})

/* DATA */
/**
 * Permet de savoir si la personne c'est déjà connecté automatiquement au démarrage du launcher.
 * Pour éviter si la personne était sur la page home et qu'elle revient sur la page login, de se reconnecter automatiquement.
 * @type {boolean}
 */
let tryToSignInAuto: boolean = false

/* LIFE CYCLE - HOOKS */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async (): Promise<void> => {
  /**
   * Si les informations de connexion sont déjà enregistrées dans le PC de l'utilisateur,
   * on tente de connecter l'utilisateur automatiquement à l'application, si il avait coché la case "Stay logged in"
   * lors de la connexion précédente.
   */
  if (props.initialCredentials) {
    credentials.value = props.initialCredentials as Credentials
    await signInAuto()
  }
})

/* METHODS */
/**
 * Si la route précédente était la page d'index (auto update) et qu'ont arrive sur la page login,
 * se connecter automatiquement à l'application si les informations de connexion sont déjà enregistrées
 * dans le PC de l'utilisateur et si il avait coché la case "Stay logged in" lors de la connexion précédente.
 * @returns {Promise<void>}
 */
const signInAuto: () => Promise<void> = async (): Promise<void> => {
  try {
    const appStore: any = useAppStore()
    if (appStore.previousUrl === '/' && !tryToSignInAuto) {
      await signIn()
      tryToSignInAuto = true
    }
  } catch (error) {
    console.error('signInAuto error:', error)
  }
}

/**
 * Sign in the user.
 * @returns {Promise<void>}
 */
const signIn: () => Promise<void> = async (): Promise<void> => {
  // Si la connexion est en cours, on ne fait rien
  if (buttonLoading.value) return

  // On désactive le bouton de connexion pour éviter les double clics et les envois multiples du formulaire
  buttonLoading.value = true

  /**
   * Si l'utilisateur a coché la case "Stay logged in" lors de la connexion,
   * on enregistre les informations de connexion dans le PC de l'utilisateur.
   */
  if (props.stayLoggedIn) {
    const dataStayLoginIn: Credentials = {
      email: credentials.value.email,
      password: credentials.value.password,
    }
    await TauriService.setStayLoggedIn(dataStayLoginIn)
  }

  /**
   * On tente de connecter l'utilisateur.
   * Sinon, on affiche un message d'erreur à l'utilisateur par rapport à l'erreur rencontrée.
   */
  let isConnected: AuthModel | null = null
  try {
    isConnected = await useAuthStore().signIn(credentials.value)
  } catch (error: any) {
    // Récupération du code HTTP et du message d'erreur
    const statusCode: any = error.response?.status
    const errorMessage: any = error.response?.data

    // Cas où le compte n'est pas activé
    if (errorMessage && typeof errorMessage === 'string' && errorMessage === 'Account is not active') {
      showModal.value = true
      return
    }

    // Cas où les identifiants sont incorrects (401, 403)
    if (statusCode === 401 || statusCode === 403) {
      $notyf.error({
        message: `
          <div style="font-size: 14px; line-height: 1.4; max-width: 280px;">
            <strong>Login failed.</strong><br>
            Please check your email and password.
          </div>
        `,
      })
      return
    }

    // Cas où le serveur est HS (500+)
    if (statusCode >= 500) {
      $notyf.error({
        message: `
          <div style="font-size: 14px; line-height: 1.4; max-width: 280px;">
            <strong>Server error.</strong><br>
            The CrzGames servers are currently unavailable.<br>
            Please try again later.
          </div>
        `,
      })
      return
    }

    // Cas inconnu : afficher un message générique
    console.error('SignIn Unexpected error:', error)
    $notyf.error({
      message: `
        <div style="font-size: 14px; line-height: 1.4; max-width: 280px;">
          <strong>Unexpected error.</strong><br>
          An unknown issue occurred.<br />
          Please try again.
        </div>
      `,
    })
    return
  } finally {
    /**
     * On réactive le bouton de connexion pour permettre à l'utilisateur
     * de se connecter à nouveau si la connexion a échoué.
     */
    buttonLoading.value = false
  }

  /**
   * Si l'utilisateur à réussi a ce connecté, on le redirige vers la page d'accueil.
   */
  if (!!isConnected) {
    await goToPageHome()
  }
}

/**
 * Allez à la page d'accueil de l'application.
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
 * Renverra un code d'activation par mail pour activer le compte de l'utilisateur.
 * @returns {Promise<void>}
 */
const resendMailCodeActivationAccount: () => Promise<void> = async (): Promise<void> => {
  await AuthService.resendNewCodeVerificationAccount(credentials.value.email)
  showModal.value = false
}

/**
 * Expose la méthode `signIn` pour être accessible depuis `login.vue`
 */
defineExpose({ signIn })
</script>
