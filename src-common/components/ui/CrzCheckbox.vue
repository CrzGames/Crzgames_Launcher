<template>
  <div class="flex cursor-pointer select-none items-center" @click.prevent="emitUpdateChecked(!props.checked)">
    <input
      type="checkbox"
      class="checkbox h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded border border-zinc-400 checked:border-amber-400"
      :checked="props.checked"
      @click.stop="emitUpdateChecked(!props.checked)"
      :id="computedId"
    />
    <label v-if="props.label" :for="computedId" class="cursor-pointer pl-2 text-sm font-medium text-gray-400">
      {{ props.label }}
    </label>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

/* TYPES */
/**
 * Props
 * @type {object}
 * @property {string | null} label - Checkbox label
 * @property {string | number} id - Checkbox ID
 * @property {boolean} checked - Checkbox checked state
 */
type Props = {
  label: string | null
  id: string | number
  checked: boolean
}

/* PROPS */
const props: Props = defineProps({
  label: {
    type: String,
    default: null,
  },
  id: {
    type: [String, Number],
    required: true,
  },
  checked: {
    type: Boolean,
    default: false,
  },
})

/*COMPUTED*/
const computedId: ComputedRef<string> = computed(() => {
  return props.id.toString()
})

/* EMIT */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  'update:checked': [checked: boolean]
}>()

/* METHODS */
/**
 * Emit update checked event
 * @param {boolean} checked - Checkbox checked state
 * @returns {void} - Nothing
 */
const emitUpdateChecked: (checked: boolean) => void = (checked: boolean): void => {
  emit('update:checked', checked)
}
</script>

<style lang="scss" scoped>
$color: rgb(224, 161, 0);

@keyframes checkmark {
  0% {
    background-position-y: 5px;
  }
  50% {
    background-position-y: -2px;
  }
  to {
    background-position-y: 0;
  }
}

.checkbox:checked,
.checkbox[checked='true'],
.checkbox[aria-checked='true'] {
  background-color: $color;
  background-repeat: no-repeat;
  animation: checkmark 0.2s ease-out;
  background-image:
    linear-gradient(-45deg, rgba(0, 0, 0, 0) 65%, $color 65.99%),
    linear-gradient(45deg, rgba(0, 0, 0, 0) 75%, $color 75.99%),
    linear-gradient(-45deg, $color 40%, rgba(0, 0, 0, 0) 40.99%),
    linear-gradient(45deg, $color 30%, rgb(29, 35, 42) 30.99%, rgb(29, 35, 42) 40%, rgba(0, 0, 0, 0) 40.99%),
    linear-gradient(-45deg, rgb(29, 35, 42) 50%, $color 50.99%);
}
</style>
