<script setup lang="ts">
import { watch } from 'vue'
import type { TableHeaders } from '~/interfaces/Table.interface'
import { debounce } from 'perfect-debounce'
const emit = defineEmits(['update:model-value'])

const selecteddeliveryId = ref(null)
const selectedStatus = ref(null)
const loading = ref(false)
const { t } = useI18n()
const currentPage = ref(1)
const totalPages = ref(0)
const accountStore = useAccountStore()
const referralStore = useReferralStore()
const vetsStore = useVetsStore()
const onboardingStore = useOnboardingStore()
const { getLoginUser: user } = storeToRefs(onboardingStore)
const { getInfoReferalCodes: referralData } = storeToRefs(referralStore)
const { getProfileInformation: profile } = storeToRefs(accountStore)
const { getInfoReferralCodes: referralCodesData } = storeToRefs(vetsStore)

const headers = ref<TableHeaders[]>([
  {
    header: t('profile.myRecommendeds.table.number'),
    field: 'usageNumber',
    type: 'text',
  },
  {
    header: t('profile.myRecommendeds.table.recommended'),
    type: 'fullname',
    field: 'usedBy.firstName',
    lastName: 'usedBy.lastName',
  },
  {
    header: t('profile.myRecommendeds.table.value'),
    field: 'commissionValue',
    type: 'currency',
  },
  {
    header: t('profile.myRecommendeds.table.usageDate'),
    field: 'usedAt',
    type: 'date',
  },
])

const form = ref({
  filter: '',
  limit: 5,
  offset: 0,
})
const loadData = async () => {
  useLoading(true)
  loading.value = true

  const response = await vetsStore.getReferralCodes(form.value)
  if (response.status && response.code === 100) {
    totalPages.value = response.data.rows
  }
  loading.value = false

  useLoading(false)
}

const onChangePage = (page: number) => {
  currentPage.value = page
  form.value.offset = page - 1
}

const handleMobilePagination = (event: any) => {
  const page = Math.floor(event.first / event.rows) + 1
  onChangePage(page)
}

const onChangeRows = (rowsPerPage: number) => {
  currentPage.value = 1
  form.value.limit = rowsPerPage
  form.value.offset = 0
}
const referalCode = ref('')

const debouncedLoadData = debounce(loadData, 500)
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

  const codeToopy =
    referalCode.value ||
    useSearchItemJson('vetInfo.vetReferralCode.code', profile.value)

  if (!codeToopy) {
    fallbackCopyReferralCodeComplete(
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
      await navigator.clipboard.writeText(codeToopy)
      useShowAlert({
        type: 'success',
        message: t('forms.create.copySuccess'),
      })
    } catch (error) {
      console.error('Error with clipboard API:', error)
      fallbackCopyReferralCodeComplete(codeToopy)
    }
  } else {
    fallbackCopyReferralCodeComplete(codeToopy)
  }
}

const fallbackCopyReferralCodeComplete = (text: string) => {
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
  nextTick(async () => {
    await referralStore.getReferalCodes()
    await loadData()
    referalCode.value = useSearchItemJson(
      'vetInfo.vetReferralCode.code',
      profile.value,
    )
    ;('')
  })
})
watch(
  () => form.value,
  async () => {
    debouncedLoadData()
  },
  { deep: true },
)
</script>
<template>
  <div class="lg:tw-mr-10 lg:tw-mt-20 max-lg:tw-mt-28">
    <div v-if="referralData[0]?.value" class="card-referal-container">
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

    <div class="tw-flex tw-flex-col lg:tw-flex-row tw-gap-2 tw-mb-4">
      <div class="tw-flex tw-gap-2 tw-flex-grow">
        <span
          class="general-input solo-form lg:tw-w-[300px] max-lg:tw-w-1/2 !tw-h-auto"
        >
          <IconField iconPosition="right">
            <InputText v-model="form.filter" placeholder="Buscar" />
            <InputIcon><i class="pi pi-search"></i></InputIcon>
          </IconField>
        </span>
      </div>
    </div>
    <div
      v-if="referralCodesData.length > 0"
      class="max-lg:tw-hidden tw-max-w-[1000px]"
    >
      <GeneralTable
        :headers="headers"
        :fields="referralCodesData"
        :empty="$t('table.empty.message')"
        :limit="form.limit"
        :pages="totalPages"
        :current-page="currentPage"
        @change-page="onChangePage"
        @change-rows="onChangeRows"
        @reload="loadData"
      />
    </div>

    <div v-if="referralCodesData.length > 0" class="tw-block lg:tw-hidden">
      <div
        v-for="data in referralCodesData"
        :key="data.id"
        class="tw-bg-white tw-rounded-lg tw-shadow-sm tw-mb-4 tw-p-4"
      >
        <div class="tw-flex tw-justify-between tw-items-center tw-mb-2">
          <div>
            <span class="tw-text-gray-500 tw-text-[12px]"
              >{{ t('profile.myRecommendeds.table.number') }}:
              {{ data.usageNumber }}</span
            >
          </div>
        </div>

        <div class="tw-mb-2">
          <span class="tw-text-primary tw-font-treble-regular tw-text-[14px]">
            {{ data.usedBy.firstName }}
            {{ data.usedBy.lastName }}
          </span>
        </div>

        <div>
          <p class="tw-text-[#575E6B] tw-text-[12px] tw-mb-1">
            {{ $t('profile.myRecommendeds.table.usageDate') + ': ' }}
            {{ useFormatDate(data.usedAt, 'date-table') }}
          </p>
        </div>

        <p class="tw-text-right tw-font-treble-bold tw-text-[14px]">
          {{ $t('profile.myRecommendeds.valueLabel') }}
          {{ useFormatPrice(data.commissionValue) }}
        </p>
      </div>

      <div class="tw-mt-4">
        <Paginator
          :rows="form.limit"
          :totalRecords="totalPages"
          :first="(currentPage - 1) * form.limit"
          @page="handleMobilePagination($event)"
          class="tw-p-0"
        />
      </div>
    </div>
    <div
      v-else
      class="tw-flex tw-items-center tw-flex-col tw-justify-center tw-mt-20"
    >
      <img
        src="/icons/profile/ic_my_plan.svg"
        alt="dog-icon"
        width="128px"
        height="127px"
      />
      <p
        class="tw-text-[12px] tw-text-[#8BA0C9] tw-w-[336px] tw-text-center tw-mt-5"
      >
        {{ $t('profile.myPets.empty') }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.card-referal-container {
  @apply tw-bg-white tw-p-4 tw-mb-4 tw-flex tw-relative lg:tw-max-w-[1000px];
  @apply max-lg:tw-w-full max-lg:tw-flex-col-reverse max-lg:tw-pt-20;
  box-shadow: 0px 3px 12px #080b2f14;
  border-radius: 16px;
  .card-referal {
    @apply tw-w-full tw-flex tw-flex-col tw-gap-5 lg:tw-mr-[359px];
  }

  img {
    @apply lg:tw-right-0 lg:tw-top-[-20px] lg:tw-w-[359px] lg:tw-h-[289px] tw-absolute;
    @apply max-lg:tw-w-[215px] max-lg:tw-h-[172px]  max-lg:tw-top-[-80px] max-lg:tw-translate-x-1/2 max-lg:tw-right-1/2;
    object-fit: cover;
  }
}
</style>
