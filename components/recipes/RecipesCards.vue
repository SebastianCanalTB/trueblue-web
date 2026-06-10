<script setup lang="ts">
const props = defineProps<{
  isMovil: boolean
}>()

const emit = defineEmits<{
  (e: 'open-recipe', recipeKey: string): void
}>()

const { t } = useI18n()

const hovered1 = ref(false)
const hovered2 = ref(false)
const hovered3 = ref(false)

const section1Ref = ref(null)
const section2Ref = ref(null)
const section3Ref = ref(null)

const handleOpenRecipe = (recipeKey: string) => {
  emit('open-recipe', recipeKey)
}

onMounted(() => {
  nextTick(() => {
    if (props.isMovil) {
      const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0.6,
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === section1Ref.value) {
              hovered1.value = true
            } else if (entry.target === section2Ref.value) {
              hovered2.value = true
            } else if (entry.target === section3Ref.value) {
              hovered3.value = true
            }
          } else {
            if (entry.target === section1Ref.value) {
              hovered1.value = false
            } else if (entry.target === section2Ref.value) {
              hovered2.value = false
            } else if (entry.target === section3Ref.value) {
              hovered3.value = false
            }
          }
        })
      }, observerOptions)

      nextTick(() => {
        if (section1Ref.value) observer.observe(section1Ref.value)
        if (section2Ref.value) observer.observe(section2Ref.value)
        if (section3Ref.value) observer.observe(section3Ref.value)
      })

      onUnmounted(() => {
        observer.disconnect()
      })
    }
  })
})
</script>

<template>
  <section class="recipes">
    <GeneralTrueBlueMarks class="tb-infor-cards-container" />
    <div class="recipes-card-container">
      <Card
        ref="section1Ref"
        class="recipe-card"
        @mouseenter="hovered1 = true"
        @mouseleave="hovered1 = false"
      >
        <template #header>
          <img
            :src="
              hovered1
                ? '/img/recipes/img_section2_2.webp'
                : '/img/recipes/img_section2_1.webp'
            "
            alt="Beef N' Carrot"
            class="recipe-image"
          />
        </template>
        <template #content>
          <div class="tw-flex tw-flex-col tw-items-center">
            <h3 class="recipe-title">Beef N' Carrot</h3>
            <i18n-t tag="p" keypath="recipes.texts.1" class="recipe-text">
              <template #strong>
                <strong class="recipe-strong">
                  {{ t('recipes.strongs.1.1') }}
                </strong>
              </template>
            </i18n-t>
          </div>
          <p class="recipe-text tw-mt-2">
            Adultos Licencia ICA: 24184 AL
            <br />
            Cachorros Licencia ICA: 24122 AL
          </p>
        </template>
        <template #footer>
          <Button
            class="recipe-button"
            @click="handleOpenRecipe('1')"
            :label="t('button.seeDetails')"
          />
        </template>
      </Card>

      <Card
        ref="section2Ref"
        class="recipe-card"
        @mouseenter="hovered2 = true"
        @mouseleave="hovered2 = false"
      >
        <template #header>
          <img
            :src="
              hovered2
                ? '/img/recipes/img_section3_2.webp'
                : '/img/recipes/img_section3_1.webp'
            "
            alt="Chicken N' Potato"
            class="recipe-image"
          />
        </template>
        <template #content>
          <div class="tw-flex tw-flex-col tw-items-center">
            <h3 class="recipe-title">Chicken N' Potato</h3>
            <i18n-t tag="p" keypath="recipes.texts.2" class="recipe-text">
              <template #strong>
                <strong class="recipe-strong">
                  {{ t('recipes.strongs.2.1') }}
                </strong>
              </template>
              <template #strong1>
                <strong class="recipe-strong">
                  {{ t('recipes.strongs.2.2') }}
                </strong>
              </template>
            </i18n-t>
          </div>
          <p class="recipe-text tw-mt-2">
            Adultos Licencia ICA: 24123 AL
            <br />
            Cachorros Licencia ICA: 24185 AL
          </p>
        </template>
        <template #footer>
          <Button
            class="recipe-button"
            @click="handleOpenRecipe('2')"
            :label="t('button.seeDetails')"
          />
        </template>
      </Card>

      <Card
        ref="section3Ref"
        class="recipe-card"
        @mouseenter="hovered3 = true"
        @mouseleave="hovered3 = false"
      >
        <template #header>
          <img
            :src="
              hovered3
                ? '/img/recipes/img_section4_2.webp'
                : '/img/recipes/img_section4_1.webp'
            "
            alt="Salmon Sensitive"
            class="recipe-image"
          />
        </template>

        <template #content>
          <h3 class="recipe-title">Salmon Sensitive</h3>
          <i18n-t tag="p" keypath="recipes.texts.3" class="recipe-text">
            <template #strong>
              <strong class="recipe-strong">
                {{ t('recipes.strongs.3.1') }}
              </strong>
            </template>
            <template #strong1>
              <strong class="recipe-strong">
                {{ t('recipes.strongs.3.2') }}
              </strong>
            </template>
            <template #strong2>
              <strong class="recipe-strong">
                {{ t('recipes.strongs.3.3') }}
              </strong>
            </template>
          </i18n-t>
          <p class="recipe-text tw-mt-2">
            Adultos Licencia ICA: 24076 AL
            <br />
            Cachorros Licencia ICA: 24077 AL
          </p>
        </template>
        <template #footer>
          <Button
            class="recipe-button"
            @click="handleOpenRecipe('3')"
            :label="t('button.seeDetails')"
          />
        </template>
      </Card>
    </div>
  </section>
</template>

<style scoped lang="scss">
.recipes {
  background-color: #ffffff;
  position: relative;
  z-index: 2;
  .recipes-card-container {
    @apply tw-flex lg:tw-justify-evenly lg:tw-gap-8 tw-px-5 lg:tw-px-[10%] tw-py-10 tw-mt-[154px];
    @apply max-lg:tw-flex-col max-lg:tw-gap-[11rem];
  }
}
</style>
