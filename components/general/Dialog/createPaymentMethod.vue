<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:show', 'addressCreated', 'backToList'])

const cardStore = useCardStore()

const showAddressCreateDialog = ref(props.show)
const dLocalRef = ref()

watch(
  () => props.show,
  (newValue) => {
    showAddressCreateDialog.value = newValue
    setErrors({})
  },
)

watch(showAddressCreateDialog, (newValue) => {
  emit('update:show', newValue)
})

const { t } = useI18n()
const addressStore = useAddressStore()

const { handleSubmit, errors, meta, setErrors } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      cardHolder: z
        .string()
        .min(5, { message: t('rule.validation.length.card') }),
      cardNumber: z.string().min(19, { message: t('rule.validation.require') }),
      cardExpirationDate: z
        .string()
        .min(5, { message: t('rule.validation.require') })
        .refine((val) => /^[0-9/]+$/.test(val), {
          message: t('rule.validation.require'),
        })
        .refine(
          (val) => {
            if (!val || val.length < 5) return false

            if (val.length !== 5 || val[2] !== '/') return false

            const [month, year] = val.split('/')
            const monthNum = parseInt(month, 10)
            const yearNum = parseInt(year, 10)

            if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return false

            const currentDate = new Date()
            const currentYear = currentDate.getFullYear() % 100
            const currentMonth = currentDate.getMonth() + 1

            if (
              yearNum < currentYear ||
              (yearNum === currentYear && monthNum < currentMonth)
            )
              return false

            return true
          },
          {
            message: t('rule.validation.expiryDate'),
          },
        ),
      check: z.boolean().optional(),
      cardCVC: z.string().min(3, { message: t('rule.validation.require') }),
    }),
  ),
})

/* Variables*/
const { value: cardHolder } = useField<string | null>('cardHolder')

const handleAddressCreation = async () => {
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

    sendData.value = { predetermined: false, token: token }
    const response = await cardStore.createCard(sendData.value)
    if (response.status && response.code == 100) {
      useShowAlert({
        type: 'success',
        message: response.message,
      })
      emit('addressCreated')
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
}
const tokenToSend = ref()
const tokenResolve = ref(null)
const getToken = (token: any) => {
  tokenToSend.value = token

  if (tokenResolve.value) {
    tokenResolve.value(token)
    tokenResolve.value = null 
  }
}
const goBackToAddressList = () => {
  showAddressCreateDialog.value = false
  emit('backToList')
}
onMounted(() => {
  nextTick(async () => {})
})
</script>

<template>
  <div>
    <GeneralDialog
      :show="showAddressCreateDialog"
      @close="showAddressCreateDialog = false"
    >
      <div class="tw-p-5 tw-relative">
        <span
          class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold tw-flex tw-gap-2 tw-items-center tw-mb-5"
        >
          <i
            class="pi pi-arrow-left"
            style="cursor: pointer"
            @click="goBackToAddressList"
          ></i
          >{{ $t('profile.myPlan.edit.cards.paymentDialog.new') }}</span
        >
        <PaymentDLocalCardField
          :ref="(el) => (dLocalRef = el)"
          @payment-success="getToken"
        />
        <div class="tw-mt-2">
          <div class="tw-flex tw-mt-11 tw-w-full tw-justify-end">
            <Button
              class="app-general-button app-btn-transparent"
              :label="$t('button.cancel')"
              @click="showAddressCreateDialog = false"
            />
            <Button
              class="app-general-button btn-solo-create !tw-w-[175px]"
              :label="$t('profile.myPlan.edit.cards.addressDialog.confirm')"
              @click="handleAddressCreation()"
            />
          </div>
        </div>
      </div>
    </GeneralDialog>
  </div>
</template>
