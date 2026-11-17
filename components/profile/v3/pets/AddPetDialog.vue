<script setup lang="ts">
/**
 * Agregar mascota (pop up). Mismas preguntas del formulario de compra.
 * La porción (calculadora de Kubo) sale solo con los datos completos.
 * Servicio existente: pets/create-pet {flag, pet, code, deliveryDate, checkout, frequency}.
 */
const props = defineProps<{ show: boolean; position: number }>()
const emit = defineEmits(['close', 'created'])

const createStore = useCreateStore()
const accountStore = useAccountStore()
const calculatorStore = useCalculatorStore()
const {
  getListPets: races,
  getBodyConditions: bodyConditions,
  getListActivities: activities,
} = storeToRefs(createStore)
const { track, trackField } = useTracking()
const { plan, frequencyId, checkoutData } = useMyAccount()

const form = reactive({
  name: '',
  raze: 0 as number,
  genre: '',
  years: '' as any,
  months: '' as any,
  actualWeight: '' as any,
  castrated: null as null | boolean,
  recommendedWeight: 0 as number,
  dogActive: 0 as number,
})
const health = ref({
  conditions: [] as string[],
  allergyFlavors: [] as string[],
  other: '',
})
const comments = ref('')
const recipes = ref<any[]>([])
const recipeId = ref<number | null>(null)
const grammage = ref(0)
const price = ref(0)

onMounted(async () => {
  await Promise.all([
    races.value?.length ? null : createStore.getPets({ filter: '' }),
    bodyConditions.value?.length ? null : createStore.getListBodyConditions(),
    activities.value?.length ? null : createStore.getActivities(),
  ])
})

const complete = computed(
  () =>
    !!form.name.trim() &&
    !!form.raze &&
    !!form.genre &&
    form.years !== '' &&
    form.months !== '' &&
    Number(form.actualWeight) > 0 &&
    form.castrated !== null &&
    !!form.recommendedWeight &&
    !!form.dogActive &&
    health.value.conditions.length > 0,
)

let calcTimer: any = null
watch(
  () => ({ ...form, ok: complete.value }),
  () => {
    clearTimeout(calcTimer)
    if (!complete.value) {
      grammage.value = 0
      return
    }
    calcTimer = setTimeout(calculate, 400)
  },
  { deep: true },
)

const calculate = async () => {
  const [calc, food] = await Promise.all([
    calculatorStore.getCalculations({
      petId: 0,
      name: form.name,
      sex: form.genre,
      years: Number(form.years),
      months: Number(form.months),
      weight: Number(form.actualWeight),
      petsBodyConditionId: form.recommendedWeight,
      sterilized: form.castrated,
      race: form.raze,
      isMixedFood: false,
      petsActivityId: form.dogActive,
    }),
    accountStore.getFoodRelatedToPet({ age: Number(form.years) }),
  ])
  grammage.value = Number(calc.data?.grammage || 0)
  price.value = Number(calc.data?.price || 0) // si la calculadora lo devuelve
  recipes.value = food.status && food.code === 100 ? food.data : []
  if (!recipeId.value && recipes.value.length)
    recipeId.value = recipes.value[0].id
  if (grammage.value)
    track('mascota_plan_visto', {
      gramos: grammage.value,
      valor: price.value || undefined,
      moneda: 'COP',
      mascota_posicion: props.position,
    })
}

const allergyWarn = (name: string) => {
  const k = flavorKey(name)
  const names: Record<string, string> = {
    beef: 'la res',
    chicken: 'al pollo',
    salmon: 'al salmón',
  }
  return health.value.allergyFlavors.includes(k)
    ? `No recomendamos este sabor para ${form.name || 'tu mascota'} dada su alergia a ${names[k]}.`
    : ''
}

const close = () => {
  track('mascota_agregar_cancelado', { mascota_posicion: props.position })
  emit('close')
}

const save = async () => {
  if (!complete.value || !recipeId.value) return
  useLoading(true)
  const p: any = plan.value || {}
  const response = await createStore.createPet({
    flag: 'general',
    pet: {
      name: form.name,
      sex: form.genre,
      age: Number(form.years),
      month: Number(form.months),
      currentWeight: Number(form.actualWeight),
      bodyCondition: form.recommendedWeight,
      sterilization: form.castrated,
      isMixedFood: false,
      race: form.raze,
      petsActivity: form.dogActive,
      planDetail: { detailProducts: [recipeId.value] },
      // CAMPOS NUEVOS (propuesta)
      medicalConditions: health.value.conditions,
      allergyFlavors: health.value.allergyFlavors,
      otherCondition: health.value.other,
      healthComments: comments.value,
    },
    code: '',
    deliveryDate: toIsoDay(p.nextDelivery),
    checkout: checkoutData(),
    frequency: frequencyId.value,
  })
  useLoading(false)
  if (response.status && response.code === 100) {
    track('mascota_creado', {
      mascota_posicion: props.position,
      valor: price.value || undefined,
      moneda: 'COP',
      origen: 'mis_mascotas',
    })
    useShowAlert({
      type: 'success',
      message: `Listo. ${form.name} ya está en tu plan y llega en tu próxima entrega.`,
    })
    emit('created')
    emit('close')
  } else useShowAlert({ type: 'error', message: response.message })
}
</script>

<template>
  <ProfileV3CommonModal :show="show" title="Agregar mascota" @close="close">
    <div class="ma-field">
      <label>¿Cómo se llama?</label>
      <input
        v-model="form.name"
        @focus="
          trackField('agregar_mascota', 'nombre', {
            mascota_posicion: position,
          })
        "
      />
    </div>
    <div class="ma-grid-2">
      <div class="ma-field">
        <label>¿Qué raza es?</label>
        <select
          v-model.number="form.raze"
          @change="
            track('formulario_campo_seleccionado', {
              formulario: 'agregar_mascota',
              campo: 'raza',
              opcion: String(form.raze),
            })
          "
        >
          <option :value="0" disabled>Elige una raza</option>
          <option v-for="r in races" :key="r.id" :value="r.id">
            {{ r.name }}
          </option>
        </select>
      </div>
      <div class="ma-field">
        <label>Género</label>
        <div class="ma-row" style="justify-content: flex-start">
          <button
            v-for="g in ['Macho', 'Hembra']"
            :key="g"
            type="button"
            class="ma-pill"
            :class="{ 'is-on': form.genre === g }"
            @click="
              () => {
                form.genre = g
                track('formulario_campo_seleccionado', {
                  formulario: 'agregar_mascota',
                  campo: 'genero',
                  opcion: g,
                })
              }
            "
          >
            {{ g }}
          </button>
        </div>
      </div>
      <div class="ma-field">
        <label>Edad</label>
        <div class="ma-row" style="flex-wrap: nowrap">
          <input
            v-model="form.years"
            type="number"
            min="0"
            aria-label="Años"
            @focus="trackField('agregar_mascota', 'edad_anos')"
          />
          <span class="ma-small">años</span>
          <input
            v-model="form.months"
            type="number"
            min="0"
            max="11"
            aria-label="Meses"
            @focus="trackField('agregar_mascota', 'edad_meses')"
          />
          <span class="ma-small">meses</span>
        </div>
      </div>
      <div class="ma-field">
        <label>Peso actual (kg)</label>
        <input
          v-model="form.actualWeight"
          type="number"
          min="0"
          step="0.1"
          @focus="trackField('agregar_mascota', 'peso')"
        />
      </div>
      <div class="ma-field">
        <label>¿Está castrado(a)?</label>
        <div class="ma-row" style="justify-content: flex-start">
          <button
            type="button"
            class="ma-pill"
            :class="{ 'is-on': form.castrated === true }"
            @click="
              () => {
                form.castrated = true
                track('formulario_campo_seleccionado', {
                  formulario: 'agregar_mascota',
                  campo: 'castracion',
                  opcion: 'si',
                })
              }
            "
          >
            Sí
          </button>
          <button
            type="button"
            class="ma-pill"
            :class="{ 'is-on': form.castrated === false }"
            @click="
              () => {
                form.castrated = false
                track('formulario_campo_seleccionado', {
                  formulario: 'agregar_mascota',
                  campo: 'castracion',
                  opcion: 'no',
                })
              }
            "
          >
            No
          </button>
        </div>
      </div>
      <div class="ma-field">
        <label>Forma corporal</label>
        <select
          v-model.number="form.recommendedWeight"
          @change="
            track('formulario_campo_seleccionado', {
              formulario: 'agregar_mascota',
              campo: 'condicion_corporal',
              opcion: String(form.recommendedWeight),
            })
          "
        >
          <option :value="0" disabled>Elige una opción</option>
          <option v-for="b in bodyConditions" :key="b.id" :value="b.id">
            {{ b.bodyCondition
            }}<template v-if="b.description"> · {{ b.description }}</template>
          </option>
        </select>
      </div>
      <div class="ma-field">
        <label>¿Qué tan activo(a) es?</label>
        <select
          v-model.number="form.dogActive"
          @change="
            track('formulario_campo_seleccionado', {
              formulario: 'agregar_mascota',
              campo: 'actividad',
              opcion: String(form.dogActive),
            })
          "
        >
          <option :value="0" disabled>Elige una opción</option>
          <option v-for="a in activities" :key="a.id" :value="a.id">
            {{ a.title
            }}<template v-if="a.description"> · {{ a.description }}</template>
          </option>
        </select>
      </div>
    </div>

    <ProfileV3PetsHealthFields
      v-model="health"
      :pet-name="form.name"
      formulario="agregar_mascota"
    />
    <div class="ma-field">
      <label>Comentarios sobre su salud</label>
      <textarea
        v-model="comments"
        @focus="trackField('agregar_mascota', 'comentarios')"
      />
    </div>

    <section v-if="complete && grammage" class="ma-box is-soft">
      <h3>Porción de {{ form.name }}</h3>
      <span class="ma-sub"
        >{{ grammage }} g al día<template v-if="price">
          · {{ useFormatPrice(price) }} por entrega</template
        >. Llega en tu próxima entrega.</span
      >
      <div v-if="recipes.length" class="ma-field">
        <label>Receta</label>
        <div class="ma-row" style="justify-content: flex-start">
          <button
            v-for="r in recipes"
            :key="r.id"
            type="button"
            class="ma-pill"
            :class="{ 'is-on': recipeId === r.id }"
            @click="recipeId = r.id"
          >
            {{ r.name }}
          </button>
        </div>
        <span
          v-for="r in recipes.filter(
            (x) => x.id === recipeId && allergyWarn(x.name),
          )"
          :key="r.id"
          class="ma-error-text"
          >{{ allergyWarn(r.name) }}</span
        >
      </div>
    </section>
    <span v-else class="ma-small"
      >Completa los datos de tu mascota para calcular su porción y su
      precio.</span
    >

    <template #footer>
      <button class="ma-btn is-outline" @click="close">Cancelar</button>
      <button
        class="ma-btn"
        :disabled="!complete || !grammage || !recipeId"
        @click="save"
      >
        Agregar a mi plan
      </button>
    </template>
  </ProfileV3CommonModal>
</template>
