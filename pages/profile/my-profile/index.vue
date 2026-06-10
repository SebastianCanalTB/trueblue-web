<script setup lang="ts">
const secondSection = useState<boolean>('profile-second-section')
</script>

<template>
  <ProfileMyAccount v-model="secondSection" />
</template>
