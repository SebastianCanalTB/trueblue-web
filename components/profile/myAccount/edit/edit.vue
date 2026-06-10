<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Loader } from '@googlemaps/js-api-loader'

const emit = defineEmits(['close-edit'])

const accountStore = useAccountStore()
const onboardingStore = useOnboardingStore()

const {
  getProfileInformation: profile,
  getListDocumentTypes: documents,
  getListCities: cities,
  getListMunicipalities: municipalities,
} = storeToRefs(accountStore)
const { getLoginUser: user } = storeToRefs(onboardingStore)

const { t } = useI18n()
const config = useRuntimeConfig()

const otpAcitve = ref(false)
const loading = ref(true)
const newPhone = ref<{ phone?: string; callingCode?: string }>({})
const code = ref(0)
const wrongCode = ref(false)
const photoUrl = ref<string>('/icons/profile/ic_my_account.svg')
const isVet = computed(() => user.value?.isVet === true)
const isBoth = computed(() => useSearchItemJson('type', user.value) === 'both')

const map = ref(null)
const autocompleteInput = ref(null)
const cityNameById = ref('')
const isInitialLoad = ref(true)
const lastSelectedAddress = ref('')
let mapInstance = null
let currentMarker = null
let googleObj = null
let autocompleteInstance = null
const predeterminedAddress = ref(null)

const personTypeOptions = [
  { value: 'natural', label: 'Natural' },
  { value: 'company', label: 'Juridica' },
]

const validationSchema = computed(() => {
  const commonFields = {
    name: z
      .string({ message: t('rule.validation.require') })
      .min(1, { message: t('rule.validation.require') }),
    surname: z
      .string({ message: t('rule.validation.require') })
      .min(1, { message: t('rule.validation.require') }),
    email: z
      .string()
      .email({ message: t('rule.validation.email') })
      .min(1, { message: t('rule.validation.require') }),
    phone: z
      .string()
      .min(9, { message: t('rule.validation.length.min') })
      .max(10, { message: t('rule.validation.length.max') }),
    photo: z
      .any()
      .refine(
        (value: any) => {
          if (photoUrl.value || !value) return true
          return value instanceof File
        },
        { message: t('rule.validation.file.require') },
      )
      .refine((value: any) => {
        if (photoUrl.value || !value) return true
        const allowedExtensions = /(.jpg|.jpeg|.png)$/i
        return allowedExtensions.exec(value?.type)
      }),
  }

  // Dirección requerida para usuario y ambos (isBoth)
  const requiredAddressFields = {
    city: z
      .number({ message: t('rule.validation.require') })
      .min(1, { message: t('rule.validation.require') }),
    municipality: z
      .number({ message: t('rule.validation.require') })
      .min(1, { message: t('rule.validation.require') }),
    address: z
      .string({ message: t('rule.validation.require') })
      .min(1, { message: t('rule.validation.require') }),
    complement: z
      .string({ message: t('rule.validation.require') })
      .min(1, { message: t('rule.validation.require') }),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
  }

  // Dirección opcional para vet puro
  const optionalAddressFields = {
    city: z.number().optional().nullable(),
    municipality: z.number().optional().nullable(),
    address: z.string().optional().nullable(),
    complement: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
  }

  const baseSchema = { ...commonFields, ...requiredAddressFields }

  if (isBoth.value) {
    return z.object({
      ...baseSchema,
      worksite: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      personType: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      userIdType: z
        .number({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      userDocument: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.length.min') }),
    })
  }

  if (isVet.value) {
    return z.object({
      ...commonFields,
      ...optionalAddressFields,
      worksite: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
    })
  }

  return z.object({
    ...baseSchema,
    personType: z
      .string({ message: t('rule.validation.require') })
      .min(1, { message: t('rule.validation.require') }),
    userIdType: z
      .number({ message: t('rule.validation.require') })
      .min(1, { message: t('rule.validation.require') }),
    userDocument: z
      .string({ message: t('rule.validation.require') })
      .min(1, { message: t('rule.validation.length.min') }),
  })
})

const { handleSubmit, errors, meta, resetForm, resetField } = useForm({
  validationSchema: computed(() => toTypedSchema(validationSchema.value)),
})

const { value: name } = useField<string | null>('name')
const { value: surname } = useField<string | null>('surname')
const { value: email } = useField<string | null>('email')
const { value: phone } = useField<string | null>('phone')
const { setValue: setPhoto } = useField<any>('photo')

const { value: city } = useField<number | null>('city')
const { value: municipality } = useField<number | null>('municipality')
const { value: address, setValue: setAddress } = useField<string | null>(
  'address',
)
const { value: complement } = useField<string | null>('complement')
const { value: latitude, setValue: setLatitude } = useField<number>('latitude')
const { value: longitude, setValue: setLongitude } =
  useField<number>('longitude')

const { value: userDocument } =
  isVet.value && !isBoth.value
    ? { value: ref(null) }
    : useField<string | null>('userDocument')
const { value: personType } =
  isVet.value && !isBoth.value
    ? { value: ref(null) }
    : useField<string | null>('personType')
const { value: userIdType } =
  isVet.value && !isBoth.value
    ? { value: ref(null) }
    : useField<number | null>('userIdType', undefined, { initialValue: 1 })

const { value: worksite } =
  isVet.value || isBoth.value
    ? useField<string | null>('worksite')
    : { value: ref(null) }

const getProfileInformation = async () => {
  useLoading(true)
  await accountStore.getProfile()
  useLoading(false)
}

const disabledEditMode = () => {
  otpAcitve.value = false
  emit('close-edit', false)
}

const saveImage = (_file: any) => {
  photoUrl.value = ''
  setPhoto(_file)
}

const userData = ref({})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onSubmit = handleSubmit(async (values: any) => {
  useLoading(true)

  const baseData = {
    firstName: values.name,
    lastName: values.surname,
    phone: values.phone,
    email: values.email,
    photo: values.photo,
  }

  const addressData = {
    cityId: values.municipality,
    address: values.address,
    complement: values.complement,
    predetermined: true,
    latitude:
      values.latitude !== undefined && values.latitude !== null
        ? values.latitude.toString()
        : '',
    longitude:
      values.longitude !== undefined && values.longitude !== null
        ? values.longitude.toString()
        : '',
  }

  userData.value = isBoth.value
    ? {
        ...baseData,
        ...addressData,
        worksite: values.worksite,
        documentType: values.userIdType,
        document: values.userDocument,
        typePerson: values.personType,
      }
    : isVet.value
      ? { ...baseData, worksite: values.worksite }
      : {
          ...baseData,
          ...addressData,
          documentType: values.userIdType,
          document: values.userDocument,
          typePerson: values.personType,
        }

  // Verificar si el teléfono cambió
  if (useSearchItemJson('phone', profile.value) !== values.phone) {
    const result = await accountStore.sendCodeProfileUpdate({
      indicative: '+57',
      phone: values.phone,
    })

    code.value = result?.data?.code
    newPhone.value = { phone: values.phone, callingCode: '+57' }
    otpAcitve.value = true
  } else {
    const profileResult =
      isBoth.value || !isVet.value
        ? await accountStore.editProfileInformation(userData.value)
        : await accountStore.editVetProfileInformation(userData.value)

    const success = profileResult.status && profileResult.code === 100

    useShowAlert({
      type: success ? 'success' : 'error',
      message: profileResult.message,
    })

    if (success) {
      await getProfileInformation()
      disabledEditMode()
    }
  }

  useLoading(false)
})

const sendDataWithCode = async (values: any) => {
  useLoading(true)

  const userDataCode = {
    ...userData.value,
    code: values.code,
    iv: values.iv,
  }

  const profileResult =
    isBoth.value || !isVet.value
      ? await accountStore.editProfileInformation(userDataCode)
      : await accountStore.editVetProfileInformation(userDataCode)

  const success = profileResult.status && profileResult.code === 100

  useShowAlert({
    type: success ? 'success' : 'error',
    message: profileResult.message,
  })

  if (success) {
    await getProfileInformation()
    disabledEditMode()
  }

  useLoading(false)
}

const initializeMap = async () => {
  const loader = new Loader({
    apiKey: config.public.keymaps,
    libraries: ['places'],
  })

  await loader.load()

  if (map.value && autocompleteInput.value) {
    googleObj = window.google

    mapInstance = new googleObj.maps.Map(map.value, {
      center: { lat: 4.711, lng: -74.0721 },
      zoom: 12,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
    })

    autocompleteInstance = new googleObj.maps.places.Autocomplete(
      autocompleteInput.value,
      {
        componentRestrictions: { country: 'co' },
      },
    )

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace()

      if (!place.geometry || !place.geometry.location) {
        return
      }

      const selectedAddress = place.formatted_address.includes('Cra,')
        ? place.formatted_address
        : place.formatted_address.split(',')[0].trim()
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

      currentMarker = new googleObj.maps.Marker({
        map: mapInstance,
        position: place.geometry.location,
        animation: googleObj.maps.Animation.DROP,
      })
    })
  }
}

const updateCityRestrictions = (cityName) => {
  if (!cityName || !googleObj || !mapInstance) return

  const geocoder = new googleObj.maps.Geocoder()
  geocoder.geocode({ address: cityName + ', Colombia' }, (results, status) => {
    if (status === 'OK' && results[0]) {
      const cityBounds = results[0].geometry.viewport

      mapInstance.fitBounds(cityBounds)

      if (autocompleteInstance) {
        try {
          autocompleteInstance.setBounds(cityBounds)
          autocompleteInstance.setOptions({
            strictBounds: true,
          })
        } catch (error) {
          console.error('Error al actualizar restricciones:', error)
        }
      }
    }
  })
}

watch(name, (newValue) => {
  if (newValue) name.value = newValue.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
})

watch(surname, (newValue) => {
  if (newValue) surname.value = newValue.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
})

watch(city, async (newValue, oldValue) => {
  if (isInitialLoad.value || newValue === oldValue) return
  await accountStore.getMunicipalities(newValue)
  if (autocompleteInput.value) {
    if (address.value !== '') {
      resetField('address')
      lastSelectedAddress.value = ''
    }
    resetField('municipality')
    autocompleteInput.value.value = ''
  }
  if (currentMarker) {
    currentMarker.setMap(null)
    currentMarker = null
  }
})

watch(municipality, (newValue) => {
  if (isInitialLoad.value) return
  const selectedMunicipality = municipalities.value.find(
    (c) => c.id === newValue,
  )
  if (selectedMunicipality) {
    cityNameById.value = selectedMunicipality.name
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, '')
    if (autocompleteInput.value) {
      if (address.value !== '') {
        resetField('address')
        lastSelectedAddress.value = ''
      }
      autocompleteInput.value.value = ''
    }
    if (currentMarker) {
      currentMarker.setMap(null)
      currentMarker = null
    }
    updateCityRestrictions(cityNameById.value)
  }
})

watch(address, (newValue) => {
  if (!isInitialLoad.value && newValue !== lastSelectedAddress.value) {
    setLatitude(null)
    setLongitude(null)
    if (currentMarker) {
      currentMarker.setMap(null)
      currentMarker = null
    }
  }
})

const handlePopState = () => {
  emit('close-edit')
  window.history.pushState(null, '', window.location.href)
}

onMounted(() => {
  nextTick(async () => {
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)

    useLoading(true)
    loading.value = true

    await accountStore.getCitiesRegister()
    await accountStore.getProfile()
    if (!isVet.value) {
      await accountStore.getDocumentsRegister()
    }

    photoUrl.value =
      useSearchItemJson('photoUrl', profile.value) ||
      '/icons/profile/ic_my_account.svg'

    const baseValues = {
      name: useSearchItemJson('firstName', profile.value) || '',
      surname: useSearchItemJson('lastName', profile.value) || '',
      phone: useSearchItemJson('phone', profile.value) || '',
      email: useSearchItemJson('email', profile.value) || '',
    }

    if (!isVet.value || isBoth.value) {
      predeterminedAddress.value = (profile.value.addresses || []).find(
        (a) => a.predetermined,
      )
    }

    let addressValues = {
      city: undefined,
      municipality: undefined,
      address: '',
      complement: '',
      latitude: undefined,
      longitude: undefined,
    }

    if (predeterminedAddress.value) {
      const addr = predeterminedAddress.value
      await accountStore.getMunicipalities(addr.cities.cityGroup.id)

      addressValues = {
        city: addr.cities.cityGroup.id,
        municipality: addr.cities.id,
        address: addr.address,
        complement: addr.complement || '',
        latitude:
          addr.latitude && +addr.latitude !== 0 ? +addr.latitude : undefined,
        longitude:
          addr.longitude && +addr.longitude !== 0 ? +addr.longitude : undefined,
      }

      if (autocompleteInput.value) {
        autocompleteInput.value.value = addr.address
      }
    }

    if (isBoth.value) {
      resetForm({
        values: {
          ...baseValues,
          ...addressValues,
          worksite: useSearchItemJson('vetInfo.worksite', profile.value) || '',
          userDocument: useSearchItemJson('document', profile.value) || '',
          userIdType: useSearchItemJson('documentType.id', profile.value) || 1,
          personType: useSearchItemJson('typePerson', profile.value) || '',
        },
      })
    } else if (isVet.value) {
      resetForm({
        values: {
          ...baseValues,
          ...addressValues,
          worksite: useSearchItemJson('vetInfo.worksite', profile.value) || '',
        },
      })
    } else {
      resetForm({
        values: {
          ...baseValues,
          ...addressValues,
          userDocument: useSearchItemJson('document', profile.value) || '',
          userIdType: useSearchItemJson('documentType.id', profile.value) || 1,
          personType: useSearchItemJson('typePerson', profile.value) || '',
        },
      })
    }

    loading.value = false
    useLoading(false)
    if (!isVet.value || isBoth.value) {
      await nextTick()

      await initializeMap()

      // Aplicar restricciones del municipio al autocomplete desde el inicio
      if (addressValues.municipality && municipalities.value.length) {
        const selectedMuni = municipalities.value.find(
          (c) => c.id === addressValues.municipality,
        )
        if (selectedMuni) {
          const name = selectedMuni.name
            .normalize('NFD')
            .replace(/[\u0300-\u036F]/g, '')
          updateCityRestrictions(name)
        }
      }

      if (
        addressValues.latitude !== undefined &&
        addressValues.longitude !== undefined &&
        mapInstance &&
        googleObj
      ) {
        const position = {
          lat: addressValues.latitude,
          lng: addressValues.longitude,
        }
        mapInstance.setCenter(position)
        mapInstance.setZoom(15)
        if (currentMarker) currentMarker.setMap(null)
        currentMarker = new googleObj.maps.Marker({
          map: mapInstance,
          position: position,
          animation: googleObj.maps.Animation.DROP,
        })
      } else if (mapInstance) {
        // Sin coordenadas guardadas: centrar en Bogotá sin marcador
        mapInstance.setCenter({ lat: 4.711, lng: -74.0721 })
        mapInstance.setZoom(12)
      }
    }

    isInitialLoad.value = false
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState)
})
</script>

<template>
  <div
    v-if="!loading"
    class="tw-my-10 tw-mb-20 lg:tw-pr-20"
    :class="otpAcitve ? 'tw-flex tw-justify-center' : ''"
  >
    <form v-if="!otpAcitve" class="edit-page-account" @keydown.enter="onSubmit">
      <h3 class="title primary1 !tw-text-[32px] tw-mb-10">
        {{ $t('profile.account.edit') }}
      </h3>
      <div class="tw-flex max-lg:tw-flex-col">
        <div class="max-lg:tw-justify-items-center">
          <div
            class="tw-relative"
            :class="
              useSearchItemJson('photoUrl', profile) ? 'max-lg:tw-w-auto' : ''
            "
          >
            <GeneralFilePicker
              class="tw-cursor-pointer"
              :design="{
                width: 120,
                height: 120,
                radius: 50,
              }"
              :defaultImage="
                useSearchItemJson('photoUrl', profile) === ''
                  ? '/icons/profile/ic_my_account.svg'
                  : useSearchItemJson('photoUrl', profile)
              "
              :extension="{
                validate: true,
                regex: /(.jpg|.jpeg|.png)$/i,
                imageName: '.JPG, .JPEG, .PNG',
                message: $t('rule.validation.file.extension'),
                input: 'image/jpg, image/jpeg, image/png',
              }"
              :size="{
                validate: true,
                size: 10000000,
                message: '10 MB',
              }"
              @save-image="saveImage"
            />
            <img
              v-if="useSearchItemJson('photoUrl', profile) === ''"
              class="tw-absolute tw-top-[78px] lg:tw-right-[24px] max-lg:tw-right-[73px] tw-cursor-pointer"
              src="/icons/profile/ic_camera.svg"
              alt="camera"
              height="42px"
              width="42px"
            />
            <p
              class="lg:tw-w-[168px] max-lg:tw-w-[280px] tw-h-[48px] tw-text-center tw-text-[#8BA0C9] tw-text-[12px] tw-mt-5"
            >
              {{ $t('profile.account.imgRestriction') }}
            </p>
          </div>
        </div>
        <div class="tw-w-full lg:tw-max-w-[700px] lg:tw-ml-3">
          <div class="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-mb-4 px-0">
            <span class="general-input solo-form normal-labels lg:tw-w-1/2">
              <label for="username">{{
                $t('forms.create.aboutMe.name')
              }}</label>
              <InputText
                v-model="name"
                :placeholder="$t('forms.create.aboutMe.namePlaceholder')"
                maxlength="50"
                @keydown="usePreventInvalidInput"
                @input="usePreventInvalidInput"
                @paste="useHandlePaste"
              />
              <GeneralInputError :error="errors['name']" />
            </span>
            <span class="general-input solo-form normal-labels lg:tw-w-1/2">
              <label for="username">{{
                $t('forms.create.aboutMe.surname')
              }}</label>
              <InputText
                v-model="surname"
                :placeholder="$t('forms.create.aboutMe.surnamePlaceholder')"
                maxlength="50"
                @keydown="usePreventInvalidInput"
                @input="usePreventInvalidInput"
                @paste="useHandlePaste"
              />
              <GeneralInputError :error="errors['surname']" />
            </span>
          </div>
          <div class="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-mb-4 px-0">
            <span class="general-input form-group normal-labels lg:tw-w-1/2">
              <label for="age">{{ t('forms.create.aboutMe.phone') }}</label>
              <div class="flex gap-3">
                <InputGroup>
                  <InputGroupAddon>
                    <span class="tw-text-[#3db5e6] tw-font-medium tw-px-2"
                      >+57</span
                    >
                  </InputGroupAddon>
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
                  />
                </InputGroup>
              </div>
              <GeneralInputError :error="errors['phone']" />
            </span>
            <span class="general-input solo-form normal-labels lg:tw-w-1/2">
              <label for="username">{{
                $t('forms.create.aboutMe.email')
              }}</label>
              <InputText
                v-model="email"
                :placeholder="
                  $t('forms.create.aboutMe.emailPlaceholder', { at: '@' })
                "
              />
              <GeneralInputError :error="errors['email']" />
            </span>
          </div>

          <div v-if="isVet || isBoth" class="tw-flex tw-gap-4 tw-mb-4">
            <span class="general-input solo-form normal-labels tw-w-full">
              <label for="worksite">{{
                $t('forms.create.aboutMe.worksite')
              }}</label>
              <InputText
                v-keyfilter="/^[0-9a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/"
                v-model="worksite"
                :placeholder="$t('forms.create.aboutMe.worksite')"
                maxlength="100"
              />
              <GeneralInputError :error="errors['worksite']" />
            </span>
          </div>

          <div
            v-if="!isVet || isBoth"
            class="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-mb-4"
          >
            <span
              class="general-selectButton form normal-label lg:tw-max-w-[50%]"
            >
              <label for="frecuency">
                {{ $t('forms.create.type.title') }}
              </label>
              <SelectButton
                v-model="personType"
                option-value="value"
                option-label="label"
                :options="[...personTypeOptions]"
                :allowEmpty="false"
                size="large"
              />
              <GeneralInputError :error="errors['personType']" />
            </span>
            <span class="general-input form-group normal-labels lg:tw-w-1/2">
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
                    v-model="userDocument"
                    type="tel"
                    placeholder="00000000000000"
                    mask="99999999999999"
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
              <GeneralInputError :error="errors['userDocument']" />
            </span>
          </div>

          <!-- Address Fields -->
          <div v-if="!isVet || isBoth" class="tw-mt-10">
            <h4 class="tw-font-treble-bold tw-text-[18px] tw-mb-5">
              {{ $t('profile.myAddresses.edit') }}
            </h4>
            <div class="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-mb-4">
              <span
                class="general-dropdown solo-create normal-labels lg:tw-w-1/2"
              >
                <label for="city">{{ $t('forms.create.checkout.city') }}</label>
                <Select
                  v-model="city"
                  :options="cities"
                  filter
                  placeholder="Selecciona"
                  option-value="id"
                  option-label="name"
                />
                <GeneralInputError
                  v-if="meta.touched"
                  :error="errors['city']"
                />
              </span>
              <span
                class="general-dropdown solo-create normal-labels lg:tw-w-1/2"
              >
                <label for="municipality">{{
                  $t('forms.create.checkout.municipality')
                }}</label>
                <Select
                  v-model="municipality"
                  :options="municipalities"
                  :disabled="!city"
                  filter
                  placeholder="Selecciona"
                  option-value="id"
                  option-label="name"
                />
                <GeneralInputError
                  v-if="meta.touched"
                  :error="errors['municipality']"
                />
              </span>
            </div>
            <div class="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-mb-4">
              <span class="general-input solo-form normal-labels lg:tw-w-1/2">
                <label for="address">{{
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
              <span class="general-input solo-form normal-labels lg:tw-w-1/2">
                <label for="complement">{{
                  $t('forms.create.checkout.complement')
                }}</label>
                <InputText
                  v-model="complement"
                  :placeholder="
                    $t('forms.create.checkout.complementPlaceholder')
                  "
                  maxlength="100"
                />
                <GeneralInputError :error="errors['complement']" />
              </span>
            </div>
            <div class="tw-mt-5">
              <p class="tw-text-[14px] tw-mb-2">
                {{ $t('forms.create.checkout.mapPlaceholder') }}
              </p>
              <div
                ref="map"
                class="tw-rounded-xl"
                style="height: 250px; width: 100%"
              ></div>
              <GeneralInputError :error="errors['latitude']" />
            </div>
          </div>
        </div>
      </div>
      <div class="tw-flex lg:tw-max-w-[869px] tw-justify-end tw-mt-5">
        <span
          @click="disabledEditMode()"
          class="cancel-btn tw-mr-7 tw-cursor-pointer"
        >
          {{ $t('create.footer.cancel') }}
        </span>
        <Button
          class="app-general-button btn-solo-create !tw-w-[144px]"
          @click="onSubmit()"
        >
          {{ $t('profile.myPlan.update') }}
        </Button>
      </div>
    </form>
    <LoginSecondStep
      v-if="otpAcitve"
      @goBack="otpAcitve = false"
      @send-data-profile="sendDataWithCode"
      :code="code"
      :wrong="wrongCode"
      :phone="newPhone"
    />
  </div>
</template>
<style scoped lang="scss">
.edit-page-account {
  @apply tw-mt-11 lg:tw-ml-[15%];
  .cancel-btn {
    @apply tw-cursor-pointer;
    color: #8ba0c9;
    font-size: 15px;
  }
}
</style>
