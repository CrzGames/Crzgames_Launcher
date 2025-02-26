<template>
  <div class="flex flex-wrap items-center gap-4">
    <template v-for="(platforms, iconName) in groupedPlatforms">
      <CrzPlatformIcon
        v-if="platforms && platforms.length > 0"
        :key="iconName"
        :title="platforms.join(', ')"
        :platform="platforms[0]"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PropType } from 'vue'
import CrzPlatformIcon from '#src-common/components/ui/CrzPlatformIcon.vue'
import { platformsIcons } from '#src-common/components/ui/platforms-icons'
import type { tPlatformsIcons } from '#src-common/components/ui/platforms-icons'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'

/* TYPES */
/**
 * Props
 * @type {Props}
 * @property {GamePlatformModel[]} platforms - The Game Platforms
 */
type Props = {
  platforms: GamePlatformModel[]
}

/*  PROPS */
const props: Props = defineProps({
  platforms: {
    type: Array as PropType<Array<GamePlatformModel>>,
    required: true,
  },
})

// Regroupement des plateformes par icône
const groupedPlatforms: ComputedRef<Record<string, string[]>> = computed(() => {
  const group: Record<string, string[]> = {}

  props.platforms.forEach((platform: GamePlatformModel) => {
    const iconInfo: tPlatformsIcons | undefined = platformsIcons.find((icon: tPlatformsIcons) =>
      icon.platforms.map((p: string) => p.toLowerCase()).includes(platform.name.toLowerCase()),
    )

    if (!iconInfo) return

    group[iconInfo.name] = []
    group[iconInfo.name].push(platform.name.toLowerCase())
  })
  return group
})
</script>
