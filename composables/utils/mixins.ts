import { DateTime } from 'luxon'
import { storeToRefs } from 'pinia'

// interfaces
interface showAlertI {
  title?: string
  message: string
  type?: string // success, info, warn, error
  duration?: number // Delay in milliseconds to close the message automatically
}

export const useApplyDiscountAndFormat = (price, discount, type = 'total') => {
  if (!price || discount === undefined || discount === null) {
    return useFormatPrice(type === 'discount' ? 0 : price)
  }

  const discountValue =
    typeof discount === 'string' ? parseFloat(discount) : discount

  if (isNaN(discountValue) || discountValue <= 0) {
    return useFormatPrice(type === 'discount' ? 0 : price)
  }

  const discountDigits = Math.floor(Math.abs(discountValue)).toString().length

  let discountAmount
  let finalPrice

  if (discountDigits <= 2) {
    // Descuento como porcentaje
    discountAmount = (price * discountValue) / 100
    finalPrice = price - discountAmount
  } else {
    // Descuento como valor absoluto
    discountAmount = discountValue
    finalPrice = price - discountValue
  }

  finalPrice = Math.max(0, finalPrice)
  discountAmount = Math.min(discountAmount, price) // El descuento no puede ser mayor al precio

  // Retornar según el tipo solicitado
  if (type === 'discount') {
    return useFormatPrice(discountAmount)
  } else {
    return useFormatPrice(finalPrice)
  }
}

export const calculateTotalWithDelivery = (
  deliveryFee,
  deliveryResume,
  type,
) => {
  const baseTotal = Number(deliveryResume?.total || 0)
  const shippingCost = Number(deliveryFee?.shippingCost || 0)
  const limit = Number(deliveryFee?.limitForFreeDeliveries || 0)

  if (type === 'price') {
    if (deliveryFee?.notApplicable) {
      return baseTotal + shippingCost
    } else {
      if (baseTotal > limit) {
        return baseTotal
      } else {
        return baseTotal + shippingCost
      }
    }
  } else if (type === 'delivery') {
    if (deliveryFee?.notApplicable) {
      return useFormatPrice(shippingCost)
    } else {
      if (baseTotal > limit) {
        return 'Gratis'
      } else {
        return useFormatPrice(shippingCost)
      }
    }
  } else if (type === 'coupon') {
    return 0
  }
}

export const useParseJson = (_json: any) => {
  try {
    return JSON.parse(_json)
  } catch (error) {
    return {}
  }
}
export const usePreventInvalidInput = (event: Event | KeyboardEvent) => {
  if (event.type === 'keydown') {
    const keyboardEvent = event as KeyboardEvent
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Home',
      'End',
    ]

    if (allowedKeys.includes(keyboardEvent.key)) {
      return
    }

    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]$/

    if (!regex.test(keyboardEvent.key)) {
      keyboardEvent.preventDefault()
    }
  } else if (event.type === 'input') {
    const inputEvent = event as Event
    const input = inputEvent.target as HTMLInputElement
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/

    if (!regex.test(input.value)) {
      input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '')
    }
  }
}
export const useHandlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pasteText = event.clipboardData?.getData('text') || ''
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/
  const cleanedText = pasteText.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '')
  document.execCommand('insertText', false, cleanedText)
}
export const useLoading = (value: boolean) => {
  const mainStore = useMainStore()
  const { loading } = storeToRefs(mainStore)

  loading.value = value
}
export const useOpenWhatsApp = () => {
  const phoneNumber = '+573235997035'

  const message = 'Hola, estoy interesado en obtener más información.'

  const encodedMessage = encodeURIComponent(message)

  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

  window.open(whatsappURL, '_blank')
}
export const useFormatAge = (years, months) => {
  let result = ''
  const { t } = useI18n()
  if (years && years > 0) {
    result += years + ' ' + (years === 1 ? t('common.year') : t('common.years'))
  }

  if (months && months > 0) {
    if (result) {
      result += ' ' + t('common.and') + ' '
    }
    result +=
      months + ' ' + (months === 1 ? t('common.month') : t('common.months'))
  }

  return result || '0 ' + t('common.months')
}
export const useSearchItemJson = (path: string, obj: any) => {
  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    const matches = key.match(/(\w+)(\[(\d+)\])?/)

    if (matches) {
      const property = matches[1]
      const index = matches[3]
      result = Object.keys(result || {}).length > 0 ? result : {}
      if (
        typeof result !== 'undefined' &&
        Object.prototype.hasOwnProperty.call(result, property)
      ) {
        result = result[property]

        if (index !== undefined) {
          result = result[index]
        }
      } else {
        return undefined || null || ''
      }
    } else {
      return undefined || null || ''
    }
  }

  return result
}
export const useTruncateText = (text: string, maxLength: number): string => {
  if (text?.length > maxLength) {
    return text.slice(0, maxLength) + '...'
  }
  return text
}
export const useShowAlert = (config: showAlertI) => {
  const nuxtApp = useNuxtApp()
  const toast: any = nuxtApp.$toast
  config.duration = config.duration || 3500

  toast.removeAllGroups()

  toast.add({
    severity: config.type,
    summary: config.title,
    detail: config.message,
    life: config.duration,
  })
}

export const useFormatDate = (date: string, type: string) => {
  let dateFormat = '-'

  const parsedDate = DateTime.fromISO(date).setLocale('es')

  if (type === 'date-send') {
    dateFormat = parsedDate.toFormat('yyyy-MM-dd')
  }

  if (type === 'date-table') {
    dateFormat = parsedDate.toFormat('dd/MMM/yyyy')
  }
  if (type === 'day-month') {
    dateFormat = parsedDate.toFormat('dd/MM')
  }
  return dateFormat
}
export const useFormatPrice = (_value: any): string => {
  try {
    const numberValue = Number(_value)

    const formattedPrice = numberValue.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })

    const formattedPriceWithDot = formattedPrice.replace(/,/g, '.')

    return formattedPriceWithDot
  } catch (error) {
    console.error('Error al formatear el precio:', error)
    return '$0'
  }
}
export const useCalculateWeigth = (weight: number) => {
  if (weight < 0) throw new Error('El valor no puede ser negativo')
  if (weight === 0) return '0 g'

  const zeros = (numStr: string) => {
    let resultado = numStr.replace(/0+$/, '')
    if (resultado.endsWith('.')) resultado = resultado.slice(0, -1)
    return resultado
  }

  if (weight < 1000) {
    return zeros(weight.toFixed(3)) + ' g'
  } else if (weight < 1000000) {
    return zeros((weight / 1000).toFixed(2)) + ' kg'
  } else {
    return zeros((weight / 1000000).toFixed(2)) + ' t'
  }
}
