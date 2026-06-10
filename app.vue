<script setup lang="ts">
const systemStore = useSystemStore()
const { widthScreen } = storeToRefs(systemStore)
onMounted(async () => {


  widthScreen.value = window.innerWidth
  window.addEventListener('resize', () => {
    widthScreen.value = window.innerWidth
  })
})
</script>

<template>
  <div>
    <GeneralLoading />
    <NuxtLayout>
      <NuxtPage />
      <Toast position="bottom-center" />
    </NuxtLayout>
  </div>
</template>
