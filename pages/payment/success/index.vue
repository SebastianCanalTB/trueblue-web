<script setup lang="ts">
definePageMeta({
  layout: 'custom',
})
const accountStore = useAccountStore()
const onboardingStore = useOnboardingStore()
const referralStore = useReferralStore()
const { getLoginUser: user } = storeToRefs(onboardingStore)
const { getProfileInformation: profile } = storeToRefs(accountStore)
const { getInfoReferalCodes: referralData } = storeToRefs(referralStore)
const paymentSuccess = ref(true)
const showFinalDialog = ref(true)
const loginSuccess = ref(false)
const referralCode = ref('')
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()
const route = useRoute()
const isLoading = ref(true)
const orderId = ref(null)
const step = ref(0)
const code = ref(0)
const phoneInfo = ref()
const nextStep = (value) => {
  phoneInfo.value = value
  step.value++
}
const codeGet = (values) => {
  code.value = values
}
const prevStep = () => {
  step.value--
}
const getData = async () => {
  useLoading(true)
  isLoading.value = true
  if (user.value?.id) {
    loginSuccess.value = true
    await accountStore.getProfile()
    const response = await accountStore.getTransferStatus(profile.value?.id)
    if (response.status && response.code === 100) {
      await referralStore.getReferalCodes()
      orderId.value = response.data.order.id

      referralCode.value = useSearchItemJson('referralCode.code', profile.value)
    } else {
      orderId.value = response?.error?.data?.data
      router.push(
        localePath({
          name: 'profile-my-deliveries-id',
          params: { id: orderId.value },
        }),
      )
    }
  } else {
    loginSuccess.value = false
  }
  useLoading(false)
  isLoading.value = false
}
const copyreferralCode = () => {
  if (
    navigator &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function' &&
    window.isSecureContext
  ) {
    navigator.clipboard
      .writeText(referralCode.value)
      .then(() => {
        useShowAlert({
          type: 'success',
          message: t('forms.create.copySuccess'),
        })
      })
      .catch((error) => {
        console.error('Error with clipboard API:', error)
        fallbackCopyReferralCode(referralCode.value)
      })
  } else {
    fallbackCopyReferralCode(referralCode.value)
  }
}

const fallbackCopyReferralCode = (text) => {
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
    useShowAlert({
      type: 'error',
      message: t('forms.create.copyError'),
    })
  }

  document.body.removeChild(textArea)
}
onMounted(() => {
  nextTick(async () => {
    getData()
  })
})
</script>

<template>
  <div v-if="!isLoading">
    <div v-if="!loginSuccess" class="login-page">
      <div class="login-content">
        <LoginFirstStep
          v-if="step === 0"
          @onSubmit="nextStep"
          @code="codeGet"
        />
        <LoginSecondStep
          v-if="step === 1"
          @goBack="prevStep"
          :code="code"
          :phone="phoneInfo"
          @submit="getData"
        />
      </div>
    </div>
    <div v-else>
      <SidebarPaymentSuccessDrawer
        v-model="paymentSuccess"
        :orderId="orderId"
      />
      <GeneralDialog :show="showFinalDialog" style="z-index: 10000">
        <div class="tw-p-5 tw-relative">
          <div class="tw-relative tw-flex tw-flex-col">
            <span
              class="tw-text-primary tw-text-[32px] tw-font-medium-heavy tw-h-[36px]"
              >{{ $t('forms.create.finalDialog.title1') }}
            </span>
            <strong class="!tw-font-medium-heavy tw-text-[32px]">{{
              $t('forms.create.finalDialog.title2')
            }}</strong>
          </div>
          <i
            class="pi pi-times"
            style="
              position: absolute;
              color: #003b71;
              top: 10px;
              right: 10px;
              font-size: 13px;
              cursor: pointer;
            "
            @click="showFinalDialog = !showFinalDialog"
          ></i>
          <div class="tw-my-4">
            <p
              class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book tw-leading-[24px]"
            >
              {{
                $t('forms.create.finalDialog.text', {
                  data: referralData[0]?.value,
                })
              }}
            </p>
          </div>
          <span
            class="general-input solo-email referal !tw-h-auto tw-w-full tw-mb-2"
          >
            <IconField iconPosition="right">
              <InputText
                v-model="referralCode"
                placeholder="Código de referido"
                maxlength="50"
                :disabled="true"
              />
              <InputIcon>
                <Button
                  @click="copyreferralCode"
                  class="app-general-button btn-solo-refeal !tw-w-[126px]"
                  label="Copiar"
                  icon="pi pi-copy"
                  iconPos="left"
                >
                </Button>
              </InputIcon>
            </IconField>
          </span>
          <div class="tw-flex tw-flex-col tw-items-center">
            <Button
              class="app-general-button btn-solo-create tw-mt-2 tw-mx-auto"
              :label="$t('button.understood')"
              autofocus
              @click="showFinalDialog = !showFinalDialog"
            />
          </div>
        </div>
      </GeneralDialog>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.login-page {
  @apply tw-py-10 tw-h-screen tw-bg-[#F5F6FA] tw-flex tw-flex-col tw-items-center tw-justify-center;
  .login-content {
    @apply tw-flex tw-h-[437px] tw-w-[370px] tw-flex-col tw-relative;
  }
}
</style>
