<template>
  <div class="background-dialog" v-show="show">
    <div class="general-dialog" :style="{ width: width }">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.background-dialog {
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  overflow: hidden;

  .general-dialog {
    background-color: white;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    span {
      @apply tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold;
    }
    p {
      @apply tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book;
    }
  }
}
</style>

<script lang="ts" setup>
const props = defineProps({
  show: Boolean,
  width: {
    type: String,
    default: '516px', // Valor por defecto
  },
})
</script>
