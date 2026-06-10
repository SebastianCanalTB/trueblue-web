<script setup lang="ts">
const emit = defineEmits(['goBack', 'send-data-profile', 'submit'])
const props = defineProps({
  phone: {
    type: Object,
    required: true,
  },
  code: {
    type: Number,
    required: false,
  },
  wrong: Boolean,
  reqired: false,
  isVet: {
    type: Boolean,
    default: false,
  },
})
const runTimeConfig = useRuntimeConfig()
const router = useRouter()
const route = useRoute()
const localePath = useLocalePath()
const wrongCode = ref(false)
const otpInput = ref(null)
const store = useOnboardingStore()
const accountStore = useAccountStore()
const vetsStore = useVetsStore()
const code = ref('')
const resendedCode = ref(null)
const countdown = ref(30)
const isCountdownFinished = ref(false)
let intervalId = null

const startCountdown = () => {
  countdown.value = 30
  isCountdownFinished.value = false
  intervalId = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      isCountdownFinished.value = true
      clearInterval(intervalId)
    }
  }, 1000)
}

const onSubmit = async () => {
  useLoading(true)
  const encriCode = enc(code.value)
  if (
    route.path.includes('login') ||
    route.path.includes('payment') ||
    props.isVet
  ) {
    const formData = ref({
      phone: props.phone.phone,
      code: encriCode.password,
      iv: encriCode.iv,
      platform: 'user_web',
      type: 'lc',
      pushToken: '',
      version: '1.0.0',
      isVet: props.isVet,
    })

    const result = await store.login(formData.value)

    if (result.status && result.code === 100) {
      useShowAlert({
        type: 'success',
        message: result.message,
      })
      await accountStore.getProfile()
      route.path.includes('login')
        ? router.push(localePath({ name: 'profile-my-profile' }))
        : emit('submit')
      wrongCode.value = false
    } else {
      useShowAlert({
        type: 'error',
        message: result.message,
      })
      wrongCode.value = true
      code.value = ''
    }
  } else if (route.path.includes('profile') || route.path === '/create') {
    const formData = ref({
      code: encriCode.password,
      iv: encriCode.iv,
    })
    setTimeout(() => {
      code.value = ''
    }, 1000)
    emit('send-data-profile', formData.value)
  }
  useLoading(false)
}

const resendCode = async () => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  startCountdown()

  wrongCode.value = false

  useLoading(true)
  const formData = ref({
    indicative: '+57',
    phone: props.phone.phone,
    isVet: props.isVet,
  })
  if (
    route.path.includes('login') ||
    route.path.includes('payment') ||
    props.isVet
  ) {
    const result = await store.sendCode(formData.value)
    if (result.status && result.code === 100) {
      useShowAlert({
        type: 'success',
        message: result.message,
      })
      resendedCode.value = result.data.code
    } else {
      useShowAlert({
        type: 'error',
        message: result.message,
      })
    }
  } else if (route.path.includes('profile')) {
    const result = await accountStore.sendCodeProfileUpdate(formData.value)
    if (result.status && result.code === 100) {
      useShowAlert({
        type: 'success',
        message: result.message,
      })
      resendedCode.value = result.data.code
    } else {
      useShowAlert({
        type: 'error',
        message: result.message,
      })
    }
  } else if (route.path.includes('create')) {
    const result = await accountStore.validatePhoneNumber(formData.value)
    if (result.status && result.code === 100) {
      useShowAlert({
        type: 'success',
        message: result.message,
      })
      resendedCode.value = result.data.code
    }
  }
  useLoading(false)
}

const goBack = () => {
  emit('goBack')
}

onMounted(() => {
  nextTick(() => {
    startCountdown()
    if (otpInput.value && otpInput.value.$el) {
      const firstInput = otpInput.value.$el.querySelector('input')
      if (firstInput) {
        firstInput.focus()
      }
    }
  })
})
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

watch(code, (newValue, oldValue) => {
  if (newValue.length === 4 && newValue.length > oldValue.length) {
    onSubmit()
  }
})
watch(props.wrong, (newValue) => {
  if (newValue === true) {
    code.value = ''
  }
})
</script>

<template>
  <div
    class="second-step-login"
    :class="route.path === '/login' ? '' : 'tw-place-self-center'"
  >
    <div class="back" @click="goBack">
      <i class="pi pi-arrow-left"></i>
      <p>
        {{ $t('login.back') }}
      </p>
    </div>
    <div class="second-step-login-content">
      <h1 class="title primary1 tw-mb-3">
        {{ $t('login.verify') }}
      </h1>
      <p class="tw-mb-3">
        {{ $t('login.instruction') }}
      </p>
      <p class="phone-number">
        {{ props?.phone?.callingCode + ' ' + props?.phone?.phone }}
      </p>
      <span class="otp-input">
        <InputOtp v-model="code" ref="otpInput" :integerOnly="true" />
        <GeneralInputError
          :error="
            wrongCode === true
              ? 'Código incorrecto, por favor inténtalo nuevamente.'
              : ''
          "
        />
      </span>
      <p class="tw-mt-10">
        {{ $t('login.notRecieved') }}
        <template v-if="!isCountdownFinished">
          <strong class="!tw-text-[#003B71]">{{
            ' ' + $t('login.segs', { data: countdown })
          }}</strong>
        </template>
        <template v-else>
          <strong class="!tw-text-[#003B71] cursor-pointer" @click="resendCode">
            {{ $t('login.resend') }}
          </strong>
        </template>
      </p>
      <p v-if="runTimeConfig.public.dlocal_env.includes('sandbox')">
        {{ resendedCode ? resendedCode : props.code }}
      </p>
    </div>
  </div>
</template>
<style lang="scss">
.second-step-login {
  .back {
    @apply tw-text-primary tw-items-center tw-flex tw-gap-3 tw-cursor-pointer tw-mb-5;
    p {
      @apply tw-text-primary;
    }
  }
  .second-step-login-content {
    .phone-number {
      @apply tw-text-primary tw-text-[14px] tw-mb-10;
      font-family: 'heading-pro-treble-regular';
    }
  }
}
.otp-solo-login {
  @apply tw-mt-5;
  .p-inputotp-input {
    width: 54px;
    height: 62px;
    border: 1px solid #cacccf;
    border-radius: 10px;
  }
  .p-inputtext:enabled:focus {
    border-color: #3db5e6;
  }
}
</style>
