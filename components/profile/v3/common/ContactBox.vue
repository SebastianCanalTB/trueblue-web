<script setup lang="ts">
/** Caja "Llámanos". Evento: soporte_contacto_click {canal:'telefono', origen, ...}. */
const props = defineProps<{
  text?: string
  origen: string
  extra?: Record<string, any>
}>()
const { track } = useTracking()
const PHONE = '+573235997035'
const call = () =>
  track('soporte_contacto_click', {
    canal: 'telefono',
    origen: props.origen,
    ...(props.extra || {}),
  })
</script>

<template>
  <div class="ma-box is-soft" style="gap: 10px">
    <span v-if="text" class="ma-sub">{{ text }}</span>
    <a
      class="ma-btn"
      style="align-self: flex-start; text-decoration: none"
      :href="`tel:${PHONE}`"
      @click="call"
    >
      Llámanos: 323 599 7035
    </a>
  </div>
</template>
