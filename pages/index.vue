<script setup lang="ts"></script>

<template>
  <div class="pb-6">
    <article class="content-page-home">
      <HomePrincipal />
      <HomeOurProducts />
      <HomeFeeding />
      <HomeBenefits />
      <HomeVets />
      <HomeTestimonials />
    </article>
  </div>
</template>
<style lang="scss">
.content-page-home {
  animation: zoomOut 1s ease-out forwards;
  transform-origin: center center;
  @keyframes zoomOut {
    0% {
      transform: scale(1.2);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
}
</style>
