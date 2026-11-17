<script setup lang="ts">
/**
 * Mis mascotas v3: pestañas por mascota, datos (mismas categorías del formulario
 * de compra), salud y agregar mascota.
 *
 * Al guardar datos que cambian la porción (peso, forma corporal o actividad):
 * calculadora de Kubo (calculator/calculate-grammage) + plan/{id}/calculate-packages
 * → se propone la nueva porción y precio. Solo se aplica si el cliente confirma.
 */
const route = useRoute()
const localePath = useLocalePath()
const createStore = useCreateStore()
const calculatorStore = useCalculatorStore()
const planStore = usePlanStore()
const myAccountStore = useMyAccountStore()
const {
  getListPets: races,
  getBodyConditions: bodyConditions,
  getListActivities: activities,
  getMyPet: petDetail,
} = storeToRefs(createStore)
const { adultNoticeSeen } = storeToRefs(myAccountStore)
const { track, trackField } = useTracking()
const {
  load,
  myPets,
  planRows,
  planId,
  frequencyId,
  buildPlanUpdatePayload,
  refresh,
  rowsTotal,
} = useMyAccount()

const tab = ref(0)
const form = reactive({
  name: '',
  years: 0,
  months: 0,
  actualWeight: 0,
  raze: 0 as number,
  genre: '',
  castrated: false,
  recommendedWeight: 0 as number,
  dogActive: 0 as number,
  portions: false,
})
const saved = ref<any>({})
const health = ref({
  conditions: [] as string[],
  allergyFlavors: [] as string[],
  other: '',
})
const healthComments = ref('')
const showAdd = ref(false)
const proposal = ref<null | {
  grammage: number
  packages: number
  price: number
  before: { grammage: number; price: number }
}>(null)

const pets = computed(() => (myPets.value as any[]) || [])
const pet = computed(() => pets.value[tab.value])

onMounted(async () => {
  await load({ force: true, detail: true })
  await Promise.all([
    createStore.getPets({ filter: '' }),
    createStore.getListBodyConditions(),
    createStore.getActivities(),
  ])
  const wanted = Number(route.query.pet || 0)
  const idx = pets.value.findIndex((p) => p.id === wanted)
  tab.value = idx >= 0 ? idx : 0
  await loadPet()
})

const loadPet = async () => {
  if (!pet.value) return
  useLoading(true)
  await createStore.getOnePet(pet.value.id)
  useLoading(false)
  const d: any = petDetail.value || {}
  Object.assign(form, {
    name: d.name || '',
    years: Number(d.age || 0),
    months: Number(d.month || 0),
    actualWeight: Number(d.currentWeight || 0),
    raze: d?.race?.id || 0,
    genre: d.sex || '',
    castrated: !!d.sterilization,
    recommendedWeight: d?.bodyCondition?.id || 0,
    dogActive: d?.petsActivity?.id || 0,
    portions: !!d.isMixedFood,
  })
  saved.value = { ...form }
  // CAMPOS NUEVOS (propuesta): medicalConditions, allergyFlavors, otherCondition, healthComments
  health.value = {
    conditions: d.medicalConditions || [],
    allergyFlavors: d.allergyFlavors || [],
    other: d.otherCondition || '',
  }
  healthComments.value = d.healthComments || ''
  proposal.value = null
}

const pickTab = async (i: number) => {
  tab.value = i
  track('formulario_campo_seleccionado', {
    formulario: 'editar_mascota',
    campo: 'mascota',
    mascota_posicion: i + 1,
  })
  await loadPet()
}

const isAdultNew = computed(
  () =>
    pet.value &&
    Number(pet.value.age) === 1 &&
    Number(pet.value.month || 0) <= 1 &&
    !adultNoticeSeen.value.includes(pet.value.id),
)
const isPuppy = computed(() => pet.value && Number(pet.value.age || 0) < 1)

const petDataPayload = () => ({
  name: form.name,
  sex: form.genre,
  age: Number(form.years),
  month: Number(form.months),
  currentWeight: Number(form.actualWeight),
  bodyCondition: form.recommendedWeight,
  sterilization: form.castrated,
  race: form.raze,
  isMixedFood: form.portions,
  petsActivity: form.dogActive,
})

const portionChanged = computed(
  () =>
    Number(saved.value.actualWeight) !== Number(form.actualWeight) ||
    saved.value.recommendedWeight !== form.recommendedWeight ||
    saved.value.dogActive !== form.dogActive,
)

const saveData = async () => {
  if (!pet.value) return
  useLoading(true)
  const response = await planStore.updatePlan(
    buildPlanUpdatePayload({ petData: { [pet.value.id]: petDataPayload() } }),
    planId.value,
  )
  if (!(response.status && response.code === 100)) {
    useLoading(false)
    useShowAlert({ type: 'error', message: response.message })
    return
  }
  track('mascota_actualizado', {
    mascota_posicion: tab.value + 1,
    propone_porcion: portionChanged.value,
  })

  if (portionChanged.value) {
    const calc = await calculatorStore.getCalculations({
      petId: pet.value.id,
      name: form.name,
      sex: form.genre,
      years: Number(form.years),
      months: Number(form.months),
      weight: Number(form.actualWeight),
      petsBodyConditionId: form.recommendedWeight,
      sterilized: form.castrated,
      race: form.raze,
      isMixedFood: form.portions,
      petsActivityId: form.dogActive,
    })
    const grammage = Number(calc.data?.grammage || 0)
    const row = planRows.value.find((r) => r.petId === pet.value.id)
    if (grammage && row && grammage !== row.grammage) {
      const pk = await planStore.changeTotalOfPackages(planId.value, {
        petId: pet.value.id,
        frequency: frequencyId.value,
        gramage: grammage,
      })
      proposal.value = {
        grammage,
        packages: Number(pk.data?.numberOfPackages || 0),
        price: Number(pk.data?.price || 0),
        before: {
          grammage: row.grammage,
          price: row.price || rowsTotal([row]),
        },
      }
      useLoading(false)
      useShowAlert({
        type: 'info',
        message: `Guardamos los datos de ${form.name}. Revisa y confirma la nueva porción que te proponemos.`,
      })
      return
    }
  }
  useLoading(false)
  saved.value = { ...form }
  useShowAlert({
    type: 'success',
    message: `Listo. Guardamos los datos de ${form.name}.`,
  })
  await refresh()
}

/** Reparte los paquetes nuevos manteniendo la proporción de sabores actual. */
const distribute = (row: any, total: number) => {
  const current =
    row.products.reduce((s: number, p: any) => s + p.numberOfPackages, 0) || 1
  let left = total
  const products = row.products.map((p: any, i: number) => {
    const n =
      i === row.products.length - 1
        ? left
        : Math.round((p.numberOfPackages / current) * total)
    left -= n
    return { ...p, numberOfPackages: Math.max(0, n) }
  })
  return { ...row, products }
}

const confirmPortion = async () => {
  if (!proposal.value || !pet.value) return
  useLoading(true)
  const rows = planRows.value.map((r) =>
    r.petId === pet.value.id
      ? {
          ...distribute(r, proposal.value!.packages),
          grammage: proposal.value!.grammage,
        }
      : r,
  )
  const response = await planStore.updatePlan(
    buildPlanUpdatePayload({ rows }),
    planId.value,
  )
  useLoading(false)
  if (response.status && response.code === 100) {
    track('plan_gramaje_actualizado', {
      gramos: proposal.value.grammage,
      mascota_posicion: tab.value + 1,
      valor_nuevo: proposal.value.price,
      valor_anterior: proposal.value.before.price,
      moneda: 'COP',
      origen: 'datos_mascota',
    })
    useShowAlert({
      type: 'success',
      message: `Listo. Actualizamos la porción de ${form.name}.`,
    })
    proposal.value = null
    await refresh()
  } else useShowAlert({ type: 'error', message: response.message })
}
const cancelPortion = () => {
  track('plan_editar_cancelado', {
    formulario: 'porcion',
    mascota_posicion: tab.value + 1,
  })
  proposal.value = null
  saved.value = { ...form }
}

const saveHealth = async () => {
  if (!pet.value) return
  useLoading(true)
  const response = await myAccountStore.updatePetHealth(pet.value.id, {
    medicalConditions: health.value.conditions,
    allergyFlavors: health.value.allergyFlavors,
    otherCondition: health.value.other,
    healthComments: healthComments.value,
  })
  useLoading(false)
  if (response.status && response.code === 100) {
    track('mascota_actualizado', {
      mascota_posicion: tab.value + 1,
      formulario: 'salud_mascota',
    })
    useShowAlert({
      type: 'success',
      message: `Listo. Guardamos la información de salud de ${form.name}.`,
    })
  } else useShowAlert({ type: 'error', message: response.message })
}

const onPhoto = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !pet.value) return
  // TODO(Kubo): servicio para subir la foto de la mascota (no existe hoy).
  track('mascota_foto_actualizado', { mascota_posicion: tab.value + 1 })
}

const adultVet = () => {
  track('asesoria_agendar_inicio', {
    origen: 'mis_mascotas_adulto',
    mascota_posicion: tab.value + 1,
  })
  navigateTo(
    localePath({
      path: '/profile/vet-advice',
      query: { motivo: 'etapa', pet: pet.value?.id },
    }),
  )
}
const goHistory = () => {
  track('click_nav', { destino: 'asesoria_vet', ubicacion: 'mis_mascotas' })
  navigateTo(
    localePath({
      path: '/profile/vet-advice',
      query: { pet: pet.value?.id },
      hash: '#historial',
    }),
  )
}
const openAdd = () => {
  track('mascota_agregar_inicio', {
    origen: 'mis_mascotas',
    mascota_posicion: pets.value.length + 1,
  })
  showAdd.value = true
}
const onSelect = (campo: string, opcion: any) =>
  track('formulario_campo_seleccionado', {
    formulario: 'editar_mascota',
    campo,
    opcion: String(opcion),
    mascota_posicion: tab.value + 1,
  })
</script>

<template>
  <div class="ma-page">
    <h1>Mis mascotas</h1>

    <div class="ma-row" style="justify-content: flex-start">
      <button
        v-for="(p, i) in pets"
        :key="p.id"
        class="ma-pill"
        :class="{ 'is-on': tab === i }"
        @click="pickTab(i)"
      >
        {{ p.name }}
      </button>
      <button class="ma-link" @click="openAdd">+ Agregar mascota</button>
    </div>

    <template v-if="pet">
      <!-- Propuesta de porción -->
      <section v-if="proposal" class="ma-box is-soft">
        <h2>Nueva porción para {{ form.name }}</h2>
        <span class="ma-sub">
          Con sus datos nuevos, {{ form.name }} necesita
          {{ proposal.grammage }} g al día (antes
          {{ proposal.before.grammage }} g): {{ proposal.packages }} paquetes
          por entrega.
        </span>
        <h3>Así quedaría tu plan</h3>
        <span class="ma-sub">
          Valor de {{ form.name }} por entrega:
          {{ useFormatPrice(proposal.price) }}
          <span class="ma-small"
            >(antes {{ useFormatPrice(proposal.before.price) }})</span
          >
        </span>
        <span class="ma-small"
          >La nueva porción solo se aplica si la confirmas. Si vuelves sin
          confirmar, su porción sigue igual.</span
        >
        <div class="ma-row" style="justify-content: flex-end">
          <button class="ma-btn is-outline" @click="cancelPortion">
            Cancelar
          </button>
          <button class="ma-btn" @click="confirmPortion">
            Confirmar cambios
          </button>
        </div>
      </section>

      <section v-if="isAdultNew" class="ma-box is-soft">
        <h3>{{ pet.name }} ya es adulto.</h3>
        <span class="ma-sub"
          >Actualizamos su plan con alimento de adulto. Si quieres revisar su
          nueva etapa en detalle, agenda una asesoría sin costo con nuestro
          equipo veterinario.</span
        >
        <button
          class="ma-link"
          style="align-self: flex-start"
          @click="adultVet"
        >
          Agendar asesoría veterinaria
        </button>
      </section>
      <span v-else-if="isPuppy" class="ma-small">
        Recuerda mantener la información de {{ pet.name }} actualizada para
        ajustar el tamaño del plan a sus necesidades.
      </span>

      <!-- Datos -->
      <section class="ma-box">
        <div class="ma-row" style="justify-content: flex-start">
          <img v-if="pet.photo" :src="pet.photo" alt="" class="ma-photo" />
          <span v-else class="ma-photo ma-photo-empty">{{
            pet.name?.charAt(0)
          }}</span>
          <label class="ma-link" style="cursor: pointer">
            Cambiar foto
            <input
              type="file"
              accept="image/*"
              style="display: none"
              @change="onPhoto"
            />
          </label>
        </div>
        <div class="ma-grid-2">
          <div class="ma-field">
            <label>Nombre</label>
            <input
              v-model="form.name"
              @focus="
                trackField('editar_mascota', 'nombre', {
                  mascota_posicion: tab + 1,
                })
              "
            />
          </div>
          <div class="ma-field">
            <label>Etapa</label>
            <input
              :value="`${isPuppy ? 'Cachorro' : 'Adulto'} · ${ageText(form.years, form.months)}`"
              readonly
            />
          </div>
          <div class="ma-field">
            <label>Edad</label>
            <div class="ma-row" style="flex-wrap: nowrap">
              <input
                v-model.number="form.years"
                type="number"
                min="0"
                aria-label="Años"
                @focus="trackField('editar_mascota', 'edad_anos')"
              />
              <span class="ma-small">años</span>
              <input
                v-model.number="form.months"
                type="number"
                min="0"
                max="11"
                aria-label="Meses"
                @focus="trackField('editar_mascota', 'edad_meses')"
              />
              <span class="ma-small">meses</span>
            </div>
          </div>
          <div class="ma-field">
            <label>Raza</label>
            <select
              v-model.number="form.raze"
              @change="onSelect('raza', form.raze)"
            >
              <option v-for="r in races" :key="r.id" :value="r.id">
                {{ r.name }}
              </option>
            </select>
          </div>
          <div class="ma-field">
            <label>Peso actual (kg)</label>
            <input
              v-model.number="form.actualWeight"
              type="number"
              min="0"
              step="0.1"
              @focus="trackField('editar_mascota', 'peso')"
            />
          </div>
          <div class="ma-field">
            <label>Forma corporal</label>
            <select
              v-model.number="form.recommendedWeight"
              @change="onSelect('condicion_corporal', form.recommendedWeight)"
            >
              <option v-for="b in bodyConditions" :key="b.id" :value="b.id">
                {{ b.bodyCondition
                }}<template v-if="b.description">
                  · {{ b.description }}</template
                >
              </option>
            </select>
          </div>
          <div class="ma-field">
            <label>¿Qué tan activo(a) es?</label>
            <select
              v-model.number="form.dogActive"
              @change="onSelect('actividad', form.dogActive)"
            >
              <option v-for="a in activities" :key="a.id" :value="a.id">
                {{ a.title
                }}<template v-if="a.description">
                  · {{ a.description }}</template
                >
              </option>
            </select>
          </div>
        </div>
        <button class="ma-btn" style="align-self: flex-end" @click="saveData">
          Guardar cambios
        </button>
      </section>

      <!-- Salud -->
      <section class="ma-box">
        <h2>Salud de {{ pet.name }}</h2>
        <ProfileV3PetsHealthFields
          v-model="health"
          :pet-name="pet.name"
          formulario="salud_mascota"
        />
        <div class="ma-field">
          <label>Comentarios sobre su salud</label>
          <textarea
            v-model="healthComments"
            placeholder="Ej.: diagnóstico, desde cuándo, medicamentos"
            @focus="trackField('salud_mascota', 'comentarios')"
          />
        </div>
        <div class="ma-row" style="justify-content: flex-end">
          <button class="ma-link" @click="goHistory">
            Ver historial de consultas
          </button>
          <button class="ma-btn" @click="saveHealth">Guardar</button>
        </div>
      </section>
    </template>

    <ProfileV3PetsAddPetDialog
      v-if="showAdd"
      :show="showAdd"
      :position="pets.length + 1"
      @close="showAdd = false"
      @created="refresh"
    />
  </div>
</template>

<style scoped lang="scss">
.ma-photo {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}
.ma-photo-empty {
  background: #e8f7fa;
  color: #003b71;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'heading-pro-treble-bold';
  font-size: 24px;
}
</style>
