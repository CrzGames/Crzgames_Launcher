<template>
  <CrzIcon
    v-if="currentIcon"
    v-tooltip.bottom.auto="title || platform"
    class="cursor-pointer"
    :viewBox="currentIcon.viewBox"
    :name="currentIcon.name"
  />
</template>

<script lang="ts" setup>
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import { platformsIcons } from '#src-common/components/ui/platforms-icons'
import type { tPlatformsIcons } from '#src-common/components/ui/platforms-icons'
import { computed } from 'vue'

/* TYPES*/
/**
 * Props
 * @type {Props}
 * @property {string} platform - The platform
 * @property {string | null} title - The title
 */
type Props = {
  platform: string
  title: string | null
}

/* PROPS */
const props: Props = defineProps({
  platform: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: false,
    default: null,
  },
})

/* REFS */
const currentIcon: ComputedRef<tPlatformsIcons | undefined> = computed(() => {
  const platform: string = props.platform.toLowerCase()

  if (!platform) return undefined

  const icon: tPlatformsIcons | undefined = platformsIcons.find((icon: tPlatformsIcons) =>
    icon.platforms.map((p: string) => p.toLowerCase()).includes(platform),
  )

  if (!icon) return undefined

  return icon
})
</script>
