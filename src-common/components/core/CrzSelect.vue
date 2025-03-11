<template>
  <div class="relative flex w-full min-w-max flex-col gap-2">
    <label v-if="props.label" class="font-medium text-white" :for="id">
      {{ props.label }}
      <span v-if="props.required" class="ml-1 text-red-400">*</span>
    </label>
    <select
      :id="id"
      class="relative flex h-12 w-full items-center justify-center rounded-md border-2 bg-zinc-900 pl-3 text-white placeholder:text-zinc-600 focus:border-white"
      :class="props.required && !selectedItem ? 'border-red-500' : 'border-zinc-500 hover:border-zinc-400'"
      :value="selectedItem?.value"
      @change="onChange($event)"
    >
      <option v-for="option in options" :value="option.value" :key="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import type { PropType } from 'vue'

export type SelectOption = {
  label: string
  value: number | string
}

/* PROPS */
const props = defineProps({
  options: {
    type: Array as PropType<SelectOption[]>,
    required: true,
  },
  modelValue: {
    type: Object as PropType<SelectOption>,
    default: null,
  },
  id: { type: String, default: 'field' },
  label: { type: String, default: null },
  required: { type: Boolean, default: false },
})

/* REFS */
const selectedItem = ref(props.modelValue)

/* WATCH */
watch(
  () => props.modelValue,
  (newValue) => {
    selectedItem.value = newValue
  },
)

/* EMIT */
const emit = defineEmits(['update:modelValue'])

/* METHODS */
const onChange = (event: Event) => {
  const selectElement = event.target as HTMLSelectElement
  const selectedOptionValue = selectElement.value

  // Find the selected option from the option array
  if (props.options) {
    const selectedOption = props.options.find((option) => option.value.toString() === selectedOptionValue)

    if (selectedOption) {
      selectedItem.value = selectedOption
      emit('update:modelValue', selectedOption)
    }
  }
}
</script>
