<script setup lang="ts">
/**
 * Pop up base de Mi cuenta v3.
 * - "← Volver" arriba a la izquierda (si hay backLabel) y "Cerrar" a la derecha.
 * - Clic por fuera = cerrar (emite close con { outside: true }).
 */
const props = withDefaults(
  defineProps<{
    show: boolean
    title?: string
    subtitle?: string
    backLabel?: string
    closable?: boolean
    maxWidth?: string
  }>(),
  { closable: true, maxWidth: '640px', title: '', subtitle: '', backLabel: '' },
)
const emit = defineEmits(['close', 'back'])

const onBackdrop = (e: MouseEvent) => {
  if (e.target === e.currentTarget && props.closable)
    emit('close', { outside: true })
}

watch(
  () => props.show,
  (v) => {
    if (typeof document !== 'undefined')
      document.body.style.overflow = v ? 'hidden' : ''
  },
)
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="ma-modal-bg" @click="onBackdrop">
      <div
        class="ma-modal"
        role="dialog"
        aria-modal="true"
        :style="{ maxWidth }"
      >
        <div class="ma-modal-head">
          <div style="display: flex; flex-direction: column; gap: 4px">
            <button
              v-if="backLabel"
              class="ma-link"
              style="align-self: flex-start"
              @click="emit('back')"
            >
              ← {{ backLabel }}
            </button>
            <h2 class="ma-modal-title">
              <slot name="title">{{ title }}</slot>
            </h2>
            <span v-if="subtitle" class="ma-sub">{{ subtitle }}</span>
          </div>
          <button
            v-if="closable"
            class="ma-link"
            style="align-self: flex-start"
            aria-label="Cerrar"
            @click="emit('close', { outside: false })"
          >
            Cerrar
          </button>
        </div>
        <slot />
        <div v-if="$slots.footer" class="ma-modal-foot">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.ma-modal-title {
  font-family: 'heading-pro-treble-bold';
  font-size: 22px;
  color: #003b71;
  margin: 0;
}
</style>
