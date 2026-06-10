<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const emit = defineEmits(['update:modelValue', 'update-data'])
/*stores*/
const createStore = useCreateStore()

/*variables*/
const { getBodyConditions: bodyConditions } = storeToRefs(createStore)
const { t } = useI18n()
const props = defineProps({
  resetForm: {
    type: Boolean,
    required: true,
  },
  editData: {
    type: Object,
    default: () => null,
  },
})
const options = [
  { value: true, label: 'Si' },
  { value: false, label: 'No' },
]

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: toTypedSchema(
    z
      .object({
        actualWeight: z
          .number({ message: t('rule.validation.require') })
          .min(0.1, { message: t('rule.validation.require') })
          .max(99.99, {
            message: t('rule.validation.length.maxNum', { number: 99.99 }),
          }),
        castrated: z.boolean({ message: t('rule.validation.require') }),
        bodyCondition: z
          .number({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        recommendedWeight: z
          .number({ message: t('rule.validation.require') })
          .min(0.1, { message: t('rule.validation.require') })
          .max(99.99, {
            message: t('rule.validation.length.maxNum', { number: 99.99 }),
          })
          .optional()
          .nullable(),
      })
      .refine(
        (data) => {
          if (data.bodyCondition !== 3) {
            return (
              data.recommendedWeight !== null &&
              data.recommendedWeight !== undefined &&
              data.recommendedWeight > 0.1
            )
          }
          return true
        },
        {
          message: t('rule.validation.require'),
          path: ['recommendedWeight'],
        },
      ),
  ),
})
const { value: actualWeight } = useField<number | null>('actualWeight')
const { value: bodyCondition, setValue: bodyConditionValue } = useField<
  number | null
>('bodyCondition')
const { value: recommendedWeight, setValue: recommendedWeightValue } = useField<
  number | null
>('recommendedWeight')
const { value: castrated, setValue: setValueCastrated } = useField<
  boolean | null
>('castrated')

const onSubmit = handleSubmit((values) => {
  emit('update-data', values)
  return values
})
const loadEditData = () => {
  if (props.editData) {
    if (props.editData.actualWeight !== undefined) {
      actualWeight.value = props.editData.actualWeight
    }

    if (props.editData.bodyCondition !== undefined) {
      bodyConditionValue(props.editData.bodyCondition)
    }

    if (props.editData.recommendedWeight !== undefined) {
      recommendedWeightValue(props.editData.recommendedWeight)
    }

    if (props.editData.castrated !== undefined) {
      setValueCastrated(props.editData.castrated)
    }
  }
}
const selectbodyCondition = (value: number) => {
  bodyConditionValue(value)
}
const getAllActivities = async () => {
  await createStore.getListBodyConditions()
}
onMounted(() => {
  nextTick(async () => {
    await getAllActivities()
    loadEditData()
  })
})
watch(
  () => props.resetForm,
  (newValue) => {
    if (newValue === true) {
      resetForm()
    }
  },
)
defineExpose({
  onSubmit,
})
watch(
  () => meta.value.valid,
  (newVal: boolean) => {
    emit('update:modelValue', newVal)
  },
)
watch(
  () => props.editData,
  (newValue) => {
    if (newValue) {
      loadEditData()
    }
  },
  { deep: true },
)

const handleWeightInput = (event: any, field: 'actualWeight' | 'recommendedWeight') => {
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
      } else {
        recommendedWeightValue(newValue)
      }
    } else {
      // Si por alguna razón es mayor a 99.9 pero no tiene 3 dígitos, lo limitamos
      const finalValue = 99.9
      if (field === 'actualWeight') {
        actualWeight.value = finalValue
      } else {
        recommendedWeightValue(finalValue)
      }
    }
  }
}
</script>

<template>
  <form class="create-container max-lg:tw-flex-col !tw-w-full tw-gap-10">
    <div class="tw-flex tw-flex-col tw-items-center tw-gap-10">
      <span
        class="general-input solo-form lg:tw-max-w-[260px] max-lg:tw-max-w-350"
      >
        <label for="username">{{ $t('forms.create.actualWeight') }}</label>
        <div class="tw-w-full tw-flex tw-flex-col tw-items-center">
          <IconField class="!tw-w-[115px]" iconPosition="right">
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
            <InputIcon class="!tw-right-5">kg</InputIcon>
          </IconField>
        </div>
        <GeneralInputError :error="errors['actualWeight']" />
      </span>

      <span
        class="general-selectButton form tw-max-w-350 tw-py-5 max-lg:tw-w-full"
      >
        <label for="sex">{{ $t('forms.create.sterilized') }}</label>
        <SelectButton
          v-model="castrated"
          option-value="value"
          option-label="label"
          :options="[...options]"
          :allowEmpty="false"
          size="large"
        />
        <GeneralInputError :error="errors['castrated']" />
      </span>
    </div>
    <div class="tw-flex tw-flex-col tw-items-center">
      <span
        class="tw-text-[#1A1A29] tw-font-treble-regular tw-text-center tw-text-[18px] tw-mb-3 tw-font-[0px]"
      >
        {{ t('create.main.content.1.bodyConditionTitle') }}
      </span>
      <div class="card-container-body-condition">
        <div
          v-for="opt in bodyConditions"
          :key="opt.id"
          class="card-body-condition"
          :class="{ selected: bodyCondition === opt.id }"
          @click="selectbodyCondition(opt.id)"
        >
          <img :src="opt.image" alt="dogs-activity" class="imgs-dogs-body" />
          <div class="content-body">
            <h3>{{ opt.bodyCondition }}</h3>
            <p>{{ opt.description }}</p>
          </div>
          <span class="app-general-button radio-btn tw-ml-3">
            <RadioButton
              :name="`body-${opt.id}`"
              :value="opt.id"
              v-model="bodyCondition"
            />
          </span>
        </div>
      </div>
      <GeneralInputError :error="errors['bodyCondition']" />
    </div>
    <div
      v-if="bodyCondition && bodyCondition !== 3"
      class="tw-flex tw-flex-col tw-items-center tw-mt-10"
    >
      <span
        class="tw-text-[#1A1A29] tw-font-treble-regular tw-text-center tw-text-[18px] tw-mb-3 tw-font-[0px]"
      >
        {{ t('forms.create.recommendedWeightLabel') }}
      </span>
      <span
        class="general-input solo-form lg:tw-max-w-[260px] max-lg:tw-max-w-350"
      >
        <div class="tw-w-full tw-flex tw-flex-col tw-items-center">
          <IconField class="!tw-w-[115px]" iconPosition="right">
            <InputNumber
              v-model="recommendedWeight"
              placeholder="00.0"
              :max="99.9"
              :maxFractionDigits="1"
              :minFractionDigits="1"
              @input="(e) => handleWeightInput(e, 'recommendedWeight')"
              :pt="{
                pcInputText: {
                  root: {
                    inputmode: 'decimal',
                  },
                },
              }"
            />
            <InputIcon class="!tw-right-5">kg</InputIcon>
          </IconField>
        </div>
        <GeneralInputError :error="errors['recommendedWeight']" />
      </span>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.card-container-body-condition {
  @apply tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-justify-center lg:tw-w-full;

  .card-body-condition {
    @apply tw-flex tw-items-center tw-bg-white tw-rounded-[10px] tw-cursor-pointer tw-transition-all tw-duration-300 tw-relative tw-border tw-border-transparent;
    @apply lg:tw-flex-col lg:tw-text-center lg:tw-p-4 lg:tw-max-w-[233px];
    @apply max-lg:tw-p-3 max-lg:tw-h-[116px];

    &:hover {
      @apply tw-border-blue-500;
    }

    &.selected {
      @apply tw-bg-[#3db5e627] tw-border-blue-500;
    }

    .imgs-dogs-body {
      @apply lg:tw-w-[150px] lg:tw-h-[85px];
      @apply max-lg:tw-w-[123px] max-lg:tw-h-auto;
    }

    .content-body {
      @apply tw-flex-1 tw-ml-5 lg:tw-ml-0 lg:tw-mt-3;

      h3 {
        @apply tw-m-0 tw-font-treble-regular lg:tw-text-[18px] max-lg:tw-text-[16px];
      }
      p {
        @apply tw-m-0 tw-mt-1 tw-text-[#575E6B] tw-font-treble-book tw-text-[14px];
      }
    }

    .radio-btn {
      @apply tw-absolute tw-right-0 tw-top-3;
    }
  }
}
</style>
