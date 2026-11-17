<script setup lang="ts">
/** Botones + / − . Emite change con la acción para medir (incrementar / decrementar). */
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    label?: string
  }>(),
  { min: 0, max: 99, label: '' },
)
const emit = defineEmits(['update:modelValue', 'change', 'max-reached'])

const step = (delta: number) => {
  const next = props.modelValue + delta
  if (next > props.max) {
    emit('max-reached')
    return
  }
  if (next < props.min) return
  emit('update:modelValue', next)
  emit('change', {
    value: next,
    accion: delta > 0 ? 'incrementar' : 'decrementar',
  })
}
</script>

<template>
  <span class="ma-counter">
    <button
      type="button"
      :aria-label="`Un paquete menos ${label}`"
      :disabled="modelValue <= min"
      @click="step(-1)"
    >
      −
    </button>
    <span>{{ modelValue }}</span>
    <button
      type="button"
      :aria-label="`Un paquete más ${label}`"
      @click="step(1)"
    >
      +
    </button>
  </span>
</template>
