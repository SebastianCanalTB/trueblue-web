<script setup lang="ts">
const props = defineProps<{
  show: boolean
  plans: any
  nextBusinessDay: Date
}>()

const emit = defineEmits(['close', 'confirm', 'changePaymentMethod'])

const localePath = useLocalePath()
const router = useRouter()
</script>

<template>
  <GeneralDialog :show="show" @close="emit('close')" :width="'591px'">
    <div class="tw-p-5">
      <div class="tw-flex tw-justify-between">
        <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
          $t('profile.myPlan.newOrderDialog.title')
        }}</span>
        <Button
          class="app-general-button app-btn-transparent label-primary"
          icon="pi pi-times"
          @click="emit('close')"
        />
      </div>
      <div class="tw-mt-2">
        <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
          {{
            $t('profile.myPlan.newOrderDialog.message', {
              deliveryDate: useFormatDate(
                nextBusinessDay.toISOString(),
                'date-table',
              ),
              price: useFormatPrice(useSearchItemJson('total', plans)),
              lastDigits: useSearchItemJson('card.lastFour', plans),
            })
          }}
        </p>

        <div class="tw-flex tw-mt-11 tw-w-full tw-justify-between">
          <Button
            class="app-general-button app-btn-transparent"
            :label="$t('button.changePaymentMethod')"
            @click="emit('changePaymentMethod')"
          />
          <Button
            class="app-general-button btn-solo-create"
            :label="$t('button.createOrder')"
            style="width: 250px"
            autofocus
            @click="emit('confirm')"
          />
        </div>
      </div>
    </div>
  </GeneralDialog>
</template>
