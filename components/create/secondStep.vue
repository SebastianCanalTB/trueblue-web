<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const accountStore = useAccountStore()
const allProductsStore = useAllProductsStore()
const localePath = useLocalePath()
const router = useRouter()
const invalidPhone = ref(false)
const { getAllFormsData: allForms } = storeToRefs(allProductsStore)

const { getListDocumentTypes: documents } = storeToRefs(accountStore)

const emit = defineEmits(['finish-form', 'prevStep', 'update:modelValue'])

const showOtpDialog = ref(false)
const code = ref(0)
const wrongCode = ref(false)
const { t } = useI18n()
const validPhone = ref(true)
const validCodeOtp = ref(false)
const newPhoneOtp = ref({})

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      callingCode: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      phone: z
        .string({ message: t('rule.validation.require') })
        .min(10, { message: t('rule.validation.length.min') })
        .max(10, { message: t('rule.validation.length.max') }),
    }),
  ),
})

// define variable
const { value: phone } = useField<string | null>('phone', undefined, {
  initialValue: '3',
})
const { value: callingCode } = useField<string | null>(
  'callingCode',
  undefined,
  {
    initialValue: '+57',
  },
)

const formSendData = ref({})
const finishForm = () => {
  emit('finish-form', formSendData.value)
}

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

const onSubmit = handleSubmit((values: any) => {
  if (validPhone.value === false) {
    return
  } else {
    formSendData.value = values
    finishForm()
    return values
  }
})
// const sendDataWithCode = async (values) => {
//   useLoading(true)
//   const userDataCode = {
//     phone: phone.value,
//     code: values.code,
//     iv: values.iv,
//   }

//   const result = await accountStore.sendVerificationCode(userDataCode)
//   if (result.status && result.code === 100) {
//     useShowAlert({
//       type: 'success',
//       message: result.message,
//     })
//     validCodeOtp.value = true
//     showOtpDialog.value = false
//     getItems()
//   } else {
//     useShowAlert({
//       type: 'error',
//       message: result.message,
//     })
//   }
// }
defineExpose({
  onSubmit,
})
const checkAndEmitValidity = () => {
  if (validPhone.value === true && meta.value.valid) {
    emit('update:modelValue', true)
  } else {
    emit('update:modelValue', false)
  }
}

watch(
  () => meta.value.valid,
  () => checkAndEmitValidity(),
)
onMounted(() => {
  nextTick(() => {
    validPhone.value = false
    if (allForms.value && allForms.value.length > 0) {
      resetForm({
        callingCode: allForms.value[0].callingCode || '+57',
        phone: allForms.value[0].phone || '',
      })
    }
  })
})
watch(
  () => validPhone.value,
  () => checkAndEmitValidity(),
)

watch(phone, (newPhone) => {
  if (newPhone && newPhone.length === 10) {
    validPhone.value = false

    const sendData = ref({
      indicative: callingCode.value,
      phone: newPhone,
      utm_source: localStorage.getItem('tb_utm_source') || '',
      utm_medium: localStorage.getItem('tb_utm_medium') || '',
      utm_campaign: localStorage.getItem('tb_utm_campaign') || '',
      utm_content: localStorage.getItem('tb_utm_content') || '',
      utm_term: localStorage.getItem('tb_utm_term') || '',
      gclid: localStorage.getItem('tb_gclid') || '',
      fbclid: localStorage.getItem('tb_fbclid') || '',
      anonymous_id: localStorage.getItem('tb_anonymous_id') || '',
    })
    accountStore.validatePhoneNumber(sendData.value).then((response) => {
      if (response.status && response.code === 100) {
        useShowAlert({
          type: 'success',
          message: response.message,
        })
        validPhone.value = true
      } else if (
        response?.error?.data?.status === false &&
        response?.error?.data?.code === 101
      ) {
        useShowAlert({
          type: 'error',
          message: response?.error.data.message,
        })
        invalidPhone.value = true
        validPhone.value = false
      } else {
        useShowAlert({
          type: 'error',
          message: 'Ocurrio un error, intente de nuevo',
        })
      }
    })
  } else {
    validPhone.value = false
  }
})
</script>

<template>
  <div class="create-container">
    <h1 class="title-create">
      {{ $t('create.main.content.2.title') }}
    </h1>
    <div class="tw-flex tw-justify-center tw-w-full tw-max-w-350 tw-mt-10">
      <span class="general-input form-group tw-w-full">
        <label for="age">{{ t('forms.create.aboutMe.phone') }}</label>
        <div class="flex gap-3">
          <InputGroup>
            <InputGroupAddon>
              <Select
                v-model="callingCode"
                option-value="value"
                option-label="key"
                :placeholder="'+57'"
                :disabled="true"
                :pt="{
                  overlay: 'tw-w-[40px]',
                  dropdown: '!tw-hidden',
                }"
              >
                <template #dropdownicon>
                  <i
                    class="pi pi-angle-down"
                    style="font-size: 15px; color: #3db5e6; font-weight: normal"
                  ></i>
                </template>
                <template #option="slotProps">
                  <div class="general">
                    {{ slotProps.option.key }}
                  </div>
                </template>
              </Select>
            </InputGroupAddon>
            <InputMask
              v-model="phone"
              class="tw-mt-3"
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
            />
          </InputGroup>
        </div>
        <GeneralInputError :error="errors['phone']" />
      </span>
    </div>
    <!-- <GeneralDialog :show="showOtpDialog">
      <LoginSecondStep
        v-if="showOtpDialog"
        class="tw-p-5 tw-my-5"
        @goBack="showOtpDialog = false"
        @send-data-profile="sendDataWithCode"
        :code="code"
        :wrong="wrongCode"
        :phone="newPhoneOtp"
      />
    </GeneralDialog> -->
    <GeneralDialog :show="invalidPhone">
      <div class="tw-p-5">
        <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
          $t('create.main.content.2.existingUserDialog.title')
        }}</span>
        <div class="tw-mt-2">
          <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
            {{ $t('create.main.content.2.existingUserDialog.description') }}
          </p>
          <div class="tw-flex tw-mt-11 tw-w-full tw-gap-3 tw-justify-center">
            <Button
              class="app-general-button app-btn-disabled"
              :label="$t('button.close')"
              autofocus
              @click="(invalidPhone = false), resetForm()"
            />
            <Button
              class="app-general-button btn-solo-create"
              :label="$t('button.login')"
              autofocus
              @click="router.push(localePath({ name: 'login' }))"
            />
          </div>
        </div>
      </div>
    </GeneralDialog>
  </div>
</template>
