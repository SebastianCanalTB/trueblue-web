<script setup lang="ts">
/** Confirmación final ("¿Guardamos tu nuevo plan?" / "¿Seguro que quieres modificar esta entrega?"). */
defineProps<{
  show: boolean
  title: string
  text?: string
  yesLabel?: string
  noLabel?: string
}>()
const emit = defineEmits(['yes', 'no'])
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="ma-modal-bg" style="z-index: 1050">
      <div
        class="ma-modal"
        role="alertdialog"
        aria-modal="true"
        style="max-width: 440px; text-align: center"
      >
        <h2
          style="
            font-family: 'heading-pro-treble-bold';
            font-size: 20px;
            color: #003b71;
            margin: 0;
          "
        >
          {{ title }}
        </h2>
        <p v-if="text" class="ma-sub" style="margin: 0">{{ text }}</p>
        <slot />
        <div style="display: flex; flex-direction: column; gap: 10px">
          <slot name="actions">
            <button class="ma-btn is-block" @click="emit('yes')">
              {{ yesLabel || 'Sí' }}
            </button>
          </slot>
          <button
            v-if="noLabel !== ''"
            class="ma-link"
            style="align-self: center"
            @click="emit('no')"
          >
            {{ noLabel ?? 'Volver' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
