<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

/** emits */
const emit = defineEmits(['update:modelValue', 'submit'])

/** props */
const props = defineProps({
  modelValue: {
    type: Boolean,
  },
})

/** variables */
const { t } = useI18n()
const open = ref(false)
const vetsStore = useVetsStore()
const isLoginMode = ref(false)
const step = ref(0)
const phoneInfo = ref()
const loginCode = ref(0)

const nextStep = (value: any) => {
  phoneInfo.value = value
  step.value++
}

const codeGet = (values: any) => {
  loginCode.value = values
}

const prevStep = () => {
  step.value--
}

/** form validation */
const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      name: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      surname: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      email: z
        .string({ message: t('rule.validation.require') })
        .email({ message: t('rule.validation.email') })
        .min(1, { message: t('rule.validation.require') }),
      callingCode: z.string().optional().nullable(),
      phone: z
        .string({ message: t('rule.validation.require') })
        .min(9, { message: t('rule.validation.length.min') })
        .max(10, { message: t('rule.validation.length.max') }),
      workplace: z.string().optional().nullable(),
      termsAccepted: z.boolean().refine((val) => val === true, {
        message: t('rule.validation.require'),
      }),
      privacyAccepted: z.boolean().refine((val) => val === true, {
        message: t('rule.validation.require'),
      }),
    }),
  ),
})

const { value: name } = useField<string | null>('name')
const { value: surname } = useField<string | null>('surname')
const { value: email } = useField<string | null>('email')
const { value: phone } = useField<string | null>('phone')
const { value: callingCode, setValue: setCallingCode } = useField<string>(
  'callingCode',
  undefined,
  {
    initialValue: '+57',
  },
)
const { value: workplace } = useField<string | null>('workplace')
const { value: termsAccepted } = useField<boolean>('termsAccepted')
const { value: privacyAccepted } = useField<boolean>('privacyAccepted')

/** methods */
const onSubmit = handleSubmit(async (values: any) => {
  useLoading(true)

  const response = await vetsStore.registryVet({
    firstName: values.name,
    lastName: values.surname,
    email: values.email,
    countryCode: callingCode.value,
    phone: values.phone,
    worksite: values.workplace || '',
    termsAndConditions: values.termsAccepted,
  })

  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })

    setLoginUser(response.data)
    emit('submit', values)
    resetForm()
    open.value = false
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
})
const handleLoginSuccess = () => {
  open.value = false
  emit('submit')
}
const handleCancel = () => {
  resetForm()
  open.value = false
  isLoginMode.value = false
  step.value = 0
}
const dowloadTerms = () => {
  const url = '/docs/Términos_y_Condiciones_Generales_de_TRUEBLUE.pdf'
  window.open(url, '_blank')
}
/** watchers */
watch(
  () => open.value,
  (newVal: any) => {
    emit('update:modelValue', newVal)
  },
)

watch(
  () => props.modelValue,
  (newVal: any) => {
    open.value = newVal
  },
)
</script>

<template>
  <Drawer
    v-model:visible="open"
    :dismissable="true"
    class="general-drawer vets-form-drawer"
    position="right"
    :pt="{
      root: 'lg:!tw-w-[511px] max-lg:!tw-w-full',
      content: 'tw-p-0',
    }"
  >
    <template #header>
      <div v-if="!isLoginMode" class="header-menu tw-w-full">
        <h2 class="drawer-title">{{ $t('vets.form.title') }}</h2>
        <p class="drawer-subtitle">{{ $t('vets.form.subtitle') }}</p>
      </div>
    </template>
    <template #closeicon>
      <i class="pi pi-times" @click="handleCancel"></i>
    </template>

    <div class="form-container">
      <div v-if="isLoginMode" class="login-wrapper">
        <LoginFirstStep
          v-if="step === 0"
          :is-vet="true"
          @onSubmit="nextStep"
          @code="codeGet"
        />
        <LoginSecondStep
          v-if="step === 1"
          :is-vet="true"
          @goBack="prevStep"
          :code="loginCode"
          :phone="phoneInfo"
          @submit="handleLoginSuccess"
        />
        <div v-if="step === 0" class="tw-mt-4 tw-text-center">
          <Button
            type="button"
            class="app-general-button app-btn-transparent label-primary"
            @click="isLoginMode = false"
            label="Volver al registro"
          />
        </div>
      </div>
      <form v-else @submit.prevent="onSubmit">
        <div class="form-row">
          <span
            class="general-input solo-form normal-labels input-checkout lg:tw-w-1/2"
          >
            <label for="name">{{ $t('vets.form.name') }}</label>
            <InputText
              v-model="name"
              :placeholder="$t('vets.form.namePlaceholder')"
              v-keyfilter="/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/"
            />
            <GeneralInputError :error="errors['name']" />
          </span>

          <span
            class="general-input solo-form normal-labels input-checkout lg:tw-w-1/2"
          >
            <label for="surname">{{ $t('vets.form.surname') }}</label>
            <InputText
              v-model="surname"
              :placeholder="$t('vets.form.surnamePlaceholder')"
              v-keyfilter="/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/"
            />
            <GeneralInputError :error="errors['surname']" />
          </span>
        </div>

        <div class="form-row">
          <span
            class="general-input solo-form normal-labels input-checkout tw-w-full"
          >
            <label for="email">{{ $t('vets.form.email') }}</label>
            <InputText
              v-model="email"
              type="email"
              :placeholder="$t('vets.form.emailPlaceholder')"
            />
            <GeneralInputError :error="errors['email']" />
          </span>
        </div>

        <div class="form-row">
          <span class="general-input form-group normal-labels tw-w-full">
            <label for="phone">{{ $t('vets.form.phone') }}</label>
            <InputGroup style="border: 1px solid #dee2e5">
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
                      style="
                        font-size: 15px;
                        color: #3db5e6;
                        font-weight: normal;
                      "
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
                mask="3999999999"
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
            <GeneralInputError :error="errors['phone']" />
          </span>
        </div>

        <div class="form-row">
          <span
            class="general-input solo-form normal-labels input-checkout tw-w-full"
          >
            <label for="workplace"
              >{{ $t('vets.form.workplace') }}
              <span class="optional-text">{{
                $t('vets.form.workplaceOptional')
              }}</span></label
            >
            <InputText
              v-keyfilter="/^[0-9a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/"
              v-model="workplace"
              :placeholder="$t('vets.form.workplacePlaceholder')"
              maxlength="100"
            />
            <GeneralInputError :error="errors['workplace']" />
          </span>
        </div>

        <div class="form-row checkbox-row">
          <span class="checkbox-container">
            <Checkbox
              v-model="termsAccepted"
              :binary="true"
              input-id="terms"
              class="custom-checkbox"
            />
            <label for="terms" class="checkbox-label">
              <i18n-t keypath="vets.form.termsCheckbox" tag="span">
                <template #link>
                  <span @click="dowloadTerms" class="terms-link">{{
                    $t('vets.form.termsLink')
                  }}</span>
                </template>
              </i18n-t>
            </label>
          </span>
          <GeneralInputError
            :error="
              errors['termsAccepted'] === 'Required'
                ? $t('rule.validation.require')
                : ''
            "
          />
        </div>

        <div class="form-row checkbox-row">
          <span class="checkbox-container">
            <Checkbox
              v-model="privacyAccepted"
              :binary="true"
              input-id="privacy"
              class="custom-checkbox"
            />
            <label for="privacy" class="checkbox-label">
              {{ $t('vets.form.privacyCheckbox') }}
            </label>
          </span>
          <GeneralInputError
            :error="
              errors['privacyAccepted'] === 'Required'
                ? $t('rule.validation.require')
                : ''
            "
          />
        </div>

        <div class="form-actions">
          <Button
            type="button"
            class="app-general-button app-btn-transparent"
            @click="handleCancel"
            :label="$t('button.cancel')"
          />
          <Button
            type="submit"
            class="app-general-button btn-solo-create"
            :label="$t('vets.form.submitButton')"
          />
        </div>

        <div class="tw-mt-8 tw-text-center">
          <p class="tw-text-gray-600 tw-mb-2">
            {{ $t('vets.form.haveAccount') }}
          </p>
          <Button
            type="button"
            class="app-general-button app-btn-transparent label-primary"
            @click="isLoginMode = true"
            :label="$t('vets.form.loginLink')"
          />
        </div>
      </form>
    </div>
  </Drawer>
</template>

<style lang="scss" scoped></style>
