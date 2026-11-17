<script setup lang="ts">
/**
 * Condiciones médicas (selección múltiple) + alergia (a qué sabor) + otra.
 * Mismos valores que el formulario de compra nuevo.
 */
const props = defineProps<{
  modelValue: { conditions: string[]; allergyFlavors: string[]; other: string }
  petName?: string
  formulario: string
}>()
const emit = defineEmits(['update:modelValue'])
const { track, trackField } = useTracking()

interface HealthValue {
  conditions: string[]
  allergyFlavors: string[]
  other: string
}

const CONDITIONS = [
  'Ninguna',
  'Alergia alimentaria',
  'Problemas de piel o pelo',
  'Sensibilidad digestiva',
  'Enfermedad renal',
  'Enfermedad hepática',
  'Pancreatitis',
  'Diabetes',
  'Sobrepeso u obesidad',
  'Problemas articulares',
  'Enfermedad cardíaca',
  'Otra',
]
const FLAVORS = [
  { k: 'beef', label: 'Res' },
  { k: 'chicken', label: 'Pollo' },
  { k: 'salmon', label: 'Salmón' },
]

const set = (patch: Partial<HealthValue>) =>
  emit('update:modelValue', { ...props.modelValue, ...patch })

const toggle = (c: string) => {
  let list = [...props.modelValue.conditions]
  if (c === 'Ninguna') list = list.includes(c) ? [] : ['Ninguna']
  else {
    list = list.filter((x) => x !== 'Ninguna')
    list = list.includes(c) ? list.filter((x) => x !== c) : [...list, c]
  }
  set({
    conditions: list,
    allergyFlavors: list.includes('Alergia alimentaria')
      ? props.modelValue.allergyFlavors
      : [],
    other: list.includes('Otra') ? props.modelValue.other : '',
  })
  track('formulario_campo_seleccionado', {
    formulario: props.formulario,
    campo: 'condicion_medica',
    opcion: c,
  })
}
const toggleFlavor = (k: string) => {
  const list = props.modelValue.allergyFlavors
  set({
    allergyFlavors: list.includes(k)
      ? list.filter((x) => x !== k)
      : [...list, k],
  })
  track('formulario_campo_seleccionado', {
    formulario: props.formulario,
    campo: 'alergia',
    opcion: k,
  })
}
</script>

<template>
  <div class="ma-field">
    <label
      >¿Tiene alguna condición médica?
      <span class="ma-small">Puedes elegir varias</span></label
    >
    <div class="ma-row" style="justify-content: flex-start; gap: 8px">
      <button
        v-for="c in CONDITIONS"
        :key="c"
        type="button"
        class="ma-pill"
        :class="{ 'is-on': modelValue.conditions.includes(c) }"
        :aria-pressed="modelValue.conditions.includes(c)"
        @click="toggle(c)"
      >
        {{ c }}
      </button>
    </div>
  </div>
  <div
    v-if="modelValue.conditions.includes('Alergia alimentaria')"
    class="ma-field"
  >
    <label>¿A qué sabor es alérgico{{ petName ? ` ${petName}` : '' }}?</label>
    <div class="ma-row" style="justify-content: flex-start; gap: 8px">
      <button
        v-for="f in FLAVORS"
        :key="f.k"
        type="button"
        class="ma-pill"
        :class="{ 'is-on': modelValue.allergyFlavors.includes(f.k) }"
        @click="toggleFlavor(f.k)"
      >
        {{ f.label }}
      </button>
    </div>
  </div>
  <div v-if="modelValue.conditions.includes('Otra')" class="ma-field">
    <label>¿Cuál otra condición?</label>
    <input
      :value="modelValue.other"
      @input="set({ other: ($event.target as HTMLInputElement).value })"
      @focus="trackField(formulario, 'otra_condicion')"
    />
  </div>
</template>
