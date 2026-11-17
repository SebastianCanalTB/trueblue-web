<script setup lang="ts">
const secondSection = useState<boolean>('profile-second-section')
const onboardingStore = useOnboardingStore()
const { getLoginUser: user } = storeToRefs(onboardingStore)
// Mi cuenta v3: las veterinarias (type 'vet') mantienen la vista anterior.
const isVet = computed(() => useSearchItemJson('type', user.value) === 'vet')
</script>

<template>
  <ProfileMyAccount v-if="isVet" v-model="secondSection" />
  <ProfileV3Home v-else />
</template>
