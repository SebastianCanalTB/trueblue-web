<script setup lang="ts">
/**
 * Cambiar fechas de entrega del plan (incluye la frecuencia).
 * Servicios existentes:
 * - plan/update-next-delivery/:planId {nextDelivery}
 * - plan/update-plan/:planId (frecuencia, vía buildPlanUpdatePayload)
 * Regla: si la nueva fecha cae dentro de la ventana de cobro, se cobra de una y
 * el pedido queda en curso pagado (lo resuelve el backend).
 */
import { DateTime } from 'luxon'

const route = useRoute()
const localePath = useLocalePath()
const planStore = usePlanStore()
const { track, trackPurchase } = useTracking()
const {
  load,
  plan,
  planId,
  frequencyId,
  currentOrders,
  chargesToday,
  buildPlanUpdatePayload,
  refresh,
  isOrderEditable,
  orderState,
} = useMyAccount()

const origen = computed(() => String(route.query.origen || 'cambiar_fecha'))
const freq = ref(1)
const date = ref('')
const review = ref(false)
const ask = ref(false)
const editOrderFor = ref<any>(null)

onMounted(async () => {
  await load({ detail: true })
  freq.value = frequencyId.value
  date.value = toIsoDay((plan.value as any)?.nextDelivery)
})

const freqDays = computed(() => (freq.value === 2 ? 14 : 28))
const changed = computed(
  () =>
    freq.value !== frequencyId.value ||
    date.value !== toIsoDay((plan.value as any)?.nextDelivery),
)

const onFreq = () =>
  track('plan_frecuencia_seleccionado', {
    frecuencia: freq.value === 2 ? '2_semanas' : '4_semanas',
    origen: 'cambiar_fecha',
  })
const onPick = (d: string) =>
  track('formulario_campo_seleccionado', {
    formulario: 'fecha_entrega',
    campo: 'fecha',
    dias_cambio: daysBetween((plan.value as any)?.nextDelivery, d),
    cobro_hoy: chargesToday(d),
  })

const preview = computed(() => {
  if (!date.value) return []
  const base = DateTime.fromISO(date.value)
  return [0, 1, 2].map((i) => {
    const iso = base.plus({ days: i * freqDays.value }).toISODate() as string
    return {
      iso,
      charge:
        i === 0 && chargesToday(iso) ? 'hoy' : formatLongDay(chargeDateOf(iso)),
    }
  })
})

/** Pedido pagado a 7 días o menos de la nueva fecha → aviso. */
const nearPaid = computed(() =>
  currentOrders.value.find(
    (o) =>
      o.statusPayment === 'paid' &&
      Math.abs(daysBetween(o.delivery, date.value)) <= 7,
  ),
)

const toReview = () => {
  track('plan_editar_paso_completado', {
    paso: 'fecha',
    formulario: 'fecha_entrega',
  })
  review.value = true
}
const confirm = () => {
  track('plan_actualizar_enviado', { formulario: 'fecha_entrega' })
  ask.value = true
}

const save = async () => {
  useLoading(true)
  let ok = true
  let message = ''
  let response: any = null
  const dateChanged = date.value !== toIsoDay((plan.value as any)?.nextDelivery)

  if (freq.value !== frequencyId.value) {
    response = await planStore.updatePlan(
      buildPlanUpdatePayload({
        frequencyId: freq.value,
        deliveryDate: date.value,
      }),
      planId.value,
    )
    ok = response.status && response.code === 100
  } else if (dateChanged) {
    response = await planStore.updateMyNextDelivery(planId.value, {
      nextDelivery: date.value,
    })
    ok = response.status && response.code === 100
  }
  message = response?.message || ''
  useLoading(false)

  if (!ok) {
    useShowAlert({ type: 'error', message })
    return
  }

  track('plan_fecha_actualizado', {
    formulario: 'fecha_entrega',
    nueva_fecha: date.value,
    dias_cambio: daysBetween((plan.value as any)?.nextDelivery, date.value),
    frecuencia: freq.value === 2 ? '2_semanas' : '4_semanas',
    origen: origen.value,
  })
  // Si la fecha quedó dentro de la ventana, el backend crea y cobra el pedido.
  // TODO(Kubo): devolver data.order {id,total} en la respuesta cuando se cobre hoy.
  const created = response?.data?.order
  if (created?.total) {
    track('pedido_nuevo_creado', {
      valor: created.total,
      moneda: 'COP',
      origen: 'cambio_fecha',
    })
    trackPurchase('cambio_fecha', Number(created.total))
  }
  useShowAlert({
    type: 'success',
    message: `Listo. Tu próximo pedido llega el ${formatLongDay(date.value)}.`,
  })
  ask.value = false
  await refresh()
  navigateTo(localePath('/profile/my-plan'))
}

const cancel = () => {
  track('plan_editar_cancelado', { formulario: 'fecha_entrega' })
  navigateTo(localePath('/profile/my-plan/adjust'))
}
const back = () => {
  if (review.value) {
    review.value = false
    return
  }
  cancel()
}

const goEditOrder = () => {
  track('pedido_editar_inicio', { origen: 'aviso_pedido_pagado' })
  ask.value = false
  editOrderFor.value = nearPaid.value
}
</script>

<template>
  <div class="ma-page">
    <button class="ma-link" style="align-self: flex-start" @click="back">
      ← {{ review ? 'Volver' : 'Volver a Ajustar plan' }}
    </button>
    <h1>Cambiar fechas de entrega</h1>

    <template v-if="!review">
      <div class="ma-field" style="max-width: 320px">
        <label for="freq">¿Cada cuánto quieres recibirla?</label>
        <select id="freq" v-model.number="freq" @change="onFreq">
          <option :value="1">Entrega cada 4 semanas</option>
          <option :value="2">Entrega cada 2 semanas</option>
        </select>
      </div>
      <section class="ma-box">
        <h3>¿Cuándo quieres tu próximo pedido?</h3>
        <ProfileV3CommonDeliveryCalendar
          v-if="date"
          v-model="date"
          formulario="fecha_entrega"
          :frequency-days="freqDays"
          @pick="onPick"
        />
        <span v-if="date && chargesToday(date)" class="ma-small">
          Esta fecha está dentro de la ventana de cobro: te cobramos hoy y tu
          pedido queda pagado.
        </span>
      </section>
      <div class="ma-modal-foot">
        <button class="ma-btn is-outline" @click="cancel">Cancelar</button>
        <button class="ma-btn" :disabled="!changed" @click="toReview">
          Ver cómo queda mi plan
        </button>
      </div>
    </template>

    <template v-else>
      <section class="ma-box">
        <h2>Así quedaría tu plan</h2>
        <span class="ma-sub"
          >Entregas {{ freq === 2 ? 'cada 2 semanas' : 'cada 4 semanas' }}</span
        >
        <ul class="ma-list">
          <li v-for="o in currentOrders" :key="o.id">
            <b>{{ formatLongDay(o.delivery) }}</b>
            <span class="ma-small"
              >Pedido en curso ·
              {{
                o.statusPayment === 'paid' ? 'ya pagado' : 'pago pendiente'
              }}</span
            >
          </li>
          <li v-for="p in preview" :key="p.iso">
            <b>{{ formatLongDay(p.iso) }}</b>
            <span class="ma-small"
              >({{
                p.charge === 'hoy' ? 'te cobramos hoy' : `cobro el ${p.charge}`
              }})</span
            >
          </li>
        </ul>
      </section>
      <div class="ma-modal-foot">
        <button class="ma-btn is-outline" @click="cancel">Cancelar</button>
        <button class="ma-btn" @click="confirm">Confirmar cambios</button>
      </div>
    </template>

    <ProfileV3CommonConfirmAsk
      :show="ask"
      title="¿Seguro que quieres modificar tu plan?"
      @yes="save"
      @no="
        () => {
          ask = false
          track('plan_editar_volver', {
            formulario: 'fecha_entrega',
            paso: 'confirmacion',
          })
        }
      "
    >
      <p v-if="nearPaid" class="ma-small" style="margin: 0">
        Ya tienes un pedido pagado para el
        {{ formatLongDay(nearPaid.delivery) }}. Si lo que quieres es modificar
        ese pedido, ve a
        <button
          v-if="
            isOrderEditable(nearPaid) || orderState(nearPaid) === 'pago_fallido'
          "
          class="ma-link"
          style="font-size: 13px; min-height: 0"
          @click="goEditOrder"
        >
          Editar pedido en curso
        </button>
        <span v-else>Editar pedido en curso</span>.
      </p>
    </ProfileV3CommonConfirmAsk>

    <ProfileV3OrderEditOrderDialog
      v-if="editOrderFor"
      :show="!!editOrderFor"
      :order="editOrderFor"
      origen="aviso_pedido_pagado"
      @close="editOrderFor = null"
    />
  </div>
</template>

<style scoped lang="scss">
.ma-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  li {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: baseline;
  }
}
</style>
