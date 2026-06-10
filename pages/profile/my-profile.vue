<script setup lang="ts">
const route = useRoute()
const isEditPage = computed(() => route.path.includes('/edit'))
</script>

<template>
  <div class="max-lg:tw-mt-20" :class="{ 'max-lg:!tw-mt-0': isEditPage }">
    <NuxtPage />
  </div>
</template>
