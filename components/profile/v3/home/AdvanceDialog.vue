<script setup lang="ts">
/**
 * Adelantar pedido: el pedido llega mañana (día hábil) y se cobra hoy.
 * Servicio existente: order/create-order {planId}.
 * Eventos: pedido_adelantar_enviado → pedido_adelantar_completado + purchase {tipo_compra:'adelanto'}
 * (solo con OK del backend), pedido_adelantar_cancelado, formulario_error.
 */
const props = defineProps<{ show: boolean; amount: number }>()
const emit = defineEmits(['close', 'done'])

const orderStore = useOrderStore()
const { planId, tomorrowBusinessDay, refresh } = useMyAccount()
const { track, trackPurchase } = useTracking()
const localePath = useLocalePath()

const tomorrow = computed(() => tomorrowBusinessDay())

const close = (e?: { outside?: boolean }) => {
  track('pedido_adelantar_cancelado')
  emit('close', e)
}

const confirm = async () => {
  track('pedido_adelantar_enviado', { valor: props.amount, moneda: 'COP' })
  useLoading(true)
  const response = await orderStore.createOrder({ planId: planId.value })
  useLoading(false)
  if (response.status && response.code === 100) {
    const valor = Number(response.data?.total || props.amount)
    track('pedido_adelantar_completado', {
      valor,
      moneda: 'COP',
      descuento_aplicado: Number(response.data?.discount || 0) > 0,
    })
    trackPurchase('adelanto', valor)
    useShowAlert({
      type: 'success',
      message: `Listo. Tu pedido llega mañana, ${formatLongDay(toIsoDay(tomorrow.value))}, y lo cobramos hoy.`,
    })
    await refresh()
    emit('done')
  } else {
    track('formulario_error', {
      formulario: 'adelantar',
      tipo_error: 'pago_rechazado',
    })
    useShowAlert({ type: 'error', message: response.message })
  }
}

const otherDate = () => {
  track('plan_fecha_editar_inicio', { origen: 'adelantar' })
  emit('close')
  navigateTo(
    localePath({
      path: '/profile/my-plan/dates',
      query: { origen: 'adelantar' },
    }),
  )
}
</script>

<template>
  <ProfileV3CommonModal
    :show="show"
    title="¿Te lo enviamos mañana?"
    max-width="480px"
    @close="close"
  >
    <p class="ma-sub" style="margin: 0">
      Estamos a punto de cobrarte {{ useFormatPrice(amount) }}. Tu pedido
      llegará mañana, {{ formatLongDay(toIsoDay(tomorrow)) }}.
    </p>
    <button class="ma-btn is-block" @click="confirm">
      Sí, recibirlo mañana
    </button>
    <button class="ma-link" style="align-self: center" @click="otherDate">
      Elegir otra fecha
    </button>
  </ProfileV3CommonModal>
</template>
