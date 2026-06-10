<script setup lang="ts">
/** props */
const props = defineProps(['error'])
</script>
<template>
  <small v-if="error" id="text-error" class="p-error">{{
    error || '&nbsp;'
  }}</small>
</template>
<style lang="scss">
#text-error {
  font-size: 10px;
  margin-top: 5px;
  font-weight: bold;
  color: #ff6464;
}
</style>
