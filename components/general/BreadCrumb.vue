<script setup lang="ts">
import type { ItemRoute } from '~/interface/item-route.interface'

export interface Props {
  routes: ItemRoute[]
}

withDefaults(defineProps<Props>(), {
  routes: () => [],
})
</script>

<template>
  <div>
    <ul>
      <li v-for="(item, key) in routes" :key="key">
        <nuxt-link :to="item.url" @click="item.action"
          >{{ item.text }}
          <span v-if="key !== routes.length - 1 && routes.length" class="mx-2"
            ><img
              src="/icons/profile/ic_arrow_bread.svg"
              alt="right-arrow"
            /> </span
        ></nuxt-link>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
ul {
  @apply tw-my-5 max-lg:tw-mt-14;
  display: flex;
  list-style: none;
  padding: 0;
}
ul li a {
  @apply tw-text-[12px];
  cursor: pointer;
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #828282;
  font-family: 'heading-pro-treble-book';
}

ul li:last-child a {
  color: $secondary;
  cursor: auto;
}
</style>
