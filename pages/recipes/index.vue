<script setup lang="ts">
const systemStore = useSystemStore()
const store = useOnboardingStore()
const bannerStore = useBannerStore()

const { getBannerInfo: banner } = storeToRefs(bannerStore)
const imageForMainSection = useSearchItemJson('[2].image', banner.value)
  ? useSearchItemJson('[2].image', banner.value)
  : '/img/recipes/header.webp'
const bannerLink = useSearchItemJson('[2].link', banner.value) ?? ''
const userData = store.getLoginUser
const { isMovil } = storeToRefs(systemStore)
const router = useRouter()
const localePath = useLocalePath()

const openRecipe = (recipeKey: string) => {
  router.push(localePath({ name: 'recipes-id', params: { id: recipeKey } }))
}

const goToBannerLink = () => {
  if (bannerLink) {
    window.open(bannerLink, '_blank')
  }
}
</script>

<template>
  <div>
    <article class="content-page-who" :class="[!userData ? 'tw-pt-10' : '']">
      <RecipesHero
        :image-for-main-section="imageForMainSection"
        :banner-link="bannerLink"
        :user-data="userData"
        @banner-click="goToBannerLink"
      />
      <RecipesCards :is-movil="isMovil" @open-recipe="openRecipe" />
      <RecipesIntroduction />
      <RecipesCharacteristics />
      <RecipesPlate />
      <RecipesSecondTitle />
      <RecipesMenus />
    </article>
  </div>
</template>

<style scoped lang="scss">
// Styles are now in individual components
</style>
