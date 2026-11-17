<script setup lang="ts">
/**
 * Editor de cantidad / sabores (y snacks del plan).
 * Se usa en "Ajustar cantidad / sabores" y dentro de "Reactivar mi plan".
 * No guarda nada: emite el borrador (filas por mascota + snacks).
 */
import type { PlanPetRow } from '~/composables/useMyAccount'

const props = withDefaults(
  defineProps<{
    rows: PlanPetRow[] // borrador (v-model:rows)
    snacks: number // borrador (v-model:snacks)
    original: PlanPetRow[] // plan actual
    originalSnacks: number
    snackUnitPrice?: number
    origen: string
    noLiked?: boolean // vino desde la causal "A mi mascota no le gustó"
    allergies?: Record<string, string[]> // petName -> ['beef','chicken']  (CAMPO NUEVO)
  }>(),
  { snackUnitPrice: 0, noLiked: false, allergies: () => ({}) },
)
const emit = defineEmits(['update:rows', 'update:snacks'])
const { track } = useTracking()

const draft = ref<PlanPetRow[]>(JSON.parse(JSON.stringify(props.rows)))
const snacksN = ref(props.snacks)
const tab = ref(0)

watch(draft, (v) => emit('update:rows', v), { deep: true })
watch(snacksN, (v) => emit('update:snacks', v))

const ALLERGY_NAME: Record<string, string> = {
  beef: 'la res',
  chicken: 'al pollo',
  salmon: 'al salmón',
}

const pet = computed(() => draft.value[tab.value])
const before = (row: PlanPetRow, productId: number) =>
  props.original
    .find((r) => r.petId === row.petId)
    ?.products.find((p) => p.productId === productId)?.numberOfPackages || 0

const sum = (r: PlanPetRow) =>
  r.products.reduce((s, p) => s + p.numberOfPackages, 0)
const total = (rows: PlanPetRow[]) => rows.reduce((s, r) => s + sum(r), 0)
const price = (rows: PlanPetRow[], sn: number) =>
  rows.reduce(
    (s, r) =>
      s +
      r.products.reduce(
        (t, p) => t + p.numberOfPackages * (p.unitPrice || 0),
        0,
      ),
    0,
  ) +
  sn * props.snackUnitPrice

const flavorsText = (rows: PlanPetRow[]) =>
  rows
    .flatMap((r) => r.products)
    .filter((p) => p.numberOfPackages > 0)
    .map((p) => `${p.numberOfPackages} ${p.name}`)
    .join(', ')

const allergyWarn = (r: PlanPetRow, name: string) => {
  const key = flavorKey(name)
  const list = props.allergies[r.name] || []
  return list.includes(key)
    ? `No recomendamos este sabor para ${r.name} dada su alergia a ${ALLERGY_NAME[key] || key}.`
    : ''
}

const onChange = (product: any, ev: any) => {
  track('plan_sabor_cantidad_actualizado', {
    sabor: flavorKey(product.name),
    cantidad: ev.value,
    accion: ev.accion,
    mascota_posicion: tab.value + 1,
    origen: props.origen,
  })
}
const onSnacks = (ev: any) =>
  track('plan_sabor_cantidad_actualizado', {
    sabor: 'snacks',
    cantidad: ev.value,
    accion: ev.accion,
  })

const pickTab = (i: number) => {
  tab.value = i
  track('formulario_campo_seleccionado', {
    formulario: 'ajustar_cantidad',
    campo: 'mascota',
    mascota_posicion: i + 1,
  })
}

defineExpose({
  total: () => total(draft.value),
  valid: () => draft.value.every((r) => sum(r) >= 1),
})
</script>

<template>
  <div class="ma-qe">
    <div class="ma-grid-2">
      <div class="ma-box">
        <span class="ma-label">Plan actual</span>
        <b>{{ total(original) }} paquetes</b>
        <span class="ma-small"
          >{{ flavorsText(original)
          }}<template v-if="originalSnacks">
            · {{ originalSnacks }} bolsas de snacks</template
          ></span
        >
        <b>{{ useFormatPrice(price(original, originalSnacks)) }}</b>
      </div>
      <div class="ma-box is-soft">
        <span class="ma-label">Nuevo plan</span>
        <b>{{ total(draft) }} paquetes</b>
        <span class="ma-small"
          >{{ flavorsText(draft)
          }}<template v-if="snacksN">
            · {{ snacksN }} bolsas de snacks</template
          ></span
        >
        <b>{{ useFormatPrice(price(draft, snacksN)) }}</b>
      </div>
    </div>
    <span class="ma-small"
      >El valor final lo confirma el sistema al guardar.</span
    >

    <div
      v-if="draft.length > 1"
      class="ma-row"
      style="justify-content: flex-start"
    >
      <span class="ma-small">¿Para quién?</span>
      <button
        v-for="(r, i) in draft"
        :key="r.petId"
        class="ma-pill"
        :class="{ 'is-on': tab === i }"
        @click="pickTab(i)"
      >
        {{ r.name }}
      </button>
    </div>

    <section v-if="pet" class="ma-box">
      <div
        v-for="p in pet.products"
        :key="p.productId"
        class="ma-row ma-qe-row"
      >
        <span
          class="ma-row"
          style="gap: 10px; justify-content: flex-start; flex: 1"
        >
          <img
            :src="FLAVOR_ICONS[flavorKey(p.name)]"
            alt=""
            width="24"
            height="24"
          />
          <span style="display: flex; flex-direction: column">
            <b>{{ p.name }}</b>
            <span class="ma-small">
              Antes {{ before(pet, p.productId) }}
              <b
                v-if="noLiked && before(pet, p.productId) === 0"
                style="margin-left: 8px; color: #003b71"
                >Prueba este sabor</b
              >
            </span>
            <span v-if="allergyWarn(pet, p.name)" class="ma-error-text">{{
              allergyWarn(pet, p.name)
            }}</span>
          </span>
        </span>
        <ProfileV3CommonCounter
          v-model="p.numberOfPackages"
          :label="`de ${p.name}`"
          @change="(ev: any) => onChange(p, ev)"
        />
      </div>
      <span v-if="sum(pet) < 1" class="ma-error-text"
        >Elige al menos 1 paquete para {{ pet.name }}.</span
      >
    </section>

    <section class="ma-box">
      <div class="ma-row">
        <span style="display: flex; flex-direction: column">
          <b>Snacks True Blue</b>
          <span class="ma-small"
            >Para todo el plan<template v-if="snackUnitPrice">
              · {{ useFormatPrice(snackUnitPrice) }} por bolsa</template
            ></span
          >
        </span>
        <ProfileV3CommonCounter
          v-model="snacksN"
          label="de snacks"
          @change="onSnacks"
        />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.ma-qe {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ma-qe-row {
  padding: 10px 0;
  border-bottom: 1px solid #dfe5ee;
  &:last-of-type {
    border-bottom: none;
  }
}
</style>
