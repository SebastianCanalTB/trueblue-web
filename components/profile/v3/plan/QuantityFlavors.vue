<script setup lang="ts">
/**
 * Ajustar cantidad / sabores del plan (incluye snacks).
 * Query:
 * - origen: ajustar_cantidad | retencion_inactivar | mascota_partio
 * - ng=1: viene de "A mi mascota no le gustó" (muestra "Prueba este sabor" y "Prefiero cancelar")
 * - sinMascota=<petId>: fallecimiento con 2+ mascotas, el plan sigue sin esa mascota
 * Servicio existente: plan/update-plan.
 */
import type { PlanPetRow } from '~/composables/useMyAccount'

const route = useRoute()
const localePath = useLocalePath()
const planStore = usePlanStore()
const { track } = useTracking()
const {
  load,
  planRows,
  planPets,
  planId,
  buildPlanUpdatePayload,
  refresh,
  rowsTotal,
  myPets,
} = useMyAccount()

const origen = computed(() => String(route.query.origen || 'ajustar_cantidad'))
const noLiked = computed(() => route.query.ng === '1')
const removePetId = computed(() => Number(route.query.sinMascota || 0))

const rows = ref<PlanPetRow[]>([])
const draft = ref<PlanPetRow[]>([])
const snacks = ref(0)
const draftSnacks = ref(0)
const ask = ref(false)
const ready = ref(false)
const showCancel = ref(false)

const snackProduct = computed(() =>
  planPets.value
    .flatMap((p: any) => p.products || [])
    .find((x: any) => flavorKey(x.name) === 'snacks'),
)

// CAMPO NUEVO: alergias por mascota (pet.allergyFlavors = ['beef'|'chicken'|'salmon'])
const allergies = computed(() => {
  const out: Record<string, string[]> = {}
  ;((myPets.value as any[]) || []).forEach((p) => {
    if (p.allergyFlavors?.length) out[p.name] = p.allergyFlavors
  })
  return out
})

onMounted(async () => {
  await load({ detail: true })
  rows.value = planRows.value
    .filter((r) => r.petId !== removePetId.value && r.status !== 'inactive')
    .map((r) => ({
      ...r,
      products: r.products.filter((p) => flavorKey(p.name) !== 'snacks'),
    }))
  draft.value = JSON.parse(JSON.stringify(rows.value))
  snacks.value = Number(snackProduct.value?.numberOfPackages || 0)
  draftSnacks.value = snacks.value
  ready.value = true
})

const valid = computed(() =>
  draft.value.every(
    (r) => r.products.reduce((s, p) => s + p.numberOfPackages, 0) >= 1,
  ),
)

const submit = () => {
  track('plan_actualizar_enviado', { formulario: 'ajustar_cantidad' })
  ask.value = true
}

const save = async () => {
  useLoading(true)
  const response = await planStore.updatePlan(
    buildPlanUpdatePayload({
      rows: draft.value,
      snacks: draftSnacks.value,
      removePetId: removePetId.value || undefined,
    }),
    planId.value,
  )
  useLoading(false)
  if (response.status && response.code === 100) {
    track('plan_actualizado', {
      valor_nuevo: rowsTotal(draft.value),
      valor_anterior: rowsTotal(rows.value),
      moneda: 'COP',
      total_paquetes: draft.value.reduce(
        (s, r) => s + r.products.reduce((t, p) => t + p.numberOfPackages, 0),
        0,
      ),
      origen: origen.value,
    })
    useShowAlert({
      type: 'success',
      message: 'Listo. Guardamos tu nuevo plan.',
    })
    ask.value = false
    await refresh()
    navigateTo(localePath('/profile/my-plan'))
  } else {
    useShowAlert({ type: 'error', message: response.message })
  }
}

const cancel = () => {
  track('plan_editar_cancelado', { formulario: 'ajustar_cantidad' })
  navigateTo(localePath('/profile/my-plan/adjust'))
}

const preferCancel = () => {
  track('plan_inactivar_paso_completado', {
    paso: 'retencion',
    motivo: 'no_le_gusto',
  })
  showCancel.value = true
}
</script>

<template>
  <div class="ma-page">
    <button class="ma-link" style="align-self: flex-start" @click="cancel">
      ← Volver
    </button>
    <h1>Ajustar cantidad / sabores</h1>

    <ProfileV3PlanQuantityEditor
      v-if="ready"
      v-model:rows="draft"
      v-model:snacks="draftSnacks"
      :original="rows"
      :original-snacks="snacks"
      :snack-unit-price="Number(snackProduct?.price || 0)"
      :origen="origen"
      :no-liked="noLiked"
      :allergies="allergies"
    />

    <button
      v-if="noLiked"
      class="ma-link is-muted"
      style="align-self: flex-start"
      @click="preferCancel"
    >
      Prefiero cancelar
    </button>

    <div class="ma-modal-foot">
      <button class="ma-btn is-outline" @click="cancel">Cancelar</button>
      <button class="ma-btn" :disabled="!valid" @click="submit">
        Guardar cambios
      </button>
    </div>

    <ProfileV3CommonConfirmAsk
      :show="ask"
      title="¿Guardamos tu nuevo plan?"
      @yes="save"
      @no="
        () => {
          ask = false
          track('plan_editar_volver', {
            formulario: 'ajustar_cantidad',
            paso: 'confirmacion',
          })
        }
      "
    />

    <ProfileV3CancelFlow
      v-if="showCancel"
      :show="showCancel"
      initial-reason="no_le_gusto"
      @close="showCancel = false"
    />
  </div>
</template>
