<script setup lang="ts">
interface card {
  url: String
  title: String
  content: String
}

const props = defineProps({
  info: {
    type: Object as PropType<card>,
    required: true,
  },
})
</script>

<template>
  <div class="home-card" v-for="(info, i) in props.info" :key="i">
    <div class="header">
      <img :src="useSearchItemJson('url', info)" alt="icon" />
      <h1>{{ useSearchItemJson('title', info) }}</h1>
    </div>
    <p>
      {{ useSearchItemJson('content', info) }}
    </p>
  </div>
</template>
