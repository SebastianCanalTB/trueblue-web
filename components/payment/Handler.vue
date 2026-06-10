<script setup lang="ts">
import { ref, computed } from 'vue'
// Props
const props = defineProps({
  orderId: {
    type: [String, Number],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'COP',
  },
  country: {
    type: String,
    default: 'CO',
  },
  userInfo: {
    type: Object,
    required: true,
  },
})

// Emits
const emit = defineEmits([
  'payment-completed',
  'payment-failed',
  'payment-cancelled',
])

// Stores
const paymentStore = usePaymentStore()

// Refs
const dLocalRef = ref()
const webViewRef = ref(null)

// Reactive data
const paymentMethod = ref('direct') // 'direct' o 'redirect'
const isProcessing = ref(false)
const currentToken = ref(null)
const showErrorModal = ref(false)
const errorTitle = ref('')
const errorMessage = ref('')
const errorDetails = ref(null)
const canRetryWithWebView = ref(false)

// Métodos principales
const handleTokenGenerated = (token) => {
  currentToken.value = token
}

const processDirectPayment = async () => {
  if (!dLocalRef.value) return

  try {
    isProcessing.value = true

    await dLocalRef.value.submitPayment()

    if (!currentToken.value) {
      throw new Error('No se pudo generar el token de pago')
    }

    const paymentResult = await processPaymentWithToken(currentToken.value)

    handlePaymentResult(paymentResult)
  } catch (error) {
    console.error('Error en pago directo:', error)
    handleDirectPaymentError(error)
  } finally {
    isProcessing.value = false
  }
}

const processPaymentWithToken = async (token) => {
  const orderData = {
    payment: {
      amount: props.amount,
      order_id: props.orderId,
      name: props.userInfo.name,
      email: props.userInfo.email,
      document: props.userInfo.document || '',
      phone: props.userInfo.phone || '',
      token: token.id, // El token de dLocal
    },
  }

  // Usar tu store existente
  const response = await paymentStore.generatePayment(orderData)

  return response
}

const handlePaymentResult = (result) => {
  if (result.status && result.code === 100) {
    // Pago exitoso según tu estructura
    useShowAlert({
      type: 'success',
      message: result.message,
    })
    emit('payment-completed', result)
  } else {
    useShowAlert({
      type: 'error',
      message: result.message,
    })
  }
}

const handleDirectPaymentError = (error) => {
  errorTitle.value = 'Error en el pago'
  errorMessage.value = error.message || 'Ocurrió un error al procesar el pago'
  errorDetails.value = error.details || null
  canRetryWithWebView.value = false
  showErrorModal.value = true
}
</script>
<template>
  <div class="payment-handler">
    <div v-if="paymentMethod === 'direct'" class="direct-payment">
      <PaymentDLocalCardField
        :ref="(el) => (dLocalRef = el)"
        @payment-success="handleTokenGenerated"
      />

      <div class="payment-actions">
        <button
          @click="processDirectPayment"
          :disabled="isProcessing"
          class="btn-pay"
        >
          <span v-if="isProcessing" class="loading-spinner"></span>
          {{
            isProcessing ? 'Procesando...' : `Pagar ${useFormatPrice(amount)}`
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-handler {
  width: 100%;
}

.direct-payment {
  width: 100%;
}

.btn-pay {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-pay:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-pay:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Modal de error */
.error-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 1rem;
}

.error-modal {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.error-header h3 {
  margin: 0;
  color: #dc3545;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #e9ecef;
}

.error-content {
  padding: 2rem 1.5rem;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-content p {
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.error-details {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  text-align: left;
}

.error-details p {
  margin: 0.5rem 0;
  font-size: 14px;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1.5rem;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.btn-retry,
.btn-retry-direct,
.btn-cancel {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-retry {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-retry:hover {
  background: #0056b3;
}

.btn-retry-direct {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.btn-retry-direct:hover {
  background: #1e7e34;
}

.btn-cancel {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-cancel:hover {
  background: #545b62;
}

/* Responsive */
@media (max-width: 768px) {
  .error-actions {
    flex-direction: column;
  }

  .error-modal-overlay {
    padding: 0.5rem;
  }
}
</style>
