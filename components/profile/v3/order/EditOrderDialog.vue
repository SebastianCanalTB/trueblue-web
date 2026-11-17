<script setup lang="ts">
/**
 * Editar pedido en curso (pagado en preparación o con pago fallido).
 * Opciones: fecha, dirección y sabores. Solo cambia ESTE pedido.
 *
 * Servicios existentes:
 * - order/get-order-detail/:id         (detalle, productos recomendados por mascota)
 * - order/change-delivery-date/:id     {nextDelivery}
 * - order/change-address               {orderId, address, complement, cityId}
 * - order/update-order                 {orderId, pets:[{pet, products:[{id, numberOfPackages}]}]}
 */
const props = defineProps<{ show: boolean; order: any; origen: string }>()
const emit = defineEmits(['close', 'saved'])

const orderStore = useOrderStore()
const accountStore = useAccountStore()
const planStore = usePlanStore()
const addressStore = useAddressStore()
const { getOrderDetail: detail } = storeToRefs(orderStore)
const { getListMunicipalities: municipalities } = storeToRefs(accountStore)
const {
  orderState,
  frequencyDays,
  frequencyLabel,
  buildPlanUpdatePayload,
  refresh,
  planId,
} = useMyAccount()
const { track, trackField } = useTracking()
const localePath = useLocalePath()

type Step = 'options' | 'date' | 'address' | 'flavors'
const step = ref<Step>('options')
const ask = ref(false)
const askScope = ref(false)
const cityNotice = ref(false)

const pedidoEstado = computed(() => orderState(props.order))

// ---------- carga ----------
watch(
  () => props.show,
  async (v) => {
    if (!v) return
    step.value = 'options'
    ask.value = false
    askScope.value = false
    useLoading(true)
    await orderStore.getOneOrder(props.order.id)
    useLoading(false)
    initForms()
  },
  { immediate: true },
)

// ---------- fecha ----------
const newDate = ref('')

// ---------- dirección ----------
const addr = reactive({
  address: '',
  neighborhood: '',
  municipalityId: 0 as number,
  city: '',
  complement: '',
  notes: '',
})

// ---------- sabores ----------
const flavorPets = ref<any[]>([])
const flavorTab = ref(0)
const maxNotice = ref('')

const initForms = async () => {
  const d: any = detail.value || {}
  newDate.value = toIsoDay(d.delivery || props.order.delivery)
  addr.address = d.address || ''
  addr.complement = d.complement || ''
  addr.city = d?.cities?.cityGroup?.name || d.city || ''
  addr.municipalityId = d?.cities?.id || 0
  addr.neighborhood = d.neighborhood || '' // CAMPO NUEVO (propuesta)
  addr.notes = d.deliveryNotes || '' // CAMPO NUEVO (propuesta)
  const groupId = d?.cities?.cityGroup?.id
  if (groupId) await accountStore.getMunicipalities(groupId)

  flavorPets.value = (d.orderDetail || []).map((cfg: any) => {
    const current = cfg.detailProducts || []
    const recommended = cfg.petDetail?.recommendedProducts || []
    const max = current.reduce(
      (s: number, p: any) => s + (p.numberOfPackages || 0),
      0,
    )
    return {
      name: cfg.petDetail?.name || cfg.pet,
      max,
      products: (recommended.length ? recommended : current).map((rec: any) => {
        const sel = current.find((p: any) => p.name === rec.name)
        return {
          productId: rec.id,
          name: rec.name,
          numberOfPackages: Number(sel?.numberOfPackages || 0),
        }
      }),
    }
  })
  flavorTab.value = 0
}

const flavorSum = (pet: any) =>
  pet.products.reduce((s: number, p: any) => s + p.numberOfPackages, 0)

const flavorsValid = computed(() =>
  flavorPets.value.every((p) => flavorSum(p) === p.max),
)

const flavorStatus = computed(() => {
  const pet = flavorPets.value[flavorTab.value]
  if (!pet) return ''
  if (maxNotice.value) return maxNotice.value
  const left = pet.max - flavorSum(pet)
  if (left === 0) return `Listo: ${pet.max} de ${pet.max} paquetes repartidos.`
  return `Te faltan ${left} ${left === 1 ? 'paquete' : 'paquetes'} por repartir.`
})

const onFlavorChange = (pet: any, product: any, ev: any) => {
  maxNotice.value = ''
  track('plan_sabor_cantidad_actualizado', {
    sabor: flavorKey(product.name),
    cantidad: ev.value,
    accion: ev.accion,
    mascota_posicion: flavorTab.value + 1,
    origen: 'pedido_en_curso',
  })
}

const flavorMax = (pet: any, product: any) => {
  const others = flavorSum(pet) - product.numberOfPackages
  return Math.max(0, pet.max - others)
}

const onFlavorMax = (pet: any) => {
  maxNotice.value = `Tu pedido ya está pago, solo puedes elegir ${pet.max} paquetes para este pedido.`
  track('pedido_sabores_maximo_visto', { total_paquetes: pet.max })
}

// ---------- navegación ----------
const pick = (opt: 'fecha' | 'direccion' | 'sabores') => {
  track('pedido_editar_opcion_seleccionado', {
    opcion: opt,
    origen: 'editar_pedido',
    pedido_estado: pedidoEstado.value,
  })
  step.value =
    opt === 'fecha' ? 'date' : opt === 'direccion' ? 'address' : 'flavors'
}

const formularioOf = computed(
  () =>
    ({
      date: 'fecha_pedido',
      address: 'direccion_pedido',
      flavors: 'sabores_pedido',
    })[step.value as 'date'] || '',
)

const close = () => {
  track(
    'pedido_editar_cancelado',
    step.value === 'options'
      ? { paso: 'opciones' }
      : { formulario: formularioOf.value },
  )
  emit('close')
}
const back = () => {
  if (ask.value || askScope.value) {
    ask.value = false
    askScope.value = false
    return
  }
  if (step.value === 'options') return close()
  step.value = 'options'
}

const goEditPlan = () => {
  emit('close')
  navigateTo(localePath('/profile/my-plan/adjust'))
}
const editPlanFromNote = () => {
  track('plan_editar_inicio', { origen: 'editar_pedido' })
  goEditPlan()
}

// ---------- guardar ----------
const save = () => {
  if (step.value === 'address') {
    track('pedido_actualizar_enviado', { formulario: 'direccion_pedido' })
    askScope.value = true
    return
  }
  ask.value = true
}

const afterSave = async (message: string) => {
  useShowAlert({ type: 'success', message })
  ask.value = false
  askScope.value = false
  await refresh()
  emit('saved')
  emit('close')
}

const saveDate = async () => {
  useLoading(true)
  const response = await orderStore.changeOrderDate(props.order.id, {
    nextDelivery: newDate.value,
  })
  useLoading(false)
  if (response.status && response.code === 100) {
    track('pedido_fecha_actualizado', {
      nueva_fecha: newDate.value,
      dias_cambio: daysBetween(props.order.delivery, newDate.value),
      pedido_estado: pedidoEstado.value,
    })
    await afterSave(
      `Listo. Tu pedido ahora llega el ${formatLongDay(newDate.value)}.`,
    )
  } else useShowAlert({ type: 'error', message: response.message })
}

const saveFlavors = async () => {
  useLoading(true)
  const response = await orderStore.editOrder({
    orderId: Number(props.order.id),
    pets: flavorPets.value
      .map((p) => ({
        pet: p.name,
        products: p.products
          .filter((x: any) => x.numberOfPackages > 0)
          .map((x: any) => ({
            id: x.productId,
            numberOfPackages: x.numberOfPackages,
          })),
      }))
      .filter((p) => p.products.length > 0),
  })
  useLoading(false)
  if (response.status && response.code === 100) {
    track('pedido_sabores_actualizado', { pedido_estado: pedidoEstado.value })
    await afterSave('Listo. Guardamos los sabores de esta entrega.')
  } else useShowAlert({ type: 'error', message: response.message })
}

const saveAddress = async (alcance: 'pedido' | 'plan') => {
  useLoading(true)
  const response = await orderStore.updateAddress({
    orderId: Number(props.order.id),
    address: addr.address,
    complement: addr.complement,
    cityId: addr.municipalityId,
    neighborhood: addr.neighborhood, // CAMPO NUEVO (propuesta)
    deliveryNotes: addr.notes, // CAMPO NUEVO (propuesta)
  })
  let ok = response.status && response.code === 100
  if (ok && alcance === 'plan') {
    // La dirección también queda para el plan: se crea y se usa en update-plan.
    const created = await addressStore.createAddress({
      city: addr.municipalityId,
      address: addr.address,
      complement: addr.complement,
      predetermined: true,
      latitude: '',
      longitude: '',
    })
    const addressId = (created as any)?.data?.id
    if (addressId) {
      await planStore.getOnePlan(planId.value)
      const up = await planStore.updatePlan(
        buildPlanUpdatePayload({ addressId }),
        planId.value,
      )
      ok = up.status && up.code === 100
    } else ok = false
  }
  useLoading(false)
  if (ok) {
    track('pedido_direccion_actualizado', {
      alcance,
      pedido_estado: pedidoEstado.value,
    })
    await afterSave(
      alcance === 'plan'
        ? 'Listo. Usaremos esta dirección para este pedido y para todo tu plan.'
        : 'Listo. Este pedido llegará a la nueva dirección.',
    )
  } else useShowAlert({ type: 'error', message: response.message })
}

const confirmYes = () => {
  if (step.value === 'date') return saveDate()
  if (step.value === 'flavors') return saveFlavors()
}

const onCityClick = () => {
  cityNotice.value = true
  track('pedido_ciudad_bloqueado_visto')
}
const goPlanAddress = () => {
  track('plan_editar_opcion_seleccionado', {
    opcion: 'direccion',
    origen: 'ciudad_bloqueada',
  })
  emit('close')
  navigateTo(localePath('/profile/my-plan/address'))
}

const titlePrefix = computed(
  () =>
    ({
      date: 'Cambiar fecha de ',
      address: 'Cambiar dirección de ',
      flavors: 'Cambiar sabores de ',
    })[step.value as 'date'] || '',
)
</script>

<template>
  <ProfileV3CommonModal
    :show="show && !!order"
    :back-label="step === 'options' ? '' : 'Volver'"
    @close="close"
    @back="back"
  >
    <template #title>
      <template v-if="step === 'options'">Editar pedido en curso</template>
      <template v-else>
        {{ titlePrefix
        }}<ProfileV3CommonScopeTip
          :formulario="formularioOf"
          @edit-plan="goEditPlan"
        />
      </template>
    </template>

    <!-- Opciones -->
    <template v-if="step === 'options'">
      <span class="ma-sub">
        Pedido del {{ formatLongDay(order.delivery) }}
        {{
          pedidoEstado === 'pago_fallido' ? '· pago pendiente.' : '· ya pagado.'
        }}
        ¿Qué quieres cambiar?
      </span>
      <div>
        <button class="ma-option" @click="pick('fecha')">
          <span class="ma-option-icon" aria-hidden="true">
            <svg
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
          </span>
          <span class="ma-option-text">
            <b>Fecha de entrega</b>
            <span class="ma-small"
              >Mueve este pedido. Tus siguientes pedidos se cuentan desde la
              nueva fecha, {{ frequencyLabel }}.</span
            >
          </span>
        </button>
        <button class="ma-option" @click="pick('direccion')">
          <span class="ma-option-icon" aria-hidden="true">
            <svg
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
          </span>
          <span class="ma-option-text">
            <b>Dirección</b>
            <span class="ma-small"
              >Envía este pedido a otra dirección. Tu plan sigue con la de
              siempre.</span
            >
          </span>
        </button>
        <button class="ma-option" @click="pick('sabores')">
          <span class="ma-option-icon" aria-hidden="true">
            <svg
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
            <b>Sabores</b>
            <span class="ma-small"
              >Reparte los paquetes de este pedido entre las recetas. Solo
              cambia este pedido.</span
            >
          </span>
        </button>
      </div>
      <span class="ma-small">
        Si quieres cambiar tus siguientes pedidos, usa
        <button
          class="ma-link"
          style="font-size: 13px; min-height: 0"
          @click="editPlanFromNote"
        >
          Editar mi plan</button
        >.
      </span>
    </template>

    <!-- Fecha -->
    <template v-else-if="step === 'date'">
      <ProfileV3CommonDeliveryCalendar
        v-model="newDate"
        formulario="fecha_pedido"
        :frequency-days="frequencyDays"
        :max-days="31"
        @pick="
          (d: string) =>
            track('formulario_campo_seleccionado', {
              formulario: 'fecha_pedido',
              campo: 'fecha',
              dias_cambio: daysBetween(order.delivery, d),
            })
        "
      />
      <span class="ma-small"
        >El plan se recalcula desde la nueva fecha: tus siguientes pedidos
        llegan {{ frequencyLabel }}.</span
      >
    </template>

    <!-- Dirección -->
    <template v-else-if="step === 'address'">
      <div class="ma-field">
        <label>Dirección</label>
        <input
          v-model="addr.address"
          @focus="trackField('direccion_pedido', 'direccion')"
        />
      </div>
      <div class="ma-grid-2">
        <div class="ma-field">
          <label>Barrio</label>
          <input
            v-model="addr.neighborhood"
            @focus="trackField('direccion_pedido', 'barrio')"
          />
        </div>
        <div class="ma-field">
          <label>Municipio</label>
          <select
            v-model.number="addr.municipalityId"
            @focus="trackField('direccion_pedido', 'municipio')"
          >
            <option v-for="m in municipalities" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
        </div>
        <div class="ma-field">
          <label>Ciudad</label>
          <input :value="addr.city" readonly @click="onCityClick" />
        </div>
        <div class="ma-field">
          <label>Apartamento, torre o casa</label>
          <input
            v-model="addr.complement"
            @focus="trackField('direccion_pedido', 'complemento')"
          />
        </div>
      </div>
      <span v-if="cityNotice" class="ma-small">
        No puedes cambiar la ciudad de este pedido porque ya está pago. Si te
        cambiaste de ciudad,
        <button
          class="ma-link"
          style="font-size: 13px; min-height: 0"
          @click="goPlanAddress"
        >
          actualiza la dirección de tu plan</button
        >.
      </span>
      <div class="ma-field">
        <label>Indicaciones para el repartidor</label>
        <input
          v-model="addr.notes"
          @focus="trackField('direccion_pedido', 'indicaciones')"
        />
      </div>
    </template>

    <!-- Sabores -->
    <template v-else-if="step === 'flavors'">
      <div class="ma-box is-soft">
        <span class="ma-small">
          Te recomendamos un solo sabor para cuidar la flora intestinal de
          {{ flavorPets[flavorTab]?.name || 'tu perro' }}. Si vas a combinar o
          cambiar de proteína, hazlo con una transición gradual.
        </span>
      </div>
      <div
        v-if="flavorPets.length > 1"
        class="ma-row"
        style="justify-content: flex-start"
      >
        <span class="ma-small">¿Para quién?</span>
        <button
          v-for="(p, i) in flavorPets"
          :key="p.name"
          class="ma-pill"
          :class="{ 'is-on': flavorTab === i }"
          @click="
            () => {
              flavorTab = i
              track('formulario_campo_seleccionado', {
                formulario: 'sabores_pedido',
                campo: 'mascota',
                mascota_posicion: i + 1,
              })
            }
          "
        >
          {{ p.name }}
        </button>
      </div>
      <template v-if="flavorPets[flavorTab]">
        <span class="ma-sub">
          Esta entrega trae {{ flavorPets[flavorTab].max }} paquetes para
          {{ flavorPets[flavorTab].name }}. Repártelos como quieras.
        </span>
        <div
          v-for="prod in flavorPets[flavorTab].products"
          :key="prod.productId"
          class="ma-row ma-flavor"
        >
          <span class="ma-row" style="gap: 10px; justify-content: flex-start">
            <img
              :src="FLAVOR_ICONS[flavorKey(prod.name)]"
              alt=""
              width="22"
              height="22"
            />
            <b>{{ prod.name }}</b>
          </span>
          <ProfileV3CommonCounter
            v-model="prod.numberOfPackages"
            :label="`de ${prod.name}`"
            :max="flavorMax(flavorPets[flavorTab], prod)"
            @change="
              (ev: any) => onFlavorChange(flavorPets[flavorTab], prod, ev)
            "
            @max-reached="onFlavorMax(flavorPets[flavorTab])"
          />
        </div>
        <span class="ma-small">{{ flavorStatus }}</span>
      </template>
    </template>

    <template v-if="step !== 'options'" #footer>
      <button class="ma-btn is-outline" @click="close">Cancelar</button>
      <button
        class="ma-btn"
        :disabled="
          (step === 'flavors' && !flavorsValid) ||
          (step === 'address' && !addr.address)
        "
        @click="save"
      >
        Guardar cambio en esta entrega
      </button>
    </template>
  </ProfileV3CommonModal>

  <ProfileV3CommonConfirmAsk
    :show="ask"
    title="¿Seguro que quieres modificar esta entrega?"
    @yes="confirmYes"
    @no="ask = false"
  />

  <ProfileV3CommonConfirmAsk
    :show="askScope"
    title="¿Dónde usamos esta dirección?"
    :text="`Puedes usarla solo para tu pedido del ${formatLongDay(order?.delivery)} o guardarla también para todo tu plan.`"
    @no="
      () => {
        askScope = false
        track('pedido_editar_volver', { formulario: 'direccion_pedido' })
      }
    "
  >
    <template #actions>
      <button class="ma-btn is-block" @click="saveAddress('pedido')">
        Solo para este pedido
      </button>
      <button class="ma-btn is-outline is-block" @click="saveAddress('plan')">
        Para todo mi plan
      </button>
    </template>
  </ProfileV3CommonConfirmAsk>
</template>

<style scoped lang="scss">
.ma-flavor {
  padding: 10px 0;
  border-bottom: 1px solid #dfe5ee;
}
</style>
