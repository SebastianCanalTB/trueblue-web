<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:show', 'addressCreated', 'backToList'])
const onboardingStore = useOnboardingStore()
const { getLoginUser: user } = storeToRefs(onboardingStore)
const accountStore = useAccountStore()
const otpAcitve = ref(false)
const code = ref(0)
const newPhone = ref({})
const wrongCode = ref(false)
const { getProfileInformation: profile, getListDocumentTypes: documents } =
  storeToRefs(accountStore)
const showAddressCreateDialog = ref(props.show)

watch(
  () => props.show,
  (newValue) => {
    showAddressCreateDialog.value = newValue
  },
)

watch(showAddressCreateDialog, (newValue) => {
  emit('update:show', newValue)
})

const { t } = useI18n()

const { handleSubmit, errors, meta, resetForm } = useForm({
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
      callingCode: z.string().min(1, { message: t('rule.validation.require') }),
      userIdType: z.number().min(1, { message: t('rule.validation.require') }),
      phone: z
        .string({ message: t('rule.validation.require') })
        .min(10, { message: t('rule.validation.length.min') })
        .max(10, { message: t('rule.validation.length.max') }),
      userId: z
        .number({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.length.min') }),
      personType: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
    }),
  ),
})
const codes = ref([
  {
    name: '+57',
    value: '+57',
  },
  {
    name: '+1',
    value: '+1',
  },
  {
    name: '+101',
    value: '+101',
  },
])

/* Variables*/
const { value: name } = useField<string | null>('name')
const { value: surname } = useField<string | null>('surname')
const { value: email } = useField<string | null>('email')
const { value: phone } = useField<string | null>('phone')
const { value: userId } = useField<number | null>('userId')
const { value: callingCode } = useField<string | null>(
  'callingCode',
  undefined,
  {
    initialValue: '+57',
  },
)
const { value: userIdType } = useField<number | null>('userIdType', undefined, {
  initialValue: 1,
})
const { value: personType, setValue: setPersonType } = useField<string | null>(
  'personType',
)
const options = [
  { value: 'natural', label: 'Natural' },
  { value: 'company', label: 'Juridica' },
]
const selectOption = (value) => {
  setPersonType(value)
}
const getItems = async () => {
  useLoading(true)
  await accountStore.getProfile()
  await accountStore.getDocumentsRegister()
  resetForm({
    values: {
      name: useSearchItemJson('firstName', profile.value) || '',
      surname: useSearchItemJson('lastName', profile.value) || '',
      phone: useSearchItemJson('phone', profile.value) || '',
      email: useSearchItemJson('email', profile.value) || '',
      userId: Number(useSearchItemJson('document', profile.value)) || '',
      callingCode: useSearchItemJson('countryCode', profile.value) || '',
      userIdType: useSearchItemJson('documentType.id', profile.value) || '',
      personType: useSearchItemJson('typePerson', profile.value),
    },
  })

  useLoading(false)
}
const userData = ref({})
const onSubmit = handleSubmit(async (values) => {
  useLoading(true)
  userData.value = ref({
    firstName: values.name,
    lastName: values.surname,
    phone: values.phone,
    email: values.email,
    documentType: values.userIdType,
    document: values.userId.toString(),
    photo: useSearchItemJson('photoUrl', profile.value),
    typePerson: values.personType,
  })
  if (useSearchItemJson('phone', profile.value) !== values.phone) {
    const result = await accountStore.sendCodeProfileUpdate({
      indicative: '+57',
      phone: values.phone,
    })
    code.value = result.data.code
    newPhone.value = { phone: values.phone, callingCode: values.callingCode }
    otpAcitve.value = true
  } else {
    const result = await accountStore.editProfileInformation(
      userData.value.value,
    )
    if (result.status && result.code === 100) {
      useShowAlert({
        type: 'success',
        message: result.message,
      })
      getItems()
      emit('addressCreated')
    } else {
      useShowAlert({
        type: 'error',
        message: result.message,
      })
    }
  }
  useLoading(false)
})

const sendDataWithCode = async (values) => {
  useLoading(true)
  const userDataCode = {
    ...userData.value.value,
    code: values.code,
    iv: values.iv,
  }

  const result = await accountStore.editProfileInformation(userDataCode)
  if (result.status && result.code === 100) {
    useShowAlert({
      type: 'success',
      message: result.message,
    })
    otpAcitve.value = false
    getItems()
  } else {
    useShowAlert({
      type: 'error',
      message: result.message,
    })
  }
}
watch(name, (newValue) => {
  name.value = newValue.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
})
watch(surname, (newValue) => {
  surname.value = newValue.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
})
watch(showAddressCreateDialog, (newValue: boolean) => {
  if (newValue) {
    getItems()
  }
})
onMounted(() => {
  nextTick(async () => {
    await getItems()
  })
})
</script>

<template>
  <div>
    <GeneralDialog
      :show="showAddressCreateDialog"
      @close="showAddressCreateDialog = false"
    >
      <form
        v-if="!otpAcitve"
        class="edit-page-account tw-p-5"
        @keydown.enter="onSubmit"
      >
        <h3 class="title primary1 !tw-text-[32px] tw-mb-5 tw-ml-3">
          {{ $t('profile.account.edit') }}
        </h3>
        <div class="tw-flex max-lg:tw-flex-col">
          <div class="tw-w-full">
            <div class="tw-flex tw-gap-2 tw-w-full max-lg:tw-flex-col">
              <span class="general-input solo-checkout lg:tw-w-1/2">
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
              <span class="general-input solo-checkout lg:tw-w-1/2">
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
            <div class="flex tw-gap-2 tw-w-full max-lg:tw-flex-col">
              <span class="general-input solo-checkout lg:tw-w-1/2 !tw-pt-0">
                <label for="username">{{
                  $t('forms.create.aboutMe.email')
                }}</label>
                <InputText
                  v-model="email"
                  class="!tw-h-[43px]"
                  :placeholder="
                    $t('forms.create.aboutMe.emailPlaceholder', { at: '@' })
                  "
                />
                <GeneralInputError :error="errors['email']" />
              </span>
              <span
                class="general-input form-group normal-labels checkout lg:tw-w-1/2"
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
            <div class="tw-flex max-lg:tw-flex-col tw-gap-2">
              <span
                class="general-selectButton form normal-label lg:tw-max-w-[50%]"
              >
                <label for="frecuency" class="!tw-text-[12px] !tw-mb-0">
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
                class="general-input form-group normal-labels checkout lg:tw-w-1/2"
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
                    <InputNumber
                      v-model="userId"
                      type="tel"
                      placeholder="00000000000000"
                      fluid
                      :useGrouping="false"
                      :max="99999999999999"
                    />
                  </InputGroup>
                </div>
                <GeneralInputError :error="errors['userId']" />
              </span>
            </div>
          </div>
        </div>

        <div class="tw-flex tw-w-full tw-justify-end max-lg:tw-mt-5 tw-gap-2">
          <Button
            class="app-general-button app-btn-transparent"
            :label="$t('button.cancel')"
            @click="showAddressCreateDialog = false"
          />
          <Button
            class="app-general-button btn-solo-create !tw-w-[175px]"
            :label="$t('profile.myPlan.edit.cards.addressDialog.confirm')"
            @click="onSubmit()"
          />
        </div>
      </form>
      <LoginSecondStep
        v-if="otpAcitve"
        class="tw-p-5 tw-my-5"
        @goBack="otpAcitve = false"
        @send-data-profile="sendDataWithCode"
        :code="code"
        :wrong="wrongCode"
        :phone="newPhone"
      />
    </GeneralDialog>
  </div>
</template>
<style lang="scss">
.label-texts {
  @apply tw-text-[12px] tw-text-[#1a1a29] tw-mb-1;
  font-family: 'heading-pro-treble-bold';
  font-weight: 10;
}
</style>
