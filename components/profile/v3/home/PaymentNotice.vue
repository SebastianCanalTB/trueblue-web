<script setup lang="ts">
/**
 * Aviso de pago: "¡Recibimos tu pago!" (solo la primera vez después del cobro) o
 * "No pudimos hacer el cobro" (pago rechazado).
 * Eventos: pago_aviso_aceptado {tipo}, pago_aviso_cancelado {tipo, tipo_error},
 * pago_reintentar_inicio / pago_metodo_editar_inicio {origen:'aviso_pago'}.
 */
const props = defineProps<{
  show: boolean
  kind: 'paid' | 'failed'
  amount: number
  chargeDate: string
  deliveryDate: string
  failure?: 'saldo_insuficiente' | 'tarjeta_vencida'
}>()
const emit = defineEmits(['close', 'retry', 'update-card'])
const { track } = useTracking()

const text = computed(() => {
  const val = useFormatPrice(props.amount)
  if (props.kind === 'paid')
    return `Cobramos ${val} el ${formatLongDay(props.chargeDate)} y tu entrega llega el ${formatLongDay(props.deliveryDate)}. Si necesitas cambiar la fecha, los sabores o la dirección de esta entrega, puedes hacerlo mientras esté en preparación.`
  if (props.failure === 'tarjeta_vencida')
    return `Intentamos cobrar ${val} el ${formatLongDay(props.chargeDate)} y tu tarjeta está vencida. Actualiza tu información de pago para que tu pedido del ${formatLongDay(props.deliveryDate)} salga a tiempo.`
  return `Intentamos cobrar ${val} el ${formatLongDay(props.chargeDate)} y tu banco lo rechazó por saldo insuficiente. Puedes volver a intentarlo para que tu pedido del ${formatLongDay(props.deliveryDate)} salga a tiempo.`
})

const ok = () => {
  track('pago_aviso_aceptado', { tipo: 'pago_recibido' })
  emit('close')
}
const later = () => {
  track('pago_aviso_cancelado', {
    tipo: 'pago_fallido',
    tipo_error: props.failure,
  })
  emit('close')
}
const cta = () => {
  if (props.failure === 'tarjeta_vencida') {
    track('pago_metodo_editar_inicio', { origen: 'aviso_pago' })
    emit('update-card')
  } else {
    track('pago_reintentar_inicio', { origen: 'aviso_pago' })
    emit('retry')
  }
}
</script>

<template>
  <ProfileV3CommonConfirmAsk
    :show="show"
    :title="
      kind === 'paid' ? '¡Recibimos tu pago!' : 'No pudimos hacer el cobro'
    "
    :text="text"
    :no-label="kind === 'paid' ? '' : 'Más tarde'"
    @no="later"
  >
    <template #actions>
      <button v-if="kind === 'paid'" class="ma-btn is-block" @click="ok">
        Entendido
      </button>
      <button v-else class="ma-btn is-block" @click="cta">
        {{
          failure === 'tarjeta_vencida'
            ? 'Actualizar información de pago'
            : 'Reintentar pago'
        }}
      </button>
    </template>
  </ProfileV3CommonConfirmAsk>
</template>
