<template>
  <div class="flex flex-col items-center space-y-2.5">
    <!-- Lien pour créer un compte -->
    <a
      style="margin-bottom: 10px"
      class="cursor-pointer text-base font-medium text-yellow-500 hover:text-yellow-400 hover:underline"
      @click="(event) => handleLinkClick(linkSignupURL, event)"
    >
      Create a free Crzgames.com account
    </a>
    <!-- Lien pour réinitialiser le mot de passe, si l'utilisateur a oublié son mot de passe -->
    <a
      class="cursor-pointer text-base font-medium text-yellow-500 hover:text-yellow-400 hover:underline"
      @click="(event) => handleLinkClick(linkForgotPasswordURL, event)"
    >
      Impossible to connect ?
    </a>
  </div>
</template>

<script lang="ts" setup>
import { open } from '@tauri-apps/plugin-shell'

/* DATA */
const linkSignupURL: string = import.meta.env.VITE_WEBSITE_BASE_URL_SIGNUP
const linkForgotPasswordURL: string = import.meta.env.VITE_WEBSITE_BASE_URL_FORGOT_PASSWORD

/* METHODS */
/**
 * Cliquer sur un lien.
 * @param {string} url - The URL to open.
 * @param {Event} event - The click event.
 * @returns {Promise<void>}
 */
const handleLinkClick: (url: string, event: Event) => Promise<void> = async (
  url: string,
  event: Event,
): Promise<void> => {
  event.preventDefault()

  // Ouvrir le lien dans le navigateur par défaut
  await open(url)
}
</script>
