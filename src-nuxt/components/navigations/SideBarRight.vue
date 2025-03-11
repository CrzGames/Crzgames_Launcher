<template>
  <div
    id="application-sidebar-right"
    :class="menuIsExpanded ? '' : 'w-[80px]'"
    class="fixed right-0 z-10 flex h-screen w-[256px] flex-col items-center justify-start overflow-hidden bg-blue-900/90 py-4 text-white transition-all duration-300"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    style="height: calc(100vh - 35px)"
  >
    <nav class="flex h-full w-full flex-col flex-wrap">
      <ul class="grid w-full gap-3">
        <li
          v-clickOutSide="onClickOutsideUserMenu"
          class="inline w-full cursor-pointer select-none px-2 py-1 hover:bg-zinc-100"
          @click="showUserMenu = !showUserMenu"
        >
          <span class="flex items-center justify-center gap-x-3.5">
            <!-- Conteneur pour l'avatar et l'icône de statut -->
            <div class="relative">
              <CrzAvatar photo="/images/avatar-placeholder.jpeg" :name="user?.username" />
              <!-- Position absolue pour l'icône de statut -->
              <CrzIcon
                v-if="statusConnected === 'Online'"
                name="circle-check"
                view-box="0 0 512 512"
                color="#00ff84"
                :width="18"
                :height="18"
                class="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2"
              />
              <CrzIcon
                v-if="statusConnected === 'Unavailable'"
                name="clock"
                mode="fill"
                :width="22"
                :height="22"
                color="#ffe66b"
                style="color: #111827"
                class="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2"
              />
              <CrzIcon
                v-if="statusConnected === 'Invisible'"
                name="circle"
                mode="fill"
                :width="22"
                :height="22"
                color="#908e97"
                style="color: #111827"
                class="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2"
              />
            </div>

            <span v-if="menuIsExpanded" class="max-w-[135px] truncate text-sm font-medium">
              {{ user?.username }}
            </span>

            <CrzIcon v-if="menuIsExpanded" name="chevron-down" mode="stroke" class="ml-auto" />
          </span>

          <UserMenu
            @open-myprofile-modal="openMyProfileModal"
            style="z-index: 1"
            :showUserMenu="showUserMenu"
            :onStatusChange="handleStatusChange"
          />
        </li>
      </ul>

      <!-- Modal MyFriend -->
      <!--<MyProfile v-if="isMyProfileModalOpen" @close="isMyProfileModalOpen = false" />-->
    </nav>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
// Ajout de onUnmounted
import type { Ref } from 'vue'

import CrzAvatar from '#src-common/components/ui/CrzAvatar.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import type UserModel from '#src-common/core/models/UserModel'

import { TauriService } from '#src-core/services/TauriService'
import type { UserConnectedStatus } from '#src-core/services/TauriService'

import UserMenu from '#src-nuxt/components/menus/UserMenu.vue'
import { useAuthStore } from '#src-nuxt/stores/auth.store'

/* REFS */
const user: Ref<UserModel | undefined> = ref(useAuthStore().user)

const isMyProfileModalOpen: Ref<boolean> = ref(false)

const menuIsExpanded: Ref<boolean> = ref(window.innerWidth >= 1448) // Modifié à 1448
const showUserMenu: Ref<boolean> = ref(false)

const statusConnected: Ref<string> = ref('Online')

/* HOOKS */
/**
 * On mounted
 * @returns {Promise<void>}
 */
onMounted(async (): Promise<void> => {
  // Update status connected
  const savedStatusConnected: UserConnectedStatus | undefined = await TauriService.getStatusConnected()
  if (savedStatusConnected) {
    statusConnected.value = savedStatusConnected
  }

  // Ajouter un écouteur pour les redimensionnements
  window.addEventListener('resize', updateSidebarState)
})

/**
 * On unmounted
 * @returns {void}
 */
onUnmounted((): void => {
  window.removeEventListener('resize', updateSidebarState)
})

/* METHODS */
/**
 * Update sidebar state
 * @returns {void}
 */
const updateSidebarState: () => void = (): void => {
  menuIsExpanded.value = window.innerWidth >= 1448 || showUserMenu.value
}

/**
 * Close the user menu
 * @returns {void}
 */
const onClickOutsideUserMenu: () => void = (): void => {
  showUserMenu.value = false
  updateSidebarState()
}

/**
 * On mouse enter
 * @returns {void}
 */
const onMouseEnter: () => void = (): void => {
  menuIsExpanded.value = true
}

/**
 * On mouse leave
 * @returns {void}
 */
const onMouseLeave: () => void = (): void => {
  menuIsExpanded.value = window.innerWidth >= 1448
  showUserMenu.value = false
}

/**
 * Open my profile modal
 * @returns {void}
 */
const openMyProfileModal: () => void = (): void => {
  isMyProfileModalOpen.value = true
}

/**
 * Handle status change
 * @param {UserConnectedStatus} newStatus - The new status
 * @returns {void}
 */
const handleStatusChange: (newStatus: UserConnectedStatus) => void = (newStatus: UserConnectedStatus): void => {
  statusConnected.value = newStatus
  TauriService.setStatusConnected(newStatus)
}
</script>
