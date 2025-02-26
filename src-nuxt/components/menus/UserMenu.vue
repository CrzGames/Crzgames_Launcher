<template>
  <div
    :class="props.showUserMenu ? 'animate-fadeIn block' : 'hidden'"
    class="absolute left-[0px] top-[70px] grid w-auto min-w-[200px] gap-1 rounded-lg border-2 border-zinc-100 bg-gray-900 px-2 py-4"
    id="menu-games"
  >
    <div
      @click="props.onStatusChange && props.onStatusChange('Online')"
      class="flex items-center gap-3 rounded-md p-3 text-sm font-medium hover:bg-gray-800 hover:bg-opacity-70"
    >
      <CrzIcon name="circle-check" view-box="0 0 512 512" color="#00ff84" :width="18" :height="18" />
      <span>Online</span>
    </div>
    <div
      class="flex items-center gap-3 rounded-md p-3 text-sm font-medium hover:bg-gray-800 hover:bg-opacity-70"
      style="margin-left: -2px"
      @click="props.onStatusChange && props.onStatusChange('Unavailable')"
    >
      <CrzIcon name="clock" mode="fill" :width="22" :height="22" color="#ffe66b" style="color: #111827" />
      <span>Unavailable</span>
    </div>
    <div
      class="flex items-center gap-3 rounded-md p-3 text-sm font-medium hover:bg-gray-800 hover:bg-opacity-70"
      style="margin-left: -2px"
      @click="props.onStatusChange && props.onStatusChange('Invisible')"
    >
      <CrzIcon name="circle" mode="fill" :width="22" :height="22" color="#908e97" style="color: #111827" />
      <span>Invisible</span>
    </div>
    <Divider class="my-2" />
    <!-- TODO: MyProfile and Setting
    <div
      @click="emitOpenMyProfileModal"
      class="flex items-center gap-3 rounded-md p-3 text-sm font-medium hover:bg-gray-800 hover:bg-opacity-70"
    >
      <CrzIcon name="friend" mode="stroke" :width="18" :height="18" />
      <span>My Profile</span>
    </div>
    <div class="flex items-center gap-3 rounded-md p-3 text-sm font-medium hover:bg-gray-800 hover:bg-opacity-70">
      <CrzIcon name="settings" mode="stroke" :width="18" :height="18" />
      <span>Setting</span>
    </div>
    <Divider class="my-2" />-->
    <div
      class="flex items-center gap-3 rounded-md p-3 text-sm font-medium hover:bg-gray-800 hover:bg-opacity-70"
      @click="signOut()"
    >
      <CrzIcon name="log-out" mode="stroke" :width="18" :height="18" />
      <span>Logout</span>
    </div>
    <div
      class="flex items-center gap-3 rounded-md p-3 text-sm font-medium hover:bg-gray-800 hover:bg-opacity-70"
      @click="toLeave()"
    >
      <CrzIcon name="log-out" mode="stroke" :width="18" :height="18" />
      <span>Close the app</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import Divider from '#src-nuxt/components/ui/Divider.vue'
import { useAuthStore } from '#src-nuxt/stores/auth.store'
import { exit } from '@tauri-apps/plugin-process'
import type { PropType } from 'vue'
import type { UserConnectedStatus } from '#src-core/services/TauriService'

/* EMITS */
//const emit: (event: 'open-myprofile-modal', ...args: any[]) => void = defineEmits(['open-myprofile-modal'])

/* STORES */
// eslint-disable-next-line @typescript-eslint/typedef
const authStore = useAuthStore()

/* INTERFACES */
/**
 * Props interface
 * @interface Props
 * @property {boolean} showUserMenu - Show user menu
 * @property {(status: UserConnectedStatus) => void} [onStatusChange] - On status change
 */
interface Props {
  showUserMenu: boolean
  onStatusChange?: (status: UserConnectedStatus) => void
}

/* PROPS */
const props: Props = defineProps({
  showUserMenu: {
    type: Boolean,
    required: true,
  },
  onStatusChange: Function as PropType<(status: UserConnectedStatus) => void>,
})

/* METHODS */
/**
 * Emit open my profile modal
 * @returns {void}
 */
/*const emitOpenMyProfileModal: () => void = (): void => {
  emit('open-myprofile-modal')
}*/

/**
 * To leave the application
 * @returns {Promise<void>}
 */
const toLeave: () => Promise<void> = async (): Promise<void> => await exit(0)

/**
 * Sign out
 * @returns {Promise<void>}
 */
const signOut: () => Promise<void> = async (): Promise<void> => await authStore.signOut()
</script>
