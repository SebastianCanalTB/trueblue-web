<script setup lang="ts">
const { t } = useI18n()
const accountStore = useAccountStore()
const { getProfileInformation: profile } = storeToRefs(accountStore)
const onboardingStore = useOnboardingStore()
const { getLoginUser: user } = storeToRefs(onboardingStore)
const referalCode = ref('')
const isLoading = ref(true)
const copyReferalCode = async () => {
  if (!useSearchItemJson('vetInfo.vetReferralCode.code', profile.value)) {
    const response = await accountStore.generateReferralCodeInfo()
    if (response.status && response.code === 100) {
      await accountStore.getProfile()
      referalCode.value = useSearchItemJson(
        'vetInfo.vetReferralCode.code',
        profile.value,
      )
    }
  }

  const codeToCopy =
    referalCode.value ||
    useSearchItemJson('vetInfo.vetReferralCode.code', profile.value)

  if (!codeToCopy) {
    fallbackCopyReferralCode(
      useSearchItemJson('vetInfo.vetReferralCode.code', profile.value),
    )
    return
  }

  if (
    navigator &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function' &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(codeToCopy)
      useShowAlert({
        type: 'success',
        message: t('forms.create.copySuccess'),
      })
    } catch (error) {
      console.error('Error with clipboard API:', error)
      fallbackCopyReferralCode(codeToCopy)
    }
  } else {
    fallbackCopyReferralCode(codeToCopy)
  }
}

const fallbackCopyReferralCode = (text: string) => {
  const textArea = document.createElement('textarea')
  textArea.value = text

  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    if (successful) {
      useShowAlert({
        type: 'success',
        message: t('forms.create.copySuccess'),
      })
    } else {
      throw new Error('Copy command failed')
    }
  } catch (err) {
    console.error('Fallback: Unable to copy referral code', err)
  }

  document.body.removeChild(textArea)
}

onMounted(() => {
  nextTick(() => {
    isLoading.value = false
    referalCode.value = useSearchItemJson(
      'vetInfo.vetReferralCode.code',
      profile.value,
    )
  })
})
</script>

<template>
  <div v-if="!isLoading" class="vets-second-section">
    <div class="header-section">
      <h1 class="title">{{ $t('profile.vetsSecondSection.title') }}</h1>
    </div>

    <div class="card-referal-container">
      <div class="card-referal">
        <i18n-t
          class="title primary1 !tw-text-[32px] max-lg:tw-text-[28px] tw-mt-5"
          :keypath="'profile.myRecommendeds.section.title1'"
          tag="h1"
        >
          <template #strong>
            <strong class="!tw-text-[#3DB5E6]">
              {{ t('profile.myRecommendeds.section.strong') }}
            </strong>
          </template>
        </i18n-t>
        <p class="tw-text-[#575E6B] tw-text-[14px]">
          {{ $t('profile.myRecommendeds.section.text') }}
        </p>
        <span
          class="general-input solo-email referal !tw-h-auto tw-w-full tw-mb-2"
        >
          <IconField iconPosition="right">
            <InputText
              v-model="referalCode"
              placeholder="¡Haz click para obtener tu código!"
              maxlength="50"
              :disabled="true"
            />
            <InputIcon>
              <Button
                @click="copyReferalCode"
                class="app-general-button btn-solo-refeal profile !tw-w-[126px]"
                label="Copiar"
                icon="pi pi-copy"
                iconPos="left"
              >
              </Button>
            </InputIcon>
          </IconField>
        </span>
      </div>
      <img src="/img/profile/img-vet-dog.webp" alt="vet&Dog" />
    </div>
    <div class="bonus-section">
      <h4
        class="tw-text-[#003366] tw-text-[24px] lg:tw-text-[32px] title tw-text-center"
      >
        {{ t('profile.vetsSecondSection.howToEarn') }}
        <strong>
          {{ t('profile.vetsSecondSection.earn') }}
        </strong>
        {{ t('profile.vetsSecondSection.money') }}
      </h4>
      <p>
        {{ t('profile.vetsSecondSection.earningsDescription') }}
      </p>
      <div
        class="tw-flex tw-gap-5 lg:tw-justify-center tw-items-center max-lg:tw-flex-col"
      >
        <div class="bonus-cards">
          <span class="bonus-cards__title">
            {{ t('profile.vetsSecondSection.firstPurchase') }}
          </span>
          <span class="bonus-cards__price">
            {{ useFormatPrice(50000) }}
          </span>
        </div>
        <div class="bonus-cards">
          <span class="bonus-cards__title">
            {{ t('profile.vetsSecondSection.secondPurchase') }}
          </span>
          <span class="bonus-cards__price">
            {{ useFormatPrice(25000) }}
          </span>
        </div>
        <div class="bonus-cards">
          <span class="bonus-cards__title">
            {{ t('profile.vetsSecondSection.thirdPurchase') }}
          </span>
          <span class="bonus-cards__price">
            {{ useFormatPrice(25000) }}
          </span>
        </div>
      </div>
      <p>
        {{ t('profile.vetsSecondSection.bonusDescription') }}
      </p>
      <div class="groups-section tw-h-[100px]">
        <div class="individual-group tw-bg-[#96D9E9]">
          <div class="tw-flex tw-gap-1">
            <span class="number"> 10 </span>
            <img
              src="/icons/profile/ic_user_fill_white.svg"
              alt=""
              width="22px"
              height="21px"
            />
          </div>
          <span class="price">
            {{ useFormatPrice(100000) }}
          </span>
        </div>
        <div class="individual-group tw-bg-[#64D0E4]">
          <div class="tw-flex tw-gap-1">
            <span class="number"> 30 </span>
            <img
              src="/icons/profile/ic_user_fill_white.svg"
              alt=""
              width="22px"
              height="21px"
            />
          </div>
          <span class="price">
            {{ useFormatPrice(300000) }}
          </span>
        </div>
        <div class="individual-group tw-bg-[#3DB5E6]">
          <div class="tw-flex tw-gap-1">
            <span class="number"> 50 </span>
            <img
              src="/icons/profile/ic_user_fill_white.svg"
              alt=""
              width="22px"
              height="21px"
            />
          </div>
          <span class="price">
            {{ useFormatPrice(500000) }}
          </span>
        </div>
        <div class="individual-group last tw-bg-[#5FADE5]">
          <div class="tw-flex tw-gap-1">
            <span class="number"> 100 </span>
            <img
              src="/icons/profile/ic_user_fill_white.svg"
              alt=""
              width="22px"
              height="21px"
            />
          </div>
          <span class="price">
            {{ useFormatPrice(1000000) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.vets-second-section {
  @apply tw-w-full tw-px-4 lg:tw-px-10 tw-py-6;
}

.header-section {
  @apply tw-mb-6 max-lg:tw-mb-28;

  .title {
    @apply tw-text-primary tw-text-[28px] lg:tw-text-[40px]  tw-text-center;
  }
}

.card-referal-container {
  @apply tw-bg-white tw-p-4 tw-mb-4 tw-flex tw-relative lg:tw-max-w-[1000px] lg:tw-mx-auto;
  @apply max-lg:tw-w-full max-lg:tw-flex-col-reverse max-lg:tw-pt-20;
  .card-referal {
    @apply tw-w-full tw-flex tw-flex-col tw-gap-5 lg:tw-mr-[359px];
  }

  img {
    @apply lg:tw-right-0 lg:tw-top-[-20px] lg:tw-w-[359px] lg:tw-h-[289px] tw-absolute;
    @apply max-lg:tw-w-[215px] max-lg:tw-h-[172px]  max-lg:tw-top-[-80px] max-lg:tw-translate-x-1/2 max-lg:tw-right-1/2;
    object-fit: cover;
  }
}
.bonus-section {
  @apply tw-flex tw-flex-col tw-gap-5 lg:tw-text-center tw-relative;
  p {
    @apply tw-text-[#575E6B] tw-text-[18px] max-lg:tw-ml-12;
    &::before {
      content: '';
      @apply tw-w-[250px] tw-absolute  tw-left-[-40px] tw-h-[13px] max-lg:tw-w-[60px];
      background: url('/icons/profile/ic_line_vets.svg') center center;
      background-size: contain;
      background-repeat: no-repeat;
      @apply max-lg:tw-bg-cover max-lg:tw-bg-right;
    }
  }
  .bonus-cards {
    @apply tw-bg-[#F5F5F5] tw-px-14 tw-py-10 tw-rounded-[27px] tw-flex tw-flex-col tw-gap-2 tw-items-center;
    @apply max-sm:tw-w-full;
    &__title {
      @apply tw-text-[#1A1A29] tw-text-[16px] lg:tw-text-[24px] tw-font-treble-bold tw-text-center;
    }
    &__price {
      @apply tw-text-[#003366] tw-text-[32px] lg:tw-text-[40px] tw-font-medium-heavy tw-text-center;
    }
  }
  .groups-section {
    @apply tw-flex tw-gap-1 tw-justify-center tw-overflow-x-auto tw-w-full max-lg:tw-pl-80 max-lg:tw-pr-2;
    .individual-group {
      @apply tw-flex tw-flex-col tw-px-10 tw-py-2 tw-items-center max-lg:tw-justify-center;
      .number {
        @apply tw-text-white tw-text-[24px] lg:tw-text-[38px] tw-font-treble-bold;
      }
      .price {
        @apply tw-text-primary tw-text-[14px] lg:tw-text-[18px] tw-font-treble-bold;
      }
      &.last {
        @apply tw-relative;
        &::after {
          content: '';
          width: 0;
          height: 0;
          position: absolute;
          right: -58px; /* Posiciona el triángulo a la derecha */
          top: 0;
          border-style: solid;
          border-top: 50px solid transparent;
          border-bottom: 50px solid transparent;
          border-left: 60px solid #5fade5;
          border-right: 0;
        }
      }
    }
  }
}
</style>
