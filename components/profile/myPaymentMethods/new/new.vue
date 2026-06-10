<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
const emit = defineEmits(['close-edit'])

const cardStore = useCardStore()

const { t } = useI18n()
const dLocalRef = ref()
const { handleSubmit, errors, meta } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      check: z.boolean().optional(),
    }),
  ),
})

const { value: cardHolder } = useField<string | null>('cardHolder')
const { value: cardNumber } = useField<string | null>('cardNumber')
const { value: cardExpirationDate } = useField<string | null>(
  'cardExpirationDate',
)
const { value: cardCVC } = useField<string | null>('cardCVC')
const { value: check } = useField('check', undefined, { initialValue: false })
const disabledEditMode = () => {
  emit('close-edit', false)
}

const onSubmit = handleSubmit(async (values: any) => {
  useLoading(true)
  const sendData = ref({})

  try {
    const token = await new Promise((resolve, reject) => {
      tokenResolve.value = resolve

      dLocalRef.value.submitPayment()

      setTimeout(() => {
        useLoading(false)
        reject(new Error('Timeout obteniendo token'))
      }, 5000)
    })

    sendData.value = { predetermined: values.check, token: token }
    const response = await cardStore.createCard(sendData.value)
    if (response.status && response.code == 100) {
      useShowAlert({
        type: 'success',
        message: response.message,
      })
      disabledEditMode()
    } else {
      useShowAlert({
        type: 'error',
        message: response.message,
      })
    }
  } catch (error) {
    console.error('Error obteniendo token:', error)
    useLoading(false)
  }

  useLoading(false)

  return
  const paymentInfo = {
    cardName: values.cardHolder,
    cardNumber: values.cardNumber,
    expiration: values.cardExpirationDate,
    cvc: values.cardCVC,
    description: 'comida para perros',
  }
  const paymentEnc = enc(JSON.stringify(paymentInfo))

  const response = await cardStore.createCard(sendData.value)
  if (response.status && response.code == 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    disabledEditMode()
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
})
const tokenToSend = ref()
const tokenResolve = ref(null)

const getToken = (token: any) => {
  tokenToSend.value = token

  // Resolver la Promise si existe
  if (tokenResolve.value) {
    tokenResolve.value(token)
    tokenResolve.value = null // Limpiar la referencia
  }
}
watch(cardHolder, (newValue) => {
  cardHolder.value = newValue.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
})
const handlePopState = () => {
  emit('close-edit')

  window.history.pushState(null, '', window.location.href)
}

onMounted(() => {
  window.history.pushState(null, '', window.location.href)

  window.addEventListener('popstate', handlePopState)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState)
})
</script>

<template>
  <div
    class="lg:tw-mt-10 max-lg:tw-mt-10 tw-w-full tw-flex tw-flex-col tw-items-center"
  >
    <form class="lg:tw-min-w-[500px] max-lg:tw-w-full" @submit.prevent>
      <h3 class="title primary1 !tw-text-[32px] tw-mb-10 tw-ml-[0.5rem]">
        {{ $t('profile.myPaymentMethods.button') }}
      </h3>

      <div class="lg:tw-flex lg:col-12 lg:tw-max-w-[1000px] max-lg:tw-w-full">
        <div class="lg:tw-w-full">
          <!-- <span class="general-input solo-form tw-col-span-2">
            <label for="username">{{ $t('forms.create.aboutMe.card') }}</label>
            <InputText
              v-model="cardHolder"
              maxlength="50"
              placeholder="ej. Juan Pérez"
              @keydown="preventInvalidInput"
              @input="preventInvalidInput"
              @paste="handlePaste"
            />
            <GeneralError
              :error="
                errors['cardHolder'] === 'Required'
                  ? $t('rule.validation.require')
                  : errors['cardHolder']
              "
            />
          </span>
          <span class="general-input solo-form col-12 !tw-pl-0">
            <label for="username">{{
              $t('forms.create.checkout.cardNumber')
            }}</label>
            <InputMask
              v-model="cardNumber"
              type="tel"
              placeholder="0000 0000 0000 0000"
              mask="9999 9999 9999 9999"
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
            <GeneralError
              :error="
                errors['cardNumber'] === 'Required'
                  ? $t('rule.validation.require')
                  : errors['cardNumber']
              "
            />
          </span>

          <div class="tw-flex">
            <span class="general-input solo-form col-6 !tw-pl-0">
              <label for="username">{{
                $t('forms.create.checkout.expiration')
              }}</label>
              <InputMask
                v-model="cardExpirationDate"
                type="tel"
                placeholder="MM/YY"
                slotChar="MM/YY"
                mask="99/99"
                :auto-clear="false"
                :pt="{
                  pcInputText: {
                    root: {
                      inputmode: 'numeric',
                    },
                  },
                }"
              />
              <GeneralError
                :error="
                  errors['cardExpirationDate'] === 'Required'
                    ? $t('rule.validation.require')
                    : errors['cardExpirationDate']
                "
              />
            </span>
            <span class="general-input solo-form col-6 !tw-pr-0">
              <label for="username">{{
                $t('forms.create.checkout.cvc')
              }}</label>
              <InputMask
                v-model="cardCVC"
                type="tel"
                :placeholder="$t('forms.create.checkout.cvc')"
                mask="999"
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
              <GeneralError
                :error="
                  errors['cardCVC'] === 'Required'
                    ? $t('rule.validation.require')
                    : errors['cardCVC']
                "
              />
            </span>
          </div> -->

          <PaymentDLocalCardField
            :ref="(el) => (dLocalRef = el)"
            @payment-success="getToken"
          />

          <span class="tw-mt-5 tw-flex tw-items-center tw-gap-3">
            <Checkbox v-model="check" binary inputId="mark" />
            <label for="ingredient1" class="tw-text-[#575E6B] tw-text-[12px]">
              {{ $t('profile.myAddresses.mark') }}
            </label>
          </span>
        </div>
      </div>
      <div class="tw-float-end max-lg:tw-mt-10">
        <Button
          type="button"
          class="app-general-button app-btn-transparent"
          :label="$t('button.cancel')"
          @click="disabledEditMode"
        />

        <Button
          @click="onSubmit()"
          class="app-general-button btn-solo-create !tw-w-[144px]"
        >
          {{ $t('profile.myAddresses.update') }}
        </Button>
      </div>
    </form>
  </div>
</template>
<style lang="scss">
.p-checkbox-checked .p-checkbox-box {
  border-color: #3db5e6 !important;
  background: #3db5e6 !important;
}
</style>
