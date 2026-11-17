<script setup lang="ts">
/**
 * Texto "este pedido" subrayado que abre un cuadrito de ayuda.
 * Evento: pedido_alcance_info_visto {formulario}. Link: plan_editar_inicio {origen:'ayuda_pedido'}.
 */
const props = defineProps<{ formulario: string }>()
const emit = defineEmits(['edit-plan'])
const open = ref(false)
const { track } = useTracking()

const toggle = () => {
  open.value = !open.value
  if (open.value)
    track('pedido_alcance_info_visto', { formulario: props.formulario })
}
const editPlan = () => {
  track('plan_editar_inicio', { origen: 'ayuda_pedido' })
  emit('edit-plan')
}
</script>

<template>
  <span class="ma-tip">
    <button class="ma-tip-trigger" type="button" @click="toggle">
      este pedido
    </button>
    <span v-if="open" class="ma-tip-box" role="tooltip">
      Este cambio solo aplica para esta entrega. Si quieres cambiar tus
      siguientes pedidos, usa
      <button class="ma-link" @click="editPlan">Editar mi plan</button>.
    </span>
  </span>
</template>
