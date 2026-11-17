<script setup lang="ts">
/**
 * Pagos v3: aviso de pago pendiente, tarjeta guardada e historial de cobros.
 * Servicios existentes: card/get-list-cards, order/get-all-order.
 * Para agregar/actualizar tarjeta se reutiliza GeneralDialogCreatePaymentMethod (dLocal).
 */
const route = useRoute()
const localePath = useLocalePath()
const cardStore = useCardStore()
const orderStore = useOrderStore()
const { getAllMyCards: cards } = storeToRefs(cardStore)
const { track } = useTracking()
const { load, currentOrders, orderState, paymentFailure } = useMyAccount()

const charges = ref<any[]>([])
const showCard = ref(false)
const cardCountBefore = ref(0)

const loadCharges = async () => {
  const res = await orderStore.getOrders({
    filter: '',
    statusOrder: '',
    limit: 10,
    offset: 0,
    someStates: false,
  })
  charges.value = res.status && res.code === 100 ? res.data.items : []
}

onMounted(async () => {
  await load({ force: true })
  await cardStore.getCards()
  await loadCharges()
  if (route.query.actualizar === '1') openCard()
})

const failed = computed(() =>
  currentOrders.value.find((o) => orderState(o) === 'pago_fallido'),
)
const failText = computed(() => {
  const o = failed.value
  if (!o) return ''
  const charge = formatLongDay(o.nextPayment || chargeDateOf(o.delivery))
  return paymentFailure(o) === 'tarjeta_vencida'
    ? `Intentamos cobrar ${useFormatPrice(o.total)} el ${charge} y tu tarjeta está vencida. Actualiza tu información de pago para que tu pedido del ${formatLongDay(o.delivery)} salga a tiempo.`
    : `Intentamos cobrar ${useFormatPrice(o.total)} el ${charge} y tu banco lo rechazó por saldo insuficiente. Puedes volver a intentarlo para que tu pedido del ${formatLongDay(o.delivery)} salga a tiempo.`
})

const failCta = () => {
  const o = failed.value
  if (!o) return
  if (paymentFailure(o) === 'tarjeta_vencida') {
    track('pago_metodo_editar_inicio', { origen: 'pagos' })
    openCard()
  } else {
    track('pago_reintentar_inicio', { origen: 'pagos' })
    navigateTo(localePath({ name: 'payment-pay-id', params: { id: o.id } }))
  }
}

const openCard = () => {
  cardCountBefore.value = (cards.value as any[]).length
  showCard.value = true
}
const updateCard = () => {
  track('pago_metodo_editar_inicio', { origen: 'pagos' })
  openCard()
}
const addCard = () => {
  track('pago_metodo_agregar_inicio', { origen: 'pagos' })
  openCard()
}

watch(showCard, async (open) => {
  if (open) return
  await cardStore.getCards()
  if ((cards.value as any[]).length !== cardCountBefore.value) {
    track('pago_metodo_actualizado', {
      origen: 'pagos',
      metodo_pago: 'tarjeta',
    })
  }
})

const chargeState = (o: any) =>
  o.statusPayment === 'paid'
    ? 'Aprobado'
    : o.statusPayment === 'rejected'
      ? 'Rechazado'
      : 'Pendiente'
</script>

<template>
  <div class="ma-page">
    <h1>Pagos</h1>

    <section v-if="failed" class="ma-box is-error">
      <span class="ma-sub" style="color: #25282b">{{ failText }}</span>
      <button class="ma-btn" style="align-self: flex-start" @click="failCta">
        {{
          paymentFailure(failed) === 'tarjeta_vencida'
            ? 'Actualizar información de pago'
            : 'Reintentar pago'
        }}
      </button>
    </section>

    <section class="ma-box">
      <h2>Tu tarjeta</h2>
      <div v-for="c in cards" :key="c.id" class="ma-row">
        <div>
          <b>{{ c.brand }} terminada en {{ c.lastFour }}</b>
          <span class="ma-small" style="display: block">
            {{ c.predetermined ? 'Predeterminada' : ''
            }}<template v-if="c.expiration">
              · vence {{ c.expiration }}</template
            >
          </span>
        </div>
        <button v-if="c.predetermined" class="ma-link" @click="updateCard">
          Actualizar tarjeta
        </button>
      </div>
      <span v-if="!cards.length" class="ma-sub"
        >No tienes una tarjeta guardada.</span
      >
      <button class="ma-link" style="align-self: flex-start" @click="addCard">
        + Agregar otro método
      </button>
    </section>

    <section class="ma-box">
      <h2>Historial de cobros</h2>
      <ul class="ma-charges">
        <li v-for="o in charges" :key="o.id">
          <span>{{ formatDay(o.nextPayment || o.createdAt) }}</span>
          <span>{{ useFormatPrice(o.total) }} · {{ chargeState(o) }}</span>
        </li>
      </ul>
      <span v-if="!charges.length" class="ma-sub">Aún no tienes cobros.</span>
    </section>

    <GeneralDialogCreatePaymentMethod v-model:show="showCard" />
  </div>
</template>

<style scoped lang="scss">
.ma-charges {
  list-style: none;
  margin: 0;
  padding: 0;
  li {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #dfe5ee;
    font-size: 14px;
  }
}
</style>
