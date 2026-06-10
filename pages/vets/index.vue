<script lang="ts" setup>
import { Carousel, Slide, Pagination, Navigation } from 'vue3-carousel'
const store = useOnboardingStore()
const { getLoginUser: userData } = storeToRefs(store)
const imageForMainSection = '/img/vets/img-bg-main.webp'
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const router = useRouter()
const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)

const carouselConfigHomecard = {
  itemsToShow: 1.1,
  snapAlign: 'center',
  wrapAround: true,
  autoplay: 10000,
  pauseAutoplayOnHover: true,
}

const homeBenefitsCard = ref([
  {
    url: '/icons/ic_water.svg',
    title: t('vets.commitment.cards.1.title'),
    content: t('vets.commitment.cards.1.text'),
  },
  {
    url: '/icons/ic_lightning.svg',
    title: t('vets.commitment.cards.2.title'),
    content: t('vets.commitment.cards.2.text'),
  },
  {
    url: '/icons/ic_stomach.svg',
    title: t('vets.commitment.cards.3.title'),
    content: t('vets.commitment.cards.3.text'),
  },
])

const vetsDrawerOpen = ref(false)

const openVetsDrawer = () => {
  vetsDrawerOpen.value = true
}

const handleFormSubmit = (values: any) => {
  router.push(localePath({ name: 'profile-my-profile' }))
}
</script>

<template>
  <article class="content-page-vets" :class="[!userData ? 'tw-pt-10' : '']">
    <section class="main-section">
      <div
        class="main-section-container"
        :style="{ backgroundImage: `url(${imageForMainSection})` }"
      >
        <h1 class="title primary1">
          {{ $t('vets.title') }}
        </h1>
      </div>
    </section>
    <div class="join-vets-section">
      <div
        class="tw-flex tw-justify-center tw-items-center tw-flex-col tw-gap-5 lg:tw-px-[10%]"
      >
        <p
          class="tw-whitespace-pre-line tw-text-center lg:tw-text-[18px] max-lg:tw-text-[16px] lg:tw-max-w-[644px]"
        >
          {{ t('vets.join') }}
        </p>
        <Button
          class="app-general-button btn-300px primary-1"
          @click="openVetsDrawer"
          :label="t('button.joinVets')"
        />
      </div>
    </div>
    <section class="commitment-section">
      <h2 class="title primary1">
        {{ t('vets.commitment.title.text') }}
        <strong>
          {{ t('vets.commitment.title.strong') }}
        </strong>
      </h2>
      <p>
        {{ t('vets.commitment.text') }}
      </p>
      <div class="messages-container">
        <div v-for="index in 4" :key="index" class="message-item">
          <img
            src="/icons/vets/ic_check.svg"
            alt="ic_check"
            width="26px"
            height="25px"
          />
          <div>
            <span class="subtitle">
              {{ t(`vets.commitment.${index}.subtitle`) }}
            </span>
            <p>{{ t(`vets.commitment.${index}.text`) }}</p>
          </div>
        </div>
      </div>
    </section>
    <section class="benefits-section">
      <div class="tw-flex tw-w-full">
        <div class="image-container">
          <img src="/img/vets/img-dog.png" alt="dog" />
        </div>
        <div class="content-text">
          <h3>
            {{ $t('home.sectionBenefits.title') }}
          </h3>
          <p class="tw-mb-4 tw-mr-3">
            {{ $t('home.sectionBenefits.content') }}
          </p>
          <Button
            v-if="!userData?.id"
            class="app-general-button btn-solo-create !tw-w-[280px]"
            @click="openVetsDrawer"
            :label="t('button.joinVets')"
          />
          <Button
            v-if="userData?.id"
            class="app-general-button btn-solo-create"
            @click="router.push(localePath({ name: 'profile-my-profile' }))"
            :label="t('home.plan')"
          />
        </div>
      </div>
      <div v-if="isMovil" class="general-carousel">
        <Carousel v-bind="carouselConfigHomecard">
          <Slide v-for="(slotProps, index) in homeBenefitsCard" :key="index">
            <div class="home-card">
              <div class="header">
                <img :src="useSearchItemJson('url', slotProps)" alt="icon" />
                <h1>
                  {{ useSearchItemJson('title', slotProps) }}
                </h1>
              </div>
              <p>
                {{ useSearchItemJson('content', slotProps) }}
              </p>
            </div>
          </Slide>
          <template #addons>
            <Pagination />
          </template>
        </Carousel>
      </div>
      <div v-else class="tw-w-full tw-grid tw-grid-cols-3 tw-gap-2">
        <GeneralHomeCard :info="homeBenefitsCard" class="component-container" />
      </div>
    </section>

    <div class="recipes-section">
      <div
        class="tw-flex tw-justify-center tw-items-center tw-flex-col tw-gap-5 tw-px-[10%] tw-text-center"
      >
        <h4 class="title primary1">{{ t('vets.recipes.title') }}</h4>
        <i18n-t
          tag="p"
          keypath="vets.recipes.text"
          class="tw-whitespace-pre-line tw-text-[#003B71]"
        >
          <template #strong1>
            <strong class="strong-texts">
              {{ t('vets.recipes.strongs.1') }}
            </strong>
          </template>
          <template #strong2>
            <strong class="strong-texts">
              {{ t('vets.recipes.strongs.2') }}
            </strong>
          </template>
        </i18n-t>
      </div>
    </div>
    <section class="testimonials-section">
      <div
        class="tw-flex tw-justify-center tw-items-center tw-flex-col tw-gap-5 tw-px-[10%] tw-text-center"
      >
        <h4 class="title primary1">{{ t('vets.testimonials.title') }}</h4>
        <i18n-t
          tag="p"
          keypath="vets.testimonials.text"
          class="tw-whitespace-pre-line tw-text-[#575E6B] tw-max-w-[514px]"
        >
          <template #strong>
            <strong class="strong-texts !tw-text-[#575E6B]">
              {{ t('vets.testimonials.strong') }}
            </strong>
          </template>
        </i18n-t>
        <Button
          class="app-general-button btn-300px primary-1"
          @click="openVetsDrawer"
          :label="t('button.joinVets')"
        />
      </div>
      <div class="team-members-container">
        <div v-for="index in 4" :key="index" class="team-member">
          <div class="member-image">
            <img
              :src="`/img/vets/img_vet_${index}.png`"
              :alt="t(`vets.testimonials.team.${index}.name`)"
            />
          </div>
          <div>
            <h5 class="member-name">
              {{ t(`vets.testimonials.team.${index}.name`) }}
            </h5>
            <p class="member-role">
              {{ t(`vets.testimonials.team.${index}.role`) }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </article>

  <SidebarVetsFormDrawer v-model="vetsDrawerOpen" @submit="handleFormSubmit" />
</template>

<style lang="scss" scoped>
.content-page-vets {
  .main-section {
    @apply lg:tw-h-[40vh] xl:tw-h-[45vh] 2xl:tw-h-[50vh] max-md:tw-min-h-[23vh];
    @apply lg:tw-max-h-[600px] xl:tw-max-h-[700px] 2xl:tw-max-h-[800px];
    z-index: 1;
    position: relative;

    .main-section-container {
      @apply lg:tw-absolute lg:tw-w-full tw-mt-3 lg:tw-h-[40vh] xl:tw-h-[45vh] 2xl:tw-h-[50vh] max-md:tw-min-h-[23vh] tw-bg-cover tw-bg-center;
      @apply lg:tw-max-h-[600px] xl:tw-max-h-[700px] 2xl:tw-max-h-[800px];
      @apply tw-flex tw-flex-col lg:tw-justify-end;
      content: '';
      background-repeat: no-repeat;

      h1 {
        @apply lg:tw-w-[750px] tw-pl-[8%] max-lg:!tw-text-[24px] lg:!tw-text-[52px];
        @apply max-lg:tw-w-full max-lg:tw-px-[4%] max-lg:tw-mt-auto max-lg:tw-mb-4;
        @apply lg:tw-pb-8 xl:tw-pb-10 2xl:tw-pb-12;
      }
    }
  }

  .join-vets-section {
    @apply lg:tw-py-10 tw-bg-[#F5F6FA] tw-w-full tw-relative max-lg:tw-p-5;
    z-index: 2;
    position: relative;
  }
  .commitment-section {
    @apply lg:tw-py-10 tw-bg-white tw-w-full tw-relative max-lg:tw-p-5;
    @apply tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-gap-3;
    z-index: 2;
    h2 {
      @apply lg:tw-text-[36px] max-lg:tw-text-[28px]  lg:tw-max-w-[674px];
    }
    p {
      @apply tw-max-w-[760px];
    }
    .messages-container {
      @apply lg:tw-px-20  tw-text-left lg:tw-mt-10;
      @apply lg:tw-grid lg:tw-grid-cols-2 lg:tw-gap-6;
      @apply max-lg:tw-flex max-lg:tw-flex-col max-lg:tw-gap-4 max-lg:tw-mt-5;
      .message-item {
        @apply tw-flex tw-gap-2 tw-items-start;
      }
      .subtitle {
        font-family: 'heading-pro-treble-bold';
        font-size: 14px;
        color: $color-25282b;
      }
    }
  }
  .benefits-section {
    @apply tw-relative tw-bg-[#F5F6FA] tw-z-20 lg:tw-min-h-[750px] max-lg:tw-h-[700px];

    .content-text {
      @apply tw-flex tw-flex-col tw-justify-center tw-pl-5 lg:tw-pr-[10%];
      @apply max-lg:tw-px-5  max-lg:tw-pb-[30px];

      h3 {
        @apply lg:tw-text-[40px] tw-mb-0  max-lg:tw-mt-6;
        color: $primary-1;
        line-height: 1.3;
        font-family: 'heading-pro-medium-heavy';
        @apply max-lg:tw-text-[28px];
      }
    }

    .image-container {
      @apply tw-relative tw-max-h-[298px] tw-min-w-[410px];
      @apply max-lg:tw-hidden;
      img {
        @apply tw-w-[232px] tw-h-[348px];
        transform: translateY(-50px) translateX(50%);
      }
    }
    &::after {
      content: '';
      @apply tw-absolute tw-bottom-0   tw-w-full lg:tw-h-[210px] max-lg:tw-h-[91px];
      background-image: url('/img/vets/img-packages.png');
      background-size: contain;
      background-repeat: no-repeat;
      background-position-x: center;
    }
  }
  .testimonials-section {
    @apply lg:tw-py-10 tw-bg-[#F5F6FA] tw-w-full tw-relative max-lg:tw-py-5;
    @apply tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-8;
    z-index: 2;

    .team-members-container {
      @apply tw-flex lg:tw-justify-evenly lg:tw-w-full tw-items-start tw-gap-6  tw-mt-8;
      @apply max-lg:tw-flex-wrap max-lg:tw-justify-center;

      .team-member {
        @apply tw-flex tw-flex-col tw-items-center tw-gap-3;
        @apply tw-max-w-[280px];

        .member-image {
          @apply tw-w-[200px] tw-h-[200px] tw-rounded-full tw-overflow-hidden;

          img {
            @apply tw-w-full tw-h-full tw-object-cover;
            box-shadow: 0px 3px 8px #0a103e1a;
            user-select: none;
            -webkit-user-drag: none;
            user-select: none;
            -moz-user-select: none;
            -webkit-user-select: none;
            -ms-user-select: none;
            pointer-events: none;
          }
          &:last-child {
            @apply tw-bg-white;
          }
        }

        .member-name {
          font-family: 'heading-pro-treble-bold';
          font-size: 20px;
          color: $color-575e6b;
          @apply tw-mb-0 tw-text-center;
        }

        .member-role {
          font-family: 'heading-pro-treble-bold';
          font-size: 12px;
          color: $color-1a1a29;
          @apply tw-mb-0 tw-text-center;
        }
      }
    }
  }
  .recipes-section {
    @apply lg:tw-py-10 tw-bg-[#96D9E9] tw-w-full tw-relative max-lg:tw-py-5;
    z-index: 2;
  }
  .strong-texts {
    @apply tw-font-treble-bold lg:!tw-text-[14px] tw-w-auto;
    @apply max-lg:!tw-text-[12px] tw-text-primary;
  }
}
</style>
