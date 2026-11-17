<script setup lang="ts">
/**
 * Cancelar mi suscripción (pop up, pasos 1 a 5).
 * 1. Causal (9 opciones). "A mi mascota no le gustó" lleva a Ajustar cantidad / sabores.
 * 2. Retención según la causal.
 * 3. "¿Seguro que quieres cancelar?" (no aplica a fallecimiento).
 * 4. Marca a la que se va (solo no le gustó, costoso y salud) y botón final.
 * 5. Recuerdo de la mascota (solo fallecimiento).
 *
 * Servicio: plan/change-status (ver myAccountStore.cancelPlan). Las causales se
 * cruzan por nombre con /reason-to-inactive; Kubo debe crear las 9 en esa tabla.
 */
const props = defineProps<{ show: boolean; initialReason?: string }>()
const emit = defineEmits(['close'])

type Reason =
  | 'tiene_comida'
  | 'no_quiere_suscripcion'
  | 'no_le_gusto'
  | 'costoso'
  | 'salud'
  | 'error_pedido'
  | 'pedido_duplicado'
  | 'mascota_partio'
  | 'otro'

const REASONS: { key: Reason; label: string }[] = [
  { key: 'tiene_comida', label: 'Todavía tengo comida' },
  { key: 'no_quiere_suscripcion', label: 'No quiero una suscripción' },
  { key: 'no_le_gusto', label: 'A mi mascota no le gustó' },
  { key: 'costoso', label: 'Es muy costoso' },
  { key: 'salud', label: 'Tuvo un problema de salud' },
  { key: 'error_pedido', label: 'Hubo un error con mi pedido' },
  { key: 'pedido_duplicado', label: 'Pedido duplicado' },
  { key: 'mascota_partio', label: 'Mi mascota falleció' },
  { key: 'otro', label: 'Otro' },
]

const HEALTH = [
  'Vómito',
  'Diarrea o heces blandas',
  'Estreñimiento',
  'Gases',
  'Alergia o problemas de piel',
  'Dejó de comer o perdió el apetito',
  'Subió o bajó de peso',
  'Le diagnosticaron una enfermedad',
  'Otro',
]

const BRANDS = [
  {
    g: 'Comida natural o cocida',
    items: [
      'Pixie',
      'Hello Dog',
      'Proper Food',
      'Dogsy',
      'Masvital',
      'Dieta BARF / cruda (ej. Peluditos BARF)',
    ],
  },
  {
    g: 'Concentrado premium',
    items: [
      'Pro Plan',
      'Royal Canin',
      "Hill's",
      'Taste of the Wild',
      'Acana',
      'Nupec',
      'True Nature (Laika)',
    ],
  },
  {
    g: 'Concentrado tradicional',
    items: [
      'Dog Chow',
      'Chunky',
      'Ringo',
      'Nutrecan',
      'Pedigree',
      'Agility Gold',
      'Equilibrio',
    ],
  },
  {
    g: 'Otras opciones',
    items: ['Comida preparada en casa', 'Otra', 'Prefiero no decir'],
  },
]

const KEYS = [
  {
    t: 'Comida real, cocida al vapor',
    d: 'Ingredientes naturales, sin rellenos ni conservantes artificiales.',
  },
  {
    t: 'Ingredientes que reconoces',
    d: 'Lees la etiqueta y reconoces cada ingrediente, sin subproductos.',
  },
  {
    t: 'Respaldo veterinario',
    d: 'Recetas de veterinarios y zootecnistas, bajo estándares AAFCO, NRC y FEDIAF.',
  },
  {
    t: 'Un plan a su medida',
    d: 'Porciones según su peso, edad y actividad, con domicilio incluido.',
  },
  {
    t: 'Sin nevera mientras está cerrada',
    d: 'Su empaque de alta barrera la conserva; una vez abierta, va a la nevera.',
  },
  {
    t: 'Sin permanencia',
    d: 'Cambias fechas, cantidad o sabores cuando quieras, y asesoría veterinaria sin costo.',
  },
]

// PROPUESTA: lista preliminar, pendiente confirmar puntos por ciudad
const POINTS_OF_SALE = [
  { c: 'Nivel nacional', t: 'Laika y Agrocampo' },
  { c: 'Bogotá', t: 'Petus y Petplace' },
  { c: 'Medellín', t: 'Casa del Granjero' },
]

const localePath = useLocalePath()
const planStore = usePlanStore()
const myAccountStore = useMyAccountStore()
const { getAllReasonsToInactive: backendReasons } = storeToRefs(planStore)
const { track, trackField } = useTracking()
const {
  plan,
  planPets,
  petNames,
  myPets,
  frequencyDays,
  currentOrders,
  orderState,
  refresh,
} = useMyAccount()

const step = ref(1)
const reason = ref<Reason | null>(null)
const petId = ref<number | null>(null)
const healthIssue = ref('')
const detail = ref('')
const brand = ref('')
const brandOther = ref('')
const showPos = ref(false)
const memorialName = ref('')

const pets = computed(() => {
  const names = planPets.value.map((p: any) => p.name)
  return ((myPets.value as any[]) || []).filter((p) => names.includes(p.name))
})
const multi = computed(() => pets.value.length > 1)
const pet = computed(
  () =>
    pets.value.find((p) => p.id === petId.value) ||
    (multi.value ? null : pets.value[0]),
)
const petName = computed(() => pet.value?.name || petNames.value)

onMounted(async () => {
  await planStore.getReasonsToRefund()
  if (props.initialReason) {
    reason.value = props.initialReason as Reason
    step.value = 3
  }
})

const params = computed(() => ({
  paso: stepName.value,
  motivo: reason.value || undefined,
}))
const stepName = computed(
  () =>
    (
      ({
        1: 'motivo',
        2: 'retencion',
        3: 'confirmacion',
        4: 'marca_destino',
        5: 'done',
      }) as any
    )[step.value],
)

// ---------- navegación ----------
const pickReason = (r: Reason) => {
  track('plan_inactivar_paso_completado', { paso: 'motivo', motivo: r })
  if (r === 'no_le_gusto') {
    emit('close')
    navigateTo(
      localePath({
        path: '/profile/my-plan/quantity',
        query: { ng: '1', origen: 'retencion_inactivar' },
      }),
    )
    return
  }
  reason.value = r
  step.value = 2
}

const back = () => {
  track('plan_inactivar_volver', params.value)
  if (step.value === 2) {
    step.value = 1
    reason.value = null
  } else if (step.value === 4 && reason.value === 'mascota_partio')
    step.value = 2
  else if (step.value > 1) step.value -= 1
  else close()
}
const close = () => {
  if (step.value === 5) {
    finishMemorial()
    return
  }
  track('plan_inactivar_cancelado', params.value)
  emit('close')
}

const needsBrand = computed(() =>
  ['no_le_gusto', 'costoso', 'salud'].includes(reason.value || ''),
)

const continueCancel = () => {
  // Validaciones del paso 2
  if (reason.value === 'salud' && (!healthIssue.value || !detail.value.trim()))
    return
  if (reason.value === 'otro' && detail.value.trim().length < 15) return
  if (reason.value === 'mascota_partio' && multi.value && !petId.value) return
  track('plan_inactivar_paso_completado', {
    paso: 'retencion',
    motivo: reason.value || undefined,
  })
  step.value = reason.value === 'mascota_partio' ? 4 : 3
}
const toFinal = () => {
  track('plan_inactivar_paso_completado', {
    paso: 'confirmacion',
    motivo: reason.value || undefined,
  })
  step.value = 4
}

// ---------- retención ----------
const retainEdit = (opcion: 'fecha' | 'cantidad_sabores') => {
  track('plan_editar_inicio', {
    origen: 'retencion_inactivar',
    motivo: reason.value || undefined,
    opcion,
  })
  emit('close')
  navigateTo(
    localePath({
      path:
        opcion === 'fecha'
          ? '/profile/my-plan/dates'
          : '/profile/my-plan/quantity',
      query: { origen: 'retencion_inactivar' },
    }),
  )
}
const retainVet = (paso?: string) => {
  track('asesoria_agendar_inicio', {
    origen: 'retencion_inactivar',
    motivo: 'salud',
    paso,
    mascota_posicion:
      pets.value.findIndex((p) => p.id === pet.value?.id) + 1 || undefined,
  })
  emit('close')
  navigateTo(
    localePath({
      path: '/profile/vet-advice',
      query: { motivo: 'salud', pet: pet.value?.id },
    }),
  )
}
const keepOthers = () => {
  track('plan_editar_inicio', {
    origen: 'retencion_inactivar',
    motivo: 'mascota_partio',
    opcion: 'mantener_otras',
  })
  emit('close')
  navigateTo(
    localePath({
      path: '/profile/my-plan/quantity',
      query: { sinMascota: String(petId.value), origen: 'mascota_partio' },
    }),
  )
}
const openPos = () => {
  track('puntos_venta_visto', { origen: 'retencion_inactivar' })
  showPos.value = true
}

const perDay = computed(
  () => Number((plan.value as any)?.total || 0) / (frequencyDays.value || 28),
)
const otherPetNames = computed(() =>
  joinNames(pets.value.filter((p) => p.id !== petId.value).map((p) => p.name)),
)

const RETENTION = computed(() => {
  const n = petName.value
  return {
    tiene_comida: [
      'Nos ajustamos a lo que te funcione',
      'No tienes que cancelar: puedes modificar tus fechas de entrega o la cantidad que recibes para que la comida te dure justo lo que necesitas.',
    ],
    no_quiere_suscripcion: [
      'Tu plan, a tu ritmo',
      'Tu plan no tiene permanencia ni compromisos. Tú decides cuándo llega, cada cuánto y cuánto recibes, y lo cambias cuando quieras desde aquí.',
    ],
    costoso: [
      'Lo que hay detrás de cada plato',
      `Sabemos que el presupuesto importa. Esto es lo que recibe ${petNames.value} en cada entrega:`,
    ],
    salud: [
      `Recibe atención personalizada para ${n}`,
      `Lamentamos que ${n} se sienta mal. Permítenos acompañarte con una asesoría veterinaria sin costo para guiarte y darte recomendaciones ajustadas a lo que ${n} necesita.`,
    ],
    error_pedido: [
      'Lamentamos el error con tu pedido',
      'Cuéntanos qué pasó y lo resolvemos antes de que tomes una decisión. Llámanos y te atendemos de inmediato.',
    ],
    pedido_duplicado: [
      'Revisemos tu pedido duplicado',
      'Si te llegó o se cobró un pedido de más, lo corregimos sin cancelar tu plan. Llámanos y lo revisamos de inmediato.',
    ],
    mascota_partio: [
      'Lo sentimos mucho',
      `Decir adiós es muy difícil. Imaginamos el dolor que implica la partida de ${pet.value?.name || 'tu mascota'}. La familia True Blue te envía un fuerte abrazo en este duro momento.`,
    ],
    otro: ['Cuéntanos qué pasó', 'Llámanos y te ayudamos de inmediato.'],
  } as Record<string, string[]>
})

// ---------- confirmación ----------
const failedPending = computed(() =>
  currentOrders.value.some((o) => orderState(o) === 'pago_fallido'),
)
const paidOrder = computed(() =>
  currentOrders.value.find((o) => o.statusPayment === 'paid'),
)
const finalText = computed(() => {
  if (reason.value === 'mascota_partio')
    return 'Tu plan queda cancelado y no habrá más cobros.'
  if (failedPending.value)
    return `Tu plan queda cancelado y no habrá más cobros. Tu pedido con el pago pendiente se anula y no se te cobrará. Puedes volver cuando quieras: guardamos el perfil de ${petNames.value}.`
  return `Tu plan queda cancelado y no habrá más cobros.${paidOrder.value ? ` Tu entrega ya pagada del ${formatLongDay(paidOrder.value.delivery)} igual te llega.` : ''} Puedes volver cuando quieras: guardamos el perfil de ${petNames.value}.`
})
const sureText = computed(
  () =>
    `Queremos que ${petNames.value} ${multi.value ? 'sigan' : 'siga'} disfrutando de comida real cocida al vapor, con respaldo veterinario y un plan a su medida. Queremos acompañar${multi.value ? 'los' : 'lo'} en cada etapa, para muchos más momentos juntos.`,
)

const backendReasonId = (r: Reason) => {
  const label = REASONS.find((x) => x.key === r)?.label || ''
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
  const found = (backendReasons.value as any[]).find(
    (x) => norm(x.name) === norm(label),
  )
  return found?.id || (backendReasons.value as any[])[0]?.id || 0
}

const finalBrand = computed(() =>
  brand.value === 'Otra' ? brandOther.value.trim() || 'Otra' : brand.value,
)

const doCancel = async () => {
  if (!reason.value) return
  if (needsBrand.value && !brand.value) return
  if (needsBrand.value)
    track('plan_inactivar_paso_completado', {
      paso: 'marca_destino',
      motivo: reason.value,
      opcion: brand.value,
    })
  useLoading(true)
  const response = await myAccountStore.cancelPlan({
    reasonToInactiveId: backendReasonId(reason.value),
    description:
      [healthIssue.value, detail.value].filter(Boolean).join(' · ') ||
      REASONS.find((x) => x.key === reason.value)?.label ||
      '',
    destinationBrand: needsBrand.value ? finalBrand.value : undefined,
    petId: reason.value === 'mascota_partio' ? pet.value?.id : undefined,
    healthIssue: healthIssue.value || undefined,
  })
  useLoading(false)
  if (!(response.status && response.code === 100)) {
    useShowAlert({ type: 'error', message: response.message })
    return
  }
  track('plan_inactivar_completado', {
    motivo: reason.value,
    marca_destino: needsBrand.value ? finalBrand.value : undefined,
    pedido_pendiente_anulado: failedPending.value,
  })
  await refresh()
  if (reason.value === 'mascota_partio') {
    memorialName.value = pet.value?.name || petNames.value
    step.value = 5
    return
  }
  useShowAlert({
    type: 'success',
    message: 'Tu plan quedó cancelado. Aquí estaremos cuando quieras volver.',
  })
  emit('close')
  navigateTo(localePath('/profile/my-profile'))
}

const finishMemorial = () => {
  track('plan_inactivar_paso_completado', {
    paso: 'done',
    motivo: 'mascota_partio',
  })
  emit('close')
  navigateTo(localePath('/profile/my-profile'))
}
</script>

<template>
  <ProfileV3CommonModal
    :show="show"
    :title="step === 5 ? '' : 'Cancelar mi suscripción'"
    :subtitle="step === 2 ? 'Nos ajustamos a tus necesidades' : ''"
    :back-label="step > 1 && step < 5 ? 'Volver' : ''"
    @close="close"
    @back="back"
  >
    <!-- Paso 1 -->
    <template v-if="step === 1">
      <span class="ma-sub">Nos ayuda mucho saber por qué. ¿Qué pasó?</span>
      <div>
        <button
          v-for="r in REASONS"
          :key="r.key"
          class="ma-option"
          @click="pickReason(r.key)"
        >
          <span class="ma-option-text"
            ><b>{{ r.label }}</b></span
          >
        </button>
      </div>
    </template>

    <!-- Paso 2 -->
    <template v-else-if="step === 2 && reason">
      <!-- Fallecimiento con 2 o más mascotas: elegir quién partió -->
      <div
        v-if="reason === 'mascota_partio' && multi"
        class="ma-row"
        style="justify-content: flex-start"
      >
        <span class="ma-small">¿Quién partió?</span>
        <button
          v-for="(p, i) in pets"
          :key="p.id"
          class="ma-pill"
          :class="{ 'is-on': petId === p.id }"
          @click="
            () => {
              petId = p.id
              track('formulario_campo_seleccionado', {
                formulario: 'inactivar',
                campo: 'mascota',
                mascota_posicion: i + 1,
              })
            }
          "
        >
          {{ p.name }}
        </button>
      </div>

      <div class="ma-box is-soft">
        <h3>{{ RETENTION[reason]?.[0] }}</h3>
        <span class="ma-sub">{{ RETENTION[reason]?.[1] }}</span>
        <ul v-if="reason === 'costoso'" class="ma-keys">
          <li v-for="k in KEYS" :key="k.t">
            <b>{{ k.t }}</b> <span class="ma-small">{{ k.d }}</span>
          </li>
        </ul>
        <span v-if="reason === 'costoso'" class="ma-sub">
          Hoy alimentar a {{ petNames }} con comida real te cuesta
          <b>{{ useFormatPrice(perDay) }} al día</b>.
        </span>
      </div>

      <div
        v-if="
          ['tiene_comida', 'no_quiere_suscripcion', 'costoso'].includes(reason)
        "
      >
        <button
          v-if="reason !== 'costoso'"
          class="ma-option"
          @click="retainEdit('fecha')"
        >
          <span class="ma-option-text"
            ><b>Cambiar fechas de entrega</b
            ><span class="ma-small"
              >Elige el día de tu próximo pedido según tus necesidades / cambia
              la frecuencia de tu plan</span
            ></span
          >
        </button>
        <button class="ma-option" @click="retainEdit('cantidad_sabores')">
          <span class="ma-option-text"
            ><b>Ajustar cantidad / sabores</b
            ><span class="ma-small"
              >Ajusta la cantidad de paquetes que recibes y los sabores de tu
              plan</span
            ></span
          >
        </button>
      </div>

      <button
        v-if="reason === 'no_quiere_suscripcion'"
        class="ma-link"
        @click="openPos"
      >
        Recuerda que nos puedes encontrar en puntos de venta especializados
      </button>

      <template v-if="reason === 'salud'">
        <div class="ma-field">
          <label>¿Qué le pasó a {{ petName }}?</label>
          <select
            v-model="healthIssue"
            @change="
              track('formulario_campo_seleccionado', {
                formulario: 'inactivar',
                campo: 'tipo_salud',
                opcion: healthIssue,
              })
            "
          >
            <option value="" disabled>Elige una opción</option>
            <option v-for="h in HEALTH" :key="h" :value="h">{{ h }}</option>
          </select>
        </div>
        <div class="ma-field">
          <label
            >Cuéntanos qué pasó
            <span class="ma-small">(obligatorio)</span></label
          >
          <textarea
            v-model="detail"
            placeholder="Desde cuándo, qué síntomas tiene, si ya lo vio su veterinario…"
            @focus="trackField('inactivar', 'detalle_salud')"
          />
        </div>
        <button
          class="ma-btn"
          style="align-self: flex-start"
          @click="retainVet()"
        >
          Agendar asesoría veterinaria
        </button>
      </template>

      <div v-if="reason === 'otro'" class="ma-field">
        <label>Cuéntanos qué pasó</label>
        <textarea
          v-model="detail"
          @focus="trackField('inactivar', 'detalle_otro')"
        />
        <span v-if="detail && detail.trim().length < 15" class="ma-small"
          >Escribe al menos 15 caracteres.</span
        >
      </div>

      <button
        v-if="reason === 'mascota_partio' && multi"
        class="ma-btn"
        style="align-self: flex-start"
        :disabled="!petId"
        @click="keepOthers"
      >
        Mantener plan de {{ otherPetNames || 'tus otras mascotas' }}
      </button>

      <div class="ma-row" style="justify-content: flex-start; gap: 12px">
        <button
          class="ma-btn is-outline"
          :disabled="
            (reason === 'salud' && (!healthIssue || !detail.trim())) ||
            (reason === 'otro' && detail.trim().length < 15) ||
            (reason === 'mascota_partio' && multi && !petId)
          "
          @click="continueCancel"
        >
          {{
            reason === 'mascota_partio' ? 'Cancelar plan' : 'Prefiero cancelar'
          }}
        </button>
        <span
          v-if="reason === 'salud' && (!healthIssue || !detail.trim())"
          class="ma-small"
          >Cuéntanos qué pasó para continuar.</span
        >
        <span
          v-if="reason === 'mascota_partio' && multi && !petId"
          class="ma-small"
          >Elige quién partió para continuar.</span
        >
      </div>
    </template>

    <!-- Paso 3 -->
    <template v-else-if="step === 3">
      <h3>¿Seguro que quieres cancelar?</h3>
      <span class="ma-sub">{{ sureText }}</span>
      <span class="ma-sub"
        >{{ petNames }} dejaría{{ multi ? 'n' : '' }} de recibir:</span
      >
      <ol class="ma-lose">
        <li>Comida real, cocida al vapor</li>
        <li>Ingredientes que reconoces</li>
        <li>Asesoría veterinaria sin costo</li>
      </ol>
      <button
        v-if="reason === 'salud'"
        class="ma-btn"
        style="align-self: flex-start"
        @click="retainVet('confirmacion')"
      >
        Agendar asesoría veterinaria
      </button>
      <button
        class="ma-btn is-outline"
        style="align-self: flex-start"
        @click="toFinal"
      >
        Continuar con la cancelación
      </button>
    </template>

    <!-- Paso 4 -->
    <template v-else-if="step === 4">
      <template v-if="needsBrand">
        <div class="ma-field">
          <label>Antes de terminar: ¿a qué marca consideras irte?</label>
          <select v-model="brand">
            <option value="" disabled>Elige una marca</option>
            <optgroup v-for="g in BRANDS" :key="g.g" :label="g.g">
              <option v-for="b in g.items" :key="b" :value="b">{{ b }}</option>
            </optgroup>
          </select>
        </div>
        <div v-if="brand === 'Otra'" class="ma-field">
          <label>¿Cuál?</label>
          <input
            v-model="brandOther"
            @focus="trackField('inactivar', 'marca_otra')"
          />
        </div>
      </template>
      <span class="ma-sub">{{ finalText }}</span>
      <button
        class="ma-btn"
        style="align-self: flex-start"
        :disabled="needsBrand && !brand"
        @click="doCancel"
      >
        Cancelar mi suscripción
      </button>
    </template>

    <!-- Paso 5: recuerdo -->
    <template v-else-if="step === 5">
      <div
        style="
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        "
      >
        <h2>{{ memorialName }}</h2>
        <h3>Por siempre en nuestra memoria</h3>
        <span class="ma-sub">
          Gracias por dejarnos ser parte de su vida y de sus días. Tu plan quedó
          cancelado y no habrá más cobros. Aquí estaremos si algún día nos
          necesitas.
        </span>
        <button class="ma-btn" @click="finishMemorial">Cerrar</button>
      </div>
    </template>

    <ProfileV3CommonContactBox
      v-if="step < 4"
      :text="`Tu experiencia y la de ${petNames} son el centro de nuestra atención. Llámanos y te atendemos de inmediato:`"
      :origen="
        ['error_pedido', 'pedido_duplicado'].includes(reason || '') &&
        step === 2
          ? 'retencion_inactivar'
          : 'inactivar'
      "
      :extra="{ paso: stepName, motivo: reason || undefined }"
    />
  </ProfileV3CommonModal>

  <!-- Puntos de venta -->
  <ProfileV3CommonModal
    :show="showPos"
    title="Encuéntranos en tiendas"
    max-width="480px"
    @close="
      () => {
        showPos = false
        track('puntos_venta_cancelado')
      }
    "
  >
    <span class="ma-sub"
      >Si prefieres no tener suscripción, puedes comprar True Blue en estos
      puntos de venta especializados:</span
    >
    <ul class="ma-keys">
      <li v-for="p in POINTS_OF_SALE" :key="p.c">
        <b>{{ p.c }}</b> <span class="ma-small">{{ p.t }}</span>
      </li>
    </ul>
  </ProfileV3CommonModal>
</template>

<style scoped lang="scss">
.ma-keys {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  b {
    font-family: 'heading-pro-treble-bold';
  }
}
.ma-lose {
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: lose;
  display: flex;
  flex-direction: column;
  gap: 8px;
  li {
    counter-increment: lose;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px 10px 10px;
    background: #e8f7fa;
    border-radius: 12px;
    font-family: 'heading-pro-treble-bold';
    &::before {
      content: counter(lose);
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #003b71;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
