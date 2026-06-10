<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const emit = defineEmits(['onSubmit', 'code'])

const props = defineProps({
  isVet: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const errMessage = ref('')
const store = useOnboardingStore()

const { handleSubmit, errors, meta, values } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      callingCode: z.string().min(1, { message: t('rule.validation.require') }),
      phone: z
        .string()
        .min(10, { message: t('rule.validation.length.min') })
        .max(10, { message: t('rule.validation.length.max') }),
    }),
  ),
})

const { value: phone } = useField<string | null>('phone')
const { value: callingCode } = useField<string | null>(
  'callingCode',
  undefined,
  {
    initialValue: '+57',
  },
)
const codes = ref([
  {
    name: '+57',
    value: '+57',
  },
  {
    name: '+1',
    value: '+1',
  },
  {
    name: '+101',
    value: '+101',
  },
])

const onSubmit = handleSubmit(async (values) => {
  useLoading(true)
  const formData = ref({
    indicative: callingCode.value,
    phone: phone.value,
    isVet: props.isVet,
  })
  const result = await store.sendCode(formData.value)

  if (result.status && result.code === 100) {
    useShowAlert({
      type: 'success',
      message: result.message,
    })
    emit('code', result.data.code)
    emit('onSubmit', values)
  } else {
    errMessage.value = result.message
  }

  useLoading(false)
})
watch(phone, (newValue) => {
  errMessage.value = ''
})
</script>

<template>
  <div class="tw-text-center">
    <h1 class="title primary1">
      {{ $t('login.title') }}
    </h1>
    <p>
      {{ $t('login.subtitle') }}
    </p>
  </div>
  <div class="login-section">
    <span class="general-dropdown solo-create not-borders tw-mt-5 !tw-h-[65px]">
      <Select
        v-model="callingCode"
        class="tw-h-[43px] lg:tw-w-[60px]"
        :options="codes"
        filter
        :disabled="true"
        option-value="value"
        option-label="name"
        :pt="{
          overlay: 'tw-w-[40px]',
          dropdown: '!tw-hidden',
        }"
      />
      <GeneralInputError :error="errors['callingCode']" />
    </span>
    <span
      class="general-input solo-form not-borders tw-w-full !tw-pt-[20px] !tw-h-[65px]"
    >
      <InputMask
        v-model="phone"
        type="tel"
        :placeholder="$t('forms.create.aboutMe.phonePlaceholder')"
        mask="9999999999"
        slot-char=""
        :auto-clear="false"
        :pt="{
          pcInputText: {
            root: {
              inputmode: 'numeric',
            },
          },
        }"
        @keydown.enter="onSubmit"
      />
    </span>
  </div>
  <div class="tw-h-[35px]">
    <GeneralInputError
      :error="
        errors['phone'] === 'Required'
          ? $t('rule.validation.require')
          : errors['phone']
      "
    />
    <GeneralInputError
      v-if="errMessage && !errors['phone']"
      :error="errMessage"
    />
  </div>
  <div class="tw-mt-10">
    <Button
      class="app-general-button btn-solo-create !tw-w-full"
      @click="onSubmit"
    >
      {{ $t('login.logginButton') }}
    </Button>
  </div>
  <div
    v-if="
      !route.path.includes('payment') &&
      !route.path.includes('vets') &&
      !props.isVet
    "
    class="new-user-section"
  >
    <p class="tw-mb-4">
      {{ $t('login.new') }}
    </p>
    <Button
      @click="router.push(localePath({ name: 'registry' }))"
      class="app-general-button btn-solo-login !tw-w-[170px]"
    >
      {{ $t('home.create') }}
    </Button>
  </div>
</template>

<style lang="scss">
.login-section {
  @apply tw-flex tw-h-[65px];
}

.new-user-section {
  @apply tw-absolute tw-flex tw-flex-col tw-items-center tw-mt-5 tw-pt-[60px] tw-bottom-0 tw-w-full;
  border-top: 1px solid #8ba0c9;
}
</style>
