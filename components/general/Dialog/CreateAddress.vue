<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Loader } from '@googlemaps/js-api-loader'
import { ref, watch, nextTick } from 'vue'
const isInitialLoad = ref(true)


const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  isForOrder: {
    type: Boolean,
    default: false,
    required: false,
  },
  blockCitiesSelection: {
    type: Boolean,
    default: false,
    required: false,
  },
  cityId: {
    type: Number,
    default: null,
    required: false,
  },
  municipalityId: {
    type: Number,
    default: null,
    required: false,
  },
  address: {
    type: String,
    default: null,
    required: false,
  },
  complement: {
    type: String,
    default: null,
    required: false,
  },
})

const emit = defineEmits(['update:show', 'addressCreated', 'backToList'])
const systemStore = useSystemStore()
const accountStore = useAccountStore()

const { getListCities: cities, getListMunicipalities: municipalities } =
  storeToRefs(accountStore)
const { isMovil } = storeToRefs(systemStore)
const showAddressCreateDialog = ref(props.show)

watch(
  () => props.show,
  async (newValue) => {
    showAddressCreateDialog.value = newValue
    if (newValue) {
      isInitialLoad.value = true
      await getItems()
      setErrors({})
    }
  },
)

watch(showAddressCreateDialog, (newValue) => {
  emit('update:show', newValue)
})

watch(
  () => props.address,
  (newVal) => {
    if (newVal && showAddressCreateDialog.value) {
      const formattedAddress = newVal.includes('Cra,')
        ? newVal
        : newVal.split(',')[0].trim()
      setAddress(formattedAddress)
      lastSelectedAddress.value = formattedAddress
      if (autocompleteInput.value) {
        autocompleteInput.value.value = formattedAddress
      }
    }
  },
  { immediate: true },
)

const { t } = useI18n()
const config = useRuntimeConfig()
const addressStore = useAddressStore()
const map = ref<HTMLElement | null>(null)
let currentMarker: any = null
const cityNameById = ref('')
const cityToShow = ref('')
const municipalityNameById = ref('')
const { handleSubmit, errors, meta, setErrors, resetField } = useForm({
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
      check: z.boolean({ message: t('rule.validation.require') }).optional(),
      latitude: z.number().optional().nullable(),
      longitude: z.number().optional().nullable(),
    }),
  ),
})

/* Variables*/
const { value: newAddress, setValue: setAddress } = useField<string | null>(
  'address',
)
const { value: city, setValue: setCity } = useField<number | null>('city')
const { value: municipality, setValue: setMunicipality } = useField<
  number | null
>('municipality')
const { value: complement, setValue: setComplement } = useField<string | null>(
  'complement',
)
const { value: latitude, setValue: setLatitude } = useField<number | null>(
  'latitude',
)
const { value: longitude, setValue: setLongitude } = useField<number | null>(
  'longitude',
)

const lastSelectedAddress = ref('')

const getItems = async () => {
  if (props.address) {
    const formattedAddress = props.address.includes('Cra,')
      ? props.address
      : props.address.split(',')[0].trim()
    setAddress(formattedAddress)
    lastSelectedAddress.value = formattedAddress
    if (autocompleteInput.value) {
      autocompleteInput.value.value = formattedAddress
    }
  }

  if (props.complement) {
    setComplement(props.complement)
  }

  useLoading(true)
  await accountStore.getCitiesRegister()

  if (props.cityId) {
    setCity(props.cityId)
    const selectedCity = cities.value.find((c) => c.id === props.cityId)
    if (selectedCity) {
      cityToShow.value = selectedCity.name
    }
    await accountStore.getMunicipalities(props.cityId)
    if (props.municipalityId) {
      setMunicipality(props.municipalityId)

      const selectedMunicipality = municipalities.value.find(
        (m) => m.id === props.municipalityId,
      )
      if (selectedMunicipality) {
        cityNameById.value = selectedMunicipality.name
          .normalize('NFD')
          .replace(/[\u0300-\u036F]/g, '')
        municipalityNameById.value = selectedMunicipality.name
      }
    }
  }

  isInitialLoad.value = false
  useLoading(false)
}

onMounted(() => {
  nextTick(async () => {
    await getItems()
    setErrors({})
  })
})

const handleAddressCreation = handleSubmit(async (values) => {
  useLoading(true)
  const sendData = ref({
    city: values.municipality,
    address: values.address,
    complement: values.complement,
    predetermined: false,
    latitude: values.latitude ? values.latitude.toString() : '',
    longitude: values.longitude ? values.longitude.toString() : '',
  })
  if (props.isForOrder) {
    emit('addressCreated', sendData.value)
    useLoading(false)
    return
  }
  try {
    const response = await addressStore.createAddress(sendData.value)
    if (response.status && response.code === 100) {
      useShowAlert({
        type: 'success',
        message: response.message,
      })

      emit('addressCreated')

      showAddressCreateDialog.value = false

      setAddress('')
      setLatitude(null)
      setLongitude(null)
      if (autocompleteInput.value) {
        autocompleteInput.value.value = ''
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
      message: 'Error al crear la dirección',
    })
  } finally {
    useLoading(false)
  }
})

const goBackToAddressList = () => {
  showAddressCreateDialog.value = false
  emit('backToList')
}

const autocompleteInput = ref<HTMLInputElement | null>(null)
onMounted(async () => {
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
        if (autocompleteInput.value && !isInitialLoad.value) {
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

          // setErrors({
          //   ...errors.value,
          //   latitude: t('rule.validation.latitudRequire'),
          //   longitude: t('rule.validation.require'),
          // })
        }
      })
    }
  }
})



watch(newAddress, (newValue) => {
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
  if (isInitialLoad.value || newValue === oldValue || !newValue) {
    return
  }

  await accountStore.getMunicipalities(newValue)

  const selectedCityObj = cities.value.find((c) => c.id === newValue)
  if (selectedCityObj) {
    cityNameById.value = selectedCityObj.name
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, '')
  }

  if (autocompleteInput.value) {
    if (newAddress.value !== '') {
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

watch(municipality, (newValue, oldValue) => {
  if (isInitialLoad.value || newValue === oldValue) {
    return
  }

  const selectedMunicipality = municipalities.value.find(
    (c) => c.id === newValue,
  )
  if (selectedMunicipality) {
    cityNameById.value = selectedMunicipality.name
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, '')
    municipalityNameById.value = cityNameById.value
    if (autocompleteInput.value) {
      if (newAddress.value !== '') {
        newAddress.value = ''
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
  }
})
</script>

<template>
  <div>
    <GeneralDialog
      :show="showAddressCreateDialog"
      @close="showAddressCreateDialog = false"
      :width="isMovil ? '' : '776px'"
    >
      <div class="tw-p-5 tw-relative">
        <span
          class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold tw-flex tw-gap-2 tw-items-center"
        >
          <i
            class="pi pi-arrow-left"
            style="cursor: pointer"
            @click="goBackToAddressList"
          ></i
          >{{ $t('profile.myPlan.edit.cards.addressDialog.new') }}</span
        >
        <div class="tw-mt-2">
          <div class="tw-flex max-lg:tw-flex-col tw-w-full lg:tw-gap-3">
            <div class="lg:tw-w-1/2 max-lg:tw-w-full !tw-p-0">
              <span
                v-if="!blockCitiesSelection"
                class="general-dropdown solo-checkout"
              >
                <label for="username">{{
                  $t('forms.create.checkout.city')
                }}</label>
                <Select
                  v-model="city"
                  :options="cities"
                  filter
                  placeholder="Selecciona"
                  :autoFilterFocus="true"
                  :disabled="blockCitiesSelection"
                  option-value="id"
                  option-label="name"
                  :pt="{
                    overlay: 'tw-w-[40px]',
                  }"
                />
                <GeneralInputError :error="errors['city']" />
              </span>
              <div v-else class="selected-disabled"></div>

              <span
                v-if="!blockCitiesSelection"
                class="general-dropdown solo-checkout"
              >
                <label for="municipality">{{
                  $t('forms.create.checkout.municipality')
                }}</label>
                <Select
                  v-model="municipality"
                  :options="municipalities"
                  filter
                  placeholder="Selecciona"
                  :autoFilterFocus="true"
                  :disabled="!city || blockCitiesSelection"
                  option-value="id"
                  option-label="name"
                  :pt="{
                    overlay: 'tw-w-[40px]',
                  }"
                />
                <GeneralInputError :error="errors['municipality']" />
              </span>
              <div v-else class="tw-flex tw-justify-evenly lg:tw-mt-6">
                <div class="selected-disabled">
                  <span>{{ $t('forms.create.checkout.city') }}</span>
                  <p>{{ cityToShow }}</p>
                </div>
                <div class="selected-disabled">
                  <span>{{ $t('forms.create.checkout.municipality') }}</span>
                  <p>{{ municipalityNameById }}</p>
                </div>
              </div>
              <span class="general-input solo-checkout !tw-h-[99px]">
                <label for="username">{{
                  $t('forms.create.checkout.address')
                }}</label>
                <input
                  class="tw-h-[40px] tw-p-2"
                  v-model="newAddress"
                  ref="autocompleteInput"
                  type="text"
                  :placeholder="$t('forms.create.checkout.addressPlacholder')"
                />
                <!-- <GeneralInputError
                  :error="
                    errors['latitude'] === 'Expected number, received null'
                      ? $t('rule.validation.latitudRequire')
                      : errors['latitude']
                  "
                /> -->
              </span>

              <span class="general-input textarea tw-w-full">
                <label for="username">{{
                  $t('forms.create.checkout.complement')
                }}</label>
                <Textarea
                  v-model="complement"
                  :placeholder="
                    $t('forms.create.checkout.complementPlaceholder')
                  "
                  maxlength="100"
                  style="resize: none; height: 73px"
                />
                <GeneralInputError :error="errors['complement']" />
              </span>
            </div>

            <div class="tw-mt-5 lg:tw-w-1/2 max-lg:tw-w-full">
              <p>
                Asegúrate de que la dirección ingresada coincida con la
                ubicación del pin.
              </p>
              <div ref="map" style="height: 229px; width: 100%"></div>
            </div>
          </div>
          <div class="tw-flex tw-mt-11 tw-w-full tw-justify-end tw-gap-2">
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

<style scoped lang="scss">
.selected-disabled {
  @apply tw-flex tw-flex-col;

  span {
    @apply tw-text-black tw-text-[12px] tw-font-treble-bold;
  }
  p {
    @apply tw-text-black tw-text-[12px];
  }
}
</style>
