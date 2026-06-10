<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const route = useRoute()

const disabledEditMode = () => {
  router.push(localePath({ name: 'profile-my-profile' }))
}

const listRoutes = computed(() => [
  {
    text: t('profile.account.mine'),
    action: disabledEditMode,
  },
  {
    text: t('profile.account.edit'),
    url: route.fullPath,
  },
])
</script>

<template>
  <div class="tw-w-full lg:tw-px-20 tw-mt-[5rem]">
    <GeneralBreadCrumb :routes="listRoutes" />
    <ProfileMyAccountEdit @close-edit="disabledEditMode" />
  </div>
</template>
