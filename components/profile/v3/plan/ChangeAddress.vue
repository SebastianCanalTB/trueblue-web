<script setup lang="ts">
/**
 * Cambiar dirección de los pedidos siguientes del plan.
 * Campos obligatorios: dirección y barrio.
 * Servicios existentes: address/create-address + plan/update-plan (checkout.addressId).
 * Barrio e indicaciones son CAMPOS NUEVOS (propuesta: neighborhood, deliveryNotes).
 */
const localePath = useLocalePath()
const accountStore = useAccountStore()
const addressStore = useAddressStore()
const planStore = usePlanStore()
const { getListCities: cities, getListMunicipalities: municipalities } =
  storeToRefs(accountStore)
const { track, trackField } = useTracking()
const { load, plan, planId, buildPlanUpdatePayload, refresh } = useMyAccount()

const form = reactive({
  address: '',
  neighborhood: '',
  cityGroupId: 0 as number,
  municipalityId: 0 as number,
  complement: '',
  notes: '',
})
const ask = ref(false)
const touched = ref(false)

onMounted(async () => {
  await load({ detail: true })
  await accountStore.getCitiesRegister()
  const a: any = (plan.value as any)?.address || {}
  form.address = a.address || ''
  form.complement = a.complement || ''
  form.neighborhood = a.neighborhood || ''
  form.notes = a.deliveryNotes || ''
  const group = (cities.value as any[]).find((c) => c.name === a.city)
  if (group) {
    form.cityGroupId = group.id
    await accountStore.getMunicipalities(group.id)
  }
})

watch(
  () => form.cityGroupId,
  async (id, old) => {
    if (!id || id === old) return
    await accountStore.getMunicipalities(id)
    form.municipalityId = 0
  },
)

const valid = computed(
  () =>
    !!form.address.trim() &&
    !!form.neighborhood.trim() &&
    !!form.municipalityId,
)

const submit = () => {
  touched.value = true
  if (!valid.value) return
  ask.value = true
}

const save = async () => {
  useLoading(true)
  const created: any = await addressStore.createAddress({
    city: form.municipalityId,
    address: form.address,
    complement: form.complement,
    neighborhood: form.neighborhood, // CAMPO NUEVO
    deliveryNotes: form.notes, // CAMPO NUEVO
    predetermined: true,
    latitude: '',
    longitude: '',
  })
  let response = created
  if (created.status && created.code === 100 && created.data?.id) {
    response = await planStore.updatePlan(
      buildPlanUpdatePayload({ addressId: created.data.id }),
      planId.value,
    )
  }
  useLoading(false)
  ask.value = false
  if (response.status && response.code === 100) {
    track('plan_direccion_actualizado', {
      alcance: 'plan',
      origen: 'cambiar_direccion',
    })
    useShowAlert({
      type: 'success',
      message: 'Listo. Tus siguientes pedidos llegarán a la nueva dirección.',
    })
    await refresh()
    navigateTo(localePath('/profile/my-plan'))
  } else {
    if (
      String(response.message || '')
        .toLowerCase()
        .includes('cobertura')
    )
      track('formulario_error', {
        formulario: 'direccion_plan',
        tipo_error: 'sin_cobertura',
      })
    useShowAlert({ type: 'error', message: response.message })
  }
}

const cancel = () => {
  track('plan_editar_cancelado', { formulario: 'direccion_plan' })
  navigateTo(localePath('/profile/my-plan/adjust'))
}
</script>

<template>
  <div class="ma-page">
    <button class="ma-link" style="align-self: flex-start" @click="cancel">
      ← Volver a Ajustar plan
    </button>
    <h1>Cambiar dirección</h1>
    <span class="ma-sub"
      >Esta dirección aplica a tus próximos pedidos. Tu pedido en curso se edita
      desde Inicio.</span
    >

    <section class="ma-box">
      <div class="ma-field">
        <label for="d-address">Dirección</label>
        <input
          id="d-address"
          v-model="form.address"
          @focus="trackField('direccion_plan', 'direccion')"
        />
        <span v-if="touched && !form.address.trim()" class="ma-error-text"
          >Escribe la dirección.</span
        >
      </div>
      <div class="ma-grid-2">
        <div class="ma-field">
          <label for="d-barrio">Barrio</label>
          <input
            id="d-barrio"
            v-model="form.neighborhood"
            @focus="trackField('direccion_plan', 'barrio')"
          />
          <span
            v-if="touched && !form.neighborhood.trim()"
            class="ma-error-text"
            >Escribe el barrio.</span
          >
        </div>
        <div class="ma-field">
          <label for="d-ciudad">Ciudad</label>
          <select
            id="d-ciudad"
            v-model.number="form.cityGroupId"
            @focus="trackField('direccion_plan', 'ciudad')"
          >
            <option v-for="c in cities" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
        <div class="ma-field">
          <label for="d-muni">Municipio</label>
          <select
            id="d-muni"
            v-model.number="form.municipalityId"
            @focus="trackField('direccion_plan', 'municipio')"
          >
            <option v-for="m in municipalities" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
          <span v-if="touched && !form.municipalityId" class="ma-error-text"
            >Elige el municipio.</span
          >
        </div>
        <div class="ma-field">
          <label for="d-apto">Apartamento, torre o casa</label>
          <input
            id="d-apto"
            v-model="form.complement"
            @focus="trackField('direccion_plan', 'complemento')"
          />
        </div>
      </div>
      <div class="ma-field">
        <label for="d-ind">Indicaciones para el repartidor</label>
        <input
          id="d-ind"
          v-model="form.notes"
          @focus="trackField('direccion_plan', 'indicaciones')"
        />
      </div>
    </section>

    <div class="ma-modal-foot">
      <button class="ma-btn is-outline" @click="cancel">Cancelar</button>
      <button class="ma-btn" @click="submit">Guardar dirección</button>
    </div>

    <ProfileV3CommonConfirmAsk
      :show="ask"
      title="¿Seguro que quieres modificar tu plan?"
      text="Tus siguientes pedidos llegarán a esta dirección."
      @yes="save"
      @no="ask = false"
    />
  </div>
</template>
