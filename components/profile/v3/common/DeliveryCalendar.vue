<script setup lang="ts">
import { DateTime } from 'luxon'

/**
 * Calendario de entregas.
 * - Se puede elegir desde mañana. No se pueden elegir domingos ni festivos
 *   (festivos desde plan/get-non-shipping-dates, ya cargados en planStore).
 * - Muestra "Día de entrega" y, si hay frecuencia, "Próximas entregas".
 */
const props = withDefaults(
  defineProps<{
    modelValue: string // YYYY-MM-DD
    frequencyDays?: number
    maxDays?: number
    formulario: string
  }>(),
  { frequencyDays: 0, maxDays: 90 },
)
const emit = defineEmits(['update:modelValue', 'pick'])

const { isBusinessDay } = useMyAccount()
const { track } = useTracking()

const today = DateTime.now().startOf('day')
const minDay = today.plus({ days: 1 })
const maxDay = today.plus({ days: props.maxDays })

const start = props.modelValue ? DateTime.fromISO(props.modelValue) : minDay
const view = ref(start.startOf('month'))

const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

const cells = computed(() => {
  const first = view.value
  const offset = first.weekday - 1 // lunes = 0
  const days = first.daysInMonth || 30
  const out: {
    label: string
    iso: string
    disabled: boolean
    selected: boolean
    next: boolean
  }[] = []
  for (let i = 0; i < offset; i++)
    out.push({
      label: '',
      iso: '',
      disabled: true,
      selected: false,
      next: false,
    })
  const nextSet = new Set(nextDeliveries.value.slice(1))
  for (let d = 1; d <= days; d++) {
    const dt = first.set({ day: d })
    const iso = dt.toISODate() as string
    const disabled = dt < minDay || dt > maxDay || !isBusinessDay(dt.toJSDate())
    out.push({
      label: String(d),
      iso,
      disabled,
      selected: iso === props.modelValue,
      next: nextSet.has(iso),
    })
  }
  return out
})

const title = computed(() => {
  const t = view.value.setLocale('es').toFormat('LLLL yyyy')
  return t.charAt(0).toUpperCase() + t.slice(1)
})

const canPrev = computed(() => view.value > minDay.startOf('month'))
const canNext = computed(
  () => view.value.plus({ months: 1 }) <= maxDay.startOf('month'),
)

const move = (delta: number) => {
  view.value = view.value.plus({ months: delta })
  track('formulario_campo_interactuado', {
    formulario: props.formulario,
    campo: 'mes',
  })
}

const pick = (cell: any) => {
  if (cell.disabled || !cell.iso) return
  emit('update:modelValue', cell.iso)
  emit('pick', cell.iso)
}

/** Fecha elegida + las 2 siguientes según la frecuencia (aproximado; el backend corre festivos). */
const nextDeliveries = computed(() => {
  if (!props.modelValue || !props.frequencyDays)
    return props.modelValue ? [props.modelValue] : []
  const base = DateTime.fromISO(props.modelValue)
  return [0, 1, 2].map(
    (i) => base.plus({ days: i * props.frequencyDays }).toISODate() as string,
  )
})
</script>

<template>
  <div class="ma-cal">
    <div class="ma-cal-head">
      <button
        type="button"
        class="ma-link"
        :disabled="!canPrev"
        @click="move(-1)"
      >
        ‹ Anterior
      </button>
      <b>{{ title }}</b>
      <button
        type="button"
        class="ma-link"
        :disabled="!canNext"
        @click="move(1)"
      >
        Siguiente ›
      </button>
    </div>
    <div class="ma-cal-grid">
      <span v-for="w in weekDays" :key="w" class="ma-cal-w">{{ w }}</span>
      <button
        v-for="(c, i) in cells"
        :key="i"
        type="button"
        class="ma-cal-d"
        :class="{
          'is-sel': c.selected,
          'is-next': c.next,
          'is-empty': !c.label,
        }"
        :disabled="c.disabled"
        :aria-label="c.iso ? formatLongDay(c.iso) : undefined"
        @click="pick(c)"
      >
        {{ c.label }}
      </button>
    </div>
    <div class="ma-cal-legend">
      <span><i class="dot is-sel"></i>Día de entrega</span>
      <span v-if="frequencyDays"
        ><i class="dot is-next"></i>Próximas entregas</span
      >
    </div>
  </div>
</template>

<style scoped lang="scss">
.ma-cal {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ma-cal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  b {
    font-family: 'heading-pro-treble-bold';
    color: #003b71;
  }
}
.ma-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.ma-cal-w {
  text-align: center;
  font-size: 12px;
  color: #575e6b;
}
.ma-cal-d {
  height: 40px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: #fff;
  font: inherit;
  cursor: pointer;
  color: #25282b;
  &:disabled {
    color: #c3c8d2;
    cursor: not-allowed;
  }
  &.is-empty {
    visibility: hidden;
  }
  &.is-sel {
    background: #003b71;
    color: #fff;
  }
  &.is-next {
    background: #e8f7fa;
    border-color: #96d9e9;
  }
}
.ma-cal-legend {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #575e6b;
  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 6px;
    &.is-sel {
      background: #003b71;
    }
    &.is-next {
      background: #96d9e9;
    }
  }
}
</style>
