<script setup lang="ts">
const { t } = useI18n()
const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)
</script>

<template>
  <section class="feeding">
    <h6 class="title primary1 lg:my-5 tw-text-center">
      {{ $t('home.feedingSection.content.plan.title') }}
    </h6>

    <div class="content-plan">
      <div class="steps">
        <img
          src="/icons/ic_food_steps_1.svg"
          alt="Crea tu plan"
          class="mb-4"
          height="73px"
          width="60px"
        />
        <h3 class="tw-text-[20px] mb-2 tw-font-treble-bold tw-text-[#575E6B]">
          {{ $t(`home.feedingSection.content.plan.1.title`) }}
        </h3>
        <p class="tw-text-[13px] tw-text-center tw-text-gray-500">
          {{ $t(`home.feedingSection.content.plan.1.content`) }}
        </p>
      </div>
      <span class="line"></span>
      <div class="steps tw-pt-5">
        <img
          src="/icons/ic_food_steps_2.svg"
          alt="Descúbranlo juntos"
          class="mb-4"
          height="73px"
          width="70px"
        />
        <h3 class="tw-text-[20px] mb-2 tw-font-treble-bold tw-text-[#575E6B]">
          {{ $t(`home.feedingSection.content.plan.2.title`) }}
        </h3>
        <p class="tw-text-[13px] tw-text-center tw-text-gray-500">
          {{ $t(`home.feedingSection.content.plan.2.content`) }}
        </p>
      </div>
      <div class="line"></div>
      <div class="steps">
        <img
          src="/icons/ic_food_steps_3.svg"
          alt="Enamórense del plan"
          class="mb-4"
          height="73px"
          width="70px"
        />
        <h3 class="tw-text-[20px] mb-2 tw-font-treble-bold tw-text-[#575E6B]">
          {{ $t(`home.feedingSection.content.plan.3.title`) }}
        </h3>
        <p class="tw-text-[13px] tw-text-center tw-text-gray-500">
          {{ $t(`home.feedingSection.content.plan.3.content`) }}
        </p>
      </div>
    </div>
    <GeneralDogsZise />
    <div class="header">
      <h6 class="title primary1 pt-5 mt-0 tw-flex-col max-lg:tw-leading-[22px]">
        {{ $t('home.feedingSection.header.title') }}
        <strong
          class="white !tw-mx-0 !tw-mt-4 lg:!tw-text-[32px] max-lg:!tw-text-[23px]"
        >
          {{ $t('home.feedingSection.header.title2') }}
        </strong>
      </h6>
      <p
        class="text primary1 tw-mt-4 lg:tw-mx-auto lg:tw-max-w-[1250px] lg:tw-w-4/5 max-lg:tw-leading-[22px] max-lg:tw-mx-3"
      >
        {{ $t('home.feedingSection.header.content') }}
        <strong class="!tw-font-treble-bold">
          {{ t('home.feedingSection.header.content2') }}
        </strong>
        {{ t('home.feedingSection.header.content3') }}
      </p>
    </div>
    <div v-if="isMovil" class="img-container-movil">
      <img
        src="/img/trueblue_packages_phone.webp"
        alt="true_food"
        width="354px"
        height="250px"
      />
    </div>
    <div class="content-feeding col-12">
      <div class="lg:col-6 pt-8">
        <div class="title-content-feeding">
          <span
            >{{ $t('home.feedingSection.content.title.1') }}
            <strong>{{ $t('home.feedingSection.content.title.2') }}</strong>
            <span>{{ $t('home.feedingSection.content.title.3') }}</span></span
          >
        </div>

        <div v-for="index in 3" :key="index" class="checks tw-mb-5">
          <div class="flex gap-5 align-items-center">
            <img
              src="/icons/ic_checks_home.svg"
              alt="check"
              width="25px"
              height="25px"
            />
            <span>
              {{ $t(`home.feedingSection.content.${index}.title`) }}
            </span>
          </div>
          <p>
            {{ $t(`home.feedingSection.content.${index}.content`) }}
          </p>
        </div>
      </div>
      <div v-if="!isMovil" class="img-container col-6">
        <img
          src="/img/trueblue_packages.webp"
          alt="check"
          width="404px"
          height="607px"
        />
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.feeding {
  @apply lg:tw-my-36;

  .header {
    @apply lg:tw-pb-[48px] max-lg:tw-pb-28 tw-text-center;
    background-color: $primary-2;

    h6 {
      @apply tw-flex tw-flex-col max-lg:tw-px-5 lg:tw-px-10;
      margin-bottom: 0;
    }
  }

  .content-feeding {
    @apply tw-pl-[5%] tw-flex tw-max-h-[700px] tw-my-10;

    .title-content-feeding {
      @apply lg:tw-text-[36px] max-lg:tw-text-[28px];
      font-family: 'heading-pro-medium-heavy';
      padding-bottom: 37px;

      span {
        color: $primary-1;
      }
    }

    .checks {
      span {
        @apply max-lg:!tw-text-[16px];
        color: #575e6b;
        font-size: 20px;
        font-family: 'heading-pro-treble-bold';
      }

      p {
        @apply max-lg:tw-text-[13px];
        padding-left: 57px;
        margin-top: 10px;
      }
    }

    .img-container {
      @apply tw-flex tw-justify-center;
      @apply max-lg:tw-translate-y-[20%] max-lg:tw-absolute;
    }
  }
  .img-container-movil {
    @apply tw-w-full max-lg:tw-translate-y-[-41%] max-lg:tw-flex max-lg:tw-justify-center  max-lg:tw-absolute;
  }
  .content-plan {
    @apply tw-flex max-lg:tw-items-center xl:tw-mx-20 lg:tw-mx-6 tw-mb-44;
    @apply max-lg:tw-flex-col max-lg:tw-mt-11 max-lg:tw-mx-10;
    p {
      @apply lg:tw-w-[300px] xl:tw-w-auto;
    }
  }

  .line {
    @apply lg:tw-flex-1 lg:tw-mt-[50px] tw-border-dashed tw-border-[#8ba0c9]  -tw-mx-24 lg:tw-h-0 lg:tw-border-t-3;
    @apply max-lg:tw-w-[2px] max-lg:tw-mt-[20px] max-lg:tw-h-[100px] max-lg:tw-border-y-0 max-lg:tw-border-r-3;
    opacity: 1;
    background: none;
  }

  .steps {
    @apply tw-flex tw-flex-col tw-items-center;
    @apply tw-max-w-[368px] lg:tw-max-h-[105px] tw-text-center tw-justify-between;

    .steps-title {
      color: #575e6b;
      font-size: 20px;
      font-family: 'heading-pro-treble-bold';
    }
  }
}
</style>
