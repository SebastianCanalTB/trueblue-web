<script setup lang="ts">
const allProductsStore = useAllProductsStore()
const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)
const { getAllFormsData: allForms } = storeToRefs(allProductsStore)
const { t } = useI18n()

const emit = defineEmits([
  'update:modelValue',
  'restartForms',
  'edit-order',
  'go-back',
])

const openPanels = ref<any[]>([])

const addOrder = () => {
  emit('restartForms')
}

const deleteOrder = (index: number) => {
  allProductsStore.deleteSelectedAllFromData(index)
  if (openPanels.value[index]) {
    openPanels.value[index].hide()
  }
}

const editOrder = (index: number) => {
  emit('edit-order', index)
  if (openPanels.value[index]) {
    openPanels.value[index].hide()
  }
}

const setPanelRef = (el: any, index: number) => {
  if (el) {
    openPanels.value[index] = el
  }
}

const openMenu = (event: Event, index: number) => {
  if (openPanels.value[index]) {
    openPanels.value[index].toggle(event)
  }
}

const getFrequencyLabel = (frecuency: number) => {
  return t(`create.main.content.texts.frecuency${frecuency}`)
}

const onSubmit = () => {
  // No-op: confirmation step does not submit
}

onMounted(() => {
  emit('update:modelValue', true)
})

defineExpose({
  onSubmit,
})
</script>

<template>
  <div class="create-container confirmation-step">
    <div class="tw-w-full lg:tw-mt-14">
      <h1
        class="title-create lg:!tw-w-full tw-flex tw-flex-col max-lg:!tw-pt-3"
      >
        {{ $t('create.confirmation.title') }}
      </h1>
      <p
        class="tw-text-center tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book tw-mt-2"
      >
        {{ $t('create.confirmation.subtitle') }}
      </p>
    </div>

    <!-- Pet summaries -->
    <div class="tw-w-full tw-mt-8">
      <div
        v-for="(form, index) in allForms"
        :key="index"
        class="confirmation-pet-card"
      >
        <div class="pet-card-header">
          <div class="tw-flex tw-items-center tw-gap-3">
            <img
              src="/icons/registry/ic_dog_pad_pet.svg"
              alt="ic_dog_pad"
              width="24px"
              height="24px"
            />
            <span class="pet-card-name">
              {{ form.pets?.form1?.name }}
            </span>
          </div>
          <div class="tw-flex tw-items-center tw-gap-3">
            <i
              v-if="allForms.length > 1"
              @click="openMenu($event, index)"
              class="pi pi-ellipsis-h"
              style="color: #5f6368; cursor: pointer; font-size: 20px"
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

        <div class="pet-card-body">
          <div class="pet-detail-row">
            <span class="pet-detail-label">{{
              $t('create.confirmation.age')
            }}</span>
            <span class="pet-detail-value">
              {{ form.pets?.form1?.years }}
              {{ $t('create.confirmation.years') }}
              {{ form.pets?.form1?.months }}
              {{ $t('create.confirmation.months') }}
            </span>
          </div>
          <div class="pet-detail-row">
            <span class="pet-detail-label">{{
              $t('create.confirmation.weight')
            }}</span>
            <span class="pet-detail-value">
              {{ form.pets?.form2?.actualWeight }} kg
            </span>
          </div>
          <div class="pet-detail-row">
            <span class="pet-detail-label">{{
              $t('create.confirmation.grammage')
            }}</span>
            <span class="pet-detail-value">
              {{ form.grammage }} g/{{ $t('create.confirmation.perDay') }}
            </span>
          </div>

          <div class="pet-detail-row">
            <span class="pet-detail-label">{{
              $t('create.confirmation.frequency')
            }}</span>
            <span class="pet-detail-value">
              {{ getFrequencyLabel(form.idealPlan?.frecuency) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add pet button -->
    <div class="add-container tw-mt-6">
      <Button
        @click="addOrder()"
        class="app-general-button app-btn-add-pet"
        :label="t('create.main.content.4.orderSummary.add')"
        icon="pi pi-plus"
        style="width: 246px; height: 40px"
      />
    </div>
  </div>
</template>

<style lang="scss">
.confirmation-step {
  @apply tw-flex tw-flex-col tw-items-center;

  .confirmation-pet-card {
    @apply tw-bg-white tw-rounded-[16px] tw-p-5 tw-mb-4 lg:tw-max-w-[600px] tw-mx-auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .pet-card-header {
      @apply tw-flex tw-justify-between tw-items-center tw-pb-3 tw-mb-3;
      border-bottom: 1px dashed #cfd7e8;

      .pet-card-name {
        @apply tw-text-[#003B71] tw-text-[18px];
        font-family: 'heading-pro-treble-bold';
      }
    }

    .pet-card-body {
      @apply tw-flex tw-flex-col tw-gap-2;

      .pet-detail-row {
        @apply tw-flex tw-justify-between tw-items-center tw-py-1;

        .pet-detail-label {
          @apply tw-text-[#8BA0C9] tw-text-[13px];
          font-family: 'heading-pro-treble-regular';
        }

        .pet-detail-value {
          @apply tw-text-[#1A1A29] tw-text-[13px] tw-text-right;
          font-family: 'heading-pro-treble-bold';
        }
      }
    }
  }

  .add-container {
    @apply tw-flex tw-items-center tw-justify-center tw-h-[70px];
  }
}
</style>
