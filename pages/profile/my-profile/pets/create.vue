<script setup lang="ts">
const planStore = usePlanStore()
const router = useRouter()
const localePath = useLocalePath()

onMounted(async () => {
  useLoading(true)
  const response = await planStore.getListPlan()
  const planId = response.status && response.code === 100 && response.data?.id ? response.data.id : 0

  await router.push(
    localePath({
      name: 'profile-my-plan-id',
      params: { id: planId },
      query: { addPet: 'true' },
    }),
  )
  useLoading(false)
})
</script>

<template>
  <div class="tw-h-screen tw-flex tw-items-center tw-justify-center">
    <!-- Redireccionando... -->
  </div>
</template>
