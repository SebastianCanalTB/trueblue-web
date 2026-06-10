<script lang="ts" setup>
import { PersonType } from '~/interfaces/Enums.interface'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
/* Emits */
const emit = defineEmits(['closeModal', 'sendData'])
/**
 * Stores
 */
const accountStore = useAccountStore()
const { getListDocumentTypes: documents } = storeToRefs(accountStore)
/**Props */
const props = defineProps({
  client: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
    required: false,
  },
})
const { t } = useI18n()
const buttonPersonType = Object.entries(PersonType).map(([key, value]) => ({
  key: t(`table.enums.persontype.${key}`) || key,
  value,
}))
/* Variables */
const dialog = ref(true)
const { handleSubmit, errors, resetForm } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      name: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      email: z
        .string({ message: t('rule.validation.requireEmail') })
        .email({ message: t('rule.validation.email') })
        .min(1, { message: t('rule.validation.requireEmail') }),
      documentType: z
        .number({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      phone: z
        .string({ message: t('rule.validation.require') })
        .min(10, { message: t('rule.validation.require') }),
      document: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      personType: z.preprocess(
        (val) => (val === null ? '' : val),
        z
          .string({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
      ),
    }),
  ),
})
const { value: name } = useField<string>('name')
const { value: email } = useField<string>('email')
const { value: phone } = useField<string>('phone')
const { value: document } = useField<string>('document')
const { value: localeCode } = useField<number>('localeCode')
const { value: personType } = useField<string>('personType')
const { value: documentType } = useField<number>('documentType')
const onSubmit = handleSubmit(async (values: any) => {
  emit('sendData', values)
})
/* Methods */
watch(
  () => dialog.value,
  (newVal: boolean) => {
    if (!newVal) {
      emit('closeModal')
    }
  },
)
onMounted(() => {
  nextTick(async () => {
    useLoading(true)
    await accountStore.getDocumentsAccount()
    resetForm({
      values: {
        name: props.client.name,
        email: props.client.email,
        phone: props.client.phone,
        localeCode: props.client.localeCode,
        document: props.client.identification,
        documentType: props.client.user.documentType.id,
        personType: props.client.user.typePerson,
      },
    })
    useLoading(false)
  })
})
</script>

<template>
  <Dialog
    :visible="dialog"
    modal
    style="max-width: 600px; width: 100%"
    class="general-dialog"
    :closable="false"
    :draggable="false"
  >
    <template #header>
      <p class="title">{{ t('profile.myDeliveries.userEdit.title') }}</p>
    </template>
    <template #default>
      <div class="form-container">
        <div class="tw-flex tw-gap-3 max-lg:tw-flex-col">
          <span
            class="lg:tw-w-1/2 general-input solo-form normal-labels input-checkout"
          >
            <label for="name">{{
              t('profile.myDeliveries.userEdit.name')
            }}</label>
            <InputText
              v-model="name"
              v-keyfilter="/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/"
              fluid
              type="text"
              :placeholder="t('profile.myDeliveries.userEdit.name')"
            />
            <GeneralInputError :error="errors['name']" />
          </span>
          <span
            class="lg:tw-w-1/2 general-input solo-form normal-labels input-checkout"
          >
            <label for="email">{{
              t('profile.myDeliveries.userEdit.email')
            }}</label>
            <InputText
              v-model="email"
              type="email"
              :placeholder="t('profile.myDeliveries.userEdit.email')"
            />
            <GeneralInputError :error="errors['email']" />
          </span>
        </div>
        <div class="tw-flex tw-gap-3 max-lg:tw-flex-col">
          <span class="general-input form-group normal-labels input-checkout">
            <label for="age">{{
              t('profile.myDeliveries.userEdit.phone')
            }}</label>
            <div class="flex gap-3">
              <InputGroup>
                <InputGroupAddon>
                  <Select
                    v-model="localeCode"
                    option-value="value"
                    option-label="key"
                    :placeholder="'+57'"
                    :disabled="true"
                  >
                    <template #option="slotProps">
                      <div class="general">
                        {{ slotProps.option.key }}
                      </div>
                    </template>
                  </Select>
                </InputGroupAddon>
                <InputMask
                  v-model="phone"
                  :placeholder="t('profile.myDeliveries.userEdit.phone')"
                  slotChar=""
                  mask="3999999999"
                  :auto-clear="false"
                  type="tel"
                />
              </InputGroup>
            </div>
            <GeneralInputError :error="errors['phone']" />
          </span>
          <span class="general-input form-group normal-labels input-checkout">
            <label for="age">{{
              t('profile.myDeliveries.userEdit.document')
            }}</label>
            <div class="flex gap-3">
              <InputGroup>
                <InputGroupAddon>
                  <Select
                    v-model="documentType"
                    option-value="id"
                    option-label="alias"
                    :options="documents"
                    :disabled="disabled"
                    :placeholder="'CC'"
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
                        {{ slotProps.option.alias }}
                      </div>
                    </template>
                  </Select>
                </InputGroupAddon>
                <InputText
                  v-keyfilter.num
                  v-model="document"
                  fluid
                  :maxlength="10"
                  :placeholder="t('form.client.document')"
                />
              </InputGroup>
            </div>
            <GeneralInputError :error="errors['document']" />
          </span>
        </div>
        <span class="general-selectButton form normal-label lg:tw-w-1/2">
          <label for="personType">{{
            t('profile.myDeliveries.userEdit.personType')
          }}</label>
          <SelectButton
            v-model="personType"
            option-value="value"
            option-label="key"
            :disabled="disabled"
            :options="[...buttonPersonType]"
            size="large"
          />
          <GeneralInputError :error="errors['personType']" />
        </span>
      </div>
    </template>
    <template #footer>
      <span class="flex gap-4 tw-mb-4 tw-mr-7">
        <Button
          class="app-general-button app-btn-transparent"
          :label="t('button.cancel')"
          @click="emit('closeModal')"
        />
        <Button
          type="submit"
          class="app-general-button app-btn-primary px-5"
          :label="t('button.update')"
          @click="onSubmit()"
        />
      </span>
    </template>
  </Dialog>
</template>

<style lang="scss" scoped>
.form-container {
  gap: 30px;
  width: 100%;
  @apply max-lg:tw-flex max-lg:tw-flex-col max-lg:tw-gap-3 lg:tw-px-5 lg:tw-py-4;
}
</style>
