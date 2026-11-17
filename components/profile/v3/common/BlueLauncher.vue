<script setup lang="ts">
/**
 * Botón flotante del chat de Blue.
 * El chat lo provee Boon: este botón solo abre su widget. La medición del chat
 * queda del lado de Boon (decisión 12 nov 2026).
 *
 * TODO(Kubo): reemplazar openBoon() por el método real del SDK de Boon
 * (por ejemplo window.Boon.open()). Mientras no esté, abre WhatsApp.
 */
const openBoon = () => {
  const w = window as any
  if (w.Boon && typeof w.Boon.open === 'function') {
    w.Boon.open()
    return
  }
  useOpenWhatsApp()
}
</script>

<template>
  <button
    class="ma-blue-fab"
    aria-label="Abrir chat con Blue"
    @click="openBoon"
  >
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" />
      <circle cx="8.5" cy="12" r="0.8" fill="currentColor" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
      <circle cx="15.5" cy="12" r="0.8" fill="currentColor" />
    </svg>
  </button>
</template>

<style scoped lang="scss">
.ma-blue-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 950;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: #003b71;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 27, 52, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  @media (max-width: 1024px) {
    right: 16px;
    bottom: 104px;
    width: 52px;
    height: 52px;
  }
}
</style>
