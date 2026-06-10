<script setup lang="ts">
const emit = defineEmits(['closeModal', 'update:visible'])

const props = defineProps({
  showUpdateDialog: {
    type: Boolean,
    required: true,
  },
})
const systemStore = useSystemStore()
const accountStore = useAccountStore()
const store = useOnboardingStore()
const { isMovil } = useSystemStore()
const { getProfileInformation: profile } = storeToRefs(accountStore)
const { getLoginUser: userData } = storeToRefs(store)
const { isMenuOpen } = storeToRefs(systemStore)
const route = useRoute()
const router = useRouter()
const showUnsavedDialog = ref(false)
const pendingNavigation = ref(null)

const localePath = useLocalePath()

const drawerVisible = computed({
  get: () => props.showUpdateDialog,
  set: (value) => {
    emit('update:visible', value)
    if (!value) {
      emit('closeModal')
    }
  },
})
const handleNavigation = (path, query = {}) => {
  if (isMenuOpen.value === true) {
    pendingNavigation.value = { path, query }
    showUnsavedDialog.value = true
  } else {
    router.push({
      path,
      query,
    })
  }
}
const cancelNavigation = () => {
  pendingNavigation.value = null
  showUnsavedDialog.value = false
}
const continueWithoutSaving = () => {
  if (pendingNavigation.value) {
    router.push({
      path: pendingNavigation.value.path,
      query: pendingNavigation.value.query,
    })
    systemStore.setMenuOpen(false)
    pendingNavigation.value = null
    showUnsavedDialog.value = false
  }
}

const closeDrawer = () => {
  drawerVisible.value = false
}
watch(isMenuOpen, (newVal) => {
  if (newVal === true && pendingNavigation.value) {
    showUnsavedDialog.value = true
  }
})
watch(userData, async (newVal) => {
  if (newVal?.user?.id) {
    await accountStore.getProfile()
  } else {
    systemStore.setMenuOpen(false)
  }
})

</script>

<template>
  <div>
    <Drawer
      v-model:visible="drawerVisible"
      :dismissable="true"
      class="general-drawer menu-mobile-drawer max-lg:!tw-w-[70%] tw-absolute"
      position="right"
    >
      <template #header>
        <div class="header-menu flex items-center gap-2">
          <span class="drawer-title">Menú</span>
        </div>
      </template>
      <template #closeicon>
        <i class="pi pi-times" style="color: #003b71" @click="closeDrawer"></i>
      </template>
      <div class="menu">
        <div v-if="userData?.id" class="menu-user">
          <div class="menu-user-header">
            <Avatar
              :image="
                profile.photoUrl
                  ? profile.photoUrl
                  : '/icons/profile/ic_profile.svg'
              "
              shape="circle"
              :class="
                profile.photoUrl
                  ? '!tw-w-[33px] !tw-h-[33px] tw-object-fit '
                  : ''
              "
              size="large"
            />
            <nuxt-link
              :to="localePath({ name: 'profile-my-profile' })"
              class="name"
              @click="closeDrawer"
              >{{
                $t('profile.welcome', {
                  userName:
                    useTruncateText(profile?.firstName, 20) +
                    ' ' +
                    useTruncateText(profile?.lastName, 20),
                })
              }}</nuxt-link
            >
          </div>

          <nuxt-link
            :class="{
              active: route.path.includes('profile/my-profile'),
            }"
            @click.prevent="
              handleNavigation(localePath({ name: 'profile-my-profile' })),
                closeDrawer()
            "
            >{{ $t('profile.account.title') }}</nuxt-link
          >

          <nuxt-link
            v-if="
              useSearchItemJson('type', userData) === 'vet' ||
              useSearchItemJson('type', userData) === 'both'
            "
            :class="{
              active: route.path.includes('profile/my-recommendeds'),
            }"
            @click.prevent="
              handleNavigation(localePath({ name: 'profile-my-recommendeds' })),
                closeDrawer()
            "
            >{{ $t('profile.myRecommendeds.title') }}</nuxt-link
          >

          <template
            v-if="
              useSearchItemJson('type', userData) === 'user' ||
              useSearchItemJson('type', userData) === 'both'
            "
          >
            <nuxt-link
              :class="{
                active: route.path.includes('profile/my-deliveries'),
              }"
              @click.prevent="
                handleNavigation(localePath({ name: 'profile-my-deliveries' })),
                  closeDrawer()
              "
              >{{ $t('profile.myDeliveries.title') }}</nuxt-link
            >
            <nuxt-link
              :class="{
                active: route.path.includes('profile/my-payment-methods'),
              }"
              @click.prevent="
                handleNavigation(
                  localePath({ name: 'profile-my-payment-methods' }),
                ),
                  closeDrawer()
              "
              >{{ $t('profile.myPaymentMethods.title') }}</nuxt-link
            >
            <nuxt-link
              :class="{
                active: route.path.includes('profile/my-referals'),
              }"
              @click.prevent="
                handleNavigation(localePath({ name: 'profile-my-referals' })),
                  closeDrawer()
              "
              >{{ $t('profile.myReferals.title') }}</nuxt-link
            >
          </template>
        </div>
        <nuxt-link
          :class="{ active: route.path === '/' }"
          @click.prevent="
            handleNavigation(localePath({ name: 'index' })), closeDrawer()
          "
          >{{ $t('home.home') }}</nuxt-link
        >
        <nuxt-link
          :class="{ active: route.path.includes('about-us') }"
          @click.prevent="
            handleNavigation(localePath({ name: 'about-us' })), closeDrawer()
          "
          >{{ $t('home.who') }}</nuxt-link
        >
        <nuxt-link
          :class="{ active: route.path.includes('recipes') }"
          @click.prevent="
            handleNavigation(localePath({ name: 'recipes' })), closeDrawer()
          "
          >{{ $t('home.recipes') }}</nuxt-link
        >

        <nuxt-link
          :class="{ active: route.path.includes('fresh') }"
          @click.prevent="
            handleNavigation(localePath({ name: 'fresh' })), closeDrawer()
          "
          >{{ $t('home.tips') }}</nuxt-link
        >

        <nuxt-link
          :class="{ active: route.path.includes('FAQ') }"
          @click.prevent="
            handleNavigation(localePath({ name: 'FAQ' })), closeDrawer()
          "
          >{{ $t('home.faq') }}</nuxt-link
        >
        <nuxt-link
          :class="{ active: route.path.includes('vets') }"
          @click.prevent="
            handleNavigation(localePath({ name: 'vets' })), closeDrawer()
          "
        >
          {{ $t('home.vets') }}
        </nuxt-link>
      </div>
      <div class="tw-flex tw-flex-col gap-4">
        <Button
          v-if="!userData?.id"
          class="app-general-button btn-solo-login !tw-w-full"
          @click="
            handleNavigation(localePath({ name: 'login' })), closeDrawer()
          "
        >
          {{ $t('home.login') }}
        </Button>

        <Button
          v-if="!userData?.id"
          class="app-general-button btn-solo-create !tw-w-full"
          @click="
            router.push(
              localePath({
                name: 'registry',
                query: { step: 'pet', substep: 'meet' },
              }),
            )
          "
        >
          {{ $t('home.create') }}
        </Button>

        <Button
          v-if="userData?.id"
          class="app-general-button btn-solo-create !tw-w-full"
          @click="
            handleNavigation(localePath({ name: 'profile-my-profile' })),
              closeDrawer()
          "
        >
          {{ $t('home.plan') }}
        </Button>
      </div>
    </Drawer>

    <GeneralDialogUnSavedProgess
      class="tw-absolute"
      v-model:show="showUnsavedDialog"
      @continueWithoutSaving="continueWithoutSaving"
      @cancel="cancelNavigation"
    />
  </div>
</template>

<style lang="scss"></style>
