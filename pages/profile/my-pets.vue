<script setup lang="ts">
const secondSection = useState<boolean>('profile-second-section')
</script>

<template>
  <div class="tw-h-full">
    <ProfileMyPets v-model="secondSection" />
  </div>
</template>
