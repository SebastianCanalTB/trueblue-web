<script setup lang="ts">
/**
 * Mi plan v3: próximos 2 pedidos en línea de tiempo, detalle por mascota,
 * snacks, dirección y valor por entrega.
 */
import { DateTime } from 'luxon'

const localePath = useLocalePath()
const { track } = useTracking()
const {
  load,
  plan,
  myPets,
  isCancelled,
  petNames,
  planPets,
  frequencyDays,
  frequencyLabel,
  currentOrders,
  orderState,
  isOrderEditable,
  paymentFailure,
  packagesText,
  addressText,
} = useMyAccount()

onMounted(() => load({ force: true }))

// ---------- línea de tiempo ----------
const timeline = computed(() => {
  const items: any[] = []
  currentOrders.value.slice(0, 2).forEach((o) => {
    const st = orderState(o)
    items.push({
      key: `o${o.id}`,
      order: o,
      date: o.delivery,
      tag:
        st === 'pago_fallido'
          ? 'Pago rechazado'
          : st === 'en_camino'
            ? 'En camino'
            : st === 'alistamiento'
              ? 'En alistamiento'
              : 'Pagado · en preparación',
      error: st === 'pago_fallido',
      sub:
        st === 'pago_fallido'
          ? ''
          : `Pagado el ${formatDay(o.nextPayment || chargeDateOf(o.delivery))}`,
      editable: isOrderEditable(o) || st === 'pago_fallido',
    })
  })
  const p: any = plan.value || {}
  if (p.nextDelivery && !isCancelled.value) {
    let next = DateTime.fromISO(String(p.nextDelivery))
    while (items.length < 2) {
      const iso = next.toISODate() as string
      items.push({
        key: `p${iso}`,
        order: null,
        date: iso,
        tag: 'Programado',
        error: false,
        sub: `Cobro el ${formatDay(items.length === currentOrders.value.length ? p.nextPayment || chargeDateOf(iso) : chargeDateOf(iso))}`,
        editable: false,
      })
      next = next.plus({ days: frequencyDays.value })
    }
  }
  return items.slice(0, 2)
})

// ---------- mascotas ----------
const petRows = computed(() =>
  planPets.value.map((pp: any, i: number) => {
    const pet =
      ((myPets.value as any[]) || []).find((x) => x.name === pp.name) || {}
    const pk = packagesText(pp.products || [])
    return {
      index: i,
      id: pet.id,
      name: pp.name,
      rows: [
        {
          k: 'Perfil',
          v: [
            pet?.race?.name,
            ageText(pet.age, pet.month),
            pet.currentWeight ? `${pet.currentWeight} kg` : '',
          ]
            .filter(Boolean)
            .join(' · '),
        },
        { k: 'Porción diaria', v: pp.idealPortion || '-' },
        { k: 'Sabores', v: `${pk.label} ${pk.detail}` },
        // CAMPO NUEVO: condiciones médicas de la mascota (pet.medicalConditions)
        {
          k: 'Condiciones médicas',
          v:
            (pet.medicalConditions || [])
              .map((c: any) => c.name || c)
              .join(', ') || 'Ninguna',
        },
      ],
    }
  }),
)

const snacksRow = computed(() =>
  planPets.value
    .flatMap((p: any) => p.products || [])
    .find((x: any) => flavorKey(x.name) === 'snacks'),
)

// ---------- acciones ----------
const editPlan = (origen: string) => {
  track('plan_editar_inicio', { origen })
  navigateTo(localePath('/profile/my-plan/adjust'))
}
const editFrequency = () => {
  track('plan_fecha_editar_inicio', { origen: 'mi_plan_frecuencia' })
  navigateTo(localePath('/profile/my-plan/dates'))
}
const editPet = (r: any) => {
  track('mascota_editar_inicio', {
    origen: 'mi_plan',
    mascota_posicion: r.index + 1,
  })
  navigateTo(localePath({ path: '/profile/my-pets', query: { pet: r.id } }))
}
const addSnacks = () => {
  track('snacks_agregar_inicio', { origen: 'mi_plan' })
  navigateTo(
    localePath({ path: '/profile/my-plan/quantity', query: { snacks: '1' } }),
  )
}
const reactivate = () => {
  track('plan_activar_inicio', { origen: 'mi_plan' })
  navigateTo(
    localePath({ path: '/profile/reactivate', query: { from: 'mi_plan' } }),
  )
}

const editOrderFor = ref<any>(null)
const editOrder = (o: any) => {
  track('pedido_editar_inicio', {
    origen: 'mi_plan',
    pedido_estado: orderState(o),
  })
  editOrderFor.value = o
}
const failCta = (o: any) => {
  if (paymentFailure(o) === 'tarjeta_vencida') {
    track('pago_metodo_editar_inicio', { origen: 'mi_plan' })
    navigateTo(
      localePath({
        path: '/profile/my-payment-methods',
        query: { actualizar: '1' },
      }),
    )
  } else {
    track('pago_reintentar_inicio', { origen: 'mi_plan' })
    navigateTo(localePath({ name: 'payment-pay-id', params: { id: o.id } }))
  }
}
</script>

<template>
  <div class="ma-page">
    <div>
      <h1>Mi plan</h1>
      <span v-if="!isCancelled" class="ma-sub">
        Comida real para {{ petNames }},
        <button
          class="ma-link"
          style="font-size: 14px; min-height: 0"
          @click="editFrequency"
        >
          {{ frequencyLabel }}</button>.
      </span>
    </div>

    <section v-if="isCancelled" class="ma-box">
      <h2>Tu plan está cancelado.</h2>
      <span class="ma-sub"
        >No habrá más cobros. Tu perfil y el de tus mascotas quedan
        guardados.</span
      >
      <button class="ma-btn" style="align-self: flex-start" @click="reactivate">
        Reactivar mi plan
      </button>
    </section>

    <template v-else>
      <!-- Próximos pedidos -->
      <section class="ma-box">
        <h2>Tus próximos pedidos</h2>
        <ol class="ma-timeline">
          <li v-for="item in timeline" :key="item.key">
            <span class="ma-small">Entrega</span>
            <b class="ma-timeline-date">{{ formatLongDay(item.date) }}</b>
            <span class="ma-tag" :class="{ 'is-error': item.error }">{{
              item.tag
            }}</span>
            <span v-if="item.sub" class="ma-small">{{ item.sub }}</span>
            <template v-if="item.order">
              <button
                v-if="item.error"
                class="ma-btn"
                style="align-self: flex-start"
                @click="failCta(item.order)"
              >
                {{
                  paymentFailure(item.order) === 'tarjeta_vencida'
                    ? 'Actualizar información de pago'
                    : 'Reintentar pago'
                }}
              </button>
              <button
                v-if="item.editable"
                class="ma-link"
                style="align-self: flex-start"
                @click="editOrder(item.order)"
              >
                Editar este pedido
              </button>
            </template>
          </li>
        </ol>
        <button
          class="ma-btn"
          style="align-self: flex-end"
          @click="editPlan('mi_plan_pedidos')"
        >
          Editar mi plan
        </button>
      </section>

      <!-- Mascotas -->
      <section v-for="r in petRows" :key="r.name" class="ma-box">
        <div class="ma-row">
          <h2>{{ r.name }}</h2>
          <button
            class="ma-icon-btn"
            :aria-label="`Editar los datos de ${r.name}`"
            @click="editPet(r)"
          >
            <img
              src="/icons/profile/ic_edit.svg"
              alt=""
              width="18"
              height="18"
            />
          </button>
        </div>
        <dl class="ma-dl">
          <template v-for="row in r.rows" :key="row.k">
            <dt>{{ row.k }}</dt>
            <dd>{{ row.v }}</dd>
          </template>
        </dl>
      </section>

      <!-- Snacks, dirección y valor -->
      <section class="ma-box">
        <div class="ma-row">
          <div>
            <h3>Snacks del plan</h3>
            <span class="ma-small">
              {{
                snacksRow
                  ? `${snacksRow.numberOfPackages} bolsas por entrega`
                  : 'Tu plan no tiene snacks.'
              }}
            </span>
          </div>
          <button class="ma-link" @click="addSnacks">Agregar snacks</button>
        </div>
        <div>
          <h3>Dirección</h3>
          <span class="ma-small">{{
            addressText((plan as any)?.address)
          }}</span>
        </div>
        <div>
          <h3>Valor por entrega</h3>
          <span>{{ useFormatPrice((plan as any)?.total) }}</span>
        </div>
      </section>

      <button
        class="ma-btn"
        style="align-self: flex-start"
        @click="editPlan('mi_plan_resumen')"
      >
        Editar mi plan
      </button>
    </template>

    <ProfileV3OrderEditOrderDialog
      v-if="editOrderFor"
      :show="!!editOrderFor"
      :order="editOrderFor"
      origen="mi_plan"
      @close="editOrderFor = null"
    />
  </div>
</template>

<style scoped lang="scss">
.ma-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
  li {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px;
    border-left: 3px solid #96d9e9;
    background: #fff;
  }
}
.ma-timeline-date {
  font-family: 'heading-pro-treble-bold';
  font-size: 17px;
  color: #003b71;
}
.ma-dl {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 8px 16px;
  margin: 0;
  dt {
    font-family: 'heading-pro-treble-bold';
    font-size: 13px;
    color: #575e6b;
  }
  dd {
    margin: 0;
    font-size: 14px;
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    dd {
      margin-bottom: 8px;
    }
  }
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
