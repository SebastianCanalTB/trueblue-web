<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
const emit = defineEmits(['payment-success'])
const cardContainer = ref<HTMLElement | null>(null)
const dlocalInstance = ref<any>(null)
const cardField = ref<any>(null)
const runtimeConfig = useRuntimeConfig()
const actualBrand = ref<string | null>(null)
const cardHolderName = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const cardHolderNameError = ref('')
const widthScreen = ref(window.innerWidth)
const isFocused = ref(false)
const hasError = ref(false)
const isComplete = ref(false)
const cardNumberLength = ref(0)
const config = useRuntimeConfig()
function validateCardHolderName(name: string): string {
  if (!name.trim()) {
    return 'El nombre del titular es requerido'
  }
  if (name.trim().length < 5) {
    return 'El nombre debe tener al menos 5 caracteres'
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())) {
    return 'El nombre solo puede contener letras y espacios'
  }
  if (name.trim().split(' ').length < 2) {
    return 'Ingrese nombre y apellido'
  }
  return ''
}

watch(cardHolderName, (newName) => {
  if (newName) {
    cardHolderNameError.value = validateCardHolderName(newName)
  } else {
    cardHolderNameError.value = ''
  }
})

onMounted(async () => {
  await nextTick(() => {
    if (!window.dlocal) {
      const script = document.createElement('script')
      script.src = config.public.dlocal_env
      script.async = true
      script.onload = initializeDLocal
      document.head.appendChild(script)
    } else {
      initializeDLocal()
    }
  })
})

const initializeDLocal = () => {
  if (!window.dlocal || !cardContainer.value) return

  dlocalInstance.value = window.dlocal(runtimeConfig.public.public_key)

  const fields = dlocalInstance.value.fields({
    country: 'CO',
    locale: 'es',
    fonts: [{ cssSrc: 'https://rsms.me/inter/inter-ui.css' }],
  })

  cardField.value = fields.create('card', {
    style: {
      base: {
        fontSize: widthScreen.value < 330 ? '13px' : '16px',
        fontFamily: "'Inter UI medium', sans-serif",
        lineHeight: '22px',
        fontSmoothing: 'antialiased',
        fontWeight: '400',
        color: '#32325d',
        '::placeholder': {
          color: '#aab7c4',
        },
        iconColor: '#adbfd3',
      },
      invalid: {
        color: '#e74c3c',
        iconColor: '#e74c3c',
      },
    },
  })

  cardField.value.mount(cardContainer.value)
  cardField.value.addEventListener('change', function (event) {
    if (event.error) {
      errorMessage.value = event.error.message
      hasError.value = true
    } else {
      errorMessage.value = ''
      hasError.value = false
    }

    isComplete.value = event.complete || false

    if (event.card && event.card.number) {
      cardNumberLength.value = event.card.number.replace(/\s/g, '').length
    }
  })
  cardField.value.addEventListener('focus', function () {
    isFocused.value = true
  })

  cardField.value.addEventListener('blur', function () {
    isFocused.value = false
  })

  cardField.value.on('brand', function (event) {
    if (event.brand) {
      actualBrand.value = event.brand

      // if (needInstallments.value) {
      //   dlocalInstance.value
      //     .createInstallmentsPlan(
      //       cardField.value,
      //       props.totalAmount,
      //       currency.value,
      //     )
      //     .then((result) => {
      //       // Manejar plan de cuotas si es necesario
      //     })
      //     .catch((result) => {
      //       console.error('Error al obtener plan de cuotas:', result)
      //     })
      // }
    }
  })
}

const needInstallments = ref(false)

const submitPayment = async () => {
  if (!dlocalInstance.value || !cardField.value) return

  const nameValidationError = validateCardHolderName(cardHolderName.value)
  if (nameValidationError) {
    cardHolderNameError.value = nameValidationError
    errorMessage.value = 'Por favor corrija los errores en el formulario'
    useShowAlert({
      type: 'error',
      message: 'Por favor corrija los errores en el formulario',
    })
    useLoading(false)
    return
  }

  if (!isComplete.value) {
    useShowAlert({
      type: 'error',
      message: 'Por favor complete todos los datos de la tarjeta',
    })
    useLoading(false)
    errorMessage.value = 'Por favor complete todos los datos de la tarjeta'
    return
  }

  if (cardNumberLength.value > 0 && cardNumberLength.value < 13) {
    errorMessage.value = 'El número de tarjeta debe tener al menos 13 dígitos'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  cardHolderNameError.value = ''

  try {
    const tokenParams = {
      name: cardHolderName.value.trim(),
    }

    if (needInstallments.value) {
      const installmentsSelect = document.getElementById(
        'installments',
      ) as HTMLSelectElement
      const installmentId = installmentsSelect?.value
      if (installmentId) {
        tokenParams.installments_id = installmentId
      }
    }

    const result = await dlocalInstance.value.createToken(
      cardField.value,
      tokenParams,
    )

    if (result.error) {
      throw new Error(result.error.message)
    }

    const token = result.token

    emit('payment-success', token)
    isSubmitting.value = false
  } catch (error) {
    console.error('Error al procesar el pago:', error)
    errorMessage.value =
      error.message ||
      'Error al procesar el pago. Por favor, intente nuevamente.'
    isSubmitting.value = false
  }
}

defineExpose({
  submitPayment,
})
</script>

<template>
  <div class="payment-form">
    <div class="form-group">
      <span
        class="general-input solo-form normal-labels input-checkout tw-w-full"
      >
        <label for="card-holder">Nombre del titular</label>
        <InputText
          v-keyfilter="/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/"
          v-model="cardHolderName"
          :placeholder="$t('forms.create.aboutMe.namePlaceholder')"
          maxlength="50"
        />
        <div class="error-message" v-if="cardHolderNameError">
          {{ cardHolderNameError }}
        </div>
      </span>
    </div>
    <div class="form-group">
      <label>Datos de la tarjeta</label>
      <div
        class="card-field-wrapper"
        :class="{
          'is-focused': isFocused,
          'has-error': hasError,
          'is-complete': isComplete,
        }"
      >
        <div ref="cardContainer"></div>
      </div>
      <div id="card-errors" class="error-message" v-if="errorMessage">
        {{ errorMessage }}
      </div>
    </div>
    <div class="dLocal-img-container">
      <div>
        <div class="tw-flex tw-gap-3">
          <div
            class="tw-min-h-[44px] tw-min-w-[44px] tw-max-w-[44px] tw-max-h-[44px]"
          >
            <img
              src="/img/payment/ssl_icon.png"
              alt="ssl"
              class="tw-w-full tw-h-full"
            />
          </div>
          <div>
            <p class="tw-text-[12px]">
              Usamos tecnología de encriptación SSL para proteger tu información
              sensible.
            </p>
            <img src="/icons/registry/ic_credit_cards.svg" alt="visa_cards" />
          </div>
        </div>
      </div>
      <img src="/img/payment/dLocal_image.png" alt="dLocal" />
    </div>
  </div>
</template>
<style scoped>
.payment-form {
  width: 100%;
  border-radius: 8px;
}
.dLocal-img-container {
  @apply tw-w-full tw-my-5 tw-flex tw-items-center tw-justify-between;
  @apply max-lg:tw-flex-col;

  gap: 10px;
}
.form-title {
  font-size: 24px;
  color: #32325d;
  margin-bottom: 25px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

label {
  font-family: 'heading-pro-treble-bold';
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a29;
}

.form-control {
  width: 100%;
  height: 48px;
  padding: 10px 12px;
  font-size: 16px;
  color: #32325d;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid#dee2e5;

  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #3db5e6;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.card-field-wrapper {
  @apply max-lg:tw-px-1 max-lg:tw-py-3 lg:tw-p-3;
  position: relative;
  border-radius: 4px;
  transition: all 0.2s ease;
  background-color: #fff;
  border: 1px solid #dee2e5;
  min-height: 44px;
}

.card-field-wrapper.is-focused {
  border-color: #3db5e6;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.card-field-wrapper.has-error {
  border-color: #e74c3c;
}
.card-field-wrapper.is-complete {
  border-color: #2ecc71;
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 8px;
}

.form-actions {
  margin-top: 30px;
  text-align: center;
}
</style>
