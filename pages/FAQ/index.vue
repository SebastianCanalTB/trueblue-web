<script setup lang="ts">
const faqStore = useFaqStore()
const { getAllMyQuestions: questions } = storeToRefs(faqStore)
const bannerStore = useBannerStore()
const { getBannerInfo: banner } = storeToRefs(bannerStore)
const imageForMainSection = useSearchItemJson('[1].image', banner.value)
  ? useSearchItemJson('[1].image', banner.value)
  : '/img/FAQ/ic_background.webp'
const bannerLink = useSearchItemJson('[1].link', banner.value) ?? ''
const { t } = useI18n()

const goToBannerLink = () => {
  if (bannerLink) {
    window.open(bannerLink, '_blank')
  }
}
onMounted(() => {
  nextTick(async () => {
    useLoading(true)
    await faqStore.getAllQuestions()
    useLoading(false)
  })
})
</script>

<template>
  <div class="faq-page">
    <section class="main-section" @click="goToBannerLink">
      <div
        class="main-section-container"
        :style="{ backgroundImage: `url(${imageForMainSection})` }"
      >
        <h1 class="title white max-lg:!tw-text-[26px]">
          {{ $t('faq.title') }}
        </h1>
      </div>
    </section>
    <div class="accordion-containers">
      <div
        v-for="(section, sectionIndex) in questions"
        :key="sectionIndex"
        class="faq-section"
      >
        <h2 class="accordions-titles">
          {{ section.name }}
        </h2>

        <Accordion class="accordion-fqa">
          <template #collapseicon>
            <i class="pi pi-minus"></i>
          </template>
          <template #expandicon>
            <i class="pi pi-plus"></i>
          </template>

          <AccordionPanel
            v-for="(question, questionIndex) in section.question"
            :key="questionIndex"
            :value="questionIndex"
          >
            <AccordionHeader>
              <span>{{ question.question }}</span>
            </AccordionHeader>
            <AccordionContent>
              <p>
                {{ question.answer }}
              </p>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
.faq-page {
  background-color: #f5f6fa;
  .main-section {
    @apply lg:tw-h-[60vh] xl:tw-min-h-[65vh] 2xl:tw-min-h-[70vh] max-md:tw-min-h-[23vh];
    z-index: 1;
    position: relative;
    .main-section-container {
      @apply lg:tw-w-full lg:tw-mt-3 max-lg:tw-mt-8 lg:tw-min-h-[60vh] xl:tw-min-h-[65vh] 2xl:tw-min-h-[70vh] max-md:tw-min-h-[23vh] tw-bg-cover tw-bg-center;
      @apply tw-flex tw-flex-col-reverse tw-justify-center;
      content: '';
      background-repeat: no-repeat;
      h1 {
        @apply lg:tw-w-[750px] tw-pl-[8%] tw-pt-[20%];
        @apply max-lg:tw-w-full max-lg:tw-px-[4%] max-lg:tw-pt-[16%];
      }
    }
  }

  .accordion-containers {
    @apply tw-pb-20;
    z-index: 2;
    position: relative;

    .accordions-titles {
      @apply tw-text-[#8BA0C9] lg:tw-text-[32px] lg:tw-ml-[25%] tw-my-10;
      @apply max-lg:tw-text-[24px] max-lg:tw-ml-5;
      font-family: 'heading-pro-treble-bold';
    }
    .accordion-fqa {
      @apply lg:tw-w-[50%] lg:tw-mx-auto;
      border-top: 1px solid #8ba0c9;
      .p-accordionpanel {
        border-bottom: 1px solid #8ba0c9;

        .p-accordionheader {
          @apply max-md:tw-px-8 tw-pl-8;
          background: transparent;
          span {
            @apply tw-text-[14px] max-md:tw-text-base max-md:tw-w-5/6 tw-text-[#25282B] tw-w-full;
            font-family: 'heading-pro-treble-bold';
          }
        }
      }
      .p-accordionpanel.p-accordionpanel-active {
        background: transparent;
        span {
          color: #3db5e6 !important ;
        }
        &:first-child {
          border-top: 1px solid #8ba0c9;
        }
      }

      .p-accordioncontent-content {
        @apply tw-p-0 max-lg:tw-px-0;

        background-color: transparent !important;
        p {
          @apply tw-text-[#25282B] tw-text-lg tw-p-5 tw-text-[12px];
        }
      }
    }
  }
}
</style>
