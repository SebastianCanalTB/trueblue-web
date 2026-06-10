<script setup lang="ts">
defineProps({
  mascotas: {
    type: Array as PropType<string[]>,
    required: true
  }
})
</script>

<template>
  <div class="mascotas-container">
    <span 
      v-for="(mascota, index) in mascotas" 
      :key="index" 
      class="mascota-tag"
    >
      {{ mascota }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.mascotas-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mascota-tag {
  background-color: rgba(135, 206, 250, 0.3);
  color: #3DB5E6 !important;
  border-radius: 1rem;
  padding: 0.25rem 1rem;
  font-size: 12px;
}
</style>