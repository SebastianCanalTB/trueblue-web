<script setup lang="ts">
const secondSection = useState<boolean>('profile-second-section')
</script>

<template>
  <div
    class="max-lg:tw-mt-20 tw-h-full"
    :class="{ 'max-lg:!tw-mt-0': secondSection }"
  >
    <ProfileMyPlan v-model="secondSection" />
  </div>
</template>
