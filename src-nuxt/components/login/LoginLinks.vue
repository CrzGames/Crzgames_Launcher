<template>
  <div class="flex flex-col items-center space-y-2.5">
    <a
      style="margin-bottom: 10px"
      class="cursor-pointer text-base font-medium text-yellow-500 hover:text-yellow-400 hover:underline"
      @click="(event) => handleLinkClick(linkSignupURL, event)"
    >
      Create a free Crzgames.com account
    </a>
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

/* VARS */
const linkSignupURL: string = import.meta.env.VITE_WEBSITE_BASE_URL_SIGNUP
const linkForgotPasswordURL: string = import.meta.env.VITE_WEBSITE_BASE_URL_FORGOT_PASSWORD

/* METHODS */
/**
 * Handle the click event on a link.
 * @param {string} url - The URL to open.
 * @param {Event} event - The click event.
 * @returns {Promise<void>}
 */
const handleLinkClick: (url: string, event: Event) => Promise<void> = async (
  url: string,
  event: Event,
): Promise<void> => {
  event.preventDefault()
  // Open the URL in the default browser
  await open(url)
}
</script>
