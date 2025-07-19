<template>
  <div class="separator flex w-[95%] mx-auto items-center" :class="{ empty: !text }">
    {{ props.text }}
  </div>
</template>

<script lang="ts" setup>
/* INTERFACE */
/**
 * @interface Props
 * @property {string | null} text - The text to display
 */
interface Props {
  text: string | null
}

/*PROPS*/
const props: Props = defineProps({
  text: { type: String, default: null },
})
</script>

<style lang="scss" scoped>
$border_color: rgb(52, 54, 71);

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  border-bottom: 3px solid $border_color;
}

.separator:not(.empty)::before {
  margin-right: 16px;
}

.separator:not(.empty)::after {
  margin-left: 16px;
}
</style>
