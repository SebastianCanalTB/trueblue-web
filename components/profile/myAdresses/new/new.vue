<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Loader } from '@googlemaps/js-api-loader'
const emit = defineEmits(['close-edit'])
const props = defineProps({
  addressId: {
    type: Number,
    required: false,
  },
})
const systemStore = useSystemStore()
const addressStore = useAddressStore()
const accountStore = useAccountStore()
const { getListCities: cities, getListMunicipalities: municipalities } =
  storeToRefs(accountStore)
const { isMovil } = storeToRefs(systemStore)
const { getOneAddress: myAddress } = storeToRefs(addressStore)
const config = useRuntimeConfig()
const { t } = useI18n()
const cityNameById = ref('')
const map = ref(null)
const sidebars = ref(false)
const citiesRef = ref()
const autocompleteInput = ref(null)
const route = useRoute()
const { handleSubmit, errors, meta, setErrors, resetForm, resetField } =
  useForm({
    validationSchema: toTypedSchema(
      z.object({
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
        check: z.boolean().optional(),
        latitude: z.number().optional().nullable(),
        longitude: z.number().optional().nullable(),
      }),
    ),
  })
const { value: address, setValue: setAddress } = useField<string | null>(
  'address',
)
const { value: city, setValue: setCity } = useField<number | null>('city')
const { value: municipality, setValue: setMunicipality } = useField<
  number | null
>('municipality')
const { value: complement } = useField<string | null>('complement')
const { value: latitude, setValue: setLatitude } = useField<number>('latitude')
const { value: longitude, setValue: setLongitude } =
  useField<number>('longitude')
const { value: check } = useField('check', undefined, { initialValue: false })
const disabledEditMode = () => {
  emit('close-edit', false)
}
const selectedCity = (_id: any) => {
  sidebars.value = false
  setCity(_id)
}
const openSidebarInsteadOfDropdown = () => {
  if (!isMovil.value) {
    return
  }
  sidebars.value = true
  citiesRef.value.hide()
}
const onSubmit = handleSubmit(async (values: any) => {
  useLoading(true)
  const sendData = ref({
    city: values.municipality,
    address: values.address,
    complement: values.complement,
    predetermined: values.check,
    latitude: values.latitude ? values.latitude.toString() : '',
    longitude: values.longitude ? values.longitude.toString() : '',
  })
  if (route.query.id !== '0') {
    const response = await addressStore.editAddress(
      sendData.value,
      +route.query.id,
    )
    if (response.status && response.code === 100) {
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
  } else {
    const response = await addressStore.createAddress(sendData.value)
    if (response.status && response.code === 100) {
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
  }

  useLoading(false)
})

const isInitialLoad = ref(true)
let mapInstance = null
let currentMarker = null
let googleObj = null
let autocompleteInstance = null
const lastSelectedAddress = ref('')

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

          setErrors({
            ...errors.value,
            latitude:
              'La latitud es requerida. Por favor seleccione una dirección del autocompletado.',
            longitude:
              'La longitud es requerida. Por favor seleccione una dirección del autocompletado.',
          })
        }
      })
    }
  }
}

const loadExistingAddress = async () => {
  if (route.query.id === '0') {
    return
  }
  await addressStore.getAddressById(route.query.id)
  await accountStore.getMunicipalities(
    useSearchItemJson('cities.cityGroup.id', myAddress.value),
  )
  isInitialLoad.value = true
  resetForm({
    values: {
      city: useSearchItemJson('cities.cityGroup.id', myAddress.value),
      municipality: useSearchItemJson('cities.id', myAddress.value),
      address: useSearchItemJson('address', myAddress.value),
      complement: useSearchItemJson('complement', myAddress.value) || '',
      latitude:
        useSearchItemJson('latitude', myAddress.value) &&
        +useSearchItemJson('latitude', myAddress.value) !== 0
          ? +useSearchItemJson('latitude', myAddress.value)
          : undefined,
      longitude:
        useSearchItemJson('longitude', myAddress.value) &&
        +useSearchItemJson('longitude', myAddress.value) !== 0
          ? +useSearchItemJson('longitude', myAddress.value)
          : undefined,
      check: useSearchItemJson('predetermined', myAddress.value),
    },
  })

  lastSelectedAddress.value = address.value
  if (autocompleteInput.value && address.value) {
    autocompleteInput.value.value = address.value
  }

  await accountStore.getMunicipalities(
    useSearchItemJson('cities.cityGroup.id', myAddress.value),
  )

  if (municipality.value) {
    const selectedMuni = municipalities.value.find(
      (c) => c.id === municipality.value,
    )
    if (selectedMuni) {
      cityNameById.value = selectedMuni.name
        .normalize('NFD')
        .replace(/[\u0300-\u036F]/g, '')
      updateCityRestrictions(cityNameById.value)
    }
  }

  if (latitude.value && longitude.value && mapInstance && googleObj) {
    const position = { lat: latitude.value, lng: longitude.value }
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

  nextTick(() => {
    isInitialLoad.value = false
  })
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

const totalCities = ref(0)

const loadingCities = ref(false)
const loadInitialCities = async () => {
  loadingCities.value = true
  try {
    const result = await accountStore.getCitiesRegister()
    totalCities.value = result.total || 0
  } finally {
    loadingCities.value = false
  }
}
const loadMunicipalities = async () => {
  const result = await accountStore.getMunicipalities(city.value)
}
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
watch(city, async (newValue, oldValue) => {
  if (isInitialLoad.value || newValue === oldValue) {
    return
  }
  await accountStore.getMunicipalities(newValue)

  if (autocompleteInput.value) {
    if (address.value !== '') {
      resetField('address')
      lastSelectedAddress.value = ''

      setErrors({
        ...errors.value,
        address: undefined,
      })
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
        setErrors({
          ...errors.value,
          address: undefined,
        })
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

const handlePopState = () => {
  emit('close-edit')
  window.history.pushState(null, '', window.location.href)
}

onMounted(() => {
  nextTick(async () => {
    useLoading(true)
    await loadInitialCities()
    setErrors({})
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)
    await initializeMap()

    if (route.params.id !== '0') {
      await loadExistingAddress()
    } else {
      isInitialLoad.value = false
    }

    useLoading(false)
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState)
})
</script>

<template>
  <div
    class="lg:tw-mt-10 max-lg:tw-mt-10 tw-w-full tw-flex tw-flex-col tw-items-center"
  >
    <form class="edit-page-account lg:tw-w-[880px]" @submit.prevent>
      <h3 class="title primary1 !tw-text-[32px] tw-mb-10 tw-ml-[0.5rem]">
        {{
          route.query.id && route.query.id !== '0'
            ? $t('profile.myAddresses.edit')
            : $t('profile.myAddresses.new')
        }}
      </h3>

      <div class="lg:tw-flex lg:tw-w-full lg:tw-max-w-[1000px]">
        <div class="maps lg:tw-w-1/2 !tw-p-0 tw-mr-5">
          <span class="general-dropdown solo-create normal-labels">
            <label for="username">{{ $t('forms.create.checkout.city') }}</label>
            <Select
              v-model="city"
              ref="citiesRef"
              :options="cities"
              filter
              placeholder="Selecciona"
              :autoFilterFocus="true"
              option-value="id"
              option-label="name"
              :pt="{
                overlay: 'tw-w-[40px]',
              }"
              @click.native="openSidebarInsteadOfDropdown()"
              @before-show="openSidebarInsteadOfDropdown()"
              @value-change="loadMunicipalities()"
            />
            <GeneralInputError v-if="meta.touched" :error="errors['city']" />
          </span>
          <span class="general-dropdown solo-create normal-labels">
            <label for="municipality">{{
              $t('forms.create.checkout.municipality')
            }}</label>
            <Select
              v-model="municipality"
              ref="citiesRef"
              :options="municipalities"
              :disabled="!city"
              filter
              placeholder="Selecciona"
              :autoFilterFocus="true"
              option-value="id"
              option-label="name"
              :pt="{
                overlay: 'tw-w-[40px]',
              }"
            />
            <GeneralInputError v-if="meta.touched" :error="errors['city']" />
          </span>
          <span class="general-input solo-form normal-labels">
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
            <GeneralInputError v-if="meta.touched" :error="errors['address']" />
          </span>

          <span
            class="general-input solo-form tw-col-span-2 tw-w-full normal-labels"
          >
            <label for="username">{{
              $t('forms.create.checkout.complement')
            }}</label>
            <Textarea
              v-model="complement"
              :placeholder="$t('forms.create.checkout.complementPlaceholder')"
              maxlength="100"
              style="resize: none; height: 73px; background-color: #fff"
            />
            <GeneralInputError :error="errors['complement']" />
          </span>
          <span class="tw-mt-5 tw-flex tw-items-center tw-gap-3">
            <Checkbox v-model="check" binary inputId="mark" />
            <label for="ingredient1" class="tw-text-[#575E6B] tw-text-[12px]">
              {{ $t('profile.myAddresses.mark') }}
            </label>
          </span>
        </div>
        <div class="max-lg:tw-mt-4 lg:tw-w-1/2">
          <p>
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
    <SidebarCityDrawer
      v-if="sidebars"
      v-model="sidebars"
      @selected="selectedCity"
    />
  </div>
</template>
<style lang="scss">
.p-checkbox-checked .p-checkbox-box {
  border-color: #3db5e6 !important;
  background: #3db5e6 !important;
}
</style>
