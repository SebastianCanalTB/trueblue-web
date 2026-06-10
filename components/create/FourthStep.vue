<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Loader } from '@googlemaps/js-api-loader'

const emit = defineEmits([
  'finish-form',
  'update:modelValue',
  'restartForms',
  'edit-order',
  'go-back',
  'payment',
])
const dLocalRef = ref()
const accountStore = useAccountStore()
const systemStore = useSystemStore()
const allProductsStore = useAllProductsStore()

const { getAllFormsData: allForms } = storeToRefs(allProductsStore)
const {
  getListDocumentTypes: documents,
  getListCities: cities,
  getListMunicipalities: municipalities,
  getAllDateOptions: dateOptions,
  getLisParametrization: parametrization,
  getInfoCupon: cupon,
} = storeToRefs(accountStore)
const { isMovil } = storeToRefs(systemStore)
const config = useRuntimeConfig()
const { t } = useI18n()
const sidebars = ref(false)
const route = useRoute()
const citiesRef = ref()
const cuponApplied = ref(false)
const openPanels = ref([])
const deliveryResume = ref(null)
const deliveryFee = ref()
const tokenToSend = ref()
const validPhone = ref(true)
const cityNameById = ref('')

const { handleSubmit, errors, meta, setErrors, resetForm, resetField } =
  useForm({
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
        callingCode: z
          .string({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        userIdType: z
          .number({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        delivery: z
          .string({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        city: z
          .number({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        municipality: z
          .number({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        phone: z
          .string({ message: t('rule.validation.require') })
          .min(9, { message: t('rule.validation.length.min') })
          .max(10, { message: t('rule.validation.length.max') }),
        userId: z
          .string({ message: t('rule.validation.require') })
          .min(6, {
            message: t('rule.validation.length.minCar', { number: 6 }),
          })
          .max(10, {
            message: t('rule.validation.length.maxCar', { number: 10 }),
          }),
        personType: z
          .string({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        address: z
          .string({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        complement: z
          .string({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        couponCode: z.string().optional().nullable(),
        latitude: z.number().optional().nullable(),
        referalCode: z.string().optional().nullable(),
        longitude: z.number().optional().nullable(),
      }),
    ),
  })
const options = [
  { value: 'natural', label: 'Natural' },
  { value: 'company', label: 'Juridica' },
]

const getItems = async () => {
  await accountStore.getCitiesRegister().then((response) => {
    resetForm({
      values: {
        phone: allForms.value[allForms.value.length - 1]?.aboutMe?.phone || '',
        city: 1,
        municipality: 169,
      },
    })
  })
  await accountStore.getMunicipalities(1)
  const bogotaCity = municipalities.value.find((m) => m.id === 169)
  if (bogotaCity) {
    deliveryFee.value = bogotaCity
  }
}

const { value: name, setValue: setName } = useField<string | null>('name')
const { value: surname, setValue: setSurname } = useField<string | null>(
  'surname',
)
const { value: referalCode } = useField<string>('referalCode')

const { value: email, setValue: setEmail } = useField<string | null>('email')
const { value: phone, setValue: setPhone } = useField<string | null>('phone')
const { value: userId, setValue: setUserId } = useField<string | null>('userId')
const { value: callingCode, setValue: setCallingCode } = useField<
  string | null
>('callingCode', undefined, {
  initialValue: '+57',
})
const { value: city, setValue: setCity } = useField<number | null>('city')
const { value: delivery } = useField<number | null>('delivery')
const { value: personType, setValue: setPersonType } = useField<string | null>(
  'personType',
)
const { value: userIdType, setValue: setUserIdType } = useField<number | null>(
  'userIdType',
  undefined,
  {
    initialValue: 1,
  },
)
const { value: address, setValue: setAddress } = useField<string | null>(
  'address',
)
const { value: complement } = useField<string | null>('complement')
const { value: municipality, setValue: setMunicipality } = useField<
  number | null
>('municipality', undefined, { initialValue: 169 })
const { value: latitude, setValue: setLatitude } = useField<number>('latitude')
const { value: couponCode } = useField<string>('couponCode')
const { value: longitude, setValue: setLongitude } =
  useField<number>('longitude')

const selectedCity = (_id: any) => {
  sidebars.value = false
  setCity(_id)
}
const addOrder = () => {
  emit('restartForms')
}

const formSendData = ref({})
const finishForm = () => {
  emit('finish-form', formSendData.value)
}
const onSubmit = handleSubmit(async (values: any) => {
  if (validPhone.value === false) {
    useShowAlert({
      type: 'error',
      message: 'Por favor verifica tu número de teléfono antes de continuar',
    })
    return
  }
  useLoading(true)

  try {
    const token = await new Promise((resolve, reject) => {
      tokenResolve.value = resolve

      dLocalRef.value.submitPayment()

      setTimeout(() => {
        useLoading(false)
        reject(new Error('Timeout obteniendo token'))
      }, 10000)
    })

    const modifiedValues = {
      ...values,
      token,
      couponCode:
        activeDiscountType.value === 'cupon' ? cuponDiscount?.value?.id : '',
      referralCode:
        activeDiscountType.value === 'referral'
          ? referralDiscountValue?.value?.id
          : '',
      vetReferralCode:
        activeDiscountType.value === 'vetReferral'
          ? vetReferralDiscount?.value?.code
          : '',
    }

    formSendData.value = modifiedValues

    finishForm()
    return modifiedValues
  } catch (error) {
    console.error('Error obteniendo token:', error)
    useLoading(false)
  }
})

const deleteOrder = (index) => {
  allProductsStore.deleteSelectedAllFromData(index)

  if (openPanels.value[index]) {
    openPanels.value[index].hide()
  }
  getDeliveryResume()
}

const cuponDiscount = ref()
const couponDiscountAmount = ref(0)
const isGreaterCoupon = ref(false)
const activeDiscountType = ref(null)

const vetReferralDiscount = ref()
const vetReferralDiscountAmount = ref(0)

const applyDiscountCode = async (code, codeType = 'auto') => {
  useLoading(true)

  try {
    const response = await accountStore.getReferralOrDiscountInfo({ code })

    if (response.status && response.code === 100) {
      const subtotal = deliveryResume?.value?.subtotal || 0
      const currentDiscountAmount = deliveryResume?.value?.discount || 0

      const getDiscountInfo = (data) => {
        if (data.referral) {
          const settings = data.referral.settingsUser
          return {
            type: 'referral',
            discountType: settings.type,
            discountValue: settings.value,
            data: data,
          }
        } else if (data.cupons) {
          return {
            type: 'cupon',
            discountType: data.cupons.type,
            discountValue: data.cupons.valueType,
            data: data,
          }
        } else if (data.vetReferral) {
          const settings = data.vetReferral.settings
          return {
            type: 'vetReferral',
            discountType: settings.discountType,
            discountValue: settings.discountValue,
            data: data,
          }
        }
        return null
      }

      const discountInfo = getDiscountInfo(response.data)

      if (!discountInfo) {
        useShowAlert({
          type: 'error',
          message: 'Tipo de código no reconocido',
        })
        return
      }

      const calculatedDiscountAmount =
        discountInfo.discountType === 'Porcentual'
          ? subtotal * (discountInfo.discountValue / 100)
          : discountInfo.discountValue

      const shouldApply =
        discountInfo.type === 'cupon'
          ? calculatedDiscountAmount > currentDiscountAmount
          : calculatedDiscountAmount >= currentDiscountAmount

      if (shouldApply) {
        useShowAlert({
          type: 'success',
          message: response.message,
        })

        if (discountInfo.type === 'referral') {
          referralDiscountValue.value = discountInfo.data.referral
          referralDiscountAmount.value = calculatedDiscountAmount
          activeDiscountType.value = 'referral'
          cuponApplied.value = true
          getDeliveryResume('referral')
        } else if (discountInfo.type === 'cupon') {
          cuponDiscount.value = discountInfo.data.cupons
          couponDiscountAmount.value = calculatedDiscountAmount
          activeDiscountType.value = 'cupon'
          cuponApplied.value = true
          getDeliveryResume('cupon')
        } else if (discountInfo.type === 'vetReferral') {
          vetReferralDiscount.value = discountInfo.data.vetReferral
          vetReferralDiscountAmount.value = calculatedDiscountAmount
          activeDiscountType.value = 'vetReferral'
          cuponApplied.value = true
          getDeliveryResume('vetReferral')
        }
      } else {
        const message =
          discountInfo.type === 'referral'
            ? 'Tu código de referido no ofrece un mejor descuento'
            : discountInfo.type === 'vetReferral'
              ? 'Tu código de veterinario no ofrece un mejor descuento'
              : 'Tu cupón no ofrece un mejor descuento'

        useShowAlert({
          type: 'error',
          message: `${message}. `,
        })
      }
    } else {
      useShowAlert({
        type: 'error',
        message: response.message,
      })
    }
  } catch (error) {
    useShowAlert({
      type: 'error',
      message: 'Error al validar el código',
    })
  }

  useLoading(false)
}

const referralDiscountValue = ref()
const referralDiscountAmount = ref(0)

const clearDiscountCode = () => {
  cuponApplied.value = false
  referralDiscountValue.value = null
  cuponDiscount.value = null
  vetReferralDiscount.value = null
  referralDiscountAmount.value = 0
  couponDiscountAmount.value = 0
  vetReferralDiscountAmount.value = 0
  couponCode.value = ''

  getDeliveryResume()

  useShowAlert({
    type: 'success',
    message: 'Código de descuento removido',
  })
}

const setPanelRef = (el, index) => {
  if (el) {
    openPanels.value[index] = el
  }
}
const openMenu = (event, index) => {
  if (openPanels.value[index]) {
    openPanels.value[index].toggle(event)
  }
}
const editOrder = (index) => {
  emit('edit-order', index)
  openPanels.value[index].hide()
}

const openSidebarInsteadOfDropdown = () => {
  if (!isMovil.value) {
    return
  }
  sidebars.value = true
  citiesRef.value.hide()
}

const tokenResolve = ref(null)

const getToken = (token: any) => {
  tokenToSend.value = token

  if (tokenResolve.value) {
    tokenResolve.value(token)
    tokenResolve.value = null
  }
}
const getDeliveryResume = async (_type?: string) => {
  try {
    const pets = allForms.value.map((form) => ({
      grams: form.grammage,
      pet: form.pets.form1.name,
      isMixedFood: form?.pets?.form5?.portions
        ? form.pets.form5.portions
        : false,
      products: form.idealPlan.selected.map((product) => product.id),
    }))
    setPhone(allForms.value[allForms.value.length - 1].aboutMe.phone)
    const frequency =
      allForms.value[allForms.value.length - 1].idealPlan.frecuency

    const response = await accountStore.getPurchaseValues({
      planId: null,
      frequency: frequency,
      pets: pets,
      cuponId:
        _type === 'cupon' ? cuponDiscount.value?.id || null : null || null,
      referralCodeId:
        _type === 'referral'
          ? referralDiscountValue.value?.id || null
          : null || null,
      vetReferralCode:
        _type === 'vetReferral'
          ? vetReferralDiscount.value?.code || null
          : null || null,
    })
    if (response?.status && response?.code == 100) {
      deliveryResume.value = response?.data
    }
  } catch (error) {
    console.error('Error al obtener valores de compra:', error)
  }
}
const dowloadTerms = () => {
  const url = '/docs/Términos_y_Condiciones_Generales_de_TRUEBLUE.pdf'
  window.open(url, '_blank')
}
watch(
  () => meta.value.valid,
  (newVal: boolean) => {
    emit('update:modelValue', newVal)
  },
)

const autocompleteInput = ref<HTMLInputElement | null>(null)
const map = ref<HTMLElement | null>(null)
let currentMarker = null
let lastSelectedAddress = ref('')

watch(address, (newValue) => {
  if (newValue !== lastSelectedAddress.value) {
    setLatitude(0)
    setLongitude(0)

    if (currentMarker) {
      currentMarker.setMap(null)
      currentMarker = null
    }
  }
})
watch(city, async (newValue: number | null) => {
  const selectedCity = cities.value.find((c) => c.id === newValue)

  if (selectedCity) {
    await accountStore.getMunicipalities(newValue)
    cityNameById.value = selectedCity.name
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, '')

    if (autocompleteInput.value) {
      autocompleteInput.value.value = ''
    }
    if (address.value !== '') {
      resetField('address')
      lastSelectedAddress.value = ''
      setErrors({
        ...errors.value,
        address: '',
      })
    }

    if (currentMarker) {
      currentMarker.setMap(null)
      currentMarker = null
    }
  }
})
watch(municipality, (newValue) => {
  const selectedCity = municipalities.value.find((c) => c.id === newValue)
  if (selectedCity) {
    deliveryFee.value = selectedCity

    cityNameById.value = selectedCity.name
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, '')

    if (autocompleteInput.value) {
      autocompleteInput.value.value = ''
    }
    if (address.value !== '') {
      address.value = ''
      lastSelectedAddress.value = ''
      setErrors({
        ...errors.value,
        address: '',
      })
    }

    if (currentMarker) {
      currentMarker.setMap(null)
      currentMarker = null
    }
  }
})

onMounted(() => {
  nextTick(async () => {
    await getItems()
    if (allForms.value && allForms.value.length > 0) {
      getDeliveryResume()
    }
    const loader = new Loader({
      apiKey: config.public.keymaps,
      libraries: ['places'],
    })

    await loader.load()

    if (map.value && autocompleteInput.value) {
      const google = window.google

      const mapInstance = new google.maps.Map(map.value, {
        center: { lat: 4.5709, lng: -74.2973 },
        zoom: 6,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
      })

      const autocomplete = new google.maps.places.Autocomplete(
        autocompleteInput.value,
        {
          componentRestrictions: { country: 'co' },
        },
      )

      const updateAutocompleteRestrictions = (cityName) => {
        if (cityName) {
          autocomplete.setComponentRestrictions({
            country: 'co',
          })

          const options = {
            bounds: null,
            strictBounds: true,
          }

          const geocoder = new google.maps.Geocoder()
          geocoder.geocode(
            { address: cityName + ', Colombia' },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                const cityLocation = results[0].geometry.location
                const cityBounds = results[0].geometry.viewport

                options.bounds = cityBounds
                autocomplete.setBounds(cityBounds)
                mapInstance.fitBounds(cityBounds)
              }
            },
          )

          for (const prop in options) {
            if (options[prop] !== null) {
              autocomplete.setOptions({ [prop]: options[prop] })
            }
          }
        }
      }

      if (cityNameById.value) {
        updateAutocompleteRestrictions(cityNameById.value)
      }

      watch(cityNameById, (newCityName) => {
        if (newCityName) {
          if (autocompleteInput.value) {
            autocompleteInput.value.value = ''
          }
          updateAutocompleteRestrictions(newCityName)
        }
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()

        if (!place.geometry || !place.geometry.location) {
          return
        }

        const selectedAddress = place.formatted_address?.includes('Cra,')
          ? place.formatted_address
          : place.formatted_address?.split(',')[0].trim()
        const selectedLatitude = place.geometry.location.lat()
        const selectedLongitude = place.geometry.location.lng()

        setAddress(selectedAddress)
        setLatitude(selectedLatitude)
        setLongitude(selectedLongitude)
        lastSelectedAddress.value = selectedAddress

        mapInstance.setCenter(place.geometry.location)
        mapInstance.setZoom(15)

        if (currentMarker) {
          currentMarker.setMap(null)
        }

        currentMarker = new google.maps.Marker({
          map: mapInstance,
          position: place.geometry.location,
          animation: google.maps.Animation.DROP,
        })
      })

      if (autocompleteInput.value) {
        autocompleteInput.value.addEventListener('blur', () => {
          if (
            autocompleteInput.value &&
            autocompleteInput.value.value !== lastSelectedAddress.value
          ) {
            setLatitude(null)
            setLongitude(null)

            if (currentMarker) {
              currentMarker.setMap(null)
              currentMarker = null
            }
          }
        })
      }
    }
  })
})

watch(phone, (newPhone) => {
  if (
    newPhone &&
    newPhone.length === 10 &&
    newPhone !== allForms.value[allForms.value.length - 1]?.aboutMe?.phone
  ) {
    const sendData = ref({
      indicative: callingCode.value,
      phone: newPhone,
    })
    accountStore.validatePhoneNumber(sendData.value).then((response) => {
      if (response.status && response.code === 100) {
        useShowAlert({
          type: 'success',
          message: response.message,
        })
        validPhone.value = true
      } else {
        useShowAlert({
          type: 'error',
          message: response.message,
        })
        validPhone.value = false
      }
    })
  } else if (
    newPhone &&
    newPhone.length === 10 &&
    newPhone === allForms.value[allForms.value.length - 1]?.aboutMe?.phone
  ) {
    validPhone.value = true
  } else {
    validPhone.value = false
  }
})
defineExpose({
  onSubmit,
  getDeliveryResume,
})
</script>

<template>
  <div
    class="create-container tw-flex max-lg:!tw-flex-col-reverse max-lg:!tw-p-0"
  >
    <div
      :class="{ 'registry-checkout': !isMovil }"
      class="max-lg:tw-mt-4 max-lg:tw-w-full max-lg:tw-px-5"
    >
      <div class="content">
        <span class="checkout-title">Checkout</span>
        <h2 class="checkouts-title tw-mt-4">
          {{ $t('create.main.content.4.firstCard') }}
        </h2>
        <div class="sections">
          <span
            class="general-input solo-form normal-labels input-checkout lg:tw-w-1/2"
          >
            <label for="username">{{ $t('forms.create.aboutMe.name') }}</label>
            <InputText
              v-keyfilter="/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/"
              v-model="name"
              :placeholder="$t('forms.create.aboutMe.namePlaceholder')"
              maxlength="50"
            />
            <GeneralInputError :error="errors['name']" />
          </span>
          <span
            class="general-input solo-form normal-labels input-checkout lg:tw-w-1/2"
          >
            <label for="username">{{
              $t('forms.create.aboutMe.surname')
            }}</label>
            <InputText
              v-keyfilter="/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/"
              v-model="surname"
              :placeholder="$t('forms.create.aboutMe.surnamePlaceholder')"
              maxlength="50"
            />
            <GeneralInputError :error="errors['surname']" />
          </span>
        </div>
        <div class="sections">
          <span
            class="general-input solo-form normal-labels input-checkout lg:tw-w-1/2"
          >
            <label for="username">{{ $t('forms.create.aboutMe.email') }}</label>
            <InputText
              v-model="email"
              :placeholder="
                $t('forms.create.aboutMe.emailPlaceholder', { at: '@' })
              "
            />
            <GeneralInputError :error="errors['email']" />
          </span>
          <span
            class="general-input form-group normal-labels input-checkout lg:tw-w-1/2"
          >
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
            </div>
            <GeneralInputError :error="errors['phone']" />
          </span>
        </div>
        <div class="sections">
          <span class="general-selectButton form normal-label lg:tw-w-1/2">
            <label for="personType">
              {{ $t('forms.create.type.title') }}
            </label>
            <SelectButton
              v-model="personType"
              option-value="value"
              option-label="label"
              :options="[...options]"
              :allowEmpty="false"
              size="large"
            />
            <GeneralInputError :error="errors['personType']" />
          </span>
          <span
            class="general-input form-group normal-labels input-checkout lg:tw-w-1/2"
          >
            <label for="age">{{ t('forms.create.aboutMe.id') }}</label>
            <div class="flex gap-3">
              <InputGroup>
                <InputGroupAddon>
                  <Select
                    v-model="userIdType"
                    class="tw-h-[43px] tw-w-[60px]"
                    :options="documents"
                    option-value="id"
                    option-label="alias"
                    :pt="{
                      overlay: 'tw-w-[80px]',
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
                  v-model="userId"
                  type="tel"
                  placeholder="00000000000000"
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
            <GeneralInputError :error="errors['userId']" />
          </span>
        </div>
        <div>
          <h3 class="checkouts-title tw-mt-4">
            {{ $t('create.main.content.4.secondCard') }}
          </h3>
          <div class="maps">
            <div class="sections">
              <span
                class="general-dropdown solo-create normal-labels checkout lg:tw-w-1/2"
              >
                <label for="username">{{
                  $t('forms.create.checkout.city')
                }}</label>
                <Select
                  v-model="city"
                  :options="cities"
                  filter
                  ref="citiesRef"
                  placeholder="Seleccione ciudad"
                  option-value="id"
                  option-label="name"
                  :pt="{
                    overlay: 'tw-w-[40px]',
                  }"
                  @click.native="openSidebarInsteadOfDropdown"
                  @before-show="openSidebarInsteadOfDropdown"
                  @value-change="municipality = null"
                />
                <GeneralInputError :error="errors['city']" />
              </span>
              <span
                class="general-dropdown solo-create normal-labels checkout lg:tw-w-1/2"
              >
                <label for="username">{{
                  $t('forms.create.checkout.municipality')
                }}</label>
                <Select
                  v-model="municipality"
                  :options="municipalities"
                  filter
                  ref="municipalityRef"
                  placeholder="Seleccione municipio"
                  option-value="id"
                  option-label="name"
                  :pt="{
                    overlay: 'tw-w-[40px]',
                  }"
                />
                <GeneralInputError :error="errors['municipality']" />
              </span>
            </div>
            <div class="sections">
              <span
                class="general-dropdown solo-create normal-labels checkout lg:tw-w-1/2"
              >
                <label for="username">{{
                  $t('forms.create.deliveryDate')
                }}</label>
                <Select
                  v-model="delivery"
                  :options="dateOptions"
                  placeholder="Selecciona"
                  option-value="date"
                  option-label="date"
                  :pt="{
                    overlay: 'tw-w-[40px]',
                  }"
                >
                  <template #option="slotProps">
                    <div class="general">
                      {{ useFormatDate(slotProps?.option?.date, 'date-table') }}
                    </div>
                  </template>
                  <template #value="slotProps">
                    <div class="general">
                      {{
                        slotProps.value
                          ? useFormatDate(slotProps.value, 'date-send')
                          : slotProps.placeholder
                      }}
                    </div>
                  </template>
                </Select>
                <small class="tw-text-[12px] tw-text-[#8BA0C9]">{{
                  $t('create.main.content.4.small')
                }}</small>
                <GeneralInputError :error="errors['delivery']" />
              </span>
              <span
                class="general-input solo-form normal-labels input-checkout lg:tw-w-1/2"
              >
                <label for="username">{{
                  $t('forms.create.checkout.address')
                }}</label>
                <input
                  class="tw-h-[40px] tw-p-2"
                  v-model="address"
                  ref="autocompleteInput"
                  type="text"
                  :placeholder="$t('forms.create.checkout.addressPlacholder')"
                />
                <GeneralInputError
                  v-if="meta.touched"
                  :error="errors['address']"
                />
              </span>
            </div>
            <span class="general-input solo-form normal-labels">
              <label for="username">{{
                $t('forms.create.checkout.complement')
              }}</label>
              <Textarea
                v-model="complement"
                :placeholder="$t('forms.create.checkout.complementPlaceholder')"
                maxlength="100"
                style="resize: none; height: 42px; background-color: #fff"
              />
              <GeneralInputError :error="errors['complement']" />
            </span>
          </div>
          <div class="tw-my-4">
            <p
              class="tw-text-[#8BA0C9] tw-text-[12px] tw-font-treble-book tw-mb-3"
            >
              {{ $t('forms.create.checkout.mapPlaceholder') }}
            </p>
            <div>
              <div ref="map" style="height: 229px; width: 100%"></div>
            </div>
            <!-- <GeneralInputError
                    v-if="meta.touched"
                    :error="
                      errors['latitude'] === 'Required' ||
                      errors['latitude'] === 'Expected number, received null'
                        ? $t('rule.validation.latitudRequire')
                        : errors['latitude']
                    "
                  /> -->
          </div>
        </div>
        <div>
          <h3 class="checkouts-title tw-mt-4">
            {{ $t('create.main.content.4.thirdCard') }}
          </h3>
          <PaymentDLocalCardField
            :ref="(el) => (dLocalRef = el)"
            @payment-success="getToken"
          />
        </div>
        <div
          class="tw-w-full tw-border-t-[1px] tw-border-solid tw-border-[#8ba0c9] tw-pt-5"
        >
          <small class="tw-text-[12px] tw-text-[#8BA0C9]">{{
            $t('create.main.content.4.message')
          }}</small>
          <small
            @click="dowloadTerms"
            class="tw-text-[12px] tw-text-[#8BA0C9] tw-underline tw-cursor-pointer"
          >
            {{ $t('home.footer.terms') + '.' }}
          </small>
          <small class="tw-text-[12px] tw-text-[#8BA0C9]">{{
            ' ' + $t('create.main.content.4.messageTwo')
          }}</small>

          <div class="tw-mt-3">
            <div
              class="lg:!tw-grid lg:!tw-grid-cols-2 tw-gap-3 max-lg:tw-flex max-lg:tw-flex-col"
            >
              <div v-for="index in 5" :key="index" class="tw-flex tw-gap-2">
                <img
                  src="/icons/registry/ic_complete_check.svg"
                  alt="ic_check"
                  width="18px"
                  height="18px"
                  class="tw-mb-auto"
                />
                <p>
                  {{ $t(`create.main.content.texts.benefits.${index}`) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="summary-section">
      <div class="lg:tw-mt-[50px] max-lg:tw-mt-5">
        <div class="lg:tw-px-7 max-lg:tw-px-8 tw-flex tw-gap-3">
          <h5 class="checkouts-title lg:tw-mt-12">
            {{ $t('create.main.content.4.orderSummary.title') }}
          </h5>
        </div>
        <div
          v-for="(products, index) in deliveryResume?.pets"
          :key="index"
          class="dogs-products-recieved"
        >
          <div class="head lg:tw-px-7 max-lg:tw-px-8">
            <span class="dogs-name">
              {{ useTruncateText(products.pet, 12) }}</span
            >
            <div class="tw-flex tw-items-center tw-gap-3">
              <i
                v-if="allForms.length > 1"
                @click="openMenu($event, index)"
                class="pi pi-ellipsis-h"
                style="color: #5f6368; cursor: pointer; font-size: 25px"
              ></i>
              <OverlayPanel
                class="menu-responsive-header"
                :ref="(el) => setPanelRef(el, index)"
                appendTo="body"
              >
                <div class="menu">
                  <span @click="deleteOrder(index)">
                    {{ $t('button.delete') }}
                  </span>
                  <span @click="editOrder(index)">
                    {{ $t('button.edit') }}
                  </span>
                </div>
              </OverlayPanel>
            </div>
          </div>

          <div
            class="pets-message-container lg:tw-px-7 max-lg:tw-px-8 !tw-my-1"
          >
            <div class="pets-message tw-gap-2">
              <img src="/icons/registry/ic_dog_pad_pet.svg" alt="ic_dog_pad" />
              <span class="tw-text-left">
                {{
                  $t('create.main.content.4.orderSummary.sumaryText', {
                    frequency: deliveryResume?.frequency,
                    quantity: products?.products[0]?.amount,
                    packages: products?.products[0]?.name,
                    grammageSum: useCalculateWeigth(
                      products?.products[0]?.amount * 500,
                    ),
                  })
                }}
                <br />
                {{
                  $t(
                    `create.main.content.4.orderSummary.${products.isMixedFood ? 'mixedFoodText' : 'notMixedFoodText'}`,
                    {
                      petName: products.pet,
                    },
                  )
                }}
              </span>
            </div>
          </div>
        </div>

        <div class="add-container">
          <Button
            @click="addOrder()"
            class="app-general-button app-btn-add-pet"
            :label="t('create.main.content.4.orderSummary.add')"
            icon="pi pi-plus"
            style="width: 246px; height: 40px"
          >
          </Button>
        </div>
        <div class="payment">
          <div class="lg:tw-px-7 max-lg:tw-px-8 tw-flex tw-justify-between">
            <p>
              {{ $t('create.main.content.4.orderSummary.subtotal') }}
            </p>
            <p>{{ useFormatPrice(deliveryResume?.subtotal) }}</p>
          </div>
          <div class="lg:tw-px-7 max-lg:tw-px-8 tw-flex tw-justify-between">
            <p>
              {{ $t('create.main.content.4.orderSummary.discount') }}
            </p>
            <p class="!tw-text-[#3DB5E6]">
              -
              {{ useFormatPrice(deliveryResume?.discount) }}
            </p>
          </div>
          <div class="lg:tw-px-7 max-lg:tw-px-8 tw-flex tw-justify-between">
            <p>
              {{ $t('create.main.content.4.orderSummary.iva') }}
              ({{ parametrization.iva }}%)
            </p>
            <p>
              {{
                isGreaterCoupon
                  ? useFormatPrice(
                      (deliveryResume?.subtotal - couponDiscountAmount) * 0.19,
                    )
                  : useFormatPrice(deliveryResume?.iva)
              }}
            </p>
          </div>
          <div class="lg:tw-px-7 max-lg:tw-px-8 tw-flex tw-justify-between">
            <p>
              {{ $t('create.main.content.4.orderSummary.delivery') }}
            </p>
            <p>
              {{
                calculateTotalWithDelivery(
                  deliveryFee,
                  deliveryResume,
                  'delivery',
                )
              }}
            </p>
          </div>

          <div class="lg:tw-px-7 max-lg:tw-px-8 tw-flex tw-justify-between">
            <p class="total tw-pt-5">
              {{ $t('create.main.content.4.orderSummary.total') }}
            </p>

            <p class="total tw-ml-auto tw-text-end tw-pt-5">
              {{
                useFormatPrice(
                  calculateTotalWithDelivery(
                    deliveryFee,
                    deliveryResume,
                    'price',
                  ),
                )
              }}
            </p>
          </div>
          <div class="lg:tw-px-7 max-lg:tw-px-8 tw-flex tw-justify-between">
            <p>
              {{ $t('forms.create.checkout.frequency') }}
            </p>
            <div class="tw-flex tw-flex-col">
              <p class="tw-text-right">
                {{
                  deliveryResume?.frequency === '4 semanas'
                    ? 'Mensual'
                    : 'Quincenal'
                }}
              </p>
              <p>
                {{ `(Cada ${deliveryResume?.frequency})` }}
              </p>
            </div>
          </div>
          <div class="lg:tw-px-7 max-lg:tw-px-8 tw-flex tw-justify-between">
            <p>
              {{ $t('forms.create.deliveryDate') }}
            </p>
            <p class="tw-text-right">
              {{
                delivery ? useFormatDate(delivery, 'date-table') : 'DD/MM/AAAA'
              }}
            </p>
          </div>
        </div>
        <p
          class="tw-w-full tw-text-center tw-font-treble-bold tw-text-[#1A1A29] tw-text-[16px] tw-mt-6"
        >
          {{ $t('forms.create.checkout.referalOrCoupon') }}
        </p>

        <div class="summary-discount">
          <span
            class="general-input solo-email checkout !tw-h-auto tw-w-full !tw-pt-0"
          >
            <label for="cupon">{{ $t('forms.create.checkout.coupon') }}</label>

            <IconField v-if="!cuponApplied" iconPosition="right">
              <InputText
                v-model="couponCode"
                :placeholder="t('forms.create.checkout.coupon')"
                maxlength="50"
              />
              <InputIcon>
                <Button
                  @click="applyDiscountCode(couponCode)"
                  class="app-general-button btn-solo-create !tw-w-[86px]"
                >
                  Aplicar
                </Button>
              </InputIcon>
            </IconField>

            <div
              v-if="!cuponApplied"
              class="tw-flex tw-items-center tw-gap-2 tw-mt-2"
            >
              <img
                src="/icons/checkout/ic_exclamation.svg"
                alt="ic_exclamation"
                width="18px"
                height="18px"
              />
              <small class="tw-text-[12px] tw-text-[#575E6B]">
                {{ $t('create.main.content.4.orderSummary.referalMessage') }}
              </small>
            </div>

            <div
              v-else
              class="tw-flex tw-gap-3 tw-mt-2 tw-items-center tw-justify-between"
            >
              <span class="discount-text">
                <img
                  :src="
                    referralDiscountValue
                      ? '/icons/checkout/ic_users.svg'
                      : vetReferralDiscount
                        ? '/icons/checkout/ic_users.svg'
                        : '/icons/checkout/ic_cupon.svg'
                  "
                  :alt="
                    referralDiscountValue
                      ? 'referral'
                      : vetReferralDiscount
                        ? 'vet-referral'
                        : 'cupon'
                  "
                  class="tw-mr-3"
                />
                {{
                  referralDiscountValue?.code ||
                  vetReferralDiscount?.code ||
                  cuponDiscount?.code ||
                  couponCode
                }}
              </span>
              <div class="tw-flex tw-items-center tw-gap-3">
                <p>
                  -
                  <template v-if="referralDiscountValue">
                    {{
                      referralDiscountValue.settingsUser.type === 'Valor'
                        ? useFormatPrice(
                            referralDiscountValue.settingsUser.value,
                          )
                        : referralDiscountValue.settingsUser.value + '%'
                    }}
                  </template>
                  <template v-else-if="vetReferralDiscount">
                    {{
                      vetReferralDiscount.settings.discountType === 'Valor'
                        ? useFormatPrice(
                            vetReferralDiscount.settings.discountValue,
                          )
                        : vetReferralDiscount.settings.discountValue + '%'
                    }}
                  </template>
                  <template v-else-if="cuponDiscount">
                    {{
                      cuponDiscount.type === 'Valor'
                        ? useFormatPrice(cuponDiscount.valueType)
                        : cuponDiscount.valueType + '%'
                    }}
                  </template>
                </p>
                <i
                  class="pi pi-times"
                  style="cursor: pointer; color: #003b71"
                  @click="clearDiscountCode()"
                ></i>
              </div>
            </div>
          </span>
        </div>
        <!-- <div class="summary-discount tw-flex tw-flex-col !tw-justify-evenly">
          <span class="general-input solo-email checkout !tw-h-auto tw-w-full">
            <label for="cupon">{{
              $t('forms.create.checkout.referral')
            }}</label>

            <IconField v-if="!referralApplied" iconPosition="right">
              <InputText
                v-model="referalCode"
                :placeholder="t('forms.create.checkout.referral')"
                maxlength="50"
              />
              <InputIcon>
                <Button
                  @click="applyReferral"
                  class="app-general-button btn-solo-create !tw-w-[86px]"
                >
                  Aplicar
                </Button>
              </InputIcon>
            </IconField>
            <div
              v-else
              class="tw-flex tw-mt-2 tw-items-center tw-justify-between"
            >
              <div class="tw-flex tw-items-center">
                <img
                  src="/icons/checkout/ic_users.svg"
                  alt="cupon"
                  class="tw-mr-3"
                />
                <span class="discount-text">
                  {{ referalCode }}
                </span>
              </div>
              <div class="tw-flex tw-gap-2 tw-items-center">
                <p v-if="referalIsGreater">
                  -
                  {{
                    referralDiscountValue.type === 'Valor'
                      ? '-' + useFormatPrice(referralDiscountValue.value)
                      : referralDiscountValue.settingsUser.value + '%'
                  }}
                </p>
                <i
                  class="pi pi-times"
                  style="cursor: pointer; color: #003b71"
                  @click="deleteReferral()"
                ></i>
              </div>
            </div>
          </span>
          <div
            v-if="!referralApplied"
            class="tw-flex tw-items-center tw-gap-2 tw-mt-2"
          >
            <img
              src="/icons/checkout/ic_exclamation.svg"
              alt="ic_exclamation"
              width="18px"
              height="18px"
            />
            <small class="tw-text-[12px] tw-text-[#575E6B]">
              {{
                $t('create.main.content.4.orderSummary.referalMessage', {
                  data: referralData[0]?.value,
                })
              }}
            </small>
          </div>
        </div> -->
      </div>
    </div>
    <SidebarCityDrawer
      v-if="sidebars"
      v-model="sidebars"
      @selected="selectedCity"
    />
  </div>
</template>

<style lang="scss">
.checkouts-title {
  @apply tw-text-primary tw-font-treble-bold tw-text-[20px] tw-mb-5 lg:tw-w-full;
}

.checkout-title {
  @apply tw-text-primary tw-font-treble-bold lg:tw-w-full tw-justify-center tw-text-[24px] tw-flex tw-mb-6;
}

.summary-section {
  @apply lg:tw-fixed lg:tw-pt-0 lg:tw-right-0 tw-h-full lg:tw-min-h-full lg:tw-min-w-[368px] lg:tw-max-w-[470px] lg:tw-w-full lg:tw-top-0 lg:tw-overflow-y-auto lg:tw-pb-16;
  @apply max-lg:tw-relative max-lg:tw-w-full max-lg:tw-mt-5;
  background-color: #f5f6fa;

  .dogs-products-recieved {
    @apply lg:tw-min-h-[80px] max-lg:tw-min-h-[110px];
    border-bottom: 3px solid white;

    .head {
      @apply tw-flex tw-justify-between tw-mt-3;
      border-bottom: 1px dashed #cfd7e8;

      .dogs-name {
        @apply tw-text-primary tw-text-[16px];
        font-family: 'heading-pro-treble-bold';
      }
    }

    .summary {
      @apply tw-flex tw-justify-between tw-mt-3;

      .price {
        @apply tw-text-[13px] tw-text-[#25282B];
        font-family: 'heading-pro-treble-bold';
      }

      .quantity {
        @apply tw-text-primary tw-text-[12px] tw-flex tw-cursor-pointer;
      }
    }

    .number-list {
      @apply tw-text-[13px] tw-text-[#575E6B] lg:tw-pl-6 max-lg:tw-pl-8;

      ul {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    }
  }

  .add-container {
    @apply tw-flex tw-items-center tw-justify-center tw-h-[70px];
    border-bottom: 3px solid white;

    .add-pet {
      @apply tw-text-primary tw-text-[15px];
      font-family: 'heading-pro-treble-regular';
    }
  }

  .payment {
    @apply tw-py-5 tw-flex tw-flex-col tw-gap-3;
    border-bottom: 3px solid white;
    p {
      @apply tw-text-[14px] tw-text-[#575E6B];
    }
    .total {
      @apply tw-text-[16px] tw-text-[#1A1A29];
      font-family: 'heading-pro-treble-bold';
      border-top: 2px solid #cfd7e8;
      width: 100%;
    }
  }

  .summary-discount {
    @apply tw-flex tw-justify-between tw-px-8  tw-items-center tw-my-4;

    .discount-text {
      @apply tw-text-[#2B7EE2] tw-flex;
    }
  }
}
</style>
