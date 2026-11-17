<script setup lang="ts">
/**
 * Historial de pedidos v3: tabla con entrega, estado, total y factura.
 * Servicio existente: order/get-all-order (paginado). Factura: PROPUESTA order/get-invoice/:id.
 */
const localePath = useLocalePath()
const orderStore = useOrderStore()
const myAccountStore = useMyAccountStore()
const { track } = useTracking()
const { t } = useI18n()

const rows = ref<any[]>([])
const total = ref(0)
const page = ref(0)
const LIMIT = 10

const loadPage = async () => {
  useLoading(true)
  const res = await orderStore.getOrders({
    filter: '',
    statusOrder: '',
    limit: LIMIT,
    offset: page.value * LIMIT,
    someStates: false,
  })
  useLoading(false)
  if (res.status && res.code === 100) {
    rows.value = res.data.items
    total.value = Number(res.data.rows || 0)
  }
}
onMounted(loadPage)

const pages = computed(() => Math.max(1, Math.ceil(total.value / LIMIT)))
const go = async (p: number) => {
  page.value = p
  await loadPage()
}

const stateLabel = (o: any) =>
  o.statusPayment === 'rejected'
    ? 'Pago rechazado'
    : t(`table.enums.status.${o.statusOrder}`)

const download = async (o: any) => {
  useLoading(true)
  const res = await myAccountStore.getInvoiceUrl(o.id)
  useLoading(false)
  if (res.status && res.code === 100 && res.data?.url) {
    track('factura_descarga_completado', { origen: 'historial' })
    window.open(res.data.url, '_blank')
  } else useShowAlert({ type: 'error', message: res.message })
}
const detail = (o: any) =>
  navigateTo(
    localePath({ name: 'profile-my-deliveries-id', params: { id: o.id } }),
  )
</script>

<template>
  <div class="ma-page">
    <h1>Historial de pedidos</h1>
    <section class="ma-box" style="padding: 0; overflow-x: auto">
      <table class="ma-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Entrega</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Factura</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in rows" :key="o.id">
            <td>
              <button class="ma-link" @click="detail(o)">#{{ o.id }}</button>
            </td>
            <td>{{ formatDay(o.delivery) }}</td>
            <td>{{ stateLabel(o) }}</td>
            <td>{{ useFormatPrice(o.total) }}</td>
            <td>
              <button
                v-if="o.statusOrder === 'delivered'"
                class="ma-link"
                @click="download(o)"
              >
                Descargar PDF
              </button>
              <span v-else class="ma-small">Disponible al entregar</span>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="5" class="ma-small">Aún no tienes pedidos.</td>
          </tr>
        </tbody>
      </table>
    </section>
    <div v-if="pages > 1" class="ma-row" style="justify-content: center">
      <button class="ma-link" :disabled="page === 0" @click="go(page - 1)">
        ‹ Anterior
      </button>
      <span class="ma-small">{{ page + 1 }} de {{ pages }}</span>
      <button
        class="ma-link"
        :disabled="page + 1 >= pages"
        @click="go(page + 1)"
      >
        Siguiente ›
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ma-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  th {
    text-align: left;
    font-family: 'heading-pro-treble-bold';
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #575e6b;
    padding: 14px 16px;
    border-bottom: 1px solid #dfe5ee;
  }
  td {
    padding: 14px 16px;
    border-bottom: 1px solid #dfe5ee;
    white-space: nowrap;
  }
}
</style>
