<script setup lang="ts">
/**
 * Reactivar mi plan: el cliente vuelve a armar el plan (cantidad / sabores,
 * frecuencia, fecha de la primera entrega, dirección y pago).
 * Servicios existentes:
 * - plan/change-status (reactiva)
 * - plan/update-plan  (cantidad, frecuencia, fecha y dirección)
 * - address/create-address (si cambió la dirección)
 * "Volver" regresa a donde estaba (query from = inicio | mi_plan).
 */
import type { PlanPetRow } from '~/composables/useMyAccount'

const route = useRoute()
const localePath = useLocalePath()
const planStore = usePlanStore()
const addressStore = useAddressStore()
const { track, trackField, trackPurchase } = useTracking()
const {
  load,
  plan,
  planId,
  planRows,
  planPets,
  profile,
  frequencyId,
  chargesToday,
  buildPlanUpdatePayload,
  refresh,
  rowsTotal,
  addressText,
  tomorrowBusinessDay,
} = useMyAccount()

const from = computed(() =>
  route.query.from === 'mi_plan' ? 'mi_plan' : 'inicio',
)
const rows = ref<PlanPetRow[]>([])
const draft = ref<PlanPetRow[]>([])
const snacks = ref(0)
const draftSnacks = ref(0)
const freq = ref(1)
const date = ref('')
const editAddress = ref(false)
const addr = reactive({
  address: '',
  complement: '',
  neighborhood: '',
  notes: '',
})
const showQty = ref(false)
const showCard = ref(false)
const ask = ref(false)
const ready = ref(false)

onMounted(async () => {
  await load({ detail: true })
  rows.value = planRows.value.map((r) => ({
    ...r,
    status: 'active',
    products: r.products.filter((p) => flavorKey(p.name) !== 'snacks'),
  }))
  draft.value = JSON.parse(JSON.stringify(rows.value))
  freq.value = frequencyId.value
  date.value = toIsoDay(tomorrowBusinessDay())
  const a: any = (plan.value as any)?.address || {}
  addr.address = a.address || ''
  addr.complement = a.complement || ''
  ready.value = true
})

const card = computed(() => (profile.value as any)?.card?.[0])
const draftValue = computed(() => rowsTotal(draft.value))
const cobroHoy = computed(() => !!date.value && chargesToday(date.value))

const back = () => {
  track('plan_activar_cancelado', { paso: 'formulario' })
  navigateTo(
    localePath(
      from.value === 'mi_plan' ? '/profile/my-plan' : '/profile/my-profile',
    ),
  )
}

const openQty = () => {
  track('plan_editar_inicio', { origen: 'reactivar' })
  showQty.value = true
}
const pickFreq = (f: number) => {
  freq.value = f
  track('plan_frecuencia_seleccionado', {
    frecuencia: f === 2 ? '2_semanas' : '4_semanas',
    origen: 'reactivar',
  })
}
const onPick = (d: string) =>
  track('formulario_campo_seleccionado', {
    formulario: 'reactivar',
    campo: 'fecha',
    cobro_hoy: chargesToday(d),
  })
const updateCard = () => {
  track('pago_metodo_editar_inicio', { origen: 'reactivar' })
  showCard.value = true
}

const submit = () => {
  track('plan_activar_enviado', {
    frecuencia: freq.value === 2 ? '2_semanas' : '4_semanas',
    cobro_hoy: cobroHoy.value,
  })
  ask.value = true
}

const save = async () => {
  useLoading(true)
  const status = await planStore.changeStatus({
    reasonToInactiveId: 0,
    description: '',
  })
  if (!(status.status && status.code === 100)) {
    useLoading(false)
    useShowAlert({ type: 'error', message: status.message })
    return
  }
  let addressId: number | undefined
  if (editAddress.value && addr.address) {
    const created: any = await addressStore.createAddress({
      city: (plan.value as any)?.address?.cityId,
      address: addr.address,
      complement: addr.complement,
      neighborhood: addr.neighborhood, // CAMPO NUEVO
      deliveryNotes: addr.notes, // CAMPO NUEVO
      predetermined: true,
      latitude: '',
      longitude: '',
    })
    addressId = created?.data?.id
  }
  const response = await planStore.updatePlan(
    buildPlanUpdatePayload({
      rows: draft.value,
      snacks: draftSnacks.value,
      frequencyId: freq.value,
      deliveryDate: date.value,
      addressId,
    }),
    planId.value,
  )
  useLoading(false)
  ask.value = false
  if (response.status && response.code === 100) {
    const valor = Number(response.data?.total || draftValue.value)
    track('plan_activar_completado', {
      frecuencia: freq.value === 2 ? '2_semanas' : '4_semanas',
      valor,
      moneda: 'COP',
      cobro_hoy: cobroHoy.value,
      origen: from.value,
    })
    trackPurchase('reactivacion', valor)
    if (cobroHoy.value)
      track('pedido_nuevo_creado', {
        valor,
        moneda: 'COP',
        origen: 'reactivar',
      })
    useShowAlert({
      type: 'success',
      message: `¡Bienvenido de vuelta! Tu primera entrega llega el ${formatLongDay(date.value)}.`,
    })
    await refresh()
    navigateTo(localePath('/profile/my-profile'))
  } else {
    useShowAlert({ type: 'error', message: response.message })
  }
}
</script>

<template>
  <div class="ma-page">
    <button class="ma-link" style="align-self: flex-start" @click="back">
      ← Volver a {{ from === 'mi_plan' ? 'Mi plan' : 'Inicio' }}
    </button>
    <h1>Reactivar mi plan</h1>
    <span class="ma-sub"
      >Revisa cómo estaba tu plan, ajusta lo que quieras y elige cuándo llega tu
      primera entrega.</span
    >

    <section class="ma-box">
      <h2>Así estaba tu plan</h2>
      <div v-for="r in draft" :key="r.petId">
        <b>{{ r.name }}</b>
        <span class="ma-small" style="display: block">
          {{
            r.products
              .filter((p) => p.numberOfPackages > 0)
              .map((p) => `${p.name} × ${p.numberOfPackages}`)
              .join(' · ')
          }}
        </span>
      </div>
      <button
        class="ma-btn is-outline"
        style="align-self: flex-start"
        @click="openQty"
      >
        Ajustar cantidad / sabores
      </button>
    </section>

    <section class="ma-box">
      <h3>¿Cada cuánto quieres recibirla?</h3>
      <div class="ma-row" style="justify-content: flex-start">
        <button
          class="ma-pill"
          :class="{ 'is-on': freq === 1 }"
          @click="pickFreq(1)"
        >
          Cada 4 semanas
        </button>
        <button
          class="ma-pill"
          :class="{ 'is-on': freq === 2 }"
          @click="pickFreq(2)"
        >
          Cada 2 semanas
        </button>
      </div>
    </section>

    <section class="ma-box">
      <h3>¿Cuándo quieres tu primera entrega?</h3>
      <ProfileV3CommonDeliveryCalendar
        v-if="date"
        v-model="date"
        formulario="reactivar"
        :frequency-days="freq === 2 ? 14 : 28"
        @pick="onPick"
      />
      <span class="ma-small">
        {{
          cobroHoy
            ? 'Te cobramos hoy y tu pedido queda pagado.'
            : `Te cobramos el ${formatLongDay(chargeDateOf(date))}, 4 días antes de la entrega.`
        }}
      </span>
    </section>

    <section class="ma-box">
      <h3>¿A dónde llega?</h3>
      <template v-if="!editAddress">
        <span class="ma-sub">{{ addressText((plan as any)?.address) }}</span>
        <button
          class="ma-link"
          style="align-self: flex-start"
          @click="editAddress = true"
        >
          Cambiar dirección
        </button>
      </template>
      <template v-else>
        <div class="ma-field">
          <label>Dirección</label>
          <input
            v-model="addr.address"
            @focus="trackField('reactivar', 'direccion')"
          />
        </div>
        <div class="ma-grid-2">
          <div class="ma-field">
            <label>Barrio</label>
            <input
              v-model="addr.neighborhood"
              @focus="trackField('reactivar', 'barrio')"
            />
          </div>
          <div class="ma-field">
            <label>Apartamento, torre o casa</label>
            <input
              v-model="addr.complement"
              @focus="trackField('reactivar', 'complemento')"
            />
          </div>
        </div>
        <div class="ma-field">
          <label>Indicaciones para el repartidor</label>
          <input
            v-model="addr.notes"
            @focus="trackField('reactivar', 'indicaciones')"
          />
        </div>
      </template>
    </section>

    <section class="ma-box">
      <h3>Pago</h3>
      <span class="ma-sub">
        {{
          card
            ? `Tarjeta terminada en ${card.lastFour}`
            : 'No tienes una tarjeta guardada.'
        }}
      </span>
      <button
        class="ma-link"
        style="align-self: flex-start"
        @click="updateCard"
      >
        Actualizar tarjeta
      </button>
    </section>

    <div class="ma-modal-foot">
      <button class="ma-btn is-outline" @click="back">Cancelar</button>
      <button class="ma-btn" :disabled="!date || !card" @click="submit">
        Reactivar mi plan
      </button>
    </div>

    <ProfileV3CommonModal
      :show="showQty"
      title="Ajustar cantidad / sabores"
      @close="showQty = false"
    >
      <ProfileV3PlanQuantityEditor
        v-if="ready"
        v-model:rows="draft"
        v-model:snacks="draftSnacks"
        :original="rows"
        :original-snacks="snacks"
        origen="reactivar"
      />
      <template #footer>
        <button class="ma-btn" @click="showQty = false">Listo</button>
      </template>
    </ProfileV3CommonModal>

    <GeneralDialogCreatePaymentMethod v-model:show="showCard" />

    <ProfileV3CommonConfirmAsk
      :show="ask"
      title="¿Reactivamos tu plan?"
      :text="`Tu primera entrega llega el ${formatLongDay(date)}${cobroHoy ? ' y te cobramos hoy' : ''}.`"
      @yes="save"
      @no="
        () => {
          ask = false
          track('plan_activar_cancelado', { paso: 'confirmacion' })
        }
      "
    />
  </div>
</template>
