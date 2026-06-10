<script setup lang="ts">
const step = ref(0)
const phoneInfo = ref()
const code = ref(0)
const onboardingStore = useOnboardingStore()
const { getLoginUser: user } = storeToRefs(onboardingStore)
const router = useRouter()
const localePath = useLocalePath()
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
onMounted(() => {
  nextTick(() => {
    if (user?.value?.id) {
      router.push(localePath({ name: 'profile' }))
    }
  })
})
</script>

<template>
  <div class="login-page">
    <div class="login-content">
      <LoginFirstStep v-if="step === 0" @onSubmit="nextStep" @code="codeGet" />
      <LoginSecondStep
        v-if="step === 1"
        @goBack="prevStep"
        :code="code"
        :phone="phoneInfo"
      />
    </div>
  </div>
</template>
<style lang="scss">
.login-page {
  @apply tw-py-10 tw-h-screen tw-bg-[#F5F6FA] tw-flex tw-flex-col tw-items-center tw-justify-center;
  .login-content {
    @apply tw-flex tw-h-[437px] tw-w-[370px] tw-flex-col tw-relative;
  }
}
</style>
