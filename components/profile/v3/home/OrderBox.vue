<script setup lang="ts">
/**
 * Caja "Pedido en curso" (pedido ya dentro de la ventana de cobro) o
 * "Próximo pedido" (fuera de la ventana).
 */
const props = defineProps<{
  kind: 'current' | 'next'
  stateTag: string
  stateError?: boolean
  stateSub?: string
  arrival: string // "Llega el jueves 19 de noviembre"
  arrivalSub?: string // "(pagado el 15 de noviembre)" / "(te cobramos el ...)"
  packages: { label: string; detail: string }
  address: string
  total: string
  totalSub?: string
  failText?: string
  failCta?: string
  editable?: boolean
  lockText?: string
  showAdvance?: boolean
  showEditPlan?: boolean
}>()
const emit = defineEmits([
  'edit-order',
  'edit-order-locked',
  'fail-cta',
  'advance',
  'edit-plan',
])

const lockOpen = ref(false)
const onLocked = () => {
  lockOpen.value = !lockOpen.value
  if (lockOpen.value) emit('edit-order-locked')
}
</script>

<template>
  <section class="ma-box ma-order" :class="{ 'is-error': stateError }">
    <h2>{{ kind === 'current' ? 'Pedido en curso' : 'Próximo pedido' }}</h2>
    <hr class="ma-order-line" />

    <div class="ma-row" style="align-items: flex-start">
      <div style="display: flex; flex-direction: column; gap: 4px">
        <span class="ma-tag" :class="{ 'is-error': stateError }">
          {{ stateTag
          }}<span v-if="stateSub" style="text-transform: none">{{
            stateSub
          }}</span>
        </span>
        <b class="ma-order-arrival">{{ arrival }}</b>
        <span v-if="arrivalSub" class="ma-sub">{{ arrivalSub }}</span>
      </div>
      <button v-if="showAdvance" class="ma-link" @click="emit('advance')">
        Adelantar pedido
      </button>
    </div>

    <div v-if="failText" class="ma-box is-soft" style="gap: 10px">
      <span class="ma-sub" style="color: #25282b">{{ failText }}</span>
      <button
        class="ma-btn"
        style="align-self: flex-start"
        @click="emit('fail-cta')"
      >
        {{ failCta }}
      </button>
    </div>

    <div class="ma-grid-2">
      <div>
        <h3>En la caja</h3>
        <span>{{ packages.label }}</span>
        <span
          v-if="packages.detail"
          class="ma-small"
          style="margin-left: 4px"
          >{{ packages.detail }}</span
        >
      </div>
      <div>
        <h3>Dirección</h3>
        <span>{{ address }}</span>
      </div>
      <div>
        <h3>Total</h3>
        <span>{{ total }}</span>
        <span v-if="totalSub" class="ma-small" style="margin-left: 4px">{{
          totalSub
        }}</span>
      </div>
    </div>

    <div class="ma-row" style="justify-content: flex-end">
      <template v-if="kind === 'current'">
        <span v-if="editable">
          <button class="ma-btn is-outline" @click="emit('edit-order')">
            Editar pedido en curso
          </button>
        </span>
        <span v-else class="ma-tip">
          <button
            class="ma-btn is-outline ma-btn-locked"
            aria-disabled="true"
            @click="onLocked"
          >
            Editar pedido en curso
          </button>
          <span
            v-if="lockOpen"
            class="ma-tip-box"
            role="tooltip"
            style="left: auto; right: 0"
          >
            {{ lockText }}. Puedes cambiar tus siguientes pedidos desde Editar
            mi plan.
          </span>
        </span>
      </template>
      <button v-if="showEditPlan" class="ma-btn" @click="emit('edit-plan')">
        Editar mi plan
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.ma-order h3 {
  margin-bottom: 4px;
}
.ma-order-line {
  border: none;
  border-top: 1px solid #dfe5ee;
  margin: 0;
}
.ma-order-arrival {
  font-family: 'heading-pro-treble-bold';
  font-size: 18px;
}
.ma-btn-locked {
  color: #8a8aa3;
  border-color: #c9d1de;
  cursor: help;
}
</style>
