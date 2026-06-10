<script setup lang="ts">
const props = defineProps<{
  plans: any
  modelValue: boolean
}>()

const emit = defineEmits([
  'update:modelValue',
  'addPet',
  'editData',
  'editPlan',
  'createOrder',
  'handleToggle',
  'edit-date',
])

const check = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const onToggle = () => {
  emit('handleToggle')
}
</script>

<template>
  <div class="tw-mt-8">
    <div
      class="tw-flex max-lg:tw-flex-col lg:tw-justify-between lg:tw-items-center"
    >
      <div
        class="tw-flex tw-items-center max-lg:tw-w-full max-lg:tw-justify-between"
      >
        <h3 class="subtitle">{{ $t('profile.myPlan.title') }}</h3>
        <div class="tw-items-center tw-flex">
          <span class="switch-label tw-ml-4">{{
            !check ? $t('profile.myPlan.inactive') : $t('profile.myPlan.active')
          }}</span>
          <span class="general-switch solo-other">
            <ToggleSwitch v-model="check" @update:modelValue="onToggle" />
          </span>
        </div>
      </div>
      <div
        class="tw-flex lg:tw-gap-4 max-lg:tw-gap-2 max-lg:tw-w-full max-lg:tw-my-4 max-lg:tw-justify-between"
      >
        <Button
          @click="emit('addPet')"
          class="app-general-button app-btn-transparent label-primary max-lg:!tw-p-0 !tw-mr-0"
          :label="$t('button.addPet')"
          icon="pi pi-plus"
        />
        <Button
          @click="emit('editData')"
          class="app-general-button app-btn-transparent label-primary max-lg:!tw-p-0 !tw-mr-0"
          :label="$t('button.editData')"
        >
          <template #icon>
            <img src="/icons/profile/ic_edit.svg" alt="edit" />
          </template>
        </Button>
      </div>
    </div>

    <div class="tw-bg-white tw-rounded-2xl tw-py-3 tw-px-4">
      <div
        class="tw-flex max-lg:tw-flex-col max-lg:tw-items-center max-lg:tw-gap-4 lg:tw-justify-between lg:tw-items-start tw-mb-3 tw-border-b tw-border-[#EDEDF1] tw-pb-3"
      >
        <div class="max-lg:tw-w-full">
          <p
            style="
              color: #2b7ee2;
              font-family: 'heading-pro-treble-bold';
              font-size: 14px;
            "
            class="tw-mb-1"
          >
            {{ $t('profile.myPlan.nextPayment') }}
            <span style="color: #25282b">{{
              plans?.nextPayment
                ? useFormatDate(
                    useSearchItemJson('nextPayment', plans),
                    'date-table',
                  )
                : '-'
            }}</span>
          </p>
          <div class="tw-flex tw-items-center tw-gap-2 tw-mt-2">
            <p
              style="
                color: #2b7ee2;
                font-family: 'heading-pro-treble-bold';
                font-size: 14px;
              "
            >
              {{ $t('profile.myPlan.nextDelivery') }}
              <span style="color: #25282b">{{
                plans?.nextDelivery
                  ? useFormatDate(
                      useSearchItemJson('nextDelivery', plans),
                      'date-table',
                    )
                  : '-'
              }}</span>
            </p>
            <img
              src="/icons/profile/ic_edit.svg"
              alt="edit"
              class="tw-cursor-pointer"
              @click="emit('edit-date')"
            />
          </div>
        </div>
        <Button
          class="app-general-button app-btn-secundary"
          @click="emit('editPlan')"
          :label="$t('button.editPlan')"
        >
          <template #icon>
            <img
              src="/icons/profile/ic_edit.svg"
              alt="edit"
              class="tw-mr-2"
              style="
                filter: invert(36%) sepia(85%) saturate(3019%)
                  hue-rotate(204deg) brightness(96%) contrast(89%);
              "
            />
          </template>
        </Button>
      </div>

      <div class="tw-grid lg:tw-grid-cols-3 max-lg:tw-grid-cols-1 tw-gap-4">
        <Card
          v-for="(pet, index) in plans?.pets"
          :key="index"
          class="account-card"
        >
          <template #content>
            <div class="">
              <p>{{ pet.name }}</p>
              <p class="tw-mb-4">{{ pet.idealPortion }}</p>

              <div class="tw-flex tw-gap-10">
                <div
                  v-for="(prod, i) in pet.products"
                  :key="i"
                  class="tw-flex tw-items-center tw-gap-1"
                >
                  <img
                    v-if="prod.name.includes('Salmon')"
                    src="/icons/profile/ic_fish.svg"
                    alt="Pescado"
                    width="20"
                    height="20"
                  />
                  <img
                    v-else-if="prod.name.includes('Chicken')"
                    src="/icons/profile/ic_chicken.svg"
                    alt="Pollo"
                    width="20"
                    height="20"
                  />
                  <img
                    v-else
                    src="/icons/profile/ic_meat.svg"
                    alt="Carne"
                    width="20"
                    height="20"
                  />
                  <span
                    class="tw-text-25282B tw-font-treble-bold"
                    style="font-size: 14px"
                    >{{ prod.numberOfPackages }}</span
                  >
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.subtitle {
  @apply tw-text-[#575E6B] tw-text-[18px] !tw-p-0;
  font-family: 'heading-pro-treble-bold';
}
.switch-label {
  @apply tw-text-[#1A1A29] tw-font-treble-bold tw-text-[12px] tw-w-16;
}
</style>
