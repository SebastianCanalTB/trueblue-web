<script setup lang="ts">
const route = useRoute()
const id = computed(() => route.params.id as string)
const secondSection = useState<boolean>('profile-second-section')

onMounted(() => {
  secondSection.value = true
})
</script>

<template>
  <div class="lg:tw-mr-10">
    <div class="lg:tw-px-20 lg:tw-mt-20">
      <GeneralBreadCrumb
        :routes="[
          {
            text: $t('profile.myDeliveries.title'),
            url: '/profile/my-deliveries',
          },
          {
            text: $t('profile.myDeliveries.detail.id', {
              data: id || '',
            }),
            url: route.fullPath,
          },
        ]"
      />
    </div>
    <ProfileMyDeliveriesDeliveryID :deliveryId="id" />
  </div>
</template>
