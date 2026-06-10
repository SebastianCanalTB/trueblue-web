<script setup lang="ts">
const secondSection = useState<boolean>('profile-second-section')
</script>

<template>
  <div>
    <ProfileMyAdresses v-model="secondSection" />
  </div>
</template>
