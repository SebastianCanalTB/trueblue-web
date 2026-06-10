<script setup lang="ts">
definePageMeta({
  layout: 'custom',
})

import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const paymentStore = usePaymentStore()
const router = useRouter()
const route = useRoute()
const localePath = useLocalePath()
const accountStore = useAccountStore()
const { t } = useI18n()
const { getListDocumentTypes: documents } = storeToRefs(accountStore)
const { getDataFromFailedOrder: data } = storeToRefs(paymentStore)
const onboardingStore = useOnboardingStore()
const { getLoginUser: userData } = storeToRefs(onboardingStore)
const user = ref(null)
const currentOrderId = ref('')
const dLocalRef = ref()
const currentToken = ref()
const isProcessing = ref(false)
const openModal = ref(false)
const openModalCancelled = ref(false)
const selectedPaymentMethod = ref('new')
const existingCards = computed(() => data.value?.user?.card || [])
const step = ref(0)
const code = ref(0)
const phoneInfo = ref()
const loginSuccess = ref(false)

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

const { handleSubmit, errors, resetForm } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      name: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      email: z
        .string({ message: t('rule.validation.require') })
        .email({ message: t('rule.validation.email') })
        .min(1, { message: t('rule.validation.require') }),
      callingCode: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      phone: z
        .string({ message: t('rule.validation.require') })
        .min(9, { message: t('rule.validation.length.min') })
        .max(10, { message: t('rule.validation.length.max') }),
      document: z
        .string({ message: t('rule.validation.require') })
        .min(6, { message: t('rule.validation.length.minCar', { number: 6 }) })
        .max(10, {
          message: t('rule.validation.length.maxCar', { number: 10 }),
        }),
    }),
  ),
})

// Form fields
const { value: name } = useField<string>('name')
const { value: email } = useField<string>('email')
const { value: phone } = useField<string>('phone')
const { value: document } = useField<string>('document')
const { value: callingCode } = useField<string>('callingCode', undefined, {
  initialValue: '+57',
})

const handleTokenGenerated = (token) => {
  currentToken.value = token
}

const getSelectedCardId = () => {
  if (selectedPaymentMethod.value === 'new') {
    return null
  }
  const selectedCard = existingCards.value.find(
    (card) => card.id.toString() === selectedPaymentMethod.value,
  )
  return selectedCard?.cardId || null
}

const getCardBrand = (brand) => {
  const brands = {
    VI: 'Visa',
    MC: 'Mastercard',
    AE: 'American Express',
    DC: 'Diners Club',
  }
  return brands[brand] || brand
}

const processDirectPayment = handleSubmit(async (values) => {
  isProcessing.value = true
  useLoading(true)

  let orderData = {
    id: useSearchItemJson('id', data.value.user),
    payment: {
      amount: data.value.total,
      order_id: currentOrderId.value,
      name: values.name,
      email: values.email,
      document: values.document,
      phone: values.phone,
    },
  }

  if (selectedPaymentMethod.value !== 'new') {
    const cardId = getSelectedCardId()
    if (cardId) {
      orderData.payment.card_id = cardId
    }
  } else {
    const result = await dLocalRef.value.submitPayment()
    orderData.payment.token = currentToken.value
  }
  if (!currentToken.value && selectedPaymentMethod.value === 'new') {
    useShowAlert({
      type: 'error',
      message: 'Por favor, complete los datos de la tarjeta.',
    })
    isProcessing.value = false
    useLoading(false)
    return
  }
  const response = await paymentStore.generatePayment(orderData)
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: 'Pago exitoso',
    })
    router.push(localePath({ name: 'index' }))
  } else {
    useShowAlert({
      type: 'error',
      message:
        'Lo sentimos, su pago no pudo ser procesado. Por favor verifique los datos de su tarjeta o intente con otro método de pago.',
    })
  }

  isProcessing.value = false
  useLoading(false)
})

const getData = async () => {
  if (!route.params.id) return

  const response = await paymentStore.getFailedOrderData(route.params.id)

  if (response.status && response.code === 100) {
    // if (response.data.statusOrder !== 'cancelled') {
    //   openModalCancelled.value = true
    //   return
    // }
    currentOrderId.value = response.data.id
  } else if (response?.error?.statusCode === 403) {
    openModal.value = true
  } else {
    router.push(localePath({ name: 'index' }))
    useShowAlert({
      type: 'error',
      message: 'Error al obtener la información',
    })
  }
}

const retryPayment = async () => {
  useLoading(true)
  loginSuccess.value = true
  await getData()
  await accountStore.getDocumentsRegister()

  if (existingCards.value.length > 0) {
    const defaultCard =
      existingCards.value.find((card) => card.predetermined) ||
      existingCards.value[0]
    selectedPaymentMethod.value = defaultCard.id.toString()
  }

  resetForm({
    values: {
      name: useSearchItemJson('firstName', data.value.user),
      email: useSearchItemJson('email', data.value.user),
      phone: useSearchItemJson('phone', data.value.user),
      document: useSearchItemJson('document', data.value.user),
    },
  })
  useLoading(false)
}

onMounted(() => {
  nextTick(() => {
    if (userData.value?.id) {
      loginSuccess.value = true
      retryPayment()
    }
  })
})
</script>

<template>
  <div class="checkout-page">
    <img
      src="/icons/LOGO-TRUE-BLUE-HEADER.svg"
      alt="true_blue_logo"
      width="129px"
      height="22px"
      class="tw-mb-10 tw-mx-auto"
    />
    <div class="container">
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
            @submit="retryPayment"
          />
        </div>
      </div>
      <div
        v-else-if="loginSuccess && !openModal && !openModalCancelled"
        class="checkout-grid"
      >
        <div class="order-summary">
          <h3>{{ $t('payment.resume.title') }}</h3>

          <div class="order-items">
            <div
              v-for="(item, i) in data.orderDetail"
              :key="i"
              class="order-item"
            >
              <div class="item-details">
                <h4>{{ item.pet }}</h4>
                <p class="item-description">{{ item.idealPortion }}</p>
                <div class="item-quantity">
                  <p v-for="(product, i) in item.detailProducts" :key="i">
                    {{ product.numberOfPackages }}
                    {{ product.name }}
                  </p>
                </div>
              </div>
              <div class="item-price">
                {{ useFormatPrice(item.price) }}
              </div>
            </div>
          </div>

          <div class="order-totals">
            <div class="total-line">
              <span>{{ $t('payment.resume.subtotal') }}:</span>
              <span>{{ useFormatPrice(data.subtotal) }}</span>
            </div>
            <div v-if="data.discount" class="total-line">
              <span>{{ $t('payment.resume.discount') }}:</span>
              <span>{{ useFormatPrice(data.discount) }}</span>
            </div>
            <div class="total-line">
              <span>{{ $t('payment.resume.taxes') }}:</span>
              <span>{{ useFormatPrice(data.iva) }}</span>
            </div>
            <div class="total-line">
              <span>{{ $t('payment.resume.shipping') }}:</span>
              <span>{{ useFormatPrice(data.shipping) }}</span>
            </div>

            <div class="total-line total-final">
              <span>{{ $t('payment.resume.total') }}:</span>
              <span>{{ useFormatPrice(data.total) }}</span>
            </div>
          </div>
        </div>

        <div class="payment-section">
          <h3>{{ $t('payment.information.title') }}</h3>

          <form @submit.prevent="processDirectPayment">
            <div class="customer-info" v-if="!user">
              <h4>{{ $t('payment.information.client') }}</h4>
              <div class="form-row">
                <div class="form-group-checkout">
                  <span
                    class="general-input solo-form normal-labels input-checkout"
                  >
                    <label for="name">{{
                      $t('payment.information.name')
                    }}</label>
                    <InputText
                      v-keyfilter="/^[a-zA-ZáéíóúÁÉÍÓÚüÜ\s]+$/"
                      v-model="name"
                      :placeholder="$t('payment.information.name')"
                      maxlength="50"
                      :disabled="
                        useSearchItemJson('firstName', data.user) ? true : false
                      "
                    />
                    <GeneralInputError :error="errors['name']" />
                  </span>
                </div>
                <div class="form-group-checkout">
                  <span
                    class="general-input solo-form normal-labels input-checkout"
                  >
                    <label for="email">{{
                      $t('forms.create.aboutMe.email')
                    }}</label>
                    <InputText
                      v-model="email"
                      type="email"
                      :disabled="
                        useSearchItemJson('email', data.user) ? true : false
                      "
                      :placeholder="
                        $t('forms.create.aboutMe.emailPlaceholder', { at: '@' })
                      "
                    />
                    <GeneralInputError :error="errors['email']" />
                  </span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group-checkout">
                  <span
                    class="general-input form-group normal-labels input-checkout tw-w-full"
                  >
                    <label for="phone">{{
                      t('payment.information.phone')
                    }}</label>
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
                                style="
                                  font-size: 15px;
                                  color: #3db5e6;
                                  font-weight: normal;
                                "
                              ></i>
                            </template>
                          </Select>
                        </InputGroupAddon>
                        <InputMask
                          v-model="phone"
                          class="tw-mt-3"
                          type="tel"
                          :placeholder="
                            $t('forms.create.aboutMe.phonePlaceholder')
                          "
                          mask="3999999999"
                          :disabled="
                            useSearchItemJson('phone', data.user) ? true : false
                          "
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

                <div class="form-group-checkout">
                  <span
                    class="general-input form-group normal-labels input-checkout"
                  >
                    <label for="document">{{
                      t('forms.create.aboutMe.id')
                    }}</label>
                    <div class="flex gap-3">
                      <InputGroup>
                        <InputText
                          v-model="document"
                          v-keyfilter="/^[0-9]+$/"
                          type="tel"
                          placeholder="00000000000000"
                          :disabled="
                            useSearchItemJson('document', data.user)
                              ? true
                              : false
                          "
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
                    <GeneralInputError :error="errors['document']" />
                  </span>
                </div>
              </div>
            </div>

            <div class="payment-form-section">
              <h4>{{ $t('payment.information.method') }}</h4>

              <!-- Tarjetas existentes -->
              <div v-if="existingCards.length > 0" class="tw-mb-6">
                <h5 class="tw-mb-4">Tarjetas guardadas</h5>
                <div class="tw-space-y-3">
                  <div
                    v-for="card in existingCards"
                    :key="card.id"
                    class="tw-flex tw-items-center tw-p-3 tw-border tw-rounded-lg tw-cursor-pointer tw-transition-colors"
                    :class="
                      selectedPaymentMethod === card.id.toString()
                        ? 'tw-border-blue-500 tw-bg-blue-50'
                        : 'tw-border-gray-300'
                    "
                    @click="selectedPaymentMethod = card.id.toString()"
                  >
                    <span class="app-general-button radio-btn payment">
                      <RadioButton
                        :name="`payment-method`"
                        :value="card.id.toString()"
                        v-model="selectedPaymentMethod"
                      />
                    </span>
                    <div class="tw-flex-1">
                      <div
                        class="tw-flex tw-items-center tw-justify-between tw-gap-2"
                      >
                        <div class="tw-flex tw-items-center tw-gap-2">
                          <span class="tw-font-medium">{{
                            getCardBrand(card.brand)
                          }}</span>
                          <span class="tw-text-gray-600"
                            >**** {{ card.lastFour }}</span
                          >
                        </div>
                        <span
                          v-if="card.predetermined"
                          class="tw-text-[#2B7EE2] tw-text-[12px] tw-mr-4 tw-font-treble-bold"
                        >
                          {{ $t('profile.myAdresses.default') }}
                        </span>
                      </div>
                      <div class="tw-text-sm tw-text-gray-600">
                        {{ card.cardName }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="tw-mb-4">
                <div
                  class="tw-flex tw-items-center tw-p-3 tw-border tw-rounded-lg tw-cursor-pointer tw-transition-colors"
                  :class="
                    selectedPaymentMethod === 'new'
                      ? 'tw-border-blue-500 tw-bg-blue-50'
                      : 'tw-border-gray-300'
                  "
                  @click="selectedPaymentMethod = 'new'"
                >
                  <span class="app-general-button radio-btn tw-mr-3">
                    <RadioButton
                      name="payment-method"
                      value="new"
                      v-model="selectedPaymentMethod"
                      style="right: auto; top: auto"
                    />
                  </span>
                  <div class="tw-flex-1">
                    <span class="tw-font-medium">Usar nueva tarjeta</span>
                  </div>
                </div>
              </div>

              <div v-show="selectedPaymentMethod === 'new'">
                <PaymentDLocalCardField
                  :ref="(el) => (dLocalRef = el)"
                  @payment-success="handleTokenGenerated"
                />
              </div>

              <div class="tw-w-full tw-flex tw-justify-center tw-mt-6">
                <Button
                  class="app-general-button btn-300px primary-1"
                  :label="
                    isProcessing
                      ? 'Procesando...'
                      : `Pagar ${useFormatPrice(data.total)}`
                  "
                  type="submit"
                  :disabled="isProcessing"
                  :loading="isProcessing"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    <GeneralDialog :show="openModal">
      <div class="tw-p-5">
        <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
          $t('payment.modal.title')
        }}</span>
        <div class="tw-mt-2">
          <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
            {{ $t('payment.modal.description') }}
          </p>

          <div class="tw-flex tw-mt-11 tw-w-full tw-flex-row-reverse">
            <Button
              class="app-general-button btn-solo-create"
              :label="$t('button.profile')"
              autofocus
              style="width: 100%"
              @click="
                router.push(
                  localePath({
                    name: 'profile',
                  }),
                )
              "
            />
          </div>
        </div>
      </div>
    </GeneralDialog>
    <GeneralDialog :show="openModalCancelled">
      <div class="tw-p-5">
        <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
          $t('payment.cancelledModal.title')
        }}</span>
        <div class="tw-mt-2">
          <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
            {{ $t('payment.cancelledModal.description') }}
          </p>

          <div class="tw-flex tw-mt-11 tw-w-full tw-flex-row-reverse">
            <Button
              class="app-general-button btn-solo-create"
              :label="$t('button.home')"
              autofocus
              style="width: 100%"
              @click="
                router.push(
                  localePath({
                    name: 'index',
                  }),
                )
              "
            />
          </div>
        </div>
      </div>
    </GeneralDialog>
  </div>
</template>
<style scoped lang="scss">
.checkout-page {
  min-height: 100vh;
  background: #f5f6fa;
  padding: 2rem 0;
  .container {
    margin-top: 50px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    .checkout-grid {
      @apply lg:tw-flex lg:tw-justify-center;
      gap: 2rem;
      align-items: start;
      @apply max-lg:tw-flex max-lg:tw-flex-col;

      .order-summary,
      .payment-section {
        @apply max-lg:tw-w-full;
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        h3 {
          margin: 0 0 1.5rem 0;
          color: #333;
          font-size: 1.5rem;
        }
      }
      .order-summary {
        @apply tw-min-w-[500px];
        .order-items {
          margin-bottom: 2rem;
          .order-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 0;
            border-bottom: 1px solid #eee;
            &:last-child {
              border-bottom: none;
            }
            .item-image {
              width: 60px;
              height: 60px;
              object-fit: cover;
              border-radius: 8px;
            }
            .item-details {
              flex: 1;
              h4 {
                margin: 0 0 0.5rem 0;
                font-size: 1rem;
                color: #333;
              }

              .item-description {
                color: #666;
                font-size: 0.875rem;
                margin: 0 0 0.5rem 0;
              }
              .item-quantity {
                font-size: 0.875rem;
                color: #888;
              }
            }
            .item-price {
              font-weight: 600;
              color: #007bff;
            }
          }
        }
        .order-totals {
          border-top: 1px solid #eee;
          padding-top: 1rem;
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            &.total-final {
              font-weight: 700;
              font-size: 1.125rem;
              color: #333;
              border-top: 1px solid #eee;
              padding-top: 0.5rem;
              margin-top: 0.5rem;
            }
          }
        }
      }
      .payment-section {
        margin-bottom: 2rem;
        .payment-form-section {
          margin-bottom: 2rem;
        }
        .customer-info {
          @apply tw-flex tw-flex-col;
          .form-row {
            @apply lg:tw-flex lg:tw-gap-3;
            .form-group-checkout {
              @apply lg:tw-w-1/2 max-lg:tw-w-full;
            }
          }
        }
      }
    }
  }
}
.login-page {
  @apply tw-py-10 tw-h-screen tw-bg-[#F5F6FA] tw-flex tw-flex-col tw-items-center tw-justify-center;
  .login-content {
    @apply tw-flex tw-h-[437px] tw-w-[370px] tw-flex-col tw-relative;
  }
}
.customer-info h4,
.payment-form-section h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.125rem;
}
</style>
