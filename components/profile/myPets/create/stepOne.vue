<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

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

const loading = ref(true)
const sidebars = ref(false)
const listDogs = ref([])
const route = useRoute()
const dogsRef = ref()
const props = defineProps({
  petData: {
    type: Object,
    required: false,
  },
  editingInfo: {
    type: Object,
    required: false,
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
              const number = value
              if (number > 11) {
                return false
              } else {
                return true
              }
            },
            { message: t('rule.validation.months') },
          ),
        actualWeight: z
          .number({ message: t('rule.validation.require') })
          .min(0.1, { message: t('rule.validation.require') })
          .max(99.99, {
            message: t('rule.validation.length.maxNum', { number: 99.99 }),
          }),
        recommendedWeight: z
          .number({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        portions: z.boolean({ message: t('rule.validation.require') }),
        castrated: z.boolean({ message: t('rule.validation.require') }),
        dogActive: z.number().min(1, { message: t('rule.validation.require') }),
      })
      .refine(
        (data) => {
          const yearsNumber = parseInt(data.years, 10)
          const monthsNumber = parseInt(data.months, 10)
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
const { value: years } = useField<number | null>('years', undefined, {
  initialValue: 0,
})
const { value: months } = useField<number | null>('months', undefined, {
  initialValue: 0,
})
const { value: portions, setValue: setPortionsValue } = useField<
  boolean | null
>('portions')
const { value: actualWeight } = useField<number | null>('actualWeight')
const { value: recommendedWeight, setValue: setValueRecommendedWeigth } =
  useField<number>('recommendedWeight')
const { value: castrated, setValue: setCastrated } =
  useField<boolean>('castrated')
const { value: dogActive, setValue: setDogActive } =
  useField<number>('dogActive')
const selectedDog = (_id: any) => {
  sidebars.value = false
  setRace(_id)
}
const selectedRecommendedWeight = (value) => {
  recommendedWeight.value = value
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
  if (Number(route.query.id) !== 0) {
    await updateData()
  } else {
    if (parametrization.value.isMixedFood === false) {
      setPortionsValue(false)
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

const selectActivity = (id) => {
  setDogActive(id)
}
const selectPortion = (value: number) => {
  setPortionsValue(value)
}
const updateData = async () => {
  resetForm({
    values: {
      name: useSearchItemJson('name', myPet.value),
      raze: useSearchItemJson('race.id', myPet.value),
      years: useSearchItemJson('age', myPet.value),
      months: useSearchItemJson('month', myPet.value),
      genre: useSearchItemJson('sex', myPet.value),
      actualWeight: useSearchItemJson('currentWeight', myPet.value),
      castrated: useSearchItemJson('sterilization', myPet.value),
      dogActive: useSearchItemJson('petsActivity.id', myPet.value),
      recommendedWeight: useSearchItemJson('bodyCondition.id', myPet.value),
      portions: useSearchItemJson('isMixedFood', myPet.value) || false,
    },
  })
}

const onSubmit = handleSubmit((values) => {
  emit('update-data', { ...values, petId: Number(route.query.id) })
  return values
})
watch(
  () => meta.value.valid,
  (newVal) => {
    emit('update:modelValue', newVal)
  },
)

onMounted(() => {
  nextTick(async () => {
    await getDogs()
  })
})
defineExpose({
  onSubmit,
})
</script>

<template>
  <div
    v-if="!loading"
    class="tw-mb-10 max-lg:tw-mt-5 lg:tw-ml-[10%] lg:!tw-max-w-[740px]"
  >
    <div v-if="Number(route.query.id) !== 0" class="tw-flex tw-gap-3 tw-mb-10">
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
    <div class="flex lg:tw-gap-3 max-lg:tw-gap-0 max-lg:tw-flex-col">
      <span class="general-input solo-form normal-labels lg:tw-w-1/2">
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
      <span class="general-dropdown solo-create normal-labels lg:tw-w-1/2">
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

    <div class="tw-flex tw-gap-3 max-lg:tw-flex-col tw-w-full">
      <span
        class="general-selectButton form normal-label tw-max-w-[50%] tw-pb-5 max-lg:tw-w-full"
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
        class="general-input form-group normal-labels max-lg:tw-max-w-350 tw-w-full"
      >
        <label for="age">{{ t('forms.create.age.title') }}</label>
        <div class="flex gap-3">
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

    <div class="tw-flex lg:tw-gap-3 tw-w-full max-lg:tw-flex-col">
      <span class="general-input solo-form normal-labels lg:tw-w-1/2">
        <label for="username">{{ $t('forms.create.actualWeight') }}</label>
        <IconField iconPosition="right">
          <InputNumber
            v-model="actualWeight"
            placeholder="0"
            :max="99.99"
            :maxFractionDigits="2"
            :pt="{
              pcInputText: {
                root: {
                  inputmode: 'numeric',
                },
              },
            }"
          />
          <InputIcon>{{ $t('common.kg') }}</InputIcon>
        </IconField>
        <GeneralInputError :error="errors['actualWeight']" />
      </span>

      <span
        class="general-selectButton form normal-label tw-max-w-350 max-lg:tw-w-full"
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
    <span v-if="parametrization.isMixedFood">
      <label class="label-texts !tw-text-[15px]">{{
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
    </span>
    <span class="tw-my-5">
      <GeneralPetsBodyConditions
        :initialValue="recommendedWeight"
        :reset="false"
        @update:condition="selectedRecommendedWeight"
      />
      <GeneralInputError
        v-if="meta.touched"
        :error="errors['recommendedWeight']"
      />
    </span>

    <div class="card-container-activity tw-mt-5">
      <label class="label-texts !tw-text-[15px]">Nivel de actividad</label>
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
    <GeneralInputError v-if="meta.touched" :error="errors['dogActive']" />
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
.title-create {
  @apply tw-w-full tw-text-[18px] lg:tw-pl-2 max-lg:tw-pt-12;
  @apply max-lg:tw-text-[16px] max-lg:tw-text-center;
  color: #575e6b;
  font-family: 'heading-pro-treble-bold';
}
</style>
