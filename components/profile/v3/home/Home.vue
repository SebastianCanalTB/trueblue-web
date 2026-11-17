<script setup lang="ts">
/**
 * Inicio de Mi cuenta v3.
 * - Plan activo fuera de la ventana de cobro: caja "Próximo pedido" (+ Adelantar pedido).
 * - Pedido dentro de la ventana (pagado, en camino o con pago fallido): caja "Pedido en curso".
 * - Plan cancelado: aviso + "Reactivar mi plan".
 */
const localePath = useLocalePath()
const orderStore = useOrderStore()
const myAccountStore = useMyAccountStore()
const { adultNoticeSeen } = storeToRefs(myAccountStore)
const { track } = useTracking()
const {
  load,
  plan,
  profile,
  myPets,
  isCancelled,
  petNames,
  planPets,
  currentOrders,
  orderState,
  isOrderEditable,
  paymentFailure,
  packagesText,
  addressText,
} = useMyAccount()

// ---------- carga ----------
const orderDetails = ref<Record<number, any>>({})
const loadOrderDetails = async () => {
  const out: Record<number, any> = {}
  for (const o of currentOrders.value.slice(0, 3)) {
    const res = await orderStore.getOneOrder(o.id)
    if (res.status && res.code === 100) out[o.id] = res.data?.userOrderDetail
  }
  orderDetails.value = out
}

onMounted(async () => {
  await load({ force: true })
  await myAccountStore.fetchVetAppointment()
  await loadOrderDetails()
  checkPaymentNotice()
})

// ---------- mascotas ----------
const petsInPlan = computed(() => {
  const names = planPets.value.map((p: any) => p.name)
  const list = (myPets.value as any[]) || []
  return names.length ? list.filter((p) => names.includes(p.name)) : list
})
const stage = (p: any) => (Number(p.age || 0) >= 1 ? 'Adulto' : 'Cachorro')

const editPet = (p: any, index: number) => {
  track('mascota_editar_inicio', {
    origen: 'inicio',
    mascota_posicion: index + 1,
  })
  navigateTo(localePath({ path: '/profile/my-pets', query: { pet: p.id } }))
}
const goPlan = () => {
  track('click_nav', { destino: 'mi_plan', ubicacion: 'inicio' })
  navigateTo(localePath('/profile/my-plan'))
}

// ---------- paso a adulto ----------
// TODO(Kubo): idealmente el backend marca la mascota que acaba de pasar a adulto
// (p. ej. pet.becameAdultAt). Mientras tanto: 1 año y 0–1 meses.
const newAdult = computed(() =>
  petsInPlan.value.find(
    (p: any) =>
      Number(p.age) === 1 &&
      Number(p.month || 0) <= 1 &&
      !adultNoticeSeen.value.includes(p.id),
  ),
)
const adultText = computed(() => {
  const pet = newAdult.value
  if (!pet) return ''
  const row = planPets.value.find((p: any) => p.name === pet.name)
  const pk = packagesText(row?.products || [])
  return `Desde la entrega del ${formatLongDay((plan.value as any)?.nextDelivery)} recibe alimento de adulto: ${pk.total} paquetes por entrega, por ${useFormatPrice((plan.value as any)?.total)}. Si quieres revisar su nueva etapa en detalle, agenda una asesoría sin costo con nuestro equipo veterinario.`
})
const adultIndex = computed(
  () => petsInPlan.value.findIndex((p: any) => p.id === newAdult.value?.id) + 1,
)
const adultVet = () => {
  track('asesoria_agendar_inicio', {
    origen: 'banner_adulto',
    mascota_posicion: adultIndex.value,
  })
  navigateTo(
    localePath({
      path: '/profile/vet-advice',
      query: { motivo: 'etapa', pet: newAdult.value?.id },
    }),
  )
}
const adultOk = () => {
  track('etapa_adulto_aviso_aceptado', { mascota_posicion: adultIndex.value })
  if (newAdult.value) myAccountStore.markAdultNoticeSeen(newAdult.value.id)
}

// ---------- asesoría ----------
const appointment = computed(() => myAccountStore.currentAppointment)
const reschedule = () => {
  track('asesoria_reprogramar_inicio', { origen: 'inicio' })
  navigateTo(
    localePath({ path: '/profile/vet-advice', query: { reprogramar: '1' } }),
  )
}

// ---------- cajas de pedido ----------
const stateTag = (o: any) =>
  ({
    preparacion: 'En preparación',
    alistamiento: 'En alistamiento',
    en_camino: 'En camino',
    pago_fallido: 'Pago rechazado',
    pago_pendiente: 'Pago pendiente',
  })[orderState(o)]

const boxFor = (o: any) => {
  const d = orderDetails.value[o.id] || {}
  const products = (d.orderDetail || []).flatMap(
    (x: any) => x.detailProducts || [],
  )
  const failed = orderState(o) === 'pago_fallido'
  const failure = paymentFailure(o)
  const charge = d.nextPayment || o.nextPayment || chargeDateOf(o.delivery)
  return {
    stateTag: stateTag(o),
    stateError: failed,
    stateSub: failed
      ? failure === 'tarjeta_vencida'
        ? ' — Tarjeta vencida'
        : ' — Saldo insuficiente'
      : '',
    arrival: `Llega el ${formatLongDay(o.delivery)}`,
    arrivalSub: failed ? '' : `(pagado el ${formatDay(charge)})`,
    packages: packagesText(products),
    address: addressText({
      address: d.address,
      complement: d.complement,
      city: d.city,
    }),
    total: useFormatPrice(d.total ?? o.total),
    failText: failed
      ? failure === 'tarjeta_vencida'
        ? `Intentamos cobrar ${useFormatPrice(o.total)} el ${formatLongDay(charge)} y tu tarjeta está vencida. Actualiza tu información de pago para que tu pedido salga a tiempo.`
        : `Intentamos cobrar ${useFormatPrice(o.total)} el ${formatLongDay(charge)} y tu banco lo rechazó por saldo insuficiente. Puedes volver a intentarlo.`
      : '',
    failCta:
      failure === 'tarjeta_vencida'
        ? 'Actualizar información de pago'
        : 'Reintentar pago',
    editable: isOrderEditable(o) || failed,
    lockText:
      orderState(o) === 'en_camino'
        ? 'Tu pedido ya está en camino, no se puede modificar'
        : 'Tu pedido ya se está alistando, no se puede modificar',
  }
}

const nextBox = computed(() => {
  const p: any = plan.value || {}
  return {
    arrival: `Llega el ${formatLongDay(p.nextDelivery)}`,
    arrivalSub: `(te cobramos el ${formatLongDay(p.nextPayment || chargeDateOf(p.nextDelivery))})`,
    packages: packagesText(
      planPets.value.flatMap((x: any) => x.products || []),
    ),
    address: addressText(p.address),
    total: useFormatPrice(p.total),
  }
})

const nextPlanText = computed(() => {
  const p: any = plan.value || {}
  if (!p.nextDelivery) return ''
  return `Siguiente pedido de tu plan: ${formatLongDay(p.nextDelivery)} (cobro el ${formatLongDay(p.nextPayment || chargeDateOf(p.nextDelivery))}).`
})

// ---------- acciones ----------
const editOrderFor = ref<any>(null)
const openEditOrder = (o: any) => {
  track('pedido_editar_inicio', {
    origen: 'inicio',
    pedido_estado: orderState(o),
  })
  editOrderFor.value = o
}
const lockedSeen = (o: any) =>
  track('pedido_editar_bloqueado_visto', { pedido_estado: orderState(o) })

const failCta = (o: any) => {
  if (paymentFailure(o) === 'tarjeta_vencida') {
    track('pago_metodo_editar_inicio', { origen: 'inicio' })
    navigateTo(
      localePath({
        path: '/profile/my-payment-methods',
        query: { actualizar: '1' },
      }),
    )
  } else {
    track('pago_reintentar_inicio', { origen: 'inicio' })
    navigateTo(localePath({ name: 'payment-pay-id', params: { id: o.id } }))
  }
}

const editPlan = (origen: string) => {
  track('plan_editar_inicio', { origen })
  navigateTo(localePath('/profile/my-plan/adjust'))
}

const showAdvance = ref(false)
const openAdvance = () => {
  track('pedido_adelantar_inicio', { origen: 'inicio' })
  showAdvance.value = true
}

const reactivate = () => {
  track('plan_activar_inicio', { origen: 'inicio' })
  navigateTo(
    localePath({ path: '/profile/reactivate', query: { from: 'inicio' } }),
  )
}

// ---------- avisos de pago ----------
const notice = ref<{ kind: 'paid' | 'failed'; order: any } | null>(null)
const readList = (key: string, storage: 'local' | 'session') => {
  try {
    const s = storage === 'local' ? localStorage : sessionStorage
    return JSON.parse(s.getItem(key) || '[]') as number[]
  } catch {
    return []
  }
}
const writeList = (
  key: string,
  storage: 'local' | 'session',
  list: number[],
) => {
  try {
    const s = storage === 'local' ? localStorage : sessionStorage
    s.setItem(key, JSON.stringify(list))
  } catch {
    /* sin almacenamiento: el aviso puede repetirse */
  }
}
const checkPaymentNotice = () => {
  const failed = currentOrders.value.find(
    (o) => orderState(o) === 'pago_fallido',
  )
  if (failed && !readList('tb_fail_notice', 'session').includes(failed.id)) {
    notice.value = { kind: 'failed', order: failed }
    writeList('tb_fail_notice', 'session', [
      ...readList('tb_fail_notice', 'session'),
      failed.id,
    ])
    return
  }
  // "¡Recibimos tu pago!" solo la primera vez después del cobro
  const paid = currentOrders.value.find((o) => o.statusPayment === 'paid')
  if (paid && !readList('tb_paid_notice', 'local').includes(paid.id)) {
    notice.value = { kind: 'paid', order: paid }
    writeList('tb_paid_notice', 'local', [
      ...readList('tb_paid_notice', 'local'),
      paid.id,
    ])
  }
}
const noticeOrder = computed(() => notice.value?.order || {})
</script>

<template>
  <div class="ma-page">
    <h1>¡Hola, {{ useSearchItemJson('firstName', profile) }}!</h1>

    <!-- Mascotas -->
    <div v-if="petsInPlan.length" class="ma-pets">
      <div v-for="(p, i) in petsInPlan" :key="p.id" class="ma-box ma-pet">
        <img v-if="p.photo" :src="p.photo" alt="" class="ma-pet-photo" />
        <span v-else class="ma-pet-photo ma-pet-initial">{{
          (p.name || '?').charAt(0)
        }}</span>
        <div style="flex: 1">
          <b class="ma-pet-name">{{ p.name }}</b>
          <span class="ma-small" style="display: block"
            >{{ stage(p) }} · {{ ageText(p.age, p.month) }}</span
          >
        </div>
        <button
          class="ma-icon-btn"
          :aria-label="`Editar los datos de ${p.name}`"
          @click="editPet(p, i)"
        >
          <img src="/icons/profile/ic_edit.svg" alt="" width="18" height="18" />
        </button>
      </div>
    </div>
    <button
      v-if="!isCancelled"
      class="ma-link is-muted"
      style="align-self: flex-start"
      @click="goPlan"
    >
      Ver plan
    </button>

    <!-- Plan cancelado -->
    <section v-if="isCancelled" class="ma-box">
      <h2>Tu plan está cancelado.</h2>
      <span class="ma-sub"
        >No habrá más cobros. Cuando quieras, vuelve a armar el plan de
        {{ petNames }}.</span
      >
      <button class="ma-btn" style="align-self: flex-start" @click="reactivate">
        Reactivar mi plan
      </button>
    </section>

    <template v-else>
      <!-- Paso a adulto -->
      <section v-if="newAdult" class="ma-box is-soft">
        <h3>
          ¡{{ newAdult.name }} ya es adulto! Cumplió 1 año y actualizamos su
          plan
        </h3>
        <span class="ma-sub">{{ adultText }}</span>
        <div class="ma-row" style="justify-content: flex-start">
          <button class="ma-link" @click="adultVet">
            Agendar asesoría veterinaria
          </button>
          <button class="ma-link" @click="adultOk">Entendido</button>
        </div>
      </section>

      <!-- Recordatorio de asesoría -->
      <section v-if="appointment" class="ma-box">
        <div class="ma-row">
          <div>
            <h3>Recuerda tu asesoría veterinaria</h3>
            <span class="ma-small">
              Para {{ appointment.petName }} ·
              {{ formatLongDay(appointment.date) }}, {{ appointment.time }} (20
              min) · con {{ appointment.vetName }} por videollamada · Motivo:
              {{ appointment.reason }}
            </span>
          </div>
          <button class="ma-link" @click="reschedule">Reprogramar</button>
        </div>
      </section>

      <!-- Pedidos en curso -->
      <template v-if="currentOrders.length">
        <ProfileV3HomeOrderBox
          v-for="(o, i) in currentOrders"
          :key="o.id"
          kind="current"
          v-bind="boxFor(o)"
          :show-edit-plan="i === 0"
          @edit-order="openEditOrder(o)"
          @edit-order-locked="lockedSeen(o)"
          @fail-cta="failCta(o)"
          @edit-plan="editPlan('inicio_pedido_en_curso')"
        />
        <span v-if="nextPlanText" class="ma-small">{{ nextPlanText }}</span>
      </template>

      <!-- Próximo pedido (fuera de la ventana de cobro) -->
      <ProfileV3HomeOrderBox
        v-else
        kind="next"
        state-tag="Programado"
        v-bind="nextBox"
        :show-advance="true"
        :show-edit-plan="true"
        @advance="openAdvance"
        @edit-plan="editPlan('inicio_proximo_pedido')"
      />
    </template>

    <ProfileV3OrderEditOrderDialog
      v-if="editOrderFor"
      :show="!!editOrderFor"
      :order="editOrderFor"
      origen="inicio"
      @close="editOrderFor = null"
      @saved="loadOrderDetails"
    />

    <ProfileV3HomeAdvanceDialog
      :show="showAdvance"
      :amount="Number((plan as any)?.total || 0)"
      @close="showAdvance = false"
      @done="
        () => {
          showAdvance = false
          loadOrderDetails()
        }
      "
    />

    <ProfileV3HomePaymentNotice
      v-if="notice"
      :show="!!notice"
      :kind="notice.kind"
      :amount="Number(noticeOrder.total || 0)"
      :charge-date="
        noticeOrder.nextPayment || chargeDateOf(noticeOrder.delivery)
      "
      :delivery-date="noticeOrder.delivery"
      :failure="paymentFailure(noticeOrder)"
      @close="notice = null"
      @retry="
        () => {
          notice = null
          navigateTo(
            localePath({
              name: 'payment-pay-id',
              params: { id: noticeOrder.id },
            }),
          )
        }
      "
      @update-card="
        () => {
          notice = null
          navigateTo(
            localePath({
              path: '/profile/my-payment-methods',
              query: { actualizar: '1' },
            }),
          )
        }
      "
    />
  </div>
</template>

<style scoped lang="scss">
.ma-pets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.ma-pet {
  flex-direction: row;
  align-items: center;
  padding: 14px 16px;
}
.ma-pet-photo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}
.ma-pet-initial {
  background: #e8f7fa;
  color: #003b71;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'heading-pro-treble-bold';
  font-size: 20px;
}
.ma-pet-name {
  font-family: 'heading-pro-treble-bold';
  font-size: 17px;
  color: #003b71;
}
.ma-icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid #dfe5ee;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
