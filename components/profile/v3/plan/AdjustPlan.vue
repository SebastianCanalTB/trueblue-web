<script setup lang="ts">
/** Ajustar plan: fechas (incluye frecuencia), dirección, cantidad / sabores y salida a cancelar. */
const localePath = useLocalePath()
const { track } = useTracking()
const { load, plan, currentOrders } = useMyAccount()

onMounted(() => load())

const lastCurrent = computed(
  () => currentOrders.value[currentOrders.value.length - 1],
)
const intro = computed(() => {
  const p: any = plan.value || {}
  return lastCurrent.value && p.nextDelivery
    ? `Estos cambios aplican a tus próximos pedidos, desde el ${formatLongDay(p.nextDelivery)}. Tu pedido en curso se edita desde Inicio.`
    : 'Estos cambios aplican a tus próximos pedidos.'
})

const rows = [
  {
    opcion: 'fecha',
    title: 'Cambiar fechas de entrega',
    desc: 'Elige el día de tu próximo pedido según tus necesidades / cambia la frecuencia de tu plan',
    to: '/profile/my-plan/dates',
    icon: 'cal',
  },
  {
    opcion: 'direccion',
    title: 'Cambiar dirección',
    desc: 'A dónde llegan tus siguientes pedidos',
    to: '/profile/my-plan/address',
    icon: 'pin',
  },
  {
    opcion: 'cantidad_sabores',
    title: 'Ajustar cantidad / sabores',
    desc: 'Ajusta la cantidad de paquetes que recibes y los sabores de tu plan',
    to: '/profile/my-plan/quantity',
    icon: 'bag',
  },
]

const pick = (r: any) => {
  track('plan_editar_opcion_seleccionado', {
    opcion: r.opcion,
    origen: 'ajustar_plan',
  })
  navigateTo(localePath(r.to))
}
const back = () => {
  track('plan_editar_volver', { formulario: 'ajustar_plan' })
  navigateTo(localePath('/profile/my-plan'))
}

const showCancel = ref(false)
const openCancel = () => {
  track('plan_inactivar_inicio', { origen: 'ajustar_plan' })
  showCancel.value = true
}
</script>

<template>
  <div class="ma-page">
    <button class="ma-link" style="align-self: flex-start" @click="back">
      ← Volver a Mi plan
    </button>
    <h1>Ajustar plan</h1>
    <span class="ma-sub">{{ intro }}</span>

    <div>
      <button
        v-for="r in rows"
        :key="r.opcion"
        class="ma-option"
        @click="pick(r)"
      >
        <span class="ma-option-icon" aria-hidden="true">
          <svg
            v-if="r.icon === 'cal'"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </svg>
          <svg
            v-else-if="r.icon === 'pin'"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 7h12l-1 14H7z" />
            <path d="M9 7V5a3 3 0 0 1 6 0v2" />
          </svg>
        </span>
        <span class="ma-option-text">
          <b>{{ r.title }}</b>
          <span class="ma-small">{{ r.desc }}</span>
        </span>
        <span aria-hidden="true">›</span>
      </button>
    </div>

    <button
      class="ma-link is-muted"
      style="align-self: flex-start"
      @click="openCancel"
    >
      Cancelar mi suscripción
    </button>

    <ProfileV3CancelFlow
      v-if="showCancel"
      :show="showCancel"
      @close="showCancel = false"
    />
  </div>
</template>
