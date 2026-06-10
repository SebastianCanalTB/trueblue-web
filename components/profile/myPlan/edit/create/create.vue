<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ref, onMounted, nextTick } from 'vue'

const emit = defineEmits(['update:modelValue', 'update-data'])
const systemStore = useSystemStore()
const createStore = useCreateStore()
const accountStore = useAccountStore()
const {
  getListActivities: activites,
  getBodyConditions: bodyConditions,
  getMyPet: myPet,
  getPortionsOptions: portionsOptions,
} = storeToRefs(createStore)
const { getLisParametrization: parametrization } = storeToRefs(accountStore)
const { isMovil } = storeToRefs(systemStore)
const { t } = useI18n()
const route = useRoute()
const loading = ref(true)
const sidebars = ref(false)
const listDogs = ref([])
const dogsRef = ref()
const props = defineProps({
  planId: {
    type: Number,
    default: false,
  },
  petId: {
    type: [Number, String],
    required: false,
  },
  initialData: {
    type: Object,
    required: false,
    default: () => ({}),
  },
})
const optionsGenre = [
  { value: 'Macho', label: t('forms.create.option1') },
  { value: 'Hembra', label: t('forms.create.option2') },
]
const optionsCastrated = [
  { value: true, label: 'Si' },
  { value: false, label: 'No' },
]

const defaultValues = {
  name: '',
  raze: undefined,
  genre: '',
  years: 0,
  months: 0,
  actualWeight: undefined,
  recommendedWeight: 3,
  castrated: undefined,
  dogActive: undefined,
  portions: false,
}
const { handleSubmit, errors, meta, setErrors, resetForm } = useForm({
  validationSchema: toTypedSchema(
    z
      .object({
        name: z
          .string({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        raze: z
          .number({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        genre: z
          .string({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        years: z
          .number({ message: t('rule.validation.require') })
          .min(0, { message: t('rule.validation.multipleRequires') })
          .refine(
            (value) => {
              const number = value
              if (number > 31) {
                return false
              } else {
                return true
              }
            },
            { message: t('rule.validation.maxYears') },
          ),
        months: z
          .number({ message: t('rule.validation.require') })
          .min(0, { message: t('rule.validation.multipleRequires') })
          .refine(
            (value) => {
              const number = Number(value)
              return number <= 11
            },
            { message: t('rule.validation.months') },
          ),
        actualWeight: z
          .number({ message: t('rule.validation.require') })
          .min(0.1, { message: t('rule.validation.require') })
          .max(99.99, {
            message: t('rule.validation.length.maxNum', { number: 99.99 }),
          }),
        portions: z
          .boolean({ message: t('rule.validation.require') })
          .default(false),
        recommendedWeight: z
          .number({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        castrated: z.boolean({ message: t('rule.validation.require') }),
        dogActive: z
          .number({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
      })
      .refine(
        (data) => {
          const yearsNumber = Number(data.years)
          const monthsNumber = Number(data.months)
          return yearsNumber > 0 || monthsNumber > 0
        },
        {
          message: t('rule.validation.multipleRequires'),
          path: ['years', 'months'],
        },
      ),
  ),
})
const { value: name } = useField<string>('name')
const { value: raze, setValue: setRace } = useField<number>('raze')
const { value: genre, setValue: setGenre } = useField<string>('genre')
const { value: years } = useField<number>('years', undefined, {
  initialValue: 0,
})
const { value: months } = useField<number>('months', undefined, {
  initialValue: 0,
})
const { value: actualWeight } = useField<number | null>('actualWeight')

const { value: recommendedWeight } = useField<number>(
  'recommendedWeight',
  undefined,
  {
    initialValue: useSearchItemJson('bodyCondition.id', myPet.value) || 3,
  },
)

const { value: portions, setValue: setPortionsValue } = useField<
  boolean | null
>('portions')

const selectPortion = (value: boolean) => {
  setPortionsValue(value)
}
const { value: castrated, setValue: setCastrated } =
  useField<boolean>('castrated')
const { value: dogActive, setValue: setDogActive } =
  useField<number>('dogActive')
const selectedDog = (_id: any) => {
  sidebars.value = false
  setRace(_id)
}
const getDogs = async () => {
  loading.value = true
  const form = ref({
    filter: '',
  })
  const response = await createStore.getPets(form.value)
  await createStore.getListBodyConditions()
  listDogs.value = response.data
  await createStore.getActivities()

  if (props.petId && typeof props.petId === 'number') {
    updateIdData()
  } else {
    if (parametrization.value?.isMixedFood === false) {
      selectPortion(false)
    }
  }
  loading.value = false
}
const openSidebarInsteadOfDropdown = () => {
  if (!isMovil.value) {
    return
  }
  sidebars.value = true
  dogsRef.value.hide()
}
const updateIdData = async () => {
  await createStore.getOnePet(props.petId)

  resetForm({
    values: {
      name: useSearchItemJson('name', myPet.value),
      raze: useSearchItemJson('race.id', myPet.value),
      genre: useSearchItemJson('sex', myPet.value),
      years: useSearchItemJson('age', myPet.value),
      months: useSearchItemJson('month', myPet.value),
      actualWeight: useSearchItemJson('currentWeight', myPet.value),
      recommendedWeight: useSearchItemJson('bodyCondition.id', myPet.value),
      castrated: useSearchItemJson('sterilization', myPet.value),
      dogActive: useSearchItemJson('petsActivity.id', myPet.value),
      portions: useSearchItemJson('isMixedFood', myPet.value) || false,
    },
  })
}

const selectedRecommendedWeight = (value: number) => {
  recommendedWeight.value = value
}

const selectActivity = (id: number) => {
  setDogActive(id)
}

const onSubmit = handleSubmit((values) => {
  emit('update-data', values)
  return values
})
const handleWeightInput = (
  event: any,
  field: 'actualWeight' | 'recommendedWeight',
) => {
  const value = event.value
  if (value === null || value === undefined) return

  // Si el usuario escribe un número mayor a 99.9, intentamos ajustarlo
  // Por ejemplo, si escribe 333, lo convertimos a 33.3
  if (value > 99.9) {
    // Convertimos a string para manipular los dígitos, quitando cualquier punto previo
    const strValue = value.toString().replace('.', '')

    // Si tiene 3 o más dígitos, ponemos el punto decimal antes del último dígito
    if (strValue.length >= 3) {
      const firstTwo = strValue.substring(0, 2)
      const lastOne = strValue.substring(2, 3)
      const newValue = parseFloat(`${firstTwo}.${lastOne}`)

      if (field === 'actualWeight') {
        actualWeight.value = newValue
      }
    } else {
      // Si por alguna razón es mayor a 99.9 pero no tiene 3 dígitos, lo limitamos
      const finalValue = 99.9
      if (field === 'actualWeight') {
        actualWeight.value = finalValue
      }
    }
  }
}
watch(
  () => meta.value.valid,
  (newVal) => {
    emit('update:modelValue', newVal)
  },
)
watch(
  [
    name,
    raze,
    genre,
    years,
    months,
    actualWeight,
    recommendedWeight,
    castrated,
    dogActive,
  ],
  () => {
    const changes = []

    const nameValue = useSearchItemJson('name', myPet.value)
    if (name.value !== nameValue) {
      changes.push('Name')
    }

    const razeValue = useSearchItemJson('race.id', myPet.value)
    if (raze.value !== razeValue) {
      changes.push('Raze')
    }

    const yearsValue = useSearchItemJson('age', myPet.value).toString()
    if (+years.value !== +yearsValue) {
      changes.push('Years')
    }

    const monthsValue = useSearchItemJson('month', myPet.value).toString()
    if (+months.value !== +monthsValue) {
      changes.push('Months')
    }

    const genreValue = useSearchItemJson('sex', myPet.value)
    if (genre.value !== genreValue) {
      changes.push('Sex')
    }

    const weightValue = useSearchItemJson('currentWeight', myPet.value)
    if (actualWeight?.value !== weightValue) {
      changes.push('ActualWeight')
    }

    const recommendedValue = useSearchItemJson('bodyCondition.id', myPet.value)
    if (recommendedWeight.value !== recommendedValue) {
      changes.push('Corporal condition')
    }

    const castratedValue = useSearchItemJson('sterilization', myPet.value)
    if (castrated.value !== castratedValue) {
      changes.push('Sterilized')
    }

    const activityValue = useSearchItemJson('petsActivity.id', myPet.value)
    if (dogActive.value !== activityValue) {
      changes.push('Activity level')
    }
    if (changes.length > 0) {
      systemStore.setMenuOpen(true)
    } else {
      systemStore.setMenuOpen(false)
    }
  },
  { deep: true },
)
onMounted(() => {
  nextTick(async () => {
    await getDogs()
  })
})
watch(
  () => props.petId,
  (newVal) => {
    if (newVal !== 0) {
      if (typeof newVal === 'number') {
        updateIdData()
      } else if (
        props.initialData &&
        Object.keys(props.initialData).length > 0
      ) {
        resetForm({
          values: {
            ...defaultValues,
            ...props.initialData,
          },
        })
      }
    } else {
      resetForm({
        values: defaultValues,
      })
    }
  },
)
defineExpose({
  onSubmit,
  resetForm,
})
</script>

<template>
  <div v-if="!loading" class="tw-mb-10 max-lg:tw-mt-5 lg:!tw-max-w-[740px]">
    <div v-if="props.petId !== 0" class="tw-flex tw-gap-3 tw-mb-10">
      <img
        class="tw-mb-auto tw-mt-1"
        src="/icons/profile/ic_info-cafe.svg"
        alt="info"
        height="16px"
        width="16px"
      />
      <p class="tw-text-[11px] tw-text-[#8BA0C9]">
        {{ $t('profile.myPlan.edit.message') }}
      </p>
    </div>
    <div class="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-mb-4">
      <span class="general-input solo-form normal-labels tw-w-full lg:tw-w-1/2">
        <label for="username">{{ $t('forms.create.inputLabel') }}</label>
        <InputText
          v-model="name"
          :placeholder="$t('forms.create.inputPlaceholder')"
          maxlength="50"
          @keydown="usePreventInvalidInput"
          @input="usePreventInvalidInput"
          @paste="useHandlePaste"
        />
        <GeneralInputError :error="errors['name']" />
      </span>
      <span
        class="general-dropdown solo-create normal-labels tw-w-full lg:tw-w-1/2"
      >
        <label for="username">{{ $t('forms.create.dropdownLabel') }}</label>
        <Select
          v-model="raze"
          :options="listDogs"
          :placeholder="$t('forms.create.dropdownPlaceholder')"
          filter
          ref="dogsRef"
          :filterPlaceholder="
            $t('forms.create.searchDropdownPlaceHolder') + '. . .'
          "
          :autoFilterFocus="isMovil ? false : true"
          option-value="id"
          option-label="name"
          :pt="{
            listContainer:
              'max-lg:!tw-max-h-auto max-lg:!tw-overflow-scroll tw-z-20',
          }"
          @click.native="openSidebarInsteadOfDropdown"
          @before-show="openSidebarInsteadOfDropdown"
        />
        <GeneralInputError :error="errors['raze']" />
      </span>
    </div>

    <div class="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-w-full tw-mb-4">
      <span
        class="general-selectButton form normal-label tw-w-full lg:tw-w-1/2"
      >
        <label for="sex">{{ $t('forms.create.genre') }}</label>
        <SelectButton
          v-model="genre"
          option-value="value"
          option-label="label"
          :options="[...optionsGenre]"
          :allowEmpty="false"
          size="large"
        />
        <GeneralInputError :error="errors['genre']" />
      </span>

      <span
        class="general-input form-group normal-labels tw-w-full lg:tw-w-1/2"
      >
        <label for="age">{{ t('forms.create.age.title') }}</label>
        <div class="tw-flex tw-gap-3">
          <InputGroup>
            <InputNumber
              v-model="years"
              :placeholder="'1'"
              :max="30"
              :useGrouping="false"
              fluid
            />
            <InputGroupAddon>{{ t('forms.create.age.year') }}</InputGroupAddon>
          </InputGroup>
          <p class="tw-mt-3 tw-text-[16px]">con</p>
          <InputGroup>
            <InputNumber
              v-model="months"
              inputId="minmax"
              :min="0"
              :max="11"
              mask="9?9"
              :placeholder="'11'"
              :useGrouping="false"
              fluid
            />
            <InputGroupAddon>{{
              t('forms.create.age.months')
            }}</InputGroupAddon>
          </InputGroup>
        </div>
        <GeneralInputError
          v-if="errors.years || errors.months"
          :error="errors[errors.years ? 'years' : 'months']"
        />
      </span>
    </div>

    <div class="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-w-full tw-mb-4">
      <span class="general-input solo-form normal-labels tw-w-full lg:tw-w-1/2">
        <label for="username">{{ $t('forms.create.actualWeight') }}</label>
        <IconField iconPosition="right">
          <InputNumber
            v-model="actualWeight"
            placeholder="00.0"
            :max="99.9"
            :maxFractionDigits="1"
            :minFractionDigits="1"
            @input="(e) => handleWeightInput(e, 'actualWeight')"
            :pt="{
              pcInputText: {
                root: {
                  inputmode: 'decimal',
                },
              },
            }"
          />
          <InputIcon>{{ $t('common.kg') }}</InputIcon>
        </IconField>
        <GeneralInputError :error="errors['actualWeight']" />
      </span>

      <span
        class="general-selectButton form normal-label tw-w-full lg:tw-w-1/2"
      >
        <label for="sex">{{ $t('forms.create.sterilized') }}</label>
        <SelectButton
          v-model="castrated"
          option-value="value"
          option-label="label"
          :options="[...optionsCastrated]"
          :allowEmpty="false"
          size="large"
        />
        <GeneralInputError :error="errors['castrated']" />
      </span>
    </div>
    <div v-if="parametrization.isMixedFood" class="tw-mb-4">
      <label class="label-texts !tw-text-[15px] tw-mb-2 tw-block">{{
        $t('create.main.content.1.portionTitle')
      }}</label>
      <div class="card-container-portions">
        <div
          v-for="opt in portionsOptions"
          :key="opt.id"
          class="card"
          :class="{ selected: portions === opt.id }"
          @click="selectPortion(opt.id)"
        >
          <img
            :src="opt.image"
            alt="dogs-portion"
            class="imgs-dogs-portion"
            width="153px"
            height="153px"
          />
          <div class="content">
            <h3>{{ opt.title }}</h3>
            <p>{{ opt.description }}</p>
          </div>
          <span class="app-general-button radio-btn portions">
            <RadioButton
              :name="`activity-${opt.id}`"
              :value="opt.id"
              v-model="portions"
              class="lg:!tw-top[30px]"
            />
          </span>
        </div>
      </div>
      <GeneralInputError
        :error="
          errors['portions'] === 'Required'
            ? $t('rule.validation.require')
            : errors['portions']
        "
      />
    </div>
    <div class="tw-mb-4">
      <GeneralPetsBodyConditions
        :initialValue="useSearchItemJson('bodyCondition.id', myPet)"
        @update:condition="selectedRecommendedWeight"
      />
      <GeneralInputError
        v-if="meta.touched"
        :error="errors['recommendedWeight']"
      />
    </div>

    <div class="card-container-activity tw-mt-4">
      <label class="label-texts !tw-text-[15px] tw-mb-2 tw-block">{{
        $t('create.main.content.1.activeTitle')
      }}</label>
      <div
        v-for="activity in activites"
        :key="activity.id"
        class="card"
        :class="{ selected: dogActive === activity.id }"
        @click="selectActivity(activity.id)"
      >
        <img
          :src="activity.image"
          alt="dogs-activity"
          class="imgs-dogs-activity"
        />
        <div class="content">
          <h3>{{ activity.title }}</h3>
          <p>{{ activity.description }}</p>
        </div>
        <span class="app-general-button radio-btn tw-ml-3">
          <RadioButton
            :name="`activity-${activity.id}`"
            :value="activity.id"
            v-model="dogActive"
          />
        </span>
      </div>
    </div>
    <GeneralInputError :error="errors['dogActive']" />
    <SidebarDogsDrawer
      v-if="sidebars"
      v-model="sidebars"
      @selected="selectedDog"
    />
  </div>
</template>

<style lang="scss">
.card-container-activity {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .card {
    display: flex;
    align-items: center;
    background-color: #ffffff;
    border-radius: 10px;
    cursor: pointer;
    transition:
      background-color 0.3s,
      border-color 0.3s;
    position: relative;

    &:hover {
      border-color: #007bff;
    }

    &.selected {
      background-color: #3db5e627;
      border: 1px solid #007bff;
    }

    .content {
      @apply lg:tw-ml-[37px];
      @apply max-lg:tw-ml-5;
      flex: 1;
      h3 {
        @apply lg:tw-text-[14px] tw-m-0;
        @apply max-lg:tw-text-[12px];

        font-family: 'heading-pro-treble-bold';
      }
      p {
        @apply lg:tw-text-[14px] max-lg:tw-text-[12px];
        margin: 0.2rem 0 0;
        color: #6c757d;
      }
    }
  }
}
</style>
